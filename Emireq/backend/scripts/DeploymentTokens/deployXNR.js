
require("dotenv").config();


const { ethers } = require("hardhat");

async function main() {


  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

    //  string memory name_,
    //     string memory symbol_,
    //     address publicAddr_,
    //     address creatorPoolAddr_,
    //     address reserveAddr_,
    //     address communityDAOAddr_,
    //     address royaltyManagerAddr_,
    //     address governanceMultisig_

  // Deploy XNR contract
  const XNR = await ethers.getContractFactory("Xenara");
  const xnr = await XNR.deploy("XenaraV1","XNRv1",deployer.address,deployer.address,deployer.address,deployer.address,deployer.address,deployer.address);
  console.log("xnr",xnr);
  
  

  console.log("XNR deployed to:", xnr.target);

  // Save deployment info
  const deploymentInfo = {
    network: "hardhat",
    deployer: deployer.address,
    contracts: {
      XNR: xnr.target,
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