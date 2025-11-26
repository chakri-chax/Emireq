

require("dotenv").config();


const { ethers } = require("hardhat");

async function main() {



    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", await deployer.getAddress());

    const GOLD = await ethers.getContractFactory("GOLD");
    const gold = await GOLD.deploy();

    console.log("Gold deployed:", gold.target);
    const SILVER = await ethers.getContractFactory("SILVER");
    const silver = await SILVER.deploy();
    console.log("Silver deployed:", silver.target);
    const RARE = await ethers.getContractFactory("RARE");
    const rare = await RARE.deploy();
    console.log("Rare deployed:", rare.target);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });