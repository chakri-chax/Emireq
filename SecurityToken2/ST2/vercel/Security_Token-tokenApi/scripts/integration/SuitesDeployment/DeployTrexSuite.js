const { deployTrexSuite } = require('../../suites/TREXSuite');
const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');

const identityFactoryAddress = "0x94Fa0D9A39b5D95eA4E3630Bf29C7e18AA4C6F1a"


async function main() {


    const [deployer, claimIssuer, irAgent, tokenAgent, USER1, USER2, USER3] =
        await ethers.getSigners();
    const identityFactory = new ethers.Contract(
        identityFactoryAddress,
        Factory.abi,
        deployer
    )
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


    console.table({
        trexFactoryContractAddress,
        gatewayContractAddress,
        claimIssuerContractAddress,
        tokenLockSmartContract
    })

}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
})