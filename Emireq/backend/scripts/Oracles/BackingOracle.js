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

  console.log("Tokens and Oracle deployed:", gold.target);

  await oracle.setTokenAddresses(
    gold.target,
    silver.target,
    rare.target
  );

  const goldPrice = ethers.parseUnits("4127.88177747", 8);  // Rounded to 8 decimals
  const silverPrice = ethers.parseUnits("51.14256217", 8);   // Rounded to 8 decimals
  const rarePrice = ethers.parseUnits("1401.17799837", 8);   // Rounded to 8 decimals



  const tx = await oracle.updateAllPrices(goldPrice, silverPrice, rarePrice);
  const receipt = await tx.wait();
  console.log("updateAllPrices txHash:", receipt.hash);

  const gp = await oracle.getAllPrices();
  console.log("Stored prices (gold,silver,rare,lastUpdated):", gp[0].toString(), gp[1].toString(), gp[2].toString(), gp[3].toString());

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

