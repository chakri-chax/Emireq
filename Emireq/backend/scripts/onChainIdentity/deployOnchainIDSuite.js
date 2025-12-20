const { ethers } = require('hardhat');
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

const path = require('path');
const fs = require('fs');

async function deployOnchainIDSuite() {
    const [deployer] = await ethers.getSigners();
    // Deploy OnchainID proxy
    console.log(`[!] Deploying OnchainID suite on ${deployer.address}, please wait...`)

    const identityImplementation = await new ethers.ContractFactory(
        Identity.abi,
        Identity.bytecode,
        deployer
    ).deploy(deployer.address, true);
    // Wait for implementation transaction to be deployed
    await identityImplementation.waitForDeployment();

    console.log(`[+ 1] Deployed OnchainID implementation (identityImplementation) `, await identityImplementation.getAddress());

    const identityImplementationAuthority = await new ethers.ContractFactory(
        ImplementationAuthority.abi,
        ImplementationAuthority.bytecode,
        deployer
    ).deploy(await identityImplementation.getAddress());

    // Wait for authority transaction to be deployed
    await identityImplementationAuthority.waitForDeployment();

    console.log(`[+ 2] Deployed OnchainID implementation authority`, await identityImplementationAuthority.getAddress());

    const identityFactory = await new ethers.ContractFactory(
        Factory.abi,
        Factory.bytecode,
        deployer
    ).deploy(await identityImplementationAuthority.getAddress());

    // Wait for factory transaction to be deployed
    await identityFactory.waitForDeployment();

    console.log("[+ 3] Deployed identityFactory ", await identityFactory.getAddress())

    const identityFactoryAddress = await identityFactory.getAddress();

    // Obtain abi and bytecode for the factory
    const identityFactoryAbi = Factory.abi;
    const identityFactoryBytecode = Factory.bytecode;

    console.log(`[✓] OnchainID suite Deployed Successfully, Preparing the next steps...  [!]`)

    console.log(`- identityFactory Address: ${identityFactoryAddress}` );

    const deployInfo = {
        identityFactoryAddress

    };
    const outputPath = path.join(__dirname, `${hre.network.name}_deployedOnchainIDSuite.json`);
    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            deployInfo,
            null,2
           
        )
    );
    return {
        identityFactory,
        identityFactoryAbi,
        identityFactoryAddress
    };
}

deployOnchainIDSuite()
    .then(() => {
        console.log('OnchainID Suite deployment script completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// module.exports = { deployOnchainIDSuite };
