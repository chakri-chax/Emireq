const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
 

  console.log("Deploying full Aave system with account:", deployer.address);

  // Step 1: Deploy core infrastructure
  console.log("\n=== Step 1: Deploying Core Infrastructure ===");
  
  const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  const addressesProvider = await PoolAddressesProvider.deploy(deployer.address);
  
  
  const ACLManager = await ethers.getContractFactory("ACLManager");
  const aclManager = await ACLManager.deploy(deployer.address);

  
  const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
  const priceOracle = await SimplePriceOracle.deploy();
//   await priceOracle.deployed();

  // Step 2: Deploy mock tokens for testing
  console.log("\n=== Step 2: Deploying Mock Tokens ===");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  
  
  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
  
  // Mint test tokens to deployer
  await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  await weth.mint(deployer.address, ethers.parseUnits("100", 18));

  // Step 3: Deploy Mock Aave Pool
  console.log("\n=== Step 3: Deploying Mock Aave Pool ===");
  
  const MockPool = await ethers.getContractFactory("MockPool");
  const mockPool = await MockPool.deploy();
//   await mockPool.deployed();

  // Step 4: Configure system
  console.log("\n=== Step 4: Configuring System ===");
  
  await addressesProvider.setACLManager(aclManager.target);
  await addressesProvider.setPriceOracle(priceOracle.target);
  await addressesProvider.setPool(mockPool.target);

  // Set prices in oracle
  await priceOracle.setAssetPrice(weth.target, ethers.parseUnits("2000", 8));
  await priceOracle.setAssetPrice(usdc.target, ethers.parseUnits("1", 8));

  // Step 5: Deploy AaveExpertWrapper
  console.log("\n=== Step 5: Deploying AaveExpertWrapper ===");
  
  const AaveExpertWrapper = await ethers.getContractFactory("AaveExpertWrapper");
  const wrapper = await AaveExpertWrapper.deploy(addressesProvider.target);

  
  await wrapper.initializePool();

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      PoolAddressesProvider: addressesProvider.target,
      ACLManager: aclManager.target,
      SimplePriceOracle: priceOracle.target,
      MockUSDC: usdc.target,
      MockWETH: weth.target,
      MockPool: mockPool.target,
      AaveExpertWrapper: wrapper.target,
    },
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n=== Deployment Complete ===");
  console.log("Deployment info saved to deployment.json");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });