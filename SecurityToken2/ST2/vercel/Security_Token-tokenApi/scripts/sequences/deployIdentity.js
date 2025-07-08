const {
    contracts: { Gateway, Factory, Identity }
} = require('@onchain-id/solidity');
const { ethers } = require('hardhat');

const { contracts } = require('@tokenysolutions/t-rex');

const { abi } = require('../../artifacts/contracts/token/Token.sol/Token.json');

const trexABI = require('../../artifacts/contracts/factory/TREXFactory.sol/TREXFactory.json').abi;

async function deployIdentity(
    gatewayContractAddress,
    user,
    trexFactoryAddress,
    irAgent,
    tokenPrefix
) {
    try {
        const gateway = new ethers.Contract(
            gatewayContractAddress,
            Gateway.abi,
            irAgent
        );
        if(!gateway) {
            throw new Error('Gateway contract not found');
        }

        console.table({
            gatewayContractAddress: gatewayContractAddress,
            user:user,
            trexFactoryAddress:trexFactoryAddress,
            irAgent:irAgent,
            tokenPrefix:tokenPrefix
        })

        console.log('deployidentity::user.addresss',user.address)
        const trexFactory = new ethers.Contract(trexFactoryAddress, trexABI, irAgent);
        if(!trexFactory) {
            throw new Error('TrexFactory contract not found');
        }
        const txDeployId = await gateway
            .connect(irAgent)
            .deployIdentityForWallet(user.address);
        await txDeployId.wait();
        console.log(
            `[✓ 24] Identity for wallet has been deployed using Gateway Contract`
        );

        console.log("trexFactory",trexFactory.target);

        try {
            const idFactoryAddress = await trexFactory.getIdFactory.staticCall();
            console.log('IdFactory address:', idFactoryAddress);
            
            // If that works, proceed with the actual call
            const idFactory = await ethers.getContractAt(
                Factory.abi,
                await trexFactory.getIdFactory()
            );
        } catch (error) {
            console.error('Error calling getIdFactory:', error);
            // Additional debugging:
            console.log('TREX Factory code:', await ethers.provider.getCode(trexFactory.address));
        }





        const idFactory = await ethers.getContractAt(
            Factory.abi,
            await trexFactory.getIdFactory()
        );

        console.log(
            `[✓--] IdFactory address from TrexFactory is ${await idFactory.getAddress()}`
        );

        const userIdentity = await ethers.getContractAt(
            Identity.abi,
            await idFactory.getIdentity(user.address)
        );

        console.log(
         
   `[✓ --] UserIdentity from idFactory is ${await userIdentity.getAddress()}`
        );
        const token = new ethers.Contract(
            await trexFactory.getToken(tokenPrefix),
            abi,
            irAgent
        );

        console.log(
            `[✓ --] Token address from trexFactory for ${tokenPrefix} is ${await token.getAddress()}`
        );

        const idRegistry = await ethers.getContractAt(
            contracts.IdentityRegistry.abi,
            await token.identityRegistry()
        );

        console.log(
            `[✓ --] IDRegistry address from token preix ${tokenPrefix} is ${await idRegistry.getAddress()}`
        );

        const txIdRegistry = await idRegistry
            .connect(irAgent)
            .registerIdentity(
                user.address,
                await userIdentity.getAddress(),
                688
            ); // SRB Iban code
        await txIdRegistry.wait();
        console.log(
            `[✓ 25] User identity has been registered in IdentityRegistry user Address is ${
                user.address
            } and identity is ${await userIdentity.getAddress()}`
        );
        return { userIdentity, token, idRegistry };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployIdentity };
