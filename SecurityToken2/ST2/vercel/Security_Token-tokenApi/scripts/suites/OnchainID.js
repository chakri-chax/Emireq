const { ethers } = require('ethers');
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

async function deployOnchainIDSuite(deployer) {
    // Deploy OnchainID proxy
    console.log(`[!] Deploying OnchainID suite, please wait...`)

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

    return {
        identityFactory,
        identityFactoryAbi,
        identityFactoryAddress
    };
}

module.exports = { deployOnchainIDSuite };
