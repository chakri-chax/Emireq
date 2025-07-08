
const { addTokenToTrex } = require('./addTokenToTrex');
const { ethers } = require('ethers');
// async function createToken(ownerAddress,irAgentAddress,tokenAgentAddress,name,symbol,prefix) {

//     // data from mobius backend
//     const trexFactoryAddress = trexFactory.target;
//     const claimIssuerContractAddress = claimIssuer.target;
//     // data from user
//     const owner ={
//         address: ownerAddress,
//         target: ownerAddress
//     };
//     const _irAgents = {
//         address: irAgentAddress,
//         target: irAgentAddress,
//     }
//     const _tokenAgents = {
//         address: tokenAgentAddress,
//         target: tokenAgentAddress,
//     }


//    const {tokenLockSmartContract,tokenAddress} = await addTokenToTrex(
//         trexFactoryAddress,
//         claimIssuerContractAddress,
//         _irAgents,
//         _tokenAgents,
//         name,
//         symbol,
//         prefix
//     );
//     console.log("tokenLockSmartContract",tokenLockSmartContract,tokenAddress);

//    return {tokenLockSmartContract,tokenAddress}
// }
class TREXOperationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TREXOperationError';
    }
}
async function createToken(ownerAddress, irAgentAddressArray, tokenAgentAddressArray, name, symbol, decimals, prefix, complianceModules, complianceSettings, claimTopics,
    claimIissuers,
    issuerClaims) {
    try {
        // Input validation
        if (!ownerAddress || !irAgentAddressArray || !tokenAgentAddressArray || !name || !symbol || !prefix) {
            throw new InputValidationError('Missing required parameters');
        }

        if (!ethers.isAddress(ownerAddress) ||
            !irAgentAddressArray.every(address => ethers.isAddress(address)) ||
            !tokenAgentAddressArray.every(address => ethers.isAddress(address))) {
            throw new InputValidationError('One or more addresses are invalid');
        }

        // Load deployed data
        let trexFactoryAddress, claimIssuerContractAddress;
        try {
            const { trexFactory, claimIssuer } = require('../../../deployedData/sepolia/implementationAuthority.json');
            if (!trexFactory?.target || !claimIssuer?.target) {
                throw new Error('Missing required addresses in deployed data');
            }
            trexFactoryAddress = trexFactory.target;
            claimIssuerContractAddress = claimIssuer.target;
        } catch (error) {
            throw new Error(`Failed to load deployed contract data: ${error.message}`);
        }

        const owner = ownerAddress;
        const _irAgents = irAgentAddressArray;
        const _tokenAgents = tokenAgentAddressArray;

        const result = await addTokenToTrex(
            trexFactoryAddress,
            claimIssuerContractAddress,
            owner,
            _irAgents,
            _tokenAgents,
            name,
            symbol,
            decimals,
            prefix,
            complianceModules,
            complianceSettings,
            claimTopics,
            claimIissuers,
            issuerClaims

        );

        if (!result.success) {
            throw new TREXOperationError(result.error.message);
        }

        console.log("Token deployment successful:", {
            tokenLockSmartContract: result.tokenLockSmartContract,
            tokenAddress: result.tokenAddress,
            contractSuite: result.contractSuite,
            modules: result.modules
        });
      
        return {
            success: true,
            data: {
                tokenLockSmartContract: result.tokenLockSmartContract,
                tokenAddress: result.tokenAddress,
                contractSuite: result.contractSuite
            }
        };

    } catch (error) {
        console.error(`[${error.name}] Token creation failed: ${error.message}`);
        console.error(error.stack);

        return {
            success: false,
            error: {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
}

async function addComplaince(tokenAddress, complainceAddress) {


}
module.exports = { createToken };
