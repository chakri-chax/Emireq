// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
contract Xenara is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMaxSupply();
    error InsufficientBalance();
    error AssetNotRegistered();
    error InsufficientBacking();
    error InvalidDistribution();
    error Unauthorized();
    error DuplicateAddress();
    error InvalidAsset();
    error InvalidPrice();
    error InvalidRecipient();
    error BackingAssetProtected();
    error InvalidPercentage();

    // Constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant BACKING_MANAGER_ROLE = keccak256("BACKING_MANAGER_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");
    bytes32 public constant ROYALTY_MANAGER_ROLE = keccak256("ROYALTY_MANAGER_ROLE");
    bytes32 public constant ROYALTY_RECIPIENT_ROLE = keccak256("ROYALTY_RECIPIENT_ROLE");

    // Tokenomics Constants
    uint256 public constant INITIAL_SUPPLY = 500_000_000 * 10**18; // 500 million XNR
    uint256 public constant MAX_SUPPLY = INITIAL_SUPPLY + 100_000 * 10**18; 
    
    // Distribution percentages (basis points - 10000 = 100%)
    uint256 public constant PUBLIC_PERCENTAGE = 5000; // 50%
    uint256 public constant CREATOR_POOL_PERCENTAGE = 2500; // 25%
    uint256 public constant RESERVE_PERCENTAGE = 1500; // 15%
    uint256 public constant COMMUNITY_DAO_PERCENTAGE = 1000; // 10%

    // Backing percentages
    uint256 public constant SILVER_BACKING_PERCENTAGE = 5000; // 50%
    uint256 public constant GOLD_BACKING_PERCENTAGE = 3000; // 30%
    uint256 public constant PRECIOUS_STONES_BACKING_PERCENTAGE = 2000; // 20%

    uint256 public constant MAX_ASSET_PRICE = type(uint128).max; // Prevent overflow

    enum BackingAsset { SILVER, GOLD, PRECIOUS_STONES }
    
    struct AssetInfo { 
        IERC20 token; 
        uint256 amount; 
        uint256 priceUSD; 
        bool registered; 
        uint256 targetPercentage; // Target backing percentage
    }

    // Addresses
    address public publicAddress;
    address public creatorPoolAddress;
    address public reserveAddress;
    address public communityDAOAddress;
    address public royaltyManagerAddress;

    mapping(BackingAsset => AssetInfo) private _assets;
    
    // Royalty tracking
    uint256 public totalRoyaltyDistributed;
    mapping(address => uint256) public royaltyEarned;

    // Events
    event BackingTokenRegistered(BackingAsset indexed asset, address token);
    event BackingTokenUnregistered(BackingAsset indexed asset);
    event BackingDeposited(BackingAsset indexed asset, address indexed from, uint256 amount);
    event BackingWithdrawn(BackingAsset indexed asset, address indexed to, uint256 amount);
    event AssetPriceUpdated(BackingAsset indexed asset, uint256 priceUSD);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event RoyaltyDistributed(address indexed to, uint256 amount, string description);
    event BackingRebalanced(BackingAsset indexed asset, uint256 deposited, uint256 withdrawn);
    event AddressUpdated(string indexed addressType, address newAddress);

    constructor(
        string memory name_,
        string memory symbol_,
        address publicAddr_,
        address creatorPoolAddr_,
        address reserveAddr_,
        address communityDAOAddr_,
        address royaltyManagerAddr_,
        address governanceMultisig_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        // Validate all addresses
        if (
            publicAddr_ == address(0) || 
            creatorPoolAddr_ == address(0) || 
            reserveAddr_ == address(0) || 
            communityDAOAddr_ == address(0) ||
            royaltyManagerAddr_ == address(0) ||
            governanceMultisig_ == address(0)
        ) revert ZeroAddress();

        // Check for duplicate addresses uncomment for mainnet deployment

        // if (_hasDuplicateAddresses(publicAddr_, creatorPoolAddr_, reserveAddr_, communityDAOAddr_, royaltyManagerAddr_)) {
        //     revert DuplicateAddress();
        // }

        publicAddress = publicAddr_;
        creatorPoolAddress = creatorPoolAddr_;
        reserveAddress = reserveAddr_;
        communityDAOAddress = communityDAOAddr_;
        royaltyManagerAddress = royaltyManagerAddr_;

        // Initialize backing assets with target percentages
        _assets[BackingAsset.SILVER].targetPercentage = SILVER_BACKING_PERCENTAGE;
        _assets[BackingAsset.GOLD].targetPercentage = GOLD_BACKING_PERCENTAGE;
        _assets[BackingAsset.PRECIOUS_STONES].targetPercentage = PRECIOUS_STONES_BACKING_PERCENTAGE;

        // Grant all roles to governance multisig for proper decentralization
        _grantRole(DEFAULT_ADMIN_ROLE, governanceMultisig_);
        _grantRole(MINTER_ROLE, governanceMultisig_);
        _grantRole(BURNER_ROLE, governanceMultisig_);
        _grantRole(PAUSER_ROLE, governanceMultisig_);
        _grantRole(BACKING_MANAGER_ROLE, governanceMultisig_);
        _grantRole(ROYALTY_MANAGER_ROLE, royaltyManagerAddr_);
        _grantRole(GOVERNANCE_ROLE, governanceMultisig_);
        _grantRole(RECOVERY_ROLE, governanceMultisig_);

        _distributeInitialSupply();
    }

    function _distributeInitialSupply() internal {
        uint256 publicAmount = (INITIAL_SUPPLY * PUBLIC_PERCENTAGE) / 10000;
        uint256 creatorAmount = (INITIAL_SUPPLY * CREATOR_POOL_PERCENTAGE) / 10000;
        uint256 reserveAmount = (INITIAL_SUPPLY * RESERVE_PERCENTAGE) / 10000;
        uint256 communityAmount = (INITIAL_SUPPLY * COMMUNITY_DAO_PERCENTAGE) / 10000;

        // Verify distribution sums to total supply with proper precision handling
        uint256 calculatedTotal = publicAmount + creatorAmount + reserveAmount + communityAmount;
        if (calculatedTotal != INITIAL_SUPPLY) {
            revert InvalidDistribution();
        }

        _mint(publicAddress, publicAmount);
        _mint(creatorPoolAddress, creatorAmount);
        _mint(reserveAddress, reserveAmount);
        _mint(communityDAOAddress, communityAmount);
    }

    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
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

    // Royalty distribution function with enhanced security
    function distributeRoyalty(address to, uint256 amount, string memory description) 
        external 
        onlyRole(ROYALTY_MANAGER_ROLE) 
        whenNotPaused 
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (!hasRole(ROYALTY_RECIPIENT_ROLE, to)) revert Unauthorized();
        if (balanceOf(creatorPoolAddress) < amount) revert InsufficientBalance();
        
        _transfer(creatorPoolAddress, to, amount);
        royaltyEarned[to] += amount;
        totalRoyaltyDistributed += amount;
        
        emit RoyaltyDistributed(to, amount, description);
    }

    function addRoyaltyRecipient(address recipient) external onlyRole(ROYALTY_MANAGER_ROLE) {
        if (recipient == address(0)) revert ZeroAddress();
        _grantRole(ROYALTY_RECIPIENT_ROLE, recipient);
    }

    function removeRoyaltyRecipient(address recipient) external onlyRole(ROYALTY_MANAGER_ROLE) {
        _revokeRole(ROYALTY_RECIPIENT_ROLE, recipient);
    }

    // Backing management functions
    function registerBackingToken(BackingAsset asset, address token) 
        external 
        onlyRole(BACKING_MANAGER_ROLE) 
    {
        if (token == address(0)) revert ZeroAddress();
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        
        _assets[asset].token = IERC20(token);
        _assets[asset].registered = true;
        emit BackingTokenRegistered(asset, token);
    }

    function unregisterBackingToken(BackingAsset asset) 
        external 
        onlyRole(BACKING_MANAGER_ROLE) 
    {
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (_assets[asset].amount > 0) revert InsufficientBacking();
        
        _assets[asset].registered = false;
        _assets[asset].priceUSD = 0;
        emit BackingTokenUnregistered(asset);
    }

    function depositBacking(BackingAsset asset, uint256 amount) 
        external 
        whenNotPaused 
    {
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (amount == 0) revert ZeroAmount();
        
        _assets[asset].token.safeTransferFrom(msg.sender, address(this), amount);
        _assets[asset].amount += amount;
        emit BackingDeposited(asset, msg.sender, amount);
    }

    function withdrawBacking(BackingAsset asset, address to, uint256 amount) 
        external 
        nonReentrant
        onlyRole(BACKING_MANAGER_ROLE) 
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (_assets[asset].amount < amount) revert InsufficientBacking();
        
        _assets[asset].amount -= amount;
        _assets[asset].token.safeTransfer(to, amount);
        emit BackingWithdrawn(asset, to, amount);
    }

    function rebalanceBacking() external onlyRole(BACKING_MANAGER_ROLE) {
        uint256 totalValue = totalBackingValueUSD();
        if (totalValue == 0) return;

        for (uint8 i = 0; i <= uint8(BackingAsset.PRECIOUS_STONES); i++) {
            BackingAsset asset = BackingAsset(i);
            if (_assets[asset].registered && _assets[asset].priceUSD > 0) {
                uint256 currentValue = (_assets[asset].amount * _assets[asset].priceUSD) / 1e18;
                uint256 targetValue = (totalValue * _assets[asset].targetPercentage) / 10000;
                
                if (currentValue < targetValue) {
                    uint256 needed = ((targetValue - currentValue) * 1e18) / _assets[asset].priceUSD;
                    // Emit event for needed deposit - actual execution would require additional parameters
                    emit BackingRebalanced(asset, needed, 0);
                } else if (currentValue > targetValue) {
                    uint256 excess = ((currentValue - targetValue) * 1e18) / _assets[asset].priceUSD;
                    // Emit event for excess - actual withdrawal would require manager action
                    emit BackingRebalanced(asset, 0, excess);
                }
            }
        }
    }

    function setAssetPriceUSD(BackingAsset asset, uint256 priceUSD) 
        external 
        onlyRole(BACKING_MANAGER_ROLE) 
    {
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        if (!_assets[asset].registered) revert AssetNotRegistered();
        if (priceUSD > MAX_ASSET_PRICE) revert InvalidPrice();
        
        _assets[asset].priceUSD = priceUSD;
        emit AssetPriceUpdated(asset, priceUSD);
    }

    // Address management functions
    function updatePublicAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        publicAddress = newAddress;
        emit AddressUpdated("PUBLIC", newAddress);
    }

    function updateCreatorPoolAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        creatorPoolAddress = newAddress;
        emit AddressUpdated("CREATOR_POOL", newAddress);
    }

    function updateReserveAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        reserveAddress = newAddress;
        emit AddressUpdated("RESERVE", newAddress);
    }

    function updateCommunityDAOAddress(address newAddress) external onlyRole(GOVERNANCE_ROLE) {
        if (newAddress == address(0)) revert ZeroAddress();
        communityDAOAddress = newAddress;
        emit AddressUpdated("COMMUNITY_DAO", newAddress);
    }

    // View functions
    function totalBackingValueUSD() public view returns (uint256) {
        uint256 total = 0;
        for (uint8 i = 0; i <= uint8(BackingAsset.PRECIOUS_STONES); i++) {
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
        if (uint256(asset) > uint256(BackingAsset.PRECIOUS_STONES)) revert InvalidAsset();
        return _assets[asset];
    }

    function getBackingRatios() external view returns (uint256 silverRatio, uint256 goldRatio, uint256 stonesRatio) {
        uint256 totalValue = totalBackingValueUSD();
        if (totalValue == 0) return (0, 0, 0);

        // Use 1e18 for precision to avoid division before multiplication
        silverRatio = (_assets[BackingAsset.SILVER].registered && _assets[BackingAsset.SILVER].priceUSD > 0) 
            ? ((_assets[BackingAsset.SILVER].amount * _assets[BackingAsset.SILVER].priceUSD) * 10000) / (totalValue * 1e18)
            : 0;
        
        goldRatio = (_assets[BackingAsset.GOLD].registered && _assets[BackingAsset.GOLD].priceUSD > 0) 
            ? ((_assets[BackingAsset.GOLD].amount * _assets[BackingAsset.GOLD].priceUSD) * 10000) / (totalValue * 1e18)
            : 0;
        
        stonesRatio = (_assets[BackingAsset.PRECIOUS_STONES].registered && _assets[BackingAsset.PRECIOUS_STONES].priceUSD > 0) 
            ? ((_assets[BackingAsset.PRECIOUS_STONES].amount * _assets[BackingAsset.PRECIOUS_STONES].priceUSD) * 10000) / (totalValue * 1e18)
            : 0;

        return (silverRatio, goldRatio, stonesRatio);
    }

    // Emergency functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function emergencyRecoverERC20(address token, address to, uint256 amount) 
        external 
        onlyRole(RECOVERY_ROLE) 
    {
        if (to == address(0)) revert ZeroAddress();
        
        // Prevent recovery of backing assets
        for (uint8 i = 0; i <= uint8(BackingAsset.PRECIOUS_STONES); i++) {
            if (token == address(_assets[BackingAsset(i)].token)) {
                revert BackingAssetProtected();
            }
        }
        
        IERC20(token).safeTransfer(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // Internal helper functions
    function _hasDuplicateAddresses(
        address publicAddr,
        address creatorAddr, 
        address reserveAddr,
        address communityAddr,
        address royaltyAddr
    ) private pure returns (bool) {
        return publicAddr == creatorAddr ||
               publicAddr == reserveAddr ||
               publicAddr == communityAddr ||
               publicAddr == royaltyAddr ||
               creatorAddr == reserveAddr ||
               creatorAddr == communityAddr ||
               creatorAddr == royaltyAddr ||
               reserveAddr == communityAddr ||
               reserveAddr == royaltyAddr ||
               communityAddr == royaltyAddr;
    }

    // Override functions
    function _beforeTokenTransfer(address from, address to, uint256 amount) 
        internal 
        override 
        whenNotPaused 
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Votes) 
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Votes) 
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) 
        internal 
        override(ERC20, ERC20Votes) 
    {
        super._burn(account, amount);
    }
}