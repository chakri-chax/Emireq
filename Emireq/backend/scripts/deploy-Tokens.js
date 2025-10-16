const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    [deployer, user1, user2] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
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
    //   usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    //   usdt = await MockERC20.deploy("Tether USD", "USDT", USDT_DECIMALS);

    console.log("weth target", weth.target);

    await weth.connect(deployer).mint(deployer.address, parseWETH("1000"));

    console.log("weth", await weth);
    
    console.log("weth balance", await weth.balanceOf(deployer.address));
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });