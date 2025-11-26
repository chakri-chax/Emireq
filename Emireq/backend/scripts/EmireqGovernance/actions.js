const { ethers } = require('hardhat');

// Address update functions
function encodeUpdatePublicAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updatePublicAddress(address newAddress)"
    ]);
    
    return iface.encodeFunctionData("updatePublicAddress", [newAddress]);
}

function encodeUpdateReserveAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updateReserveAddress(address newAddress)"
    ]);
    
    return iface.encodeFunctionData("updateReserveAddress", [newAddress]);
}

function encodeUpdateDevelopmentAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updateDevelopmentAddress(address newAddress)"
    ]);
    
    return iface.encodeFunctionData("updateDevelopmentAddress", [newAddress]);
}

// Backing management functions
function encodeWithdrawBacking(asset, to, amount) {
    const iface = new ethers.Interface([
        "function withdrawBacking(uint8 asset, address to, uint256 amount)"
    ]);
    
    return iface.encodeFunctionData("withdrawBacking", [asset, to, amount]);
}

function encodeSetAssetPriceUSD(asset, priceUSD) {
    const iface = new ethers.Interface([
        "function setAssetPriceUSD(uint8 asset, uint256 priceUSD)"
    ]);
    
    return iface.encodeFunctionData("setAssetPriceUSD", [asset, priceUSD]);
}

function encodeRegisterBackingToken(asset, token) {
    const iface = new ethers.Interface([
        "function registerBackingToken(uint8 asset, address token)"
    ]);
    
    return iface.encodeFunctionData("registerBackingToken", [asset, token]);
}

function encodeUnregisterBackingToken(asset) {
    const iface = new ethers.Interface([
        "function unregisterBackingToken(uint8 asset)"
    ]);
    
    return iface.encodeFunctionData("unregisterBackingToken", [asset]);
}

async function main() {
    const [deployer] = await ethers.getSigners();

    // Example usage for address update functions
    const newAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    
    const encodedPublicAddress = encodeUpdatePublicAddress(newAddress);
    const encodedReserveAddress = encodeUpdateReserveAddress(newAddress);
    const encodedDevelopmentAddress = encodeUpdateDevelopmentAddress(newAddress);

    // Example usage for backing management functions
    const asset = 1; // Assuming BackingAsset enum: 0 = BASE, 1 = RARE
    const toAddress = deployer.address;
    const amount = ethers.parseEther("1000");
    const priceUSD = ethers.parseUnits("1500", 18); // $1500 with 18 decimals
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const encodedWithdrawBacking = encodeWithdrawBacking(asset, toAddress, amount);
    const encodedSetAssetPrice = encodeSetAssetPriceUSD(asset, priceUSD);
    const encodedRegisterToken = encodeRegisterBackingToken(asset, tokenAddress);
    const encodedUnregisterToken = encodeUnregisterBackingToken(asset);

    console.log("=== Address Update Functions ===");
    console.log("Encoded updatePublicAddress:", encodedPublicAddress);
    console.log("Encoded updateReserveAddress:", encodedReserveAddress);
    console.log("Encoded updateDevelopmentAddress:", encodedDevelopmentAddress);
    
    console.log("\n=== Backing Management Functions ===");
    console.log("Encoded withdrawBacking:", encodedWithdrawBacking);
    console.log("Encoded setAssetPriceUSD:", encodedSetAssetPrice);
    console.log("Encoded registerBackingToken:", encodedRegisterToken);
    console.log("Encoded unregisterBackingToken:", encodedUnregisterToken);

    // Return all encoded data in an array
    const allEncodedData = [
        encodedPublicAddress,
        encodedReserveAddress,
        encodedDevelopmentAddress,
        encodedWithdrawBacking,
        encodedSetAssetPrice,
        encodedRegisterToken,
        encodedUnregisterToken
    ];

    console.log("\n=== All Encoded Data Array ===");
    console.log(allEncodedData);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });