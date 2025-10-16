// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimplePriceOracle
 * @dev Basic price oracle for testing - replace with Chainlink in production
 */
contract SimplePriceOracle {
    mapping(address => uint256) private prices;
    address private owner;

    event AssetPriceUpdated(address indexed asset, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can update prices");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Set some default prices for testing
        // WETH: $2000
        prices[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2] = 2000 * 10**8;
        // USDC: $1
        prices[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = 1 * 10**8;
        // DAI: $1
        prices[0x6B175474E89094C44Da98b954EedeAC495271d0F] = 1 * 10**8;
    }

    function setAssetPrice(address asset, uint256 price) external onlyOwner {
        prices[asset] = price;
        emit AssetPriceUpdated(asset, price);
    }

    function getAssetPrice(address asset) external view returns (uint256) {
        require(prices[asset] > 0, "Price not set for asset");
        return prices[asset];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }
}