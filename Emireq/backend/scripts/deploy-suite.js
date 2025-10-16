const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  [deployer, user1, user2] = await ethers.getSigners();
   const USDC_DECIMALS = 6;
  const WETH_DECIMALS = 18;
  const USDT_DECIMALS = 6;
  const DAI_DECIMALS = 18;
  const WBTC_DECIMALS = 8;
  const PRICE_DECIMALS = 8;

   const parseUSDC = (amount) => ethers.parseUnits(amount, USDC_DECIMALS);
  const parseWETH = (amount) => ethers.parseUnits(amount, WETH_DECIMALS);
  const parseUSDT = (amount) => ethers.parseUnits(amount, USDT_DECIMALS);
  const parseDAI = (amount) => ethers.parseUnits(amount, DAI_DECIMALS);
  const parseWBTC = (amount) => ethers.parseUnits(amount, WBTC_DECIMALS);
  const parsePrice = (amount) => ethers.parseUnits(amount, PRICE_DECIMALS);
  // Test constants
  const wethAddress = "0x72b902DF2F5977b74707A2228F2491d0777b12fA"

  // Deploy Enhanced Price Oracle (Dynamic)
  const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
  priceOracle = await SimplePriceOracle.deploy();

console.log("priceOracle", priceOracle.target);

   // Add assets to oracle with prices and decimals
  await priceOracle.connect(deployer).addAsset(wethAddress, parsePrice("2000"), WETH_DECIMALS);

console.log("priceOracle");
    // Deploy Core Infrastructure
  const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  addressesProvider = await PoolAddressesProvider.deploy(deployer.address);
console.log("addressesProvider", addressesProvider.target);

  const ACLManager = await ethers.getContractFactory("ACLManager");
  aclManager = await ACLManager.deploy(deployer.address);

  console.log("aclManager", aclManager.target);
  
  // Deploy Enhanced MockPool (Dynamic)
  const MockPool = await ethers.getContractFactory("MockPool");
  mockPool = await MockPool.deploy(priceOracle.target);

  console.log("mockPool", mockPool.target);
  
  // Add assets to MockPool with collateral configurations
  await mockPool.connect(deployer).addAsset(wethAddress, 7500, 8000); 
    console.log("mockPool", mockPool.target);
    
  await addressesProvider.connect(deployer).setACLManager(aclManager.target);
  await addressesProvider.connect(deployer).setPriceOracle(priceOracle.target);
  await addressesProvider.connect(deployer).setPool(mockPool.target);

  const AaveExpertWrapper = await ethers.getContractFactory("AaveExpertWrapper");
  wrapper = await AaveExpertWrapper.deploy(addressesProvider.target);
  console.log("wrapper", wrapper.target);
  
  await wrapper.connect(deployer).initializePool();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });