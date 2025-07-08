const { ethers } = require('hardhat');
const {
    abi
} = require('../../../artifacts/contracts/factory/TREXFactory.sol/TREXFactory.json');
const { initializeBlockchain } = require('../Utils/blockchainSetup');

// Custom error classes for better error handling
class BlockchainInitializationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BlockchainInitializationError';
    }
}

class ContractDeploymentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContractDeploymentError';
    }
}

class TREXOperationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TREXOperationError';
    }
}

class InputValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputValidationError';
    }
}
let provider, deployer;

async function addTokenToTrex(
    trexFactoryAddress,
    claimIssuerContract,
    owner,
    irAgentArray,
    tokenAgentArray,
    tokenName,
    tokenSymbol,
    decimals,
    tokenPrefix,
    complianceModules,
    complianceSettings,
    claimTopics,
    claimIissuers,
    issuerClaims
) {
    try {
        // Input validation
        if (!trexFactoryAddress || !claimIssuerContract || !irAgentArray || !tokenAgentArray ||
            !tokenName || !tokenSymbol || !tokenPrefix) {
            throw new InputValidationError('Missing required parameters');
        }



        // Blockchain initialization

        try {
            const blockchain = initializeBlockchain();
            if (!blockchain || !blockchain.provider || !blockchain.deployer) {
                throw new BlockchainInitializationError('Blockchain initialization failed - missing provider or deployer');
            }
            provider = blockchain.provider;
            deployer = blockchain.deployer;
        } catch (error) {
            throw new BlockchainInitializationError(`Failed to initialize blockchain: ${error.message}`);
        }

        // Deploy TokenLockContract
        let investmentTokenPlatform;
        try {
            const InvestmentTokenPlatform = await ethers.getContractFactory('TokenLockContract');
            investmentTokenPlatform = await InvestmentTokenPlatform.connect(deployer).deploy(100);
            await investmentTokenPlatform.waitForDeployment();

            console.log(`[✓ 21] TokenLockContract deployed @ ${await investmentTokenPlatform.getAddress()}`);
        } catch (error) {
            throw new ContractDeploymentError(`Failed to deploy TokenLockContract: ${error.message}`);
        }

        // Setup TREX Factory
        const trexFactory = new ethers.Contract(trexFactoryAddress, abi, deployer);

        // Get gas data with fallback
        let gasPrice;
        try {
            const feeData = await provider.getFeeData();
            gasPrice = feeData.gasPrice ? feeData.gasPrice : ethers.parseUnits("30", "gwei");
        } catch (error) {
            console.warn('Failed to get fee data, using fallback gas price');
            gasPrice = ethers.parseUnits("30", "gwei");
        }

        // Deploy TREX Suite
        let tokenAddress;
        let identityRegistryAddress;
        let identityRegistryStorageAddress;
        let trustedIssuerRegistryAddress;
        let claimTopicsRegistryAddress;
        let modularComplianceAddress;


        try {
            const txDeployTREX = await trexFactory.connect(deployer).deployTREXSuite(
                tokenPrefix,
                {
                    owner: owner,
                    name: tokenName,
                    symbol: tokenSymbol,
                    decimals: decimals,
                    irs: ethers.ZeroAddress,
                    ONCHAINID: ethers.ZeroAddress,
                    irAgents: irAgentArray,
                    tokenAgents: tokenAgentArray,
                    complianceModules: complianceModules,
                    complianceSettings: complianceSettings,
                    lockContract: await investmentTokenPlatform.getAddress()
                },
                {
                    claimTopics: claimTopics,
                    issuers: claimIissuers,
                    issuerClaims: issuerClaims
                },
                {
                    gasPrice: gasPrice + ethers.parseUnits("2", "gwei"),
                }
            );

            const receipt = await txDeployTREX.wait();

            if (!receipt || !receipt.logs) {
                throw new TREXOperationError('Transaction receipt is invalid');
            }

            const trexSuiteDeployedEvent = receipt.logs.find(log => log.eventName === 'TREXSuiteDeployed');

            if (!trexSuiteDeployedEvent || !trexSuiteDeployedEvent.args || !trexSuiteDeployedEvent.args[0]) {
                throw new TREXOperationError('Failed to find TREXSuiteDeployed event in transaction logs');
            }

            tokenAddress = trexSuiteDeployedEvent.args[0];
            identityRegistryAddress = trexSuiteDeployedEvent.args[1];
            identityRegistryStorageAddress = trexSuiteDeployedEvent.args[2];
            trustedIssuerRegistryAddress = trexSuiteDeployedEvent.args[3];
            claimTopicsRegistryAddress = trexSuiteDeployedEvent.args[4];
            modularComplianceAddress = trexSuiteDeployedEvent.args[5];
            console.log(`[✓ 22] Token added in Trex Factory and the address is ${tokenAddress}`);

        } catch (error) {
            if (error instanceof TREXOperationError) {
                throw error;
            }
            throw new TREXOperationError(`Failed to deploy TREX Suite: ${error.message}`);
        }

        try {
            // transfer ownership of modules

            const abi = [
                "function transferOwnership(address newOwner)"
            ];

            for (const module of complianceModules) {
                const moduleContract = new ethers.Contract(module, abi, deployer);
                const tx = await moduleContract.transferOwnership(owner);
                await tx.wait(); 
                console.log(`Ownership transferred for ${module}, tx: ${tx.hash}`);
            }
        } catch (error) {
            console.error("Failed to transfer ownership:", error);
            throw error;
        }
        return {
            success: true,
            tokenLockSmartContract: await investmentTokenPlatform.getAddress(),
            tokenAddress: tokenAddress,
            contractSuite: {
                identityRegistryAddress: identityRegistryAddress,
                identityRegistryStorageAddress: identityRegistryStorageAddress,
                trustedIssuerRegistryAddress: trustedIssuerRegistryAddress,
                claimTopicsRegistryAddress: claimTopicsRegistryAddress,
                modularComplianceAddress: modularComplianceAddress
            }
        };

    } catch (error) {
        console.error(`[${error.name}] ${error.message}`);
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



module.exports = { addTokenToTrex };