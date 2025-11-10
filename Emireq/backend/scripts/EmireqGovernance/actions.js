const { ethers } = require('hardhat');

function encodeMintCall(to, amount, reason) {
    const iface = new ethers.Interface([
        "function mint(address to, uint256 amount, string memory reason)"
    ]);
    
    return iface.encodeFunctionData("mint", [to, amount, reason]);
}

async function main() {
    const [deployer] = await ethers.getSigners();

    const encodedData = encodeMintCall(
        deployer.address, // to address
        ethers.parseEther("1"), // amount (1 ETH in wei)
        "Community reward payment" // reason
    );

    console.log("Encoded call data:", [encodedData]);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
  })