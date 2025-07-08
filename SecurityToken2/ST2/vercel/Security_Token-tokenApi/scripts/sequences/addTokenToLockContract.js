const {
    contracts: { Gateway, Factory, Identity }
} = require('@onchain-id/solidity');
const { ethers } = require('hardhat');
const { contracts } = require('@tokenysolutions/t-rex');
const {
    abi
} = require('../../artifacts/contracts/TokenLockContract.sol/TokenLockContract.json');

async function addTokenToLockContract(
    lockContractAddress,
    tokenPrefix,
    tokenContractAddress,
    deployer
) {
    try {
        const lockContract = new ethers.Contract(
            lockContractAddress,
            abi,
            deployer
        );

        console.log("lockContract::::",await lockContract.getAddress())

        const tokenMappingTxn = await lockContract
            .connect(deployer)
            .setTokenMapping(tokenPrefix,tokenContractAddress);

        await tokenMappingTxn.wait();

        console.log('TokenMapping is done');
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { addTokenToLockContract };
