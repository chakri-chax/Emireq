// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Aurivox is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMaxSupply();
    error InsufficientBalance();
    error AssetNotRegistered();
    error InsufficientBacking();
    error InvalidDistribution();
    error Unauthorized();
    error SpeculativeTradeDetected();
    error InvalidMudarabahTerms();
    error ProfitNotYetDistributed();
    error InvestmentPeriodActive();
    error OracleNotAuthorized();

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant BACKING_MANAGER_ROLE =
        keccak256("BACKING_MANAGER_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant MUDARIB_ROLE = keccak256("MUDARIB_ROLE");

    // Tokenomics Constants
    uint256 public constant TOTAL_SUPPLY = 250_000_000 * 10 ** 18; // 250 million AVX
    uint256 public constant MAX_SUPPLY = TOTAL_SUPPLY + 1_000_000 * 10 ** 18; // 100 million AVX buffer

    // Distribution percentages (basis points - 10000 = 100%)
    uint256 public constant LIQUIDITY_MINING_PERCENTAGE = 5000; // 50%
    uint256 public constant INSTITUTIONAL_PERCENTAGE = 2500; // 25%
    uint256 public constant RESERVE_PERCENTAGE = 1500; // 15%
    uint256 public constant CHARITY_WAQF_PERCENTAGE = 1000; // 10%

    // Backing percentages
    uint256 public constant GOLD_BACKING_PERCENTAGE = 7000; // 70%
    uint256 public constant INDUSTRIAL_METALS_BACKING_PERCENTAGE = 2000; // 20%
    uint256 public constant CASH_EQUIVALENTS_BACKING_PERCENTAGE = 1000; // 10%

    // Mudarabah constants
    uint256 public constant MAX_MUDARIB_SHARE = 3000; // 30% maximum for Mudarib
    uint256 public constant MIN_INVESTMENT_PERIOD = 30 days;

    enum BackingAsset {
        GOLD,
        INDUSTRIAL_METALS,
        CASH_EQUIVALENTS
    }

    struct AssetInfo {
        IERC20 token;
        uint256 amount;
        uint256 priceUSD;
        bool registered;
        uint256 targetPercentage;
        uint256 lastOracleUpdate;
    }

    struct MudarabahInvestment {
        address investor;
        uint256 capital;
        uint256 startTime;
        uint256 endTime;
        uint256 mudaribShare; // basis points (10000 = 100%)
        bool profitDistributed;
        uint256 distributedProfit;
    }

    struct MudarabahPool {
        uint256 totalCapital;
        uint256 totalProfit;
        uint256 mudaribShare;
        bool active;
        uint256 startTime;
        uint256 endTime;
        mapping(address => uint256) investments;
        address[] investors;
    }

    // Addresses
    address public liquidityMiningAddress;
    address public institutionalInvestorsAddress;
    address public reserveAddress;
    address public charityWaqfAddress;
    address public mudaribAddress; // Fund manager

    mapping(BackingAsset => AssetInfo) private _assets;
    mapping(uint256 => MudarabahPool) public mudarabahPools;
    mapping(address => uint256[]) public userInvestments;

    uint256 public currentPoolId;
    uint256 public lastOracleUpdate;
    uint256 public oracleUpdateInterval = 30 days;

    // Anti-speculation mechanisms
    mapping(address => uint256) public lastTradeTime;
    uint256 public constant MIN_HOLDING_PERIOD = 1 days;
    uint256 public constant MAX_TRADE_FREQUENCY = 3; // Max 3 trades per day per address

    // Events
    event BackingTokenRegistered(BackingAsset indexed asset, address token);
    event BackingDeposited(
        BackingAsset indexed asset,
        address indexed from,
        uint256 amount
    );
    event BackingWithdrawn(
        BackingAsset indexed asset,
        address indexed to,
        uint256 amount
    );
    event AssetPriceUpdated(
        BackingAsset indexed asset,
        uint256 priceUSD,
        address oracle
    );
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event MudarabahPoolCreated(
        uint256 indexed poolId,
        uint256 mudaribShare,
        uint256 endTime
    );
    event InvestmentMade(
        uint256 indexed poolId,
        address indexed investor,
        uint256 amount
    );
    event ProfitDistributed(
        uint256 indexed poolId,
        uint256 totalProfit,
        uint256 mudaribShare
    );
    event SpeculativeTradePrevented(address indexed trader, string reason);
    event OracleUpdated(address indexed oracle, uint256 timestamp);

    constructor(
        string memory name_,
        string memory symbol_,
        address liquidityMiningAddr_,
        address institutionalAddr_,
        address reserveAddr_,
        address charityWaqfAddr_,
        address mudaribAddr_,
        address governanceMultisig_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        // Validate addresses
        if (
            liquidityMiningAddr_ == address(0) ||
            institutionalAddr_ == address(0) ||
            reserveAddr_ == address(0) ||
            charityWaqfAddr_ == address(0) ||
            mudaribAddr_ == address(0) ||
            governanceMultisig_ == address(0)
        ) revert ZeroAddress();

        liquidityMiningAddress = liquidityMiningAddr_;
        institutionalInvestorsAddress = institutionalAddr_;
        reserveAddress = reserveAddr_;
        charityWaqfAddress = charityWaqfAddr_;
        mudaribAddress = mudaribAddr_;

        // Set up backing asset target percentages
        _assets[BackingAsset.GOLD].targetPercentage = GOLD_BACKING_PERCENTAGE;
        _assets[BackingAsset.INDUSTRIAL_METALS]
            .targetPercentage = INDUSTRIAL_METALS_BACKING_PERCENTAGE;
        _assets[BackingAsset.CASH_EQUIVALENTS]
            .targetPercentage = CASH_EQUIVALENTS_BACKING_PERCENTAGE;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BACKING_MANAGER_ROLE, msg.sender);
        _grantRole(MUDARIB_ROLE, mudaribAddr_);
        _grantRole(GOVERNANCE_ROLE, governanceMultisig_);
        _grantRole(RECOVERY_ROLE, msg.sender);

        // Initial distribution
        _distributeInitialSupply();
    }

    function _distributeInitialSupply() internal {
        uint256 liquidityAmount = (TOTAL_SUPPLY * LIQUIDITY_MINING_PERCENTAGE) /
            10000;
        uint256 institutionalAmount = (TOTAL_SUPPLY *
            INSTITUTIONAL_PERCENTAGE) / 10000;
        uint256 reserveAmount = (TOTAL_SUPPLY * RESERVE_PERCENTAGE) / 10000;
        uint256 charityAmount = (TOTAL_SUPPLY * CHARITY_WAQF_PERCENTAGE) /
            10000;

        // Verify distribution sums to total supply
        if (
            liquidityAmount +
                institutionalAmount +
                reserveAmount +
                charityAmount !=
            TOTAL_SUPPLY
        ) {
            revert InvalidDistribution();
        }

        _mint(liquidityMiningAddress, liquidityAmount);
        _mint(institutionalInvestorsAddress, institutionalAmount);
        _mint(reserveAddress, reserveAmount);
        _mint(charityWaqfAddress, charityAmount);
    }

    // Islamic-compliant Mudarabah functions
    // function createMudarabahPool(uint256 mudaribShare, uint256 investmentPeriod)
    //     external
    //     onlyRole(MUDARIB_ROLE)
    //     whenNotPaused
    //     returns (uint256)
    // {
    //     if (mudaribShare > MAX_MUDARIB_SHARE) revert InvalidMudarabahTerms();
    //     if (investmentPeriod < MIN_INVESTMENT_PERIOD) revert InvalidMudarabahTerms();

    //     currentPoolId++;
    //     MudarabahPool storage pool = mudarabahPools[currentPoolId];

    //     pool.mudaribShare = mudaribShare;
    //     pool.startTime = block.timestamp;
    //     pool.endTime = block.timestamp + investmentPeriod;
    //     pool.active = true;

    //     emit MudarabahPoolCreated(currentPoolId, mudaribShare, pool.endTime);
    //     return currentPoolId;
    // }

    // function investInMudarabah(uint256 poolId, uint256 amount) external whenNotPaused {
    //     MudarabahPool storage pool = mudarabahPools[poolId];
    //     if (!pool.active) revert InvestmentPeriodActive();
    //     if (block.timestamp >= pool.endTime) revert InvestmentPeriodActive();
    //     if (amount == 0) revert ZeroAmount();
    //     if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

    //     // Transfer tokens to pool
    //     _transfer(msg.sender, address(this), amount);

    //     if (pool.investments[msg.sender] == 0) {
    //         pool.investors.push(msg.sender);
    //     }

    //     pool.investments[msg.sender] += amount;
    //     pool.totalCapital += amount;
    //     userInvestments[msg.sender].push(poolId);

    //     emit InvestmentMade(poolId, msg.sender, amount);
    // }

    // function distributeMudarabahProfit(uint256 poolId, uint256 totalProfit) external onlyRole(MUDARIB_ROLE) {
    //     MudarabahPool storage pool = mudarabahPools[poolId];
    //     if (block.timestamp < pool.endTime) revert InvestmentPeriodActive();
    //     if (!pool.active) revert ProfitNotYetDistributed();

    //     pool.totalProfit = totalProfit;
    //     pool.active = false;

    //     // Calculate Mudarib share
    //     uint256 mudaribProfit = (totalProfit * pool.mudaribShare) / 10000;
    //     uint256 investorProfit = totalProfit - mudaribProfit;

    //     // Distribute Mudarib share
    //     if (mudaribProfit > 0) {
    //         _mint(mudaribAddress, mudaribProfit);
    //     }

    //     // Distribute investor shares proportionally
    //     for (uint256 i = 0; i < pool.investors.length; i++) {
    //         address investor = pool.investors[i];
    //         uint256 investment = pool.investments[investor];
    //         uint256 profitShare = (investment * investorProfit) / pool.totalCapital;

    //         if (profitShare > 0) {
    //             _mint(investor, profitShare);
    //         }
    //     }

    //     emit ProfitDistributed(poolId, totalProfit, mudaribProfit);
    // }

    // Anti-speculation mechanisms
    function _checkTradeRestrictions(address from, address to) internal {
        // Exclude minting and burning from restrictions
        if (from == address(0) || to == address(0)) return;

        if (block.timestamp - lastTradeTime[from] < MIN_HOLDING_PERIOD) {
            revert SpeculativeTradeDetected();
        }

        lastTradeTime[from] = block.timestamp;
        lastTradeTime[to] = block.timestamp;
    }

    // Backing management with Oracle integration
    function updateAssetPrice(
        BackingAsset asset,
        uint256 priceUSD
    ) external onlyRole(ORACLE_ROLE) {
        if (!_assets[asset].registered) revert AssetNotRegistered();

        _assets[asset].priceUSD = priceUSD;
        _assets[asset].lastOracleUpdate = block.timestamp;
        lastOracleUpdate = block.timestamp;

        emit AssetPriceUpdated(asset, priceUSD, msg.sender);
        emit OracleUpdated(msg.sender, block.timestamp);
    }

    function registerBackingToken(
        BackingAsset asset,
        address token
    ) external onlyRole(BACKING_MANAGER_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        _assets[asset].token = IERC20(token);
        _assets[asset].registered = true;
        emit BackingTokenRegistered(asset, token);
    }

    function depositBacking(
        BackingAsset asset,
        uint256 amount
    ) external whenNotPaused {
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (amount == 0) revert ZeroAmount();

        _assets[asset].token.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        unchecked {
            _assets[asset].amount += amount;
        }
        emit BackingDeposited(asset, msg.sender, amount);
    }

    function withdrawBacking(
        BackingAsset asset,
        address to,
        uint256 amount
    ) external onlyRole(BACKING_MANAGER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (_assets[asset].amount < amount) revert InsufficientBacking();

        _assets[asset].amount -= amount;
        _assets[asset].token.safeTransfer(to, amount);
        emit BackingWithdrawn(asset, to, amount);
    }

    function totalBackingValueUSD() public view returns (uint256) {
        uint256 total = 0;
        for (uint8 i = 0; i < 3; i++) {
            BackingAsset asset = BackingAsset(i);
            AssetInfo storage ai = _assets[asset];
            if (ai.registered && ai.priceUSD > 0 && ai.amount > 0) {
                total += (ai.amount * ai.priceUSD) / (10 ** 18);
            }
        }
        return total;
    }

    function backingPerTokenUSD() external view returns (uint256) {
        uint256 totalVal = totalBackingValueUSD();
        uint256 currentSupply = totalSupply();
        if (totalVal == 0 || currentSupply == 0) return 0;
        return (totalVal * (10 ** 18)) / currentSupply;
    }

    function getAssetInfo(
        BackingAsset asset
    ) external view returns (AssetInfo memory) {
        return _assets[asset];
    }

    function getMudarabahPoolInfo(
        uint256 poolId
    )
        external
        view
        returns (
            uint256 totalCapital,
            uint256 totalProfit,
            uint256 mudaribShare,
            bool active,
            uint256 startTime,
            uint256 endTime,
            uint256 investorCount
        )
    {
        MudarabahPool storage pool = mudarabahPools[poolId];
        return (
            pool.totalCapital,
            pool.totalProfit,
            pool.mudaribShare,
            pool.active,
            pool.startTime,
            pool.endTime,
            pool.investors.length
        );
    }

    function getUserInvestment(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        return mudarabahPools[poolId].investments[user];
    }

    function transfer(
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        _checkTradeRestrictions(msg.sender, to);
        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        _checkTradeRestrictions(from, to);
        return super.transferFrom(from, to, amount);
    }

    function mint(
        address to,
        uint256 amount,
        string memory reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();

        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    function burn(
        address from,
        uint256 amount,
        string memory reason
    ) external onlyRole(BURNER_ROLE) whenNotPaused {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(from) < amount) revert InsufficientBalance();

        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function emergencyRecoverERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(RECOVERY_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
