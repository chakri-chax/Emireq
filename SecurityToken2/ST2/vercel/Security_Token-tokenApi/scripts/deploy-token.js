const config = require('../config.json');
const { ethers } = require('hardhat');
const { generateWallet, generateMnemonicWallet } = require('../scripts/utils/ethers')

const { deployOnchainIDSuite } = require('../scripts/suites/OnchainID')
const { getOwner, deployIdentity,getIdentity } = require('../scripts/integration/idFactoryFunctionalities')
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

// const {deployIdentity} = require('../scripts/identities/deploy-identity')

async function main() {
    const [deployer, USER1, USER2, USER3] = await ethers.getSigners();
    // const user1 = generateWallet();

    // console.log("user1", user1);

    let tokenPrefix = 'GaianByMobius';
    console.log("deployer", deployer.address);

    //######################1:  Deploy OnchainID suite ###########################

    const { identityFactory, identityFactoryAbi, identityFactoryAddress } =
    await deployOnchainIDSuite(deployer);

    
    console.log("identityFactoryAddress", identityFactoryAddress);
    console.log("identityFactory", identityFactory);

    // const identityFactoryAddress = "0x94Fa0D9A39b5D95eA4E3630Bf29C7e18AA4C6F1a"
    // // ###################### Load Identity contract  ###########################
    const owner = await getOwner(identityFactoryAddress, deployer)
    console.log("owner", owner);

    // ################### DeployIdentity for user #############################

    const identity = await deployIdentity(identityFactoryAddress, deployer, USER2.address)
    console.log("identity", identity);

    // ################### GetIdentity for user ################################

    // const identity = await getIdentity(identityFactoryAddress, deployer, USER1.address)
    // console.log("identity", identity);

    // Validate config values exist
    // if (!config.gatewayContractAddress || !config.trexFactoryContractAddress) {
    //     throw new Error("Missing required contract addresses in config. Please set gatewayContractAddress and trexFactoryContractAddress");
    // }

    // // Debug: Print all addresses before deployment
    // console.log("Configuration values:");
    // console.log("- Gateway Contract:", config.gatewayContractAddress);
    // console.log("- TREX Factory:", config.trexFactoryContractAddress);
    // console.log("- User Address:", USER1.address);
    // console.log("- Deployer Address:", deployer.address);

    // // Verify contracts exist at these addresses
    // try {
    //     const gatewayCode = await ethers.provider.getCode(config.gatewayContractAddress);
    //     const factoryCode = await ethers.provider.getCode(config.trexFactoryContractAddress);

    //     console.log("Gateway contract code exists:", gatewayCode !== '0x');
    //     console.log("TREX Factory contract code exists:", factoryCode !== '0x');

    //     if (gatewayCode === '0x' || factoryCode === '0x') {
    //         throw new Error("One or more contracts are not deployed at the specified addresses");
    //     }
    // } catch (error) {
    //     console.error("Error verifying contracts:", error);
    //     throw error; // Re-throw to stop execution
    // }

    // Proceed with deployment
    // try {
    //     await deployIdentity(
    //         config.gatewayContractAddress,
    //         USER1,
    //         config.trexFactoryContractAddress,
    //         deployer,
    //         tokenPrefix
    //     );
    //     console.log("Identity deployed successfully");
    // } catch (error) {
    //     console.error("Failed to deploy identity:", error);
    //     throw error;
    // }
}

// Add error handling when calling main
main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});

