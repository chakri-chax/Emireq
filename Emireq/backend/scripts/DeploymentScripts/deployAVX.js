
require("dotenv").config();


const { ethers } = require("hardhat");

async function main() {


  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // string memory name_,
  //       string memory symbol_,
  //       address liquidityMiningAddr_,
  //       address institutionalAddr_,
  //       address reserveAddr_,
  //       address charityWaqfAddr_,
  //       address mudaribAddr_,
  //       address governanceMultisig_
  // Deploy AVX contract
  const AVX = await ethers.getContractFactory("Aurivox");
  const avx = await AVX.deploy("Aurivox","AVX",deployer.address,deployer.address,deployer.address,deployer.address,deployer.address,deployer.address);
  
  

  console.log("AVX deployed to:", avx.target);

  // Save deployment info
  const deploymentInfo = {
    network: "hardhat",
    deployer: deployer.address,
    contracts: {
      AVX: avx.target,
    },
    timestamp: new Date().toISOString()
  };

  console.log("Deployment completed:", JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
  })