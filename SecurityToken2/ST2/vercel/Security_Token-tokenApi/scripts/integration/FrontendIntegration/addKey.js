const {
    contracts: { Identity }
} = require('@onchain-id/solidity');
const { id } = require('ethers');
const { ethers } = require('hardhat');

const userPrivateKey = process.env.USER1;
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL

if (!userPrivateKey) {
    throw new Error('Private key not configured in environment variables');
}
if (!sepoliaRpcUrl) {
    throw new Error('Sepolia RPC URL not configured in environment variables');
}

const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
const userWallet = new ethers.Wallet(userPrivateKey, provider);


const addKey = async (identity, user) => {
    console.log("[!] Invoking addKey...");

    const identityContract = new ethers.Contract(identity, Identity.abi, userWallet);
    const KEY = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address'],
            [user]
        )
    )

    console.log("KEY", KEY);

    const tx = await identityContract.connect(userWallet).addKey(
        ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['address'],
                [user]
            )
        ),
        3,
        1

    )
    const receipt = await tx.wait();
    // console.log("receipt", receipt);

    console.log(`[✓ 27] Invoked addKey at userIdentiyt ${await identityContract.getAddress()}`);
}
const getKey = async ( user) => {
    const KEY = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address'],
            [user]
        )
    )

    console.log("KEY", KEY);
}
// getKey("0x6EA36aE43E9d34BEf3CCC98cDb50c0E90f26db80");
// addKey("0x3a67F35040B55233cFbF9020AAEec9d29A04fC0B", "0x3f146c06ba1e3164222bfe48070673b47d6c0f0a");

// key for claimIssuer : 0x24343fa050867563ed17f1c687a0f68c9ea24ff7ef8f7b2404afd16b16b3c75e