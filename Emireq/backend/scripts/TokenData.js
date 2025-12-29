const { ethers } = require('ethers');
const { networkData } = require("./utils/networkUtils.js");

const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)"
];

const getERC20Data = async (tokenAddress) => {
    let chainId = 11155111;
    const { networkRPC } = networkData(chainId);
    const provider = new ethers.JsonRpcProvider(networkRPC);
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [name, symbol, decimals, totalSupply, maxSupply] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.decimals(),
        erc20.totalSupply(),
        erc20.MAX_SUPPLY()
    ]);

    return {
        address: tokenAddress,
        name,
        symbol,
        decimals: parseInt(decimals),
        totalSupply: parseInt(totalSupply.toString()) / (10 ** parseInt(decimals)),
        maxSupply: maxSupply ? (parseInt(maxSupply.toString()) / (10 ** parseInt(decimals))) : null
    };
};


const tokenAddress = "0x5d5b5Ce40e1a4b54A55f8c933595A6843571EFA5"; // Example token 
getERC20Data(tokenAddress).then((data) => console.log(data)).catch((err) => console.error(err));
module.exports = { getERC20Data };