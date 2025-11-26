
require("dotenv").config();


const { ethers } = require("hardhat");

async function main() {


  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

    //   string memory name_,
    //     string memory symbol_,
    //     address publicAddr_,
    //     address reserveAddr_,
    //     address devAddr_,
    //     address shariaAddr_,
    //     address strategicAddr_,
    //     address governanceMultisig_
  // Deploy EMN contract
  const EMN = await ethers.getContractFactory("EminarToken");
  const emn = await EMN.deploy("EminarToken","EMN",deployer.address,deployer.address,deployer.address,deployer.address,deployer.address,deployer.address);
  
  

  console.log("EMN deployed to:", emn.target);

  // Save deployment info
  const deploymentInfo = {
    network: "hardhat",
    deployer: deployer.address,
    contracts: {
      EMN: emn.target,
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