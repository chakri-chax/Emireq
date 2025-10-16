const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  [deployer, user1, user2] = await ethers.getSigners();
  // Test constants
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
  
  // Deploy Mock Tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  weth = await MockERC20.deploy("Wrapped Ether", "WETH", WETH_DECIMALS);
  usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
  usdt = await MockERC20.deploy("Tether USD", "USDT", USDT_DECIMALS);
  dai = await MockERC20.deploy("Dai Stablecoin", "DAI", DAI_DECIMALS);
  wbtc = await MockERC20.deploy("Wrapped BTC", "WBTC", WBTC_DECIMALS);

  // Deploy Enhanced Price Oracle (Dynamic)
  const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
  priceOracle = await SimplePriceOracle.deploy();

  // Add assets to oracle with prices and decimals
  await priceOracle.connect(deployer).addAsset(weth.target, parsePrice("2000"), WETH_DECIMALS);
  await priceOracle.connect(deployer).addAsset(usdc.target, parsePrice("1"), USDC_DECIMALS);
  await priceOracle.connect(deployer).addAsset(usdt.target, parsePrice("1"), USDT_DECIMALS);
  await priceOracle.connect(deployer).addAsset(dai.target, parsePrice("1"), DAI_DECIMALS);
  await priceOracle.connect(deployer).addAsset(wbtc.target, parsePrice("30000"), WBTC_DECIMALS);

  // Deploy Core Infrastructure
  const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  addressesProvider = await PoolAddressesProvider.deploy(deployer.address);

  const ACLManager = await ethers.getContractFactory("ACLManager");
  aclManager = await ACLManager.deploy(deployer.address);

  // Deploy Enhanced MockPool (Dynamic)
  const MockPool = await ethers.getContractFactory("MockPool");
  mockPool = await MockPool.deploy(priceOracle.target);

  // Add assets to MockPool with collateral configurations
  await mockPool.connect(deployer).addAsset(weth.target, 7500, 8000); // 75% LTV, 80% liquidation
  await mockPool.connect(deployer).addAsset(usdc.target, 8000, 8500); // 80% LTV, 85% liquidation
  await mockPool.connect(deployer).addAsset(usdt.target, 7500, 8000); // 75% LTV, 80% liquidation
  await mockPool.connect(deployer).addAsset(dai.target, 7500, 8000);  // 75% LTV, 80% liquidation
  await mockPool.connect(deployer).addAsset(wbtc.target, 7000, 7500); // 70% LTV, 75% liquidation

  // Configure System
  await addressesProvider.connect(deployer).setACLManager(aclManager.target);
  await addressesProvider.connect(deployer).setPriceOracle(priceOracle.target);
  await addressesProvider.connect(deployer).setPool(mockPool.target);

  const AaveExpertWrapper = await ethers.getContractFactory("AaveExpertWrapper");
  wrapper = await AaveExpertWrapper.deploy(addressesProvider.target);
  await wrapper.connect(deployer).initializePool();

  const deploymentInfo = {
    addressesProvider: addressesProvider.target,
    aclManager: aclManager.target,
    priceOracle: priceOracle.target,
    wrapper: wrapper.target,
    mockPool: mockPool.target,
    weth: weth.target,
    usdc: usdc.target,
    usdt: usdt.target,
    dai: dai.target,
    wbtc: wbtc.target,
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