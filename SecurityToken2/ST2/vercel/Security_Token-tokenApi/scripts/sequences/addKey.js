const { ethers } = require('hardhat');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');

async function addKey(userIdentityContractAddress, claimissuerdata, userdata) {
    try {
        const userIdentity = new ethers.Contract(
            userIdentityContractAddress,
            Identity.abi,
            claimissuerdata
        );

        // option #1 for addClaim, add claim issuer signing key (type = 3 CLAIM) into user identity store:
        const txUserIdentity = await userIdentity
            .connect(userdata)
            .addKey(
                ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ['address'],
                        [claimissuerdata.address]
                    )
                ),
                3,
                1
            );
        await txUserIdentity.wait();
        console.log(
            `[✓ 27] Invoked addKey at userIdentiyt ${await userIdentity.getAddress()}`
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}
module.exports = { addKey };
