// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TokenOracle is Ownable, Pausable {
    address public goldToken;
    address public silverToken;
    address public rareToken;

    struct TokenPrice {
        uint256 price;
        uint256 lastUpdated;
        address updatedBy;
    }

    mapping(address => TokenPrice) public tokenPrices;
    mapping(address => bool) public relayers;

    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public maxChangeBps = 5000;

    event PriceUpdated(address indexed token, uint256 price, address updatedBy, uint256 timestamp);
    event TokensSet(address gold, address silver, address rare);
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    event MaxChangeBpsUpdated(uint256 newBps);

    constructor(address _initialOwner) Ownable() {
        if (_initialOwner != address(0)) {
            transferOwnership(_initialOwner);
        }
    }

    function setTokenAddresses(address _goldToken, address _silverToken, address _rareToken) external onlyOwner {
        require(goldToken == address(0) && _goldToken != address(0) && _silverToken != address(0) && _rareToken != address(0), "Invalid or already set");
        goldToken = _goldToken;
        silverToken = _silverToken;
        rareToken = _rareToken;
        emit TokensSet(_goldToken, _silverToken, _rareToken);
    }

    function addRelayer(address relayer) external onlyOwner {
        require(relayer != address(0), "zero");
        relayers[relayer] = true;
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        relayers[relayer] = false;
        emit RelayerRemoved(relayer);
    }

    function setMaxChangeBps(uint256 bps) external onlyOwner {
        require(bps <= 10000, "bps>10000");
        maxChangeBps = bps;
        emit MaxChangeBpsUpdated(bps);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateTokenPrice(address token, uint256 price) public whenNotPaused {
        require(token == goldToken || token == silverToken || token == rareToken, "Invalid token");
        require(price > 0, "Price>0");
        require(relayers[msg.sender] || owner() == msg.sender, "Not authorized");
        TokenPrice memory prev = tokenPrices[token];
        if (prev.lastUpdated != 0) {
            uint256 old = prev.price;
            if (old > 0) {
                if (price > old) {
                    uint256 diff = price - old;
                    require(diff * 10000 <= old * maxChangeBps, "Increase too large");
                } else {
                    uint256 diff = old - price;
                    require(diff * 10000 <= old * maxChangeBps, "Decrease too large");
                }
            }
        }
        tokenPrices[token] = TokenPrice({price: price, lastUpdated: block.timestamp, updatedBy: msg.sender});
        emit PriceUpdated(token, price, msg.sender, block.timestamp);
    }

    function updateAllPrices(uint256 goldPrice, uint256 silverPrice, uint256 rarePrice) external whenNotPaused {
        require(goldToken != address(0) && silverToken != address(0) && rareToken != address(0), "Tokens not set");
        require((relayers[msg.sender] || owner() == msg.sender), "Not authorized");
        updateTokenPrice(goldToken, goldPrice);
        updateTokenPrice(silverToken, silverPrice);
        updateTokenPrice(rareToken, rarePrice);
    }

    function getTokenPrice(address token) public view returns (uint256 price, uint256 lastUpdated) {
        TokenPrice memory tokenPrice = tokenPrices[token];
        return (tokenPrice.price, tokenPrice.lastUpdated);
    }

    function getGoldPrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(goldToken);
    }

    function getSilverPrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(silverToken);
    }

    function getRarePrice() external view returns (uint256 price, uint256 lastUpdated) {
        return getTokenPrice(rareToken);
    }

    function getAllPrices() external view returns (uint256 goldPrice, uint256 silverPrice, uint256 rarePrice, uint256 lastUpdated) {
        TokenPrice memory gold = tokenPrices[goldToken];
        TokenPrice memory silver = tokenPrices[silverToken];
        TokenPrice memory rare = tokenPrices[rareToken];
        uint256 latestUpdate = gold.lastUpdated > silver.lastUpdated ? gold.lastUpdated : silver.lastUpdated;
        latestUpdate = rare.lastUpdated > latestUpdate ? rare.lastUpdated : latestUpdate;
        return (gold.price, silver.price, rare.price, latestUpdate);
    }

    function isPriceRecent(address token, uint256 maxAge) external view returns (bool) {
        TokenPrice memory tokenPrice = tokenPrices[token];
        if (tokenPrice.lastUpdated == 0) return false;
        return (block.timestamp - tokenPrice.lastUpdated) <= maxAge;
    }

    function getTokenAddresses() external view returns (address, address, address) {
        return (goldToken, silverToken, rareToken);
    }
}
