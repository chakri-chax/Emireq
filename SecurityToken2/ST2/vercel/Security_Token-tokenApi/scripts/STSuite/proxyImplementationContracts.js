const { ethers } = require('hardhat');
const {trexImplementationAuthority} = require('../../deployedData/sepolia/implementationAuthority.json');


async function main() {
    const [deployer, irAgent, tokenAgent, USER1, USER2, USER3] =
    await ethers.getSigners();

    let nonce = await ethers.provider.getTransactionCount(deployer.address);
    const feeData = await ethers.provider.getFeeData();
    let gasPrice = feeData.gasPrice ? feeData.gasPrice : ethers.parseUnits("30", "gwei"); // fallback
    
    

    const overrides = {
        gasPrice: BigInt(2) * BigInt(gasPrice),
        nonce: nonce++
    };
    try {
        // Deploy registries using the proxy pattern
        const claimTopicsRegistry = await ethers
            .deployContract(
                'ClaimTopicsRegistryProxy',
                [await trexImplementationAuthority.target],
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
                [await trexImplementationAuthority.target],
                {
                    gasPrice: gasPrice,
                    nonce: nonce++
                }
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
                [await trexImplementationAuthority.target],
                {
                    gasPrice: gasPrice + ethers.parseUnits("2", "gwei"),
                    nonce: nonce++
                }
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
                    await trexImplementationAuthority.target,
                    await trustedIssuersRegistry.getAddress(),
                    await claimTopicsRegistry.getAddress(),
                    await identityRegistryStorage.getAddress()
                ],
                {
                    gasPrice: gasPrice + ethers.parseUnits("2", "gwei"),
                    nonce: nonce++
                }
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
                [await trexImplementationAuthority.target],
                {
                    gasPrice: gasPrice + ethers.parseUnits("2", "gwei"),
                    nonce: nonce++
                }
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
    } catch (error) {
        console.error(error);
    }
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
})