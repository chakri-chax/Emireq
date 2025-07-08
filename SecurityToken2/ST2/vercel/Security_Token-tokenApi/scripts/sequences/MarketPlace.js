const { ethers } = require('hardhat');

const {
    abi
} = require('../../artifacts/contracts/Marketplace.sol/Marketplace.json');

async function deployMarketPlace(deployer, identityRegistry) {
    try {
        const Marketplace = await ethers.getContractFactory('Marketplace');
        const marketPlaceContract = await Marketplace.connect(deployer).deploy(
            100,
            identityRegistry
        );

        console.log(
            `[✓ 26] marketPlaceContract deployed @ ${await marketPlaceContract.getAddress()}`
        );

        return {
            marketplace: await marketPlaceContract.getAddress()
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function lockDigitalDocumentInMarket(
    marketPlaceContractAddress,
    digitizePropertyContractAddress,
    tokenId,
    user
) {
    try {
        const marketPlaceInstance = new ethers.Contract(
            marketPlaceContractAddress,
            abi,
            user
        );

        console.log(
            'marketPlaceInstance::::',
            await marketPlaceInstance.getAddress()
        );

        const lockNft = await marketPlaceInstance
            .connect(user)
            .lockNFTInMarketPlace(digitizePropertyContractAddress, tokenId);

        await lockNft.wait();

        console.log('NFT has been locked in the contract');
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployMarketPlace, lockDigitalDocumentInMarket };
