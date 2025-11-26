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

npx hardhat verify 0x50ca3E65991328448F28E18c1fA30587a168f782 "0x3F146C06ba1E3164222bfe48070673b47d6c0f0A" --network sepolia

npx hardhat verify 0xe0f3c5039FF9fC1467587B854a105Df7Bd38674C --contract contracts/Oracles/BackingTokens.sol:GOLD --network sepolia
```


```shell
npx hardhat run scripts/DeploymentTokens/deployEMN.js --network sepolia
```

### Backing test token 

```shell 
Gold deployed: 0xe0f3c5039FF9fC1467587B854a105Df7Bd38674C
Silver deployed: 0x034443DAE55C02910CC237c8b2B4BF1212F372ed
Rare deployed: 0x8C001Fe067B76947c2f3e6335edE74cf75700e02
```

```shell
Token Oracle deployed: 0x50ca3E65991328448F28E18c1fA30587a168f782
```
