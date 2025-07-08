const { identityFactoryAddress } = require('../../../deployedData/sepolia/identityFactory.json');
const { identityFactoryAbi } = require('../../../deployedData/sepolia/identityFactory.json');
const { ethers } = require('ethers');
const { initializeBlockchain } = require('../Utils/blockchainSetup');

const { provider, deployer, signer } = initializeBlockchain();

const identityFactoryContract = new ethers.Contract(identityFactoryAddress, identityFactoryAbi, deployer);


const createIdentity = async (userAddress, salt) => {
    if (ethers.isAddress(userAddress) === false || (userAddress == ethers.ZeroAddress)) {
        throw new Error("Not a valid address");
    }
    try {
        const tx = await identityFactoryContract.connect(deployer).createIdentity(userAddress, salt);
        const receipt = await tx.wait();
        
        const identityAddress = await getIdentity(userAddress);
        
        
        return identityAddress;
    } catch (error) {
        console.error(error);
        throw error; 
    }
}

const getIdentity = async (userAddress) => {
    if (ethers.isAddress(userAddress) === false || (userAddress == ethers.ZeroAddress)) {
        return "Not a valid address";
    }
    const identity = await identityFactoryContract.connect(deployer).getIdentity(userAddress);

    return identity;
}


module.exports = { identityFactoryContract, createIdentity, getIdentity };