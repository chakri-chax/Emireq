const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
const { ethers } = require('hardhat');

const { getIdentity } = require('./IdentityFactory')
const { initializeBlockchain } = require('../Utils/blockchainSetup');
const { use } = require('../../../routes/identityRoutes');
const { signer } = initializeBlockchain();
async function getKeyFromIdentity(user) {
    if (!ethers.isAddress(user) || (user === ethers.ZeroAddress)) {
        throw new Error("Not a valid address");
    }

    const identityAddress = await getIdentityAddress(user);
    if (identityAddress === ethers.ZeroAddress) {
        throw new Error("No Identity contract for this address");
    }

    const KEY = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address'],
            [user]
        )
    );

    const identityContract = await ethers.getContractAt(Identity.abi, identityAddress, signer);
    return await identityContract.getKey(KEY);
}

const getIdentityAddress = async (user) => {
    const identity = await getIdentity(user);
    return identity;
}


module.exports = { getKeyFromIdentity, getIdentityAddress };