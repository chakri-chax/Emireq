const { ethers } = require('hardhat');
const {
    abi
} = require('../../artifacts/contracts/factory/TREXFactory.sol/TREXFactory.json');

async function addTokenToTrex(
    trexFactoryAddress,
    claimIssuerContract,
    deployer,
    irAgent,
    tokenAgent,
    tokenName,
    tokenSymbol,
    tokenPrefix
) {
    try {
        const InvestmentTokenPlatform = await ethers.getContractFactory(
            'TokenLockContract'
        );
        const investmentTokenPlatform = await InvestmentTokenPlatform.connect(
            deployer
        ).deploy(100);

        console.log(
            `[✓ 21] TokenLockContract deployed @ ${await investmentTokenPlatform.getAddress()}`
        );

        const trexFactory = new ethers.Contract(
            trexFactoryAddress,
            abi,
            deployer
        );
        // console.log('trexFactory::::', trexFactory);
        const functions = trexFactory.interface.fragments.filter(
            fragment => fragment.type === 'function'
        );
        let nonce = await ethers.provider.getTransactionCount(deployer.address);
        console.log('nonce:::', nonce);
        
        const feeData = await ethers.provider.getFeeData();
        let gasPrice = feeData.gasPrice ? feeData.gasPrice : ethers.parseUnits("30", "gwei"); // fallback

        // console.log('functions:::', functions);
        const txDeployTREX = await trexFactory
            .connect(deployer)
            .deployTREXSuite(
                tokenPrefix,
                {
                    owner: tokenAgent.address, // token owner/admin can be any account (doesn't have to be deployer)
                    name: tokenName,
                    symbol: tokenSymbol,
                    decimals: 18,
                    irs: ethers.ZeroAddress, // if irs address is passed then all users from that irs will be reused (multiple tokens case)
                    ONCHAINID: ethers.ZeroAddress,
                    irAgents: [irAgent.address],
                    tokenAgents: [tokenAgent.address],
                    complianceModules: [],
                    complianceSettings: [],
                    lockContract: await investmentTokenPlatform.getAddress()
                },
                {
                    claimTopics: [ethers.id('CLAIM_TOPIC')],
                    issuers: [claimIssuerContract],
                    issuerClaims: [[ethers.id('CLAIM_TOPIC')]]
                },
                {
                    gasPrice: gasPrice + ethers.parseUnits("2", "gwei"),
                    // nonce: nonce
                }
            );
        const receipt = await txDeployTREX.wait();

        const trexSuiteDeployedEvent = receipt.logs.find(
            log => log.eventName === 'TREXSuiteDeployed'
        );
        console.log(
            `[✓ 22] Token added in Trex Factory and the address is ${trexSuiteDeployedEvent.args[0]}`
        );

        return {
            tokenLockSmartContract: await investmentTokenPlatform.getAddress(),
            tokenSmartContract: trexSuiteDeployedEvent.args[0]
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { addTokenToTrex };
