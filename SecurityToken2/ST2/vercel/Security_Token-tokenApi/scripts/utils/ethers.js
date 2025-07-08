const { ethers } = require('ethers');

/**
 * Auxiliary function to get a contract instance at a given address
 *
 * @param {*} address - The address of the contract
 * @param {*} abi - The ABI of the contract
 * @param {*} signer - The signer to use for the contract
 * @returns
 */
function getContractAt(address, abi, signer) {
    try {
        return new ethers.Contract(address, abi, signer);
    } catch (error) {
        console.error('Error getting contract at address: ', address);
        return null;
    }
}

/**
 * Auxiliary function to get a wallet instance
 * @param {*} privateKey - The private key of the wallet
 * @param {*} provider - The provider associated to the wallet
 * @returns
 */
function getWallet(privateKey, provider) {
    try {
        return new ethers.Wallet(privateKey, provider);
    } catch (error) {
        return null;
    }
}

/**
 * Auxiliary function to get a provider instance for a given node address
 */
function jsonRpcProvider(nodeAddress) {
    try {
        return new ethers.JsonRpcProvider(nodeAddress);
    } catch (error) {
        console.error('Error getting provider for node address: ', nodeAddress);
        throw error;
    }
}

function generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
    };
}
function generateMnemonicWallet() {

    const mnemonic = ethers.Wallet.createRandom().mnemonic;
    const wallet = ethers.Wallet.fromPhrase(mnemonic.phrase);
    
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic.phrase,
        derivationPath:"m/44'/60'/0'/0/0" 
    };
}
module.exports = { getContractAt, getWallet, jsonRpcProvider, generateWallet,generateMnemonicWallet };
