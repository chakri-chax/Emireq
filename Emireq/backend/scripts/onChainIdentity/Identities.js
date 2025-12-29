const OnchainID = require("@onchain-id/solidity");
const ethers = require("ethers");
require("dotenv").config();
const { networkData } = require("../utils/networkUtils.js");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const fs = require("fs");
const path = require("path");
let ID_Factory = "0xa3Af6e0375dD444EF316624772eDC99547aC7571";
let identityFactoryContract;

async function deployIdFactory(chainId) {
  try {
    const { networkRPC } = networkData(chainId);
    const provider = new ethers.JsonRpcProvider(networkRPC);

    if (!provider) {
      throw new Error("Failed to connect to RPC provider");
    }

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await signer.getAddress();
    console.log("Signer", signerAddress);

    const identityImplementation = await new ethers.ContractFactory(
      OnchainID.contracts.Identity.abi,
      OnchainID.contracts.Identity.bytecode,
      signer
    ).deploy(signerAddress, true);
    await identityImplementation.deployed();
    console.log("identityImplementation", identityImplementation.address);

    const identityImplementationAuthority = await new ethers.ContractFactory(
      OnchainID.contracts.ImplementationAuthority.abi,
      OnchainID.contracts.ImplementationAuthority.bytecode,
      signer
    ).deploy(identityImplementation.address);
    await identityImplementationAuthority.deployed();

    console.log(
      "identityImplementationAuthority",
      identityImplementationAuthority.address
    );

    const identityFactory = await new ethers.ContractFactory(
      OnchainID.contracts.Factory.abi,
      OnchainID.contracts.Factory.bytecode,
      signer
    ).deploy(identityImplementationAuthority.address);
    await identityFactory.deployed();
    console.log("identity Factory", identityFactory.address);
    ID_Factory = identityFactory.address;
    return { identityFactory };
  } catch (error) {
    console.log("Error while deploying idFactory", error);
  }
}

const createIdentity = async (userAddress, salt) => {
  try {
    let chainId = 11155111;
    if (!ethers.isAddress(userAddress) || userAddress === ethers.ZeroAddress) {
      throw new Error("Invalid user address");
    }

    const { networkRPC } = networkData(chainId);
    const provider = new ethers.JsonRpcProvider(networkRPC);

    if (!provider) {
      throw new Error("Failed to connect to RPC provider");
    }

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await signer.getAddress();

    if (!identityFactoryContract) {
      identityFactoryContract = new ethers.Contract(
        ID_Factory,
        OnchainID.contracts.Factory.abi,
        provider
      );
    }
    const isSaltTaken = await identityFactoryContract.isSaltTaken(salt);
    if (isSaltTaken) {
      throw new Error("Salt already used");
    }

    const existingIdentity = await identityFactoryContract.getIdentity(
      userAddress
    );

    if (
      existingIdentity &&
      existingIdentity != "0x0000000000000000000000000000000000000000"
    ) {

      return existingIdentity;
    }

    const tx = await identityFactoryContract
      .connect(signer)
      .createIdentity(userAddress, salt);
    await tx.wait();

    const identityAddress = await identityFactoryContract.getIdentity(
      userAddress
    );
    console.log("iden",identityAddress);

    return identityAddress;
  } catch (error) {
    const reason = error.reason || error.message || "Unknown error";
    const msg = `❌ Failed to create identity: ${reason}`;
    console.error(msg);
    throw new Error(msg);
  }
};

const getIdentity= async (userAddress) => {
  try {
    let chainId = 11155111;
    if (!ethers.isAddress(userAddress) || userAddress === ethers.ZeroAddress) {
      throw new Error("Invalid user address");
    }

    const { networkRPC } = networkData(chainId);
    const provider = new ethers.JsonRpcProvider(networkRPC);

    if (!provider) {
      throw new Error("Failed to connect to RPC provider");
    }

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await signer.getAddress();

    if (!identityFactoryContract) {
      identityFactoryContract = new ethers.Contract(
        ID_Factory,
        OnchainID.contracts.Factory.abi,
        provider
      );
    }
    const existingIdentity = await identityFactoryContract.getIdentity(
      userAddress
    );
    return existingIdentity;
  } catch (error) {
    const reason = error.reason || error.message || "Unknown error";
    const msg = `❌ Failed to get identity: ${reason}`;
    console.error(msg);
    throw new Error(msg);
  }
};  


module.exports = {
  deployIdFactory,
  createIdentity,
    getIdentity
};

// const identity_ = createIdentity("0x2589419752C0E6B9446A73f2Fc0E53F7596f4bD9", "lovachakravarthi@gmail.com");
// identity_.then((address) => {
//     console.log("Created Identity Address:", address);
// }).catch((error) => {
//     console.error("Error creating identity:", error);
// });

// const existingIdentity_ = getIdentity("0x2589419752C0E6B9446A73f2Fc0E53F7596f4bD9");
// existingIdentity_.then((address) => {
//     console.log(" Identity Address:", address);
// }).catch((error) => {
//     console.error("Error getting identity:", error);
// });
