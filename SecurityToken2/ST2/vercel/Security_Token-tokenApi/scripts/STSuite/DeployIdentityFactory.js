

require('dotenv').config(); // Ensure .env is loaded
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('../suites/OnchainID');


async function main() {
    
  const [deployer, claimIssuer, irAgent, tokenAgent, USER1, USER2, USER3] =
    await ethers.getSigners();

  console.log(
        'Deployment started, 30 steps to go!, please wait patiently...'
    );

    const { identityFactory, identityFactoryAbi, identityFactoryAddress } =
        await deployOnchainIDSuite(deployer);

    try {
        const configFactoryData = {
            identityFactory:identityFactory,
            identityFactoryAbi:identityFactoryAbi,
            identityFactoryAddress: identityFactoryAddress
        };
        const configFilePath = path.resolve(__dirname, '../../deployedData/sepolia/identityFactory.json');

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

}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});