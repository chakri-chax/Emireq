
const {ethers} = require('ethers');
const {abi} = require('../../../../artifacts/contracts/token/Token.sol/Token.json');


async function getTokenBalance(tokenAddress, address) {
    const token = new ethers.Contract(tokenAddress, abi, ethers.provider);
    return await token.balanceOf(address);
}
async function getTokenName(tokenAddress) {
    const token = new ethers.Contract(tokenAddress, abi, ethers.provider);
    return await token.name();
}

async function addComplaince(tokenAddress) {
    
}
module.exports = {
    getTokenBalance
}