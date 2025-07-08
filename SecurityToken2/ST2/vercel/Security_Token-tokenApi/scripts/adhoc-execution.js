const { ethers } = require('hardhat');

const config = require('../config.json');
const {
    initiateTransferRequestToContract
} = require('./sequences/transferToken');

const { identityForContract } = require('./sequences/identityForContract');
const { addClaim } = require('./sequences/addClaim');
const { addTokenToTrex } = require('./sequences/addTokenToTrex');
const {
    addTokenToLockContract
} = require('./sequences/addTokenToLockContract');
const { tokenBalance } = require('./sequences/tokenBalance');
const { deployIdentity } = require('./sequences/deployIdentity');

let tokenName = 'Property at Dubai';
let tokenSymbol = 'property-5';
let tokenPrefix = 'Property5';

async function main() {
    const [deployer, claimIssuer, irAgent, tokenAgent, user, usernew, user3] =
        await ethers.getSigners();
    console.log('testing & deployment started');

    // await addTokenToTrex(
    //     config.trexFactoryContractAddress,
    //     config.claimIssuerContractAddress,
    //     deployer,
    //     irAgent,
    //     tokenAgent,
    //     tokenName,
    //     tokenSymbol,
    //     tokenPrefix
    // )

    // gatewayContractAddress,
    // investmentLockContract,
    // trexFactoryAddress,
    // irAgent,
    // tokenPrefix

    // await identityForContract(
    //     config.gatewayContractAddress,
    //     config.tokenLockSmartContract,
    //     config.trexFactoryContractAddress,
    //     irAgent,
    //     tokenPrefix,
    //     deployer
    // );

    await addClaim(
        config.claimIssuerContractAddress,   //claimIssuerContractAddress
        "0xb6aA306f01Bc5A00D5385a642dfDd3125f69Ad12",   //UserIdentityContractaddress
        claimIssuer,
        user3
    );

    // await addTokenToLockContract(
    //     config.tokenLockSmartContract,
    //     tokenPrefix,
    //     config.tokenContractAddress, //adhoc
    //     deployer
    // );

    // user,
    // tokenContractAddress,
    // targetUser,
    // tokenLockContractAddress
    //tokenprefix

    // await initiateTransferRequestToContract(
    //     user,
    //     config.tokenContractAddress,
    //     '0xDD984A823176BDe6D776B0A25144AA9A95a7Ee0A',    // Target user
    //     config.tokenLockSmartContract,
    //     tokenPrefix
    // );

    // await tokenBalance(
    //     config.tokenContractAddress, // token contract address
    //     '0xE611882694798a5a92BF2f23a0a1a7B56F243a31', // for user
    //     user
    // );

    // await deployIdentity(
    //     config.gatewayContractAddress,
    //     user3,
    //     config.trexFactoryContractAddress,
    //     irAgent,
    //     tokenPrefix
    // );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        s;
        console.error(error);
        process.exit(1);
    });
