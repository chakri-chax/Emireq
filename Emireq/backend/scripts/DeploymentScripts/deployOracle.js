

require("dotenv").config();


const { ethers } = require("hardhat");

async function main() {



    const [owner] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", await owner.getAddress());

    // {
    //     const TokenOracle = await ethers.getContractFactory("TokenOracle");
    //     const oracle = await TokenOracle.deploy(await owner.getAddress());
    //     console.log("Token Oracle deployed:", oracle.target);
    // }

    const TokenOracle = await ethers.getContractFactory("TokenOracle");
    const oracleAddress = "0x50ca3E65991328448F28E18c1fA30587a168f782";
    const oracle = TokenOracle.attach(oracleAddress);


    const goldToken = "0xe0f3c5039FF9fC1467587B854a105Df7Bd38674C";
    const silverToken = "0x034443DAE55C02910CC237c8b2B4BF1212F372ed";
    const rareToken = "0x8C001Fe067B76947c2f3e6335edE74cf75700e02";

    try {
        const tx = await oracle.setTokenAddresses(goldToken, silverToken, rareToken);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("setTokenAddresses txHash:", receipt.hash);

        // Verify the addresses were set correctly
        const tokens = await oracle.getTokenAddresses();
        console.log("Verified token addresses:");
        console.log("Gold:", tokens[0]);
        console.log("Silver:", tokens[1]);
        console.log("Rare:", tokens[2]);

    } catch (error) {
        console.error("Error setting token addresses:", error); 

        // Try to get more detailed error information
        if (error.data) {
            console.log("Error data:", error.data);
        }
        if (error.reason) {
            console.log("Error reason:", error.reason);
        }
    }


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });