
const { addTokenToTrex } = require('../../sequences/addTokenToTrex');
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { abi } = require('../../../artifacts/contracts/factory/TREXFactory.sol/TREXFactory.json');
const { trexFactory, claimIssuer } = require('../../../deployedData/sepolia/implementationAuthority.json');
const { transferOwnership } = require('../../sequences/transferOwnership');
const { gateway } = require('../../../deployedData/sepolia/implementationAuthority.json');
const {deployIdentity} = require('../../sequences/deployIdentity');
const {identityFactoryAddress} = require('../../../deployedData/sepolia/identityFactory.json')
async function main() {

    const tokenName = 'Mobius Services';
    const tokenSymbol = 'MOBSERV';
    const tokenPrefix = 'MOBSERV11';


    const [deployer, iragentdata, tokenagentdata, USER1, USER2, USER3] =
        await ethers.getSigners();
   
        const trexFactoryContract = new ethers.Contract(
            trexFactory.target,
            abi,
            deployer
        );
    
        const getIdFactory = await trexFactoryContract.getIdFactory();
        console.log("getIdFactory", getIdFactory);
        const owner = await trexFactoryContract.owner();
        console.log("owner", owner);
        console.log("deployer", deployer.address);
    
    
  await  _addTokenToTrex(trexFactory.target, claimIssuer.target, deployer, deployer, deployer, tokenName, tokenSymbol, tokenPrefix);

//    await transferOwnershipToGateway(identityFactoryAddress,gateway.target,deployer, USER1, trexFactory.target, deployer, tokenPrefix).then(() => process.exit(0));


}



// 
// async function transferOwnershipToGateway(identityFactoryAddress, gatewayAddress, deployer,userdata, trexFactoryAddress, iragentdata, tokenPrefix) {

//    const trOwn =  await transferOwnership(
//         identityFactoryAddress,
//         gatewayAddress,
//         deployer
//     );
//    console.log("to", trOwn);
   

//     const { userIdentity, token, idRegistry } = await deployIdentity(
//         gatewayAddress,
//         userdata,
//         trexFactoryAddress,
//         iragentdata,
//         tokenPrefix
//     );

//     try {
//         const configFactoryData = {
//             userIdentity: userIdentity,
//             token: token,
//             idRegistry: idRegistry
//         };
//         const configFilePath = path.resolve(__dirname, '../../../deployedData/userIdentity.json');

//         // Write the updated config object to the file
//         fs.writeFileSync(
//             configFilePath,
//             JSON.stringify(configFactoryData, null, 2),
//             'utf8'
//         );
//     } catch (err) {
//         console.error(`[x] Error updating the configuration file: ${err}`);
//         return;
//     }


// }


async function _addTokenToTrex(trexFactoryAddress, claimIssuerContract, deployer, irAgent, tokenAgent, tokenName, tokenSymbol, tokenPrefix) {

    const { tokenLockSmartContract ,tokenSmartContract} = await addTokenToTrex(
        trexFactoryAddress,
        claimIssuerContract,
        deployer,
        deployer,
        deployer,
        tokenName,
        tokenSymbol,
        tokenPrefix
    );

    try {
        const configFactoryData = {
            tokenLockSmartContract: tokenLockSmartContract
        };
        const configFilePath = path.resolve(__dirname, '../../../deployedData/tokenLockSmartContract.json');

        // Write the updated config object to the file
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(configFactoryData, null, 2),
            'utf8'
        );
    } catch (err) {
        console.error(`[x] Error updating the configuration file: ${err}`);
        return;
    }

    return {tokenLockSmartContract,tokenSmartContract}
}





// main().then(() => process.exit(0)).catch((error) => {
//     console.error(error);
//     process.exit(1);
// })







module.exports = { createToken };
