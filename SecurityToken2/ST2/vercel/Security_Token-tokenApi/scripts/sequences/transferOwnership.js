const {
    contracts: { Factory }
} = require('@onchain-id/solidity');
const { ethers } = require('hardhat');

async function transferOwnership(identityFactoryAddress, gatewayContractAddress, deployer) {
    try {
        const identityFactory = new ethers.Contract(
            identityFactoryAddress,
            Factory.abi,
            deployer
        );
        console.log('Transferring Ownership to Gateway....');
        const txTransferOwnership = await identityFactory
            .connect(deployer)
            .transferOwnership(gatewayContractAddress);
        await txTransferOwnership.wait();
        console.log(
            `[✓ 23] IdentityFactory Ownership has been transferred to Gateway Contract`
        );   
     } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { transferOwnership };
