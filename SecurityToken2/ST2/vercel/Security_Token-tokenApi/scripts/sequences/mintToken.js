const { ethers } = require('hardhat');
const { contracts } = require('@tokenysolutions/t-rex');

async function mintToken(
    tokenAgent,
    user,
    tokenContractAddress,
    tokenSymbol
) {
    try {
        const token = new ethers.Contract(
            tokenContractAddress,
            contracts.Token.abi,
            tokenAgent
        );

        const txMint = await token
            .connect(tokenAgent)
            .mint(user.address, ethers.WeiPerEther * BigInt(1000)); // 1000 ether
        await txMint.wait();
        console.log(
            `[✓ 29] Invoked Token Mint for the user ${
                user.address
            } and minted ${ethers.WeiPerEther * BigInt(1000)} ${tokenSymbol}`
        );

        const txUnpause = await token.connect(tokenAgent).unpause();
        await txUnpause.wait();
        console.log(
            `[✓ 30] Invoked token Pause by tokenAgent ${tokenAgent.address}`
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { mintToken };
