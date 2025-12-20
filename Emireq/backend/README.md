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
## Deploying OnchainID Suite
```shell
 npx hardhat run scripts/onChainIdentity/deployOnchainIDSuite.js --network sepolia
[!] Deploying OnchainID suite on 0x6EA36aE43E9d34BEf3CCC98cDb50c0E90f26db80, please wait...
[+ 1] Deployed OnchainID implementation (identityImplementation)  0x25b215ff37Ce36d61ef880EC9BF620E642115386
[+ 2] Deployed OnchainID implementation authority 0x519A19c4d5205f52f0cD3DbA556f5427647CBEbC
[+ 3] Deployed identityFactory  0x09D27b733656c1c890B00cD5A4B7e59Ce58A0794
[✓] OnchainID suite Deployed Successfully, Preparing the next steps...  [!]
- identityFactory Address: 0x09D27b733656c1c890B00cD5A4B7e59Ce58A0794
OnchainID Suite deployment script completed.
```