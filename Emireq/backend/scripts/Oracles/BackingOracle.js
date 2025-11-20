const { ethers } = require("hardhat");




async function main() {
// Deploy tokens first
const [owner] = await ethers.getSigners();
console.log("Deploying contracts with the account:", await owner.getAddress());

const GOLD = await ethers.getContractFactory("GOLD");
const gold = await GOLD.deploy();

const SILVER = await ethers.getContractFactory("SILVER");
const silver = await SILVER.deploy();

const RARE = await ethers.getContractFactory("RARE");
const rare = await RARE.deploy();

const TokenOracle = await ethers.getContractFactory("TokenOracle");
const oracle = await TokenOracle.deploy(await owner.getAddress());

console.log("Tokens and Oracle deployed:",gold.target);

await oracle.setTokenAddresses(
  gold.target,
  silver.target,
  rare.target
);


await oracle.updateAllPrices(
  "185050000000",  // GOLD: $1850.50
  "2150000000",    // SILVER: $21.50
  "125000000000"   // RARE: $1250.00
);

// Get individual prices
const goldPrice = await oracle.getGoldPrice();
const silverPrice = await oracle.getSilverPrice();
const rarePrice = await oracle.getRarePrice();

// Get all prices at once
const allPrices = await oracle.getAllPrices();
console.log("Gold Price:", goldPrice.toString());
console.log("Silver Price:", silverPrice.toString());
console.log("Rare Price:", rarePrice.toString());
console.log("All Prices:", allPrices.map(price => price.toString()));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Welcome to Alpha Vantage! Here is your API key: T9GY9H9656HAAFKL. Please record this API key at a safe place for future data access.

https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=T9GY9H9656HAAFKL
https://www.alphavantage.co/query?function=COPPER&interval=monthly&apikey=T9GY9H9656HAAFKL