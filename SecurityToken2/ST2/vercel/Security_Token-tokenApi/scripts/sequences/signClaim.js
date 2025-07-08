const { ethers } = require('hardhat');

async function signClaim(
    claimIssuerContractAddress,
    userIdentityContractAddress,
    claimissuerdata
) {
    try {
        const claimForUser = {
            data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
            issuer: claimIssuerContractAddress,
            topic: ethers.id('CLAIM_TOPIC'),
            scheme: 1,
            identity: userIdentityContractAddress,
            signature: '',
            uri: 'https://example.com'
        };

        claimForUser.signature = await claimissuerdata.signMessage(
            ethers.getBytes(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address', 'uint256', 'bytes'],
                        [
                            claimForUser.identity,
                            claimForUser.topic,
                            claimForUser.data
                        ]
                    )
                )
            )
        );
        console.log(
            `[✓ 26] Claim for User & ClaimSignature has been configured`
        );

        return claimForUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
module.exports = { signClaim };
