// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MudarabahVault
/// @notice Upgradeable Mudarabah-style profit-sharing vault for AVX (or any ERC20 asset).
/// - Investors deposit asset and receive internal 'shares' representing proportional ownership.
/// - Manager (owner) may deposit profits and call reportProfit to claim manager fee (BPS).
/// - No interest, only profit-sharing. Use governance for manager role and fee params.
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MudarabahVault is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // using SafeERC20Upgradeable for ERC20Upgradeable;

    /// @notice underlying asset (AVX)
    ERC20Upgradeable public asset;

    /// @notice total shares (internal accounting)
    uint256 public totalShares;

    /// @notice user => shares
    mapping(address => uint256) private _shares;

    /// @notice manager fee in basis points applied to reported profits
    uint256 public managerFeeBps;
    uint256 public constant MAX_BPS = 10000;

    /// @notice minimal deposit (to avoid dust and gas waste)
    uint256 public minDeposit;

    event Deposit(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdraw(address indexed user, uint256 amount, uint256 sharesBurned);
    event ProfitReported(address indexed manager, uint256 profitAmount, uint256 managerFee);
    event ManagerFeeUpdated(uint256 newFeeBps);
    event MinDepositUpdated(uint256 newMinDeposit);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    /// @param asset_ underlying ERC20 token address (AVX)
    /// @param owner_ owner/manager address (governance multisig recommended)
    /// @param managerFeeBps_ manager fee in BPS (e.g., 1000 = 10%)
    /// @param minDeposit_ minimal deposit amount in token units
    function initialize(address asset_, address owner_, uint256 managerFeeBps_, uint256 minDeposit_) public initializer {
        require(asset_ != address(0), "asset-zero");
        require(managerFeeBps_ <= MAX_BPS, "fee-too-high");

        __Ownable_init(msg.sender);
        // __ReentrancyGuard_init();
        // __Pausable_init();
        __UUPSUpgradeable_init();

        asset = ERC20Upgradeable(asset_);
        managerFeeBps = managerFeeBps_;
        minDeposit = minDeposit_;

        if (owner_ != address(0)) {
            transferOwnership(owner_);
        }
    }

    /// @dev Authorize UUPS upgrades only by owner
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /* --------------------------- VIEWS --------------------------- */

    /// @notice total assets currently held by vault
    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    /// @notice returns shares owned by account
    function sharesOf(address account) external view returns (uint256) {
        return _shares[account];
    }

    /// @notice convert asset amount to shares using current ratio
    function assetsToShares(uint256 assetAmount) public view returns (uint256) {
        uint256 assets = totalAssets();
        if (totalShares == 0 || assets == 0) {
            // initial approach: 1:1 mapping for first depositor
            return assetAmount;
        }
        // mintedShares = (assetAmount * totalShares) / assets
        return (assetAmount * totalShares) / assets;
    }

    /// @notice convert shares to underlying asset amount
    function sharesToAssets(uint256 shareAmount) public view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shareAmount * totalAssets()) / totalShares;
    }

    /* --------------------------- MUTATIVE --------------------------- */

    /// @notice deposit asset; mints shares based on relative ratio
    /// @dev handles fee-on-transfer tokens by computing actualReceived
    function deposit(uint256 amount) external   {
        require(amount > 0, "zero-amount");
        require(amount >= minDeposit, "below-min-deposit");

        uint256 before = totalAssets();
        // asset.safeTransferFrom(msg.sender, address(this), amount);
        asset.transferFrom(msg.sender, address(this), amount);
        uint256 after_ = totalAssets();

        uint256 actualReceived = after_ - before;
        require(actualReceived > 0, "no-received");

        uint256 mintedShares = assetsToShares(actualReceived);
        if (mintedShares == 0) {
            // Guard against rounding causing zero shares; mint at least 1
            mintedShares = 1;
        }

        totalShares += mintedShares;
        _shares[msg.sender] += mintedShares;

        emit Deposit(msg.sender, actualReceived, mintedShares);
    }

    /// @notice withdraw underlying by burning shares
    function withdraw(uint256 shareAmount) external  {
        require(shareAmount > 0, "zero-shares");
        uint256 holderShares = _shares[msg.sender];
        require(holderShares >= shareAmount, "insufficient-shares");
        require(totalShares > 0, "no-shares-total");

        uint256 amount = sharesToAssets(shareAmount);
        require(amount > 0, "zero-withdraw");

        // effects
        _shares[msg.sender] = holderShares - shareAmount;
        totalShares -= shareAmount;

        // interactions
        // asset.safeTransfer(msg.sender, amount);
        asset.transfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount, shareAmount);
    }

    /**
     * @notice Manager reports profit. Manager MUST transfer `profitAmount` tokens into the vault before calling.
     * For simplicity, this function trusts that profitAmount was deposited. It computes manager fee and transfers it.
     * The remaining profit stays in the vault and increases backing per share.
     * @param profitAmount amount of profit tokens added to vault
     */
    function reportProfit(uint256 profitAmount) external onlyOwner   {
        require(profitAmount > 0, "zero-profit");
        // ensure vault holds at least profitAmount extra — cannot robustly check previous balance without storing state,
        // so we rely on manager honesty + external audit. In tests, manager will transfer before calling.
        uint256 managerFee = (profitAmount * managerFeeBps) / MAX_BPS;
        if (managerFee > 0) {
            // send manager fee to owner (manager)
            // asset.safeTransfer(owner(), managerFee);
            asset.transfer(owner(), managerFee);
        }
        emit ProfitReported(owner(), profitAmount, managerFee);
    }

    /* --------------------------- ADMIN --------------------------- */

    function setManagerFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_BPS, "fee-too-high");
        managerFeeBps = newFeeBps;
        emit ManagerFeeUpdated(newFeeBps);
    }

    function setMinDeposit(uint256 newMin) external onlyOwner {
        minDeposit = newMin;
        emit MinDepositUpdated(newMin);
    }

    // function pause() external onlyOwner {
    //     _pause();
    // }

    // function unpause() external onlyOwner {
    //     _unpause();
    // }

    /* --------------------------- EMERGENCY --------------------------- */

    /// @notice Emergency withdraw entire vault to specified address (governance only)
    function emergencyWithdrawAll(address to) external onlyOwner  {
        require(to != address(0), "zero-address");
        uint256 bal = totalAssets();
        if (bal > 0) {
            // asset.safeTransfer(to, bal);
            asset.transfer(to, bal);
        }
        emit EmergencyWithdraw(to, bal);
    }
}
