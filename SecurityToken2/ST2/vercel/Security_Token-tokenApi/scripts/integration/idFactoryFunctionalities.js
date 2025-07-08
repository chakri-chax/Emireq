const {
    contracts: { Identity, Factory, ImplementationAuthority }
} = require('@onchain-id/solidity');


const { v4 } = require('uuid');

async function deployIdentityFactory() {
    const factory = await Factory.deploy();
    await factory.deployed();
    console.log('Factory deployed to:', factory.address);
    return factory;
}

async function getOwner(identityFactoryAddress,deployer) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.owner();

}

async function deployIdentity(identityFactoryAddress,deployer,userAddress) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    const identity = await idFactory.createIdentity(userAddress,v4());
    if(identity) {
        const getIdentity = await idFactory.getIdentity(userAddress);
        return getIdentity;
    }
    else {
        return null;
    }
    
}

async function getIdentity(identityFactoryAddress,deployer,userAddress) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.getIdentity(userAddress);
}
async function getWallets(identityFactoryAddress,deployer,identity) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.getWallets(identity);
    
}
async function getToken(identityFactoryAddress,deployer,identity) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.getToken(identity);
    
}

async function createTokenIdentity(identityFactoryAddress,deployer,tokenAddress,tokenOwner,salt) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.createTokenIdentity(tokenAddress,tokenOwner,salt);
}
async function addTokenFactory(identityFactoryAddress,deployer,tokenFactoryAddress) {
    const idFactory = new ethers.Contract(identityFactoryAddress, Factory.abi, deployer);
    return await idFactory.addTokenFactory(tokenFactoryAddress);
}
module.exports = {
    deployIdentityFactory,
    getOwner,
    deployIdentity,
    getIdentity,
    getWallets,
    getToken,
    createTokenIdentity,
    addTokenFactory
}