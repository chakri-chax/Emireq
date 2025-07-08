const { ethers } = require('hardhat');

const {
    abi
} = require('../../artifacts/contracts/Digitization.sol/Digitization.json');


async function deployDigitization(
    deployer,
    _marketplaceAddress,
    _identityRegistry,
    _name,
    _symbol
) {
    try {
        const DigitizeProperty = await ethers.getContractFactory(
            'Digitization'
        );

        console.log("_govTokenName:::", _name);
        console.log("_marketplaceAddress", _marketplaceAddress);
        console.log("_symbol", _symbol);
        console.log("identityRegistry", _identityRegistry);

        const digitizePropertyContract = await DigitizeProperty.connect(
            deployer
        ).deploy(_marketplaceAddress, _name, _symbol, _identityRegistry);

        console.log(
            `[✓ 21] digitizePropertyContract deployed @ ${await digitizePropertyContract.getAddress()}`
        );

        return {
            "digitizePropertyContract":
                await digitizePropertyContract.getAddress()
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}


async function digitizeProperty(
    digitizePropertyContractAddress,
    propertyURI,
    user
) {
    try {
        const digitizePropertyContract = new ethers.Contract(
            digitizePropertyContractAddress,
            abi,
            user
        );

        console.log(
            'digitizePropertyContract::::',
            await digitizePropertyContract.getAddress()
        );

        const mintingNFTToken = await digitizePropertyContract
            .connect(user)
            .digitizeIt('https://gateway.pinata.cloud/ipfs/12352352353');

        await mintingNFTToken.wait();

        console.log('Digitizing the Property is done');
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployDigitization,digitizeProperty };
