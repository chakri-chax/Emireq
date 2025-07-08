const { ethers } = require('hardhat');
const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
const { initializeBlockchain } = require('../Utils/blockchainSetup');
const {signer} = initializeBlockchain();
const {claimIssuer} = require('../../../deployedData/sepolia/implementationAuthority.json');
const { use } = require('../../../routes/identityRoutes');
const USER2 = process.env.USER1;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;


const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const userWallet = new ethers.Wallet(USER2, provider);

async function signClaim(
    claimIssuerContractAddress,
    userIdentityContractAddress,
    claimTopic
) {
    try {
        const claimForUser = {
            data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
            issuer: claimIssuerContractAddress,
            topic: ethers.id(`${claimTopic}`),
            scheme: 1,
            identity: userIdentityContractAddress,
            signature: '',
            uri: 'https://example.com'
        };

        claimForUser.signature = await signer.signMessage(
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
        

        return claimForUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function addClaim(
    userIdentityContractAddress,
    claimForUser
) {


    try {
        const userIdentity = new ethers.Contract(
            userIdentityContractAddress,
            Identity.abi,
            userWallet
        );


        // add user claim to user onchainid (connect should be possible with claimIssuer due to above addClaim option #1)
        const txAddClaim = await userIdentity
            .connect(userWallet)
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




const main = async () => {
    const user2IdentityAddress = "0x3a67F35040B55233cFbF9020AAEec9d29A04fC0B"
     const claimForUser = await  signClaim("0xE2411b687F742b73e1690013E40889a6CbAB646F", user2IdentityAddress,"KYC");
    console.log("claimForUser", claimForUser);

    await addClaim(user2IdentityAddress, claimForUser);
     
}
// main().then(() => process.exit(0)).catch((error) => {
//     console.error(error);
//     process.exit(1);
// })
module.exports = { signClaim };

