# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

```shell 

npx hardhat verify 0xdd083C27bF52F945928435b1ad580bA32daE65DF "XenaraV1" "XNRv1" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" --network sepolia
```

```shell
npx hardhat run scripts/DeploymentTokens/deployEMN.js --network sepolia
```