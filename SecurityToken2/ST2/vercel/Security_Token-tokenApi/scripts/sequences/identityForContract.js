const {
    contracts: { Gateway, Factory, Identity }
} = require('@onchain-id/solidity');
const { ethers } = require('hardhat');
const { contracts } = require('@tokenysolutions/t-rex');
const { abi } = require('../../artifacts/contracts/token/Token.sol/Token.json');
async function identityForContract(
    gatewayContractAddress,
    investmentLockContract,
    trexFactoryAddress,
    irAgent,
    tokenPrefix,
    deployer
) {
    try {
        const gateway = new ethers.Contract(
            gatewayContractAddress,
            Gateway.abi,
            irAgent
        );
        const trexFactory = new ethers.Contract(
            trexFactoryAddress,
            contracts.TREXFactory.abi,
            irAgent
        );
        // const txDeployId = await gateway
        //     .connect(irAgent)
        //     .deployIdentityForWallet(investmentLockContract);
        // await txDeployId.wait();
        // console.log(
        //     `[✓ 24] Identity for contract has been deployed using Gateway Contract`
        // );
        const idFactory = await ethers.getContractAt(
            Factory.abi,
            await trexFactory.getIdFactory()
        );

        console.log(
            `[✓--] IdFactory address from TrexFactory is ${await idFactory.getAddress()}`
        );

        const userIdentity = await ethers.getContractAt(
            Identity.abi,
            await idFactory.getIdentity(investmentLockContract)
        );

        console.log(
            `[✓ --] Contract Identity from idFactory is ${await userIdentity.getAddress()}`
        );

        const token = new ethers.Contract(
            await trexFactory.getToken(tokenPrefix),
            abi,
            deployer
        );
        console.log("token::::",token)

        const functions = token.interface.fragments.filter(
            (fragment) => fragment.type === 'function'
          );
          console.log("functions:::",functions)
          // Check if `whitelist` function exists
          const whitelistFunction = functions.find(
            (func) => func.name === 'setWhitelist'
          );

          console.log("whitelisfuncion:::",whitelistFunction)
        console.log(
            `[✓ --] Token address from trexFactory for ${tokenPrefix} is ${await token.getAddress()}`
        );

        const whitelistTxn = await token.connect(
            deployer
        ).setWhitelist(investmentLockContract);
        await whitelistTxn.wait();
        console.log("Whitelisted Contract Address in Token")

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
                investmentLockContract,
                await userIdentity.getAddress(),
                688
            ); // SRB Iban code
        await txIdRegistry.wait();
        console.log(
            `[✓ 25] Contract identity has been registered in IdentityRegistry InvestmentPlatformcontract Address is ${
                investmentLockContract
            } and identity is ${await userIdentity.getAddress()}`
        );
        return { userIdentity, token };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { identityForContract };
