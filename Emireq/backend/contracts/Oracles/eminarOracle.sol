// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenOracle is Ownable, ReentrancyGuard {
    
    // Token addresses
    address public goldToken;
    address public silverToken;
    address public rareToken;
    
    // Price structure
    struct TokenPrice {
        uint256 price; // Price in USD with 8 decimals (e.g., $100 = 100 * 10^8)
        uint256 lastUpdated;
        address updatedBy;
    }
    
    // Price mappings
    mapping(address => TokenPrice) public tokenPrices;
    
    // Events
    event PriceUpdated(address indexed token, uint256 price, address updatedBy, uint256 timestamp);
    event TokensSet(address gold, address silver, address rare);
    
    // Constants
    uint256 public constant PRICE_DECIMALS = 8;
    
    constructor(address _initialOwner) Ownable() {
        if (_initialOwner != address(0)) {
            transferOwnership(_initialOwner);
        }
    }
    
    /**
     * @dev Set token addresses (can only be done once)
     */
    function setTokenAddresses(
        address _goldToken,
        address _silverToken,
        address _rareToken
    ) external onlyOwner {
        require(goldToken == address(0), "Tokens already set");
        require(_goldToken != address(0) && _silverToken != address(0) && _rareToken != address(0), 
                "Invalid token addresses");
        
        goldToken = _goldToken;
        silverToken = _silverToken;
        rareToken = _rareToken;
        
        emit TokensSet(_goldToken, _silverToken, _rareToken);
    }
    
    /**
     * @dev Update price for a specific token
     */
    function updateTokenPrice(address token, uint256 price) external onlyOwner {
        require(token == goldToken || token == silverToken || token == rareToken, "Invalid token");
        require(price > 0, "Price must be greater than 0");
        
        tokenPrices[token] = TokenPrice({
            price: price,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
        
        emit PriceUpdated(token, price, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update all token prices at once
     */
    function updateAllPrices(
        uint256 goldPrice,
        uint256 silverPrice,
        uint256 rarePrice
    ) external onlyOwner {
        require(goldPrice > 0 && silverPrice > 0 && rarePrice > 0, "Prices must be greater than 0");
        
        // Update GOLD price
        tokenPrices[goldToken] = TokenPrice({
            price: goldPrice,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
        
        // Update SILVER price
        tokenPrices[silverToken] = TokenPrice({
            price: silverPrice,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
        
        // Update RARE price
        tokenPrices[rareToken] = TokenPrice({
            price: rarePrice,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
        
        emit PriceUpdated(goldToken, goldPrice, msg.sender, block.timestamp);
        emit PriceUpdated(silverToken, silverPrice, msg.sender, block.timestamp);
        emit PriceUpdated(rareToken, rarePrice, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get current price for a token
     */
    function getTokenPrice(address token) public view returns (uint256 price, uint256 lastUpdated) {
        TokenPrice memory tokenPrice = tokenPrices[token];
        return (tokenPrice.price, tokenPrice.lastUpdated);
    }
    
    /**
     * @dev Get price for GOLD token
     */
    function getGoldPrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(goldToken);
    }
    
    /**
     * @dev Get price for SILVER token
     */
    function getSilverPrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(silverToken);
    }
    
    /**
     * @dev Get price for RARE token
     */
    function getRarePrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(rareToken);
    }
    
    /**
     * @dev Get all current prices
     */
    function getAllPrices() external view returns (
        uint256 goldPrice,
        uint256 silverPrice,
        uint256 rarePrice,
        uint256 lastUpdated
    ) {
        TokenPrice memory gold = tokenPrices[goldToken];
        TokenPrice memory silver = tokenPrices[silverToken];
        TokenPrice memory rare = tokenPrices[rareToken];
        
        // Use the latest update timestamp among all tokens
        uint256 latestUpdate = gold.lastUpdated > silver.lastUpdated ? gold.lastUpdated : silver.lastUpdated;
        latestUpdate = rare.lastUpdated > latestUpdate ? rare.lastUpdated : latestUpdate;
        
        return (gold.price, silver.price, rare.price, latestUpdate);
    }
    
    /**
     * @dev Check if price is recent (updated within specified time)
     */
    function isPriceRecent(address token, uint256 maxAge) external view returns (bool) {
        TokenPrice memory tokenPrice = tokenPrices[token];
        if (tokenPrice.lastUpdated == 0) return false;
        
        return (block.timestamp - tokenPrice.lastUpdated) <= maxAge;
    }
    
    /**
     * @dev Get token addresses
     */
    function getTokenAddresses() external view returns (address, address, address) {
        return (goldToken, silverToken, rareToken);
    }
}
