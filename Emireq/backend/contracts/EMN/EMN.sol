// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EminarToken is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant BACKING_MANAGER_ROLE = keccak256("BACKING_MANAGER_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18;

    enum BackingAsset { GOLD, SILVER, RARE }
    struct AssetInfo { IERC20 token; uint256 amount; uint256 priceUSD; bool registered; }

    mapping(BackingAsset => AssetInfo) private _assets;
    address public reserveAddress;
    address public developmentAddress;
    address public shariaTrustAddress;
    address public strategicPartnersAddress;
    address public publicAddress;

    event BackingTokenRegistered(BackingAsset indexed asset, address token);
    event BackingDeposited(BackingAsset indexed asset, address indexed from, uint256 amount);
    event BackingWithdrawn(BackingAsset indexed asset, address indexed to, uint256 amount);
    event AssetPriceUpdated(BackingAsset indexed asset, uint256 priceUSD);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address publicAddr_,
        address reserveAddr_,
        address devAddr_,
        address shariaAddr_,
        address strategicAddr_,
        address governanceMultisig_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        require(publicAddr_ != address(0) && reserveAddr_ != address(0) && devAddr_ != address(0) && shariaAddr_ != address(0) && strategicAddr_ != address(0), "zero address");
        publicAddress = publicAddr_;
        reserveAddress = reserveAddr_;
        developmentAddress = devAddr_;
        shariaTrustAddress = shariaAddr_;
        strategicPartnersAddress = strategicAddr_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BACKING_MANAGER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, governanceMultisig_);
        _grantRole(RECOVERY_ROLE, msg.sender);

        _mint(publicAddress, (TOTAL_SUPPLY * 40) / 100);
        _mint(reserveAddress, (TOTAL_SUPPLY * 20) / 100);
        _mint(developmentAddress, (TOTAL_SUPPLY * 20) / 100);
        _mint(shariaTrustAddress, (TOTAL_SUPPLY * 10) / 100);
        _mint(strategicPartnersAddress, (TOTAL_SUPPLY * 10) / 100);
    }

    function registerBackingToken(BackingAsset asset, address token) external onlyRole(BACKING_MANAGER_ROLE) {
        require(token != address(0), "zero token");
        _assets[asset].token = IERC20(token);
        _assets[asset].registered = true;
        emit BackingTokenRegistered(asset, token);
    }

    function depositBacking(BackingAsset asset, uint256 amount) external whenNotPaused {
        require(_assets[asset].registered, "asset not registered");
        require(amount > 0, "zero amount");
        _assets[asset].token.safeTransferFrom(msg.sender, address(this), amount);
        unchecked { _assets[asset].amount += amount; }
        emit BackingDeposited(asset, msg.sender, amount);
    }

    function withdrawBacking(BackingAsset asset, address to, uint256 amount) external onlyRole(BACKING_MANAGER_ROLE) {
        require(to != address(0), "zero address");
        require(amount > 0, "zero amount");
        require(_assets[asset].amount >= amount, "insufficient backing");
        _assets[asset].amount -= amount;
        _assets[asset].token.safeTransfer(to, amount);
        emit BackingWithdrawn(asset, to, amount);
    }

    function setAssetPriceUSD(BackingAsset asset, uint256 priceUSD) external onlyRole(BACKING_MANAGER_ROLE) {
        require(_assets[asset].registered, "asset not registered");
        _assets[asset].priceUSD = priceUSD;
        emit AssetPriceUpdated(asset, priceUSD);
    }

    function totalBackingValueUSD() public view returns (uint256) {
        uint256 total = 0;
        AssetInfo storage ai = _assets[BackingAsset.GOLD];
        if(ai.registered && ai.priceUSD > 0 && ai.amount > 0) total += (ai.amount * ai.priceUSD) / (10**18);
        ai = _assets[BackingAsset.SILVER];
        if(ai.registered && ai.priceUSD > 0 && ai.amount > 0) total += (ai.amount * ai.priceUSD) / (10**18);
        ai = _assets[BackingAsset.RARE];
        if(ai.registered && ai.priceUSD > 0 && ai.amount > 0) total += (ai.amount * ai.priceUSD) / (10**18);
        return total;
    }

    function backingPerTokenUSD() external view returns (uint256) {
        uint256 totalVal = totalBackingValueUSD();
        if(totalVal == 0) return 0;
        return (totalVal * (10**18)) / TOTAL_SUPPLY;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit Paused(msg.sender);
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit Unpaused(msg.sender);
    }

    function emergencyRecoverERC20(address token, address to, uint256 amount) external onlyRole(RECOVERY_ROLE) {
        require(to != address(0), "zero address");
        IERC20(token).safeTransfer(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
