const { ethers } = require('hardhat');
const { contracts } = require('@tokenysolutions/t-rex');

const amountToSend = ethers.WeiPerEther * BigInt(10); // Replace "10.0" with the amount (adjust decimals as required)
const { abi } = require('../../artifacts/contracts/token/Token.sol/Token.json');

async function initiateTransferRequestToContract(
    user,
    tokenContractAddress,
    targetUser,
    tokenLockContractAddress,
    tokenPrefix
) {
    try {
        const token = new ethers.Contract(tokenContractAddress, abi, user);

        const approvalTx = await await token
            .connect(user)
            .approve(tokenLockContractAddress, amountToSend);

        console.log('Approval transaction submitted:', approvalTx.hash);

        // Wait for approval transaction confirmation
        const approvalReceipt = await approvalTx.wait();
        console.log('Approval confirmed:', approvalReceipt);

        const tokenLockContract = await ethers.getContractAt(
            'TokenLockContract',
            tokenLockContractAddress
        );
        const transferTx = await tokenLockContract
            .connect(user)
            .requestTransfer(targetUser, amountToSend, tokenPrefix);

        const transferReceipt = await transferTx.wait();
        console.log('Transfer confirmed:', transferReceipt);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { initiateTransferRequestToContract };
