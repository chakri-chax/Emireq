require('dotenv').config(); // Ensure .env is loaded
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('./suites/OnchainID');
const { deployTrexSuite } = require('./suites/TREXSuite');
const { uploadConfig } = require('../config/uploadConfiguration');

async function main() {
  // Use Hardhat's default provider for the active network
  const provider = ethers.provider;
//   const [deployer, claimIssuer, irAgent, tokenAgent, USER1, USER2, USER3] =
//     await ethers.getSigners();
    const [deployer, USER1, USER2, USER3] =
    await ethers.getSigners();
  // Log addresses to verify accounts
  console.log('Deployer Address:', deployer.address);
  console.log('USER1 Address:', USER1.address);
  console.log('USER2 Address:', USER2.address);
  console.log('USER3 Address:', USER3.address);

    console.log(
        'Deployment started, 30 steps to go!, please wait patiently...'
    );

    const { identityFactory, identityFactoryAbi, identityFactoryAddress } =
        await deployOnchainIDSuite(deployer);

    try {
        const configFactoryData = {
            identityFactoryAddress: identityFactoryAddress
        };
        const configFilePath = path.resolve(__dirname, '../configFactory.json');

        // Write the updated config object to the file
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(configFactoryData, null, 2),
            'utf8'
        );
    } catch (err) {
        console.error(`[x] Error updating the configuration file: ${err}`);
        return;
    }

    // const {
    //     trexFactoryContractAddress,
    //     gatewayContractAddress,
    //     claimIssuerContractAddress,
    //     tokenLockSmartContract
    // } = await deployTrexSuite(
    //     deployer,
    //     identityFactory,
    //     irAgent,
    //     claimIssuer,
    //     tokenAgent,
    //     USER1
    // );

    const {
        trexFactoryContractAddress,
        gatewayContractAddress,
        claimIssuerContractAddress,
        tokenLockSmartContract
    } = await deployTrexSuite(
        deployer,   
        identityFactory,
        deployer,
        deployer,
        deployer,
        USER1
    );

    // Update the configuration file
    // uploadConfig(
    //     trexFactoryContractAddress,
    //     gatewayContractAddress,
    //     claimIssuerContractAddress,
    //     tokenLockSmartContract,
    //     deployer.address,
    //     irAgent.address,
    //     tokenAgent.address,
    //     user.address,
    //     claimIssuer.address
    // );

    uploadConfig(
        trexFactoryContractAddress,
        gatewayContractAddress,
        claimIssuerContractAddress,
        tokenLockSmartContract,
        deployer.address,
        deployer.address,
        deployer.address,
        USER1.address,
        deployer.address
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
