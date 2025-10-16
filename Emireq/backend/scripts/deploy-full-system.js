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
  await priceOracle.addAsset(weth.target, parsePrice("2000"), WETH_DECIMALS);
  await priceOracle.addAsset(usdc.target, parsePrice("1"), USDC_DECIMALS);
  await priceOracle.addAsset(usdt.target, parsePrice("1"), USDT_DECIMALS);
  await priceOracle.addAsset(dai.target, parsePrice("1"), DAI_DECIMALS);
  await priceOracle.addAsset(wbtc.target, parsePrice("30000"), WBTC_DECIMALS);

  // Deploy Core Infrastructure
  const PoolAddressesProvider = await ethers.getContractFactory("PoolAddressesProvider");
  addressesProvider = await PoolAddressesProvider.deploy(deployer.address);

  const ACLManager = await ethers.getContractFactory("ACLManager");
  aclManager = await ACLManager.deploy(deployer.address);

  // Deploy Enhanced MockPool (Dynamic)
  const MockPool = await ethers.getContractFactory("MockPool");
  mockPool = await MockPool.deploy(priceOracle.target);

  // Add assets to MockPool with collateral configurations
  await mockPool.addAsset(weth.target, 7500, 8000); // 75% LTV, 80% liquidation
  await mockPool.addAsset(usdc.target, 8000, 8500); // 80% LTV, 85% liquidation
  await mockPool.addAsset(usdt.target, 7500, 8000); // 75% LTV, 80% liquidation
  await mockPool.addAsset(dai.target, 7500, 8000);  // 75% LTV, 80% liquidation
  await mockPool.addAsset(wbtc.target, 7000, 7500); // 70% LTV, 75% liquidation

  // Configure System
  await addressesProvider.setACLManager(aclManager.target);
  await addressesProvider.setPriceOracle(priceOracle.target);
  await addressesProvider.setPool(mockPool.target);

  const AaveExpertWrapper = await ethers.getContractFactory("AaveExpertWrapper");
  wrapper = await AaveExpertWrapper.deploy(addressesProvider.target);
  await wrapper.initializePool();


  const fundPromises = [
    weth.mint(deployer.address, parseWETH("1000")),
    usdc.mint(deployer.address, parseUSDC("1000000")),
    usdt.mint(deployer.address, parseUSDT("1000000")),
    dai.mint(deployer.address, parseDAI("1000000")),
    wbtc.mint(deployer.address, parseWBTC("100")),
  ];

  await Promise.all(fundPromises);

  const approveAndFund = [
    weth.connect(deployer).approve(mockPool.target, parseWETH("1000")),
    usdc.connect(deployer).approve(mockPool.target, parseUSDC("1000000")),
    usdt.connect(deployer).approve(mockPool.target, parseUSDT("1000000")),
    dai.connect(deployer).approve(mockPool.target, parseDAI("1000000")),
    wbtc.connect(deployer).approve(mockPool.target, parseWBTC("100")),
  ];

  await Promise.all(approveAndFund);

  const fundPool = [
    mockPool.connect(deployer).fundPool(weth.target, parseWETH("500")),
    mockPool.connect(deployer).fundPool(usdc.target, parseUSDC("500000")),
    mockPool.connect(deployer).fundPool(usdt.target, parseUSDT("500000")),
    mockPool.connect(deployer).fundPool(dai.target, parseDAI("500000")),
    mockPool.connect(deployer).fundPool(wbtc.target, parseWBTC("50")),
  ];

  await Promise.all(fundPool);

  const userFunding = [
    weth.mint(user1.address, parseWETH("10")),
    usdc.mint(user1.address, parseUSDC("10000")),
    usdt.mint(user1.address, parseUSDT("10000")),
    dai.mint(user1.address, parseDAI("10000")),
    wbtc.mint(user1.address, parseWBTC("1")),
    weth.mint(user2.address, parseWETH("5")),
    usdc.mint(user2.address, parseUSDC("5000")),
  ];

  await Promise.all(userFunding);

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