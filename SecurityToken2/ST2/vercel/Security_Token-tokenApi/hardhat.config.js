require('@nomicfoundation/hardhat-ethers');
require('dotenv').config()

const accounts = [
    process.env.DEPLOYER,
    process.env.CLAIMISSUER,
    process.env.IRAGENT,
    process.env.TOKENAGENT,
    process.env.USER1,
    process.env.USER2,
    process.env.USER3,
].filter(key => key !== undefined); // Filter out undefined keys;
const sepoliaProjectId = process.env.SEPOLIA_ProjectId 
console.log('account:::', accounts)

module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    },
                    viaIR: true
                }
            },
            {
                version: '0.8.20',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    },
                    viaIR: true

                }
            }
        ]
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
            allowUnlimitedContractSize: true,
            blockGasLimit: 100000000, 
            gas: 100000000
        },
        eapothem: {
            url: "https://erpc.apothem.network",
            accounts: accounts
        },
        holesky:{
            url: "https://ethereum-holesky-rpc.publicnode.com",
            accounts: accounts,
            gasPrice: "auto", // or set a specific value
            gasMultiplier: 1.5, 
        },
        apothem: {
            url: "https://apothem.xdcrpc.com",
            accounts: accounts
        },
        ownapothem: {
            url: "https://xdcapothemfnode1.plugin.global",
            accounts: accounts
        },
        mainnet: {
            url: "https://erpc.xinfin.network",
            accounts: accounts
        },
        ankrxdc: {
            url: "https://rpc.ankr.com/xdc",
            accounts: accounts
        },
        sepolia:{
            url: `https://sepolia.infura.io/v3/${sepoliaProjectId}`,
            accounts: accounts
        }
    }
};
