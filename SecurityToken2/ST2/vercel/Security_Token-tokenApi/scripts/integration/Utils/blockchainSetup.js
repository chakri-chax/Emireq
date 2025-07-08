const { ethers } = require('ethers');
require('dotenv').config();

// Initialize provider and signers
const initializeBlockchain = () => {
    const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'; 
    const PRIVATE_KEY = process.env.DEPLOYER;
    
    if (!PRIVATE_KEY) {
        throw new Error('Private key not configured in environment variables');
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    return {
        provider,
        deployer,
        signer
    };
};

module.exports = {
    initializeBlockchain
};