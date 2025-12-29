
require('dotenv').config();
function networkData(chainId) {
    switch (chainId) {
        case 11155111:
            return {
                networkName: "sepolia",
                networkRPC: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
            };
        // Add more networks as needed
        default:
            throw new Error("Unsupported network");
    }
}

module.exports = { networkData };