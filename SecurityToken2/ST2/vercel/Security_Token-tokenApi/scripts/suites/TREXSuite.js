const { contracts } = require('@tokenysolutions/t-rex');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const {
    contracts: { Gateway, ClaimIssuer, Factory, Identity }
} = require('@onchain-id/solidity');

let tokenName = 'Property at Dubai';
let tokenSymbol = 'property-5';
let tokenPrefix = 'Property5';
let _govTokenName = 'Governance Propert 5';
let _govTokenSymbol = 'GovProperty-5';

const { addTokenToTrex } = require('../sequences/addTokenToTrex');
const { transferOwnership } = require('../sequences/transferOwnership');
const { deployIdentity } = require('../sequences/deployIdentity');
const { addClaim } = require('../sequences/addClaim');
const { mintToken } = require('../sequences/mintToken');
const { signClaim } = require('../sequences/signClaim');
const { addKey } = require('../sequences/addKey');
const {
    deployMarketPlace,
    lockDigitalDocumentInMarket
} = require('../sequences/MarketPlace');
const { deployGovernance, mintGovernance } = require('../sequences/Governance');
const {
    deployDigitization,
    digitizeProperty
} = require('../sequences/Digitization');

async function deployGateway(identityFactory, deployer, irAgent) {
    const gateway = await new ethers.ContractFactory(
        Gateway.abi,
        Gateway.bytecode,
        deployer
    ).deploy(await identityFactory.getAddress(), [irAgent.address]);
    await gateway.waitForDeployment();
    var gatewayAddress = await gateway.getAddress();
    return {
        gateway,
        gatewayAddress
    };
}

async function deployClaimIssuer(deployer, cIssuer) {
    const claimIssuer = await new ethers.ContractFactory(
        ClaimIssuer.abi,
        ClaimIssuer.bytecode,
        deployer
    ).deploy(cIssuer.address);
    await claimIssuer.waitForDeployment();
    var claimIssuerContractAddress = await claimIssuer.getAddress();
    return {
        claimIssuer,
        claimIssuerContractAddress
    };
}

async function deployTrexLogicSuite(deployer) {
    // Deploy T-Rex proxy
    console.log(`[!] Deploying TRexLogic suite, please wait...`);
    const claimTopicsRegistryImplementation = await ethers.deployContract(
        'ClaimTopicsRegistry',
        deployer
    );

    await claimTopicsRegistryImplementation.waitForDeployment();

    console.log(
        `[✓ 4] Deployed ClaimTopicsRegistryImplementation @ ${await claimTopicsRegistryImplementation.getAddress()}`
    );

    const trustedIssuersRegistryImplementation = await ethers.deployContract(
        'TrustedIssuersRegistry',
        deployer
    );

    await trustedIssuersRegistryImplementation.waitForDeployment();

    console.log(
        `[✓ 5] Deployed TrustedIssuersRegistryImplementation @ ${await trustedIssuersRegistryImplementation.getAddress()}`
    );

    const identityRegistryStorageImplementation = await ethers.deployContract(
        'IdentityRegistryStorage',
        deployer
    );

    await identityRegistryStorageImplementation.waitForDeployment();

    console.log(
        `[✓ 6] Deployed IdentityRegistryStorageImplementation @ ${await identityRegistryStorageImplementation.getAddress()}`
    );

    const identityRegistryImplementation = await ethers.deployContract(
        'IdentityRegistry',
        deployer
    );

    await identityRegistryImplementation.waitForDeployment();

    console.log(
        `[✓ 7] Deployed IdentityRegistryImplementation @ ${await identityRegistryImplementation.getAddress()}`
    );

    const modularComplianceImplementation = await ethers.deployContract(
        'ModularCompliance',
        deployer
    );

    await modularComplianceImplementation.waitForDeployment();

    console.log(
        `[✓ 8] Deployed ModularComplianceImplementation @ ${await modularComplianceImplementation.getAddress()}`
    );

    const tokenImplementation = await ethers.deployContract('Token', deployer);

    await tokenImplementation.waitForDeployment();

    console.log(
        `[✓ 9] Deployed TokenImplementation @ ${await tokenImplementation.getAddress()}`
    );

    console.log(
        `[✓] TRexLogic suite Deployed Successfully, Preparing the next steps...  [!]`
    );

    return {
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryStorageImplementation,
        identityRegistryImplementation,
        modularComplianceImplementation,
        tokenImplementation
    };
}

async function deployImplementationAuthority(
    deployer,
    claimTopicsRegistryImplementation,
    trustedIssuersRegistryImplementation,
    identityRegistryStorageImplementation,
    identityRegistryImplementation,
    modularComplianceImplementation,
    tokenImplementation,
    identityFactory,
    iragentdata,
    claimissuerdata,
    userdata
) {
    console.log(`[!] Deploying Implementation Authority suite, please wait`);

    const trexImplementationAuthority = await ethers.deployContract(
        'TREXImplementationAuthority',
        [true, ethers.ZeroAddress, ethers.ZeroAddress],
        deployer
    );

    await trexImplementationAuthority.waitForDeployment();

    console.log(
        `[✓ 10] Deployed TrexImplementationAuthority @ ${await trexImplementationAuthority.getAddress()}`
    );

    const versionStruct = {
        major: 4,
        minor: 0,
        patch: 0
    };

    const contractsStruct = {
        tokenImplementation: await tokenImplementation.target,
        ctrImplementation: await claimTopicsRegistryImplementation.target,
        irImplementation: await identityRegistryImplementation.target,
        irsImplementation:
            await identityRegistryStorageImplementation.target,
        tirImplementation:
            await trustedIssuersRegistryImplementation.target,
        mcImplementation: await modularComplianceImplementation.target
    };

    const tx = await trexImplementationAuthority
        .connect(deployer)
        .addAndUseTREXVersion(versionStruct, contractsStruct);
    await tx.wait();
    console.log(
        `[✓ 11] Invoked AddAndUseTREXVersion method on TrexImplementationAuthority @ ${await trexImplementationAuthority.getAddress()}`
    );

    // const trexFactory = await new ethers.ContractFactory(
    //     contracts.TREXFactory.abi,
    //     contracts.TREXFactory.bytecode,
    //     deployer
    // ).deploy(
    //     await trexImplementationAuthority.getAddress(),
    //     await identityFactory.getAddress()
    // );

    const trexFactory = await ethers.deployContract(
        'TREXFactory',
        [
            await trexImplementationAuthority.getAddress(),
            await identityFactory.identityFactoryAddress
        ],
        deployer
    );

    await trexFactory.waitForDeployment();
    console.log(
        `[✓ 12] Deployed TrexFactory @ ${await trexFactory.getAddress()}`
    );

    identityFactory = await ethers.getContractAt(
        identityFactory.identityFactoryAbi,
        await trexFactory.getIdFactory()
    )
    const tx1 = await identityFactory
        .connect(deployer)
        .addTokenFactory(await trexFactory.getAddress());
    await tx1.wait();

    console.log(
        `[✓ 13] Invoked AddTokenFactory @ ${await identityFactory.getAddress()}`
    );

    const { gateway, gatewayAddress } = await deployGateway(
        identityFactory,
        deployer,
        iragentdata // IR Agent Address
    );
    console.log(`[✓ 14] Deployed Gateway @ ${await gateway.getAddress()}`);

    const { claimIssuer, claimIssuerContractAddress } = await deployClaimIssuer(
        deployer,
        claimissuerdata // Claim Issuer address
    );
    console.log(
        `[✓ 15] Deployed ClaimIssuerContract @ ${await claimIssuer.getAddress()}`
    );
    console.log(
        `[✓] Implementation Authority suite Deployed Successfully, Preparing the next steps...  [!]`
    );

    return {
        trexImplementationAuthority,
        gateway,
        claimIssuer,
        trexFactory
    };
}

async function deployTrexSuite(
    deployer,
    identityFactory,
    iragentdata,
    claimissuerdata,
    tokenagentdata,
    userdata
) {
    console.log(`[!] Invoking deployTrexLogicSuite, please wait..`);

    const {
        claimTopicsRegistryImplementation,
        trustedIssuersRegistryImplementation,
        identityRegistryStorageImplementation,
        identityRegistryImplementation,
        modularComplianceImplementation,
        tokenImplementation
    } = await deployTrexLogicSuite(deployer);

    console.log(`[!] Invoking deployImplementationAuthority, please wait..`);

    const { trexImplementationAuthority, gateway, claimIssuer, trexFactory } =
        await deployImplementationAuthority(
            deployer,
            claimTopicsRegistryImplementation,
            trustedIssuersRegistryImplementation,
            identityRegistryStorageImplementation,
            identityRegistryImplementation,
            modularComplianceImplementation,
            tokenImplementation,
            identityFactory,
            iragentdata,
            claimissuerdata,
            userdata
        );

    // Deploy registries using the proxy pattern
    const claimTopicsRegistry = await ethers
        .deployContract(
            'ClaimTopicsRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'ClaimTopicsRegistry',
                await proxy.getAddress()
            )
        );
    console.log(
        `[✓ 16] Deployed ClaimTopicRegistry using Proxy Pattern @ ${await claimTopicsRegistry.getAddress()}`
    );

    const trustedIssuersRegistry = await ethers
        .deployContract(
            'TrustedIssuersRegistryProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'TrustedIssuersRegistry',
                await proxy.getAddress()
            )
        );
    console.log(
        `[✓ 17] Deployed TrustedIssuersRegistry using Proxy Pattern @ ${await trustedIssuersRegistry.getAddress()}`
    );

    const identityRegistryStorage = await ethers
        .deployContract(
            'IdentityRegistryStorageProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt(
                'IdentityRegistryStorage',
                await proxy.getAddress()
            )
        );
    console.log(
        `[✓ 18] Deployed IdentityRegistryStorage using Proxy Pattern @ ${await identityRegistryStorage.getAddress()}`
    );

    const identityRegistry = await ethers
        .deployContract(
            'IdentityRegistryProxy',
            [
                await trexImplementationAuthority.getAddress(),
                await trustedIssuersRegistry.getAddress(),
                await claimTopicsRegistry.getAddress(),
                await identityRegistryStorage.getAddress()
            ],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt('IdentityRegistry', await proxy.getAddress())
        );
    console.log(
        `[✓ 19] Deployed IdentityRegistry using Proxy Pattern @ ${await identityRegistry.getAddress()}`
    );

    const modularCompliance = await ethers
        .deployContract(
            'ModularComplianceProxy',
            [await trexImplementationAuthority.getAddress()],
            deployer
        )
        .then(async proxy =>
            ethers.getContractAt('ModularCompliance', await proxy.getAddress())
        );
    console.log(
        `[✓ 20] Deployed ModularCompliance using Proxy Pattern @ ${await modularCompliance.getAddress()}`
    );

    console.log(
        '----------------- All the contracts deployed sucessfully ----------------'
    );

    //Add token to Trex here, symbol and prefix of the token is passed as arguments.

    const { tokenLockSmartContract } = await addTokenToTrex(
        await trexFactory.getAddress(),
        await claimIssuer.getAddress(),
        deployer,
        iragentdata,
        tokenagentdata,
        tokenName,
        tokenSymbol,
        tokenPrefix
    );

    await transferOwnership(
        await identityFactory.getAddress(),
        await gateway.getAddress(),
        deployer
    );
    console.log('userdata::::',userdata);
    console.log('userdata.address::::',userdata.address);

    const { userIdentity, token, idRegistry } = await deployIdentity(
        await gateway.getAddress(),
        userdata,
        await trexFactory.getAddress(),
        iragentdata,
        tokenPrefix
    );

    // Deploy Marketplace

    const { marketplace } = await deployMarketPlace(
        deployer,
        await idRegistry.getAddress()
    );

    console.log('marketplace', marketplace);
    // DDeploy digitize Property

    const { digitizePropertyContract } = await deployDigitization(
        deployer,
        marketplace,
        await idRegistry.getAddress(),
        _govTokenName,
        _govTokenSymbol
    );

    // Deploy Governance

    const { governance } = await deployGovernance(
        deployer,
        _govTokenName,
        _govTokenSymbol,
        await idRegistry.getAddress(),
        digitizePropertyContract
    );

    console.log('governance contract is', governance);

    // investment token minting logic is below
    var claimForUser = await signClaim(
        await claimIssuer.getAddress(),
        await userIdentity.getAddress(),
        claimissuerdata
    );

    await addKey(await userIdentity.getAddress(), claimissuerdata, userdata);

    await addClaim(
        await userIdentity.getAddress(),
        claimissuerdata,
        claimForUser
    );

    //Digitize Property

    await digitizeProperty(digitizePropertyContract, 'testing', userdata);

    // LOCK NFT IN DIGITZ
    await lockDigitalDocumentInMarket(
        marketplace,
        digitizePropertyContract,
        1,
        userdata
    );

    // Mint Governance Token
    await mintGovernance(deployer, governance, userdata, 100);

    await mintToken(
        tokenagentdata,
        userdata,
        await token.getAddress(),
        tokenSymbol
    );

    return {
        trexFactoryContractAddress: await trexFactory.getAddress(),
        gatewayContractAddress: await gateway.getAddress(),
        claimIssuerContractAddress: await claimIssuer.getAddress(),
        tokenLockSmartContract: tokenLockSmartContract
    };
}

module.exports = { deployTrexSuite,deployTrexLogicSuite ,deployImplementationAuthority};
