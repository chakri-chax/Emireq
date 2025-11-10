// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract EminarToken is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    using SafeERC20 for IERC20;

    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMaxSupply();
    error InsufficientBalance();
    error InsufficientBacking();
    error AssetNotRegistered();
    error DuplicateAddress();
    error InvalidPrice();
    error InvalidAsset();

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant BACKING_MANAGER_ROLE = keccak256("BACKING_MANAGER_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18 ;
    uint256 public constant MAX_ASSET_PRICE = type(uint128).max;

    enum BackingAsset { GOLD, SILVER, RARE }
    
    struct AssetInfo { 
        IERC20 token; 
        uint256 amount; 
        uint256 priceUSD; 
        bool registered; 
    }

    mapping(BackingAsset => AssetInfo) private _assets;
    mapping(address=>bool) public isMember;
    address public reserveAddress;
    address public developmentAddress;
    address public shariaTrustAddress;
    address public strategicPartnersAddress;
    address public publicAddress;
    address public governanceAddress;

    event BackingTokenRegistered(BackingAsset indexed asset, address token);
    event BackingTokenUnregistered(BackingAsset indexed asset);
    event BackingDeposited(BackingAsset indexed asset, address indexed from, uint256 amount);
    event BackingWithdrawn(BackingAsset indexed asset, address indexed to, uint256 amount);
    event AssetPriceUpdated(BackingAsset indexed asset, uint256 priceUSD);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event AddressUpdated(string indexed addressType, address newAddress);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address publicAddr_,
        address reserveAddr_,
        address devAddr_,
        address shariaAddr_,
        address strategicAddr_
        // address governanceMultisig_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (publicAddr_ == address(0) || 
            reserveAddr_ == address(0) || 
            devAddr_ == address(0) || 
            shariaAddr_ == address(0) || 
            strategicAddr_ == address(0)
            ) {
            revert ZeroAddress();
        }

        // if (_hasDuplicateAddresses(publicAddr_, reserveAddr_, devAddr_, shariaAddr_, strategicAddr_)) {
        //     revert DuplicateAddress();
        // }


        publicAddress = publicAddr_;
        reserveAddress = reserveAddr_;
        developmentAddress = devAddr_;
        shariaTrustAddress = shariaAddr_;
        strategicPartnersAddress = strategicAddr_;
        
        isMember[publicAddress] = true;
        isMember[reserveAddress] = true;
        isMember[developmentAddress] = true;
        isMember[shariaTrustAddress] = true;
        isMember[strategicPartnersAddress] = true;


        // Grant roles - give DEFAULT_ADMIN_ROLE to governance for future management
        // _grantRole(DEFAULT_ADMIN_ROLE, governanceMultisig_);
        // _grantRole(MINTER_ROLE, governanceMultisig_);
        // _grantRole(BURNER_ROLE, governanceMultisig_);
        // _grantRole(PAUSER_ROLE, governanceMultisig_);
        // _grantRole(BACKING_MANAGER_ROLE, governanceMultisig_);
        // _grantRole(GOVERNANCE_ROLE, governanceMultisig_);
        // _grantRole(RECOVERY_ROLE, governanceMultisig_);

        _mint(publicAddress, (INITIAL_SUPPLY * 40) / 100);
        _mint(reserveAddress, (INITIAL_SUPPLY * 20) / 100);
        _mint(developmentAddress, (INITIAL_SUPPLY * 20) / 100);
        _mint(shariaTrustAddress, (INITIAL_SUPPLY * 10) / 100);
        _mint(strategicPartnersAddress, (INITIAL_SUPPLY * 10) / 100);
    }   

    function updateGovernance(address governanceMultisig_) external  {
         // Grant roles - give DEFAULT_ADMIN_ROLE to governance for future management
        // _grantRole(DEFAULT_ADMIN_ROLE, governanceMultisig_);
        require(governanceAddress == address(0), "Governance already set");

        require(isMember[msg.sender], "Not authorized");    
        _grantRole(MINTER_ROLE, governanceMultisig_);
        _grantRole(BURNER_ROLE, governanceMultisig_);
        _grantRole(PAUSER_ROLE, governanceMultisig_);
        // _grantRole(BACKING_MANAGER_ROLE, governanceMultisig_);
        _grantRole(GOVERNANCE_ROLE, governanceMultisig_);
        // _grantRole(RECOVERY_ROLE, governanceMultisig_);

    }

    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 

    {   console.log("minting");
        console.log("to", to);
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    function burn(address from, uint256 amount, string memory reason) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(from) < amount) revert InsufficientBalance();
        
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }

    function burnMyTokens(uint256 amount, string memory reason) 
        external 
        whenNotPaused 
    {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, reason);
    }

    function registerBackingToken(BackingAsset asset, address token) external onlyRole(BACKING_MANAGER_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        
        _assets[asset].token = IERC20(token);
        _assets[asset].registered = true;
        emit BackingTokenRegistered(asset, token);
    }

    function unregisterBackingToken(BackingAsset asset) external onlyRole(BACKING_MANAGER_ROLE) {
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        
        if (_assets[asset].amount > 0) revert InsufficientBacking();
        
        _assets[asset].registered = false;
        _assets[asset].priceUSD = 0;
        emit BackingTokenUnregistered(asset);
    }

    function depositBacking(BackingAsset asset, uint256 amount) external whenNotPaused {
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (amount == 0) revert ZeroAmount();
        
        _assets[asset].token.safeTransferFrom(msg.sender, address(this), amount);
        _assets[asset].amount += amount;
        emit BackingDeposited(asset, msg.sender, amount);
    }

    function withdrawBacking(BackingAsset asset, address to, uint256 amount) external onlyRole(BACKING_MANAGER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (_assets[asset].amount < amount) revert InsufficientBacking();
        
        _assets[asset].amount -= amount;
        _assets[asset].token.safeTransfer(to, amount);
        emit BackingWithdrawn(asset, to, amount);
    }

    function setAssetPriceUSD(BackingAsset asset, uint256 priceUSD) external onlyRole(BACKING_MANAGER_ROLE) {
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (priceUSD > MAX_ASSET_PRICE) revert InvalidPrice();
        
        _assets[asset].priceUSD = priceUSD;
        emit AssetPriceUpdated(asset, priceUSD);
    }

    function totalBackingValueUSD() public view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i <= uint256(BackingAsset.RARE); i++) {
            BackingAsset asset = BackingAsset(i);
            AssetInfo storage ai = _assets[asset];
            
            if (ai.registered && ai.priceUSD > 0 && ai.amount > 0) {
                total += (ai.amount * ai.priceUSD) / 1e18;
            }
        }
        return total;
    }

    function backingPerTokenUSD() external view returns (uint256) {
        uint256 totalVal = totalBackingValueUSD();
        uint256 currentSupply = totalSupply();
        
        if (totalVal == 0 || currentSupply == 0) return 0;
        
        return (totalVal * 1e18) / currentSupply;
    }

    function getAssetInfo(BackingAsset asset) external view returns (AssetInfo memory) {
        if (asset > BackingAsset.RARE) revert InvalidAsset();
        return _assets[asset];
    }

    function updatePublicAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        publicAddress = newAddress;
        emit AddressUpdated("PUBLIC", newAddress);
    }

    function updateReserveAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        reserveAddress = newAddress;
        emit AddressUpdated("RESERVE", newAddress);
    }

    function updateDevelopmentAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        developmentAddress = newAddress;
        emit AddressUpdated("DEVELOPMENT", newAddress);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function emergencyRecoverERC20(address token, address to, uint256 amount) external onlyRole(RECOVERY_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        for (uint256 i = 0; i <= uint256(BackingAsset.RARE); i++) {
            if (token == address(_assets[BackingAsset(i)].token)) {
                revert InsufficientBacking();
            }
        }
        IERC20(token).safeTransfer(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _hasDuplicateAddresses(
        address publicAddr,
        address reserveAddr, 
        address devAddr,
        address shariaAddr,
        address strategicAddr
    ) private pure returns (bool) {
        return publicAddr == reserveAddr ||
               publicAddr == devAddr ||
               publicAddr == shariaAddr ||
               publicAddr == strategicAddr ||
               reserveAddr == devAddr ||
               reserveAddr == shariaAddr ||
               reserveAddr == strategicAddr ||
               devAddr == shariaAddr ||
               devAddr == strategicAddr ||
               shariaAddr == strategicAddr;
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