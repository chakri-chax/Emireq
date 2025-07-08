

require('dotenv').config(); // Ensure .env is loaded
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('../suites/OnchainID');
const { deployTrexSuite } = require('../suites/TREXSuite');
const { uploadConfig } = require('../../config/uploadConfiguration');


const {deployTrexLogicSuite} = require('../suites/TREXSuite');

async function main() {
    
  const [deployer, claimIssuer, irAgent, tokenAgent, USER1, USER2, USER3] =
    await ethers.getSigners();

const {
    claimTopicsRegistryImplementation,
    trustedIssuersRegistryImplementation,
    identityRegistryStorageImplementation,
    identityRegistryImplementation,
    modularComplianceImplementation,
    tokenImplementation
} = await deployTrexLogicSuite(deployer);

try {
        const configFactoryData = {
            claimTopicsRegistryImplementation: claimTopicsRegistryImplementation,
            trustedIssuersRegistryImplementation: trustedIssuersRegistryImplementation,
            identityRegistryStorageImplementation: identityRegistryStorageImplementation,
            identityRegistryImplementation: identityRegistryImplementation,
            modularComplianceImplementation: modularComplianceImplementation,
            tokenImplementation: tokenImplementation
        };
        const configFilePath = path.resolve(__dirname, '../../deployedData/sepolia/trexLogicAddress.json');

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