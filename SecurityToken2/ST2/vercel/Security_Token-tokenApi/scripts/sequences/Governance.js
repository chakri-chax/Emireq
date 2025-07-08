const { ethers } = require('hardhat');

const {
    abi
} = require('../../artifacts/contracts/Governance.sol/Governance.json');

async function deployGovernance(
    deployer,
    _name,
    _symbol,
    _identityRegistry,
    _digitizedContractAddress
) {
    try {
        const Governance = await ethers.getContractFactory('Governance');
        const governance = await Governance.connect(deployer).deploy(
            _name,
            _symbol,
            _identityRegistry,
            _digitizedContractAddress,
            10
        );

        console.log(
            `[✓ 21] Governance Contract deployed @ ${await governance.getAddress()}`
        );

        return {
            "governance": await governance.getAddress()
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}


async function mintGovernance(
    deployer,
    _governanceContract,
    _caller,
    _amountToMint
) {
    try {
        const governanceContract = new ethers.Contract(
            _governanceContract,
            abi,
            deployer
        );

        console.log(
            'governanceContract::::',
            await governanceContract.getAddress()
        );

        const mintingGovernance = await governanceContract
            .connect(deployer)
            .mint(_caller.address, _amountToMint);

        await mintingGovernance.wait();

        console.log('Governance Token Minted!');
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { deployGovernance, mintGovernance };
