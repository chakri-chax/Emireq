const { ethers } = require('hardhat');
const { contracts } = require('@tokenysolutions/t-rex');

const { abi } = require('../../artifacts/contracts/token/Token.sol/Token.json');

async function tokenBalance(tokenContractAddress, targetUser,user) {
    try {
        const token = new ethers.Contract(tokenContractAddress, abi, user);

        const result = await token.balanceOf(targetUser);

        console.log(`Token balance of user ${targetUser} is`, result);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { tokenBalance };
