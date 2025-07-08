const { ethers } = require('hardhat');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');

async function addClaim(
    userIdentityContractAddress,
    claimissuerdata,
    claimForUser
) {
    try {
        const userIdentity = new ethers.Contract(
            userIdentityContractAddress,
            Identity.abi,
            claimissuerdata
        );

        // add user claim to user onchainid (connect should be possible with claimIssuer due to above addClaim option #1)
        const txAddClaim = await userIdentity
            .connect(claimissuerdata)
            .addClaim(
                claimForUser.topic,
                claimForUser.scheme,
                claimForUser.issuer,
                claimForUser.signature,
                claimForUser.data,
                claimForUser.uri
            );
        await txAddClaim.wait();
        console.log(
            `[✓ 28] Invoked addClaim in userIdentiy contract by Claimissuer and added claim for user`
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}
module.exports = { addClaim };
