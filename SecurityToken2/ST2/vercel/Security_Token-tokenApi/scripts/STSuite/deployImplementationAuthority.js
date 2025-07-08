

require('dotenv').config(); // Ensure .env is loaded
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { deployOnchainIDSuite } = require('../suites/OnchainID');
const { deployTrexSuite } = require('../suites/TREXSuite');


const {deployImplementationAuthority} = require('../suites/TREXSuite');

const identityFactory = require('../../deployedData/sepolia/identityFactory.json');

const {
    claimTopicsRegistryImplementation,
    trustedIssuersRegistryImplementation,
    identityRegistryStorageImplementation,
    identityRegistryImplementation,
    modularComplianceImplementation,
    tokenImplementation
} = require('../../deployedData/sepolia/trexLogicAddress.json');

async function main() {
    const [deployer, irAgent, tokenAgent, USER1, USER2, USER3] =
    await ethers.getSigners();

    console.log(`[!] Invoking deployImplementationAuthority, please wait..`);


    const { trexImplementationAuthority, gateway, claimIssuer, trexFactory } =
        await deployImplementationAuthority(
            deployer,
            claimTopicsRegistryImplementation,
            trustedIssuersRegistryImplementation,
            identityRegistryStorageImplementation,
            identityRegistryImplementation,
            modularComplianceImplementation,
            tokenImplementation,
            identityFactory,
            deployer,
            deployer,
            USER1
        );

     try {
            const configFactoryData = {
                trexImplementationAuthority:trexImplementationAuthority,
                gateway:gateway,
                claimIssuer:claimIssuer,
                trexFactory:trexFactory
            };
            const configFilePath = path.resolve(__dirname, '../../deployedData/sepolia/implementationAuthority.json');
    
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
})