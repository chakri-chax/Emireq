require("dotenv").config();
const axios = require("axios");
const express = require('express');

const { ethers } = require("hardhat");

const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ORACLE_ADDRESS = process.env.SEPOLIA_ORACLE_ADDRESS;
const METAL_API_KEY = process.env.METAL_API_KEY;
const POLL_INTERVAL_MS = 2 * 60 * 60 * 1000;
const VOLATILITY_PERCENT = process.env.VOLATILITY_PERCENT ? parseFloat(process.env.VOLATILITY_PERCENT) : 1;
let oraclePrices;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const abi = [
  "function updateAllPrices(uint256,uint256,uint256)",
  "function getTokenAddresses() view returns (address,address,address)",
  "function owner() view returns (address)",
  "function tokenPrices(address) view returns (uint256 price,uint256 lastUpdated,address updatedBy)"
];
const contract = new ethers.Contract(ORACLE_ADDRESS, abi, wallet);

async function fetchApiRates() {
  const apiPrices =
  {
    "success": true,
    "base": "USD",
    "timestamp": 1764115199,
    "rates": {
      "USDXAG": 51.142562173,
      "USDXAU": 4127.8817774659,
      "USDXPD": 1401.1779983668,
      "XAG": 0.0195531854,
      "XAU": 0.000242255,
      "XPD": 0.0007136852
    }
  }

  const rates = apiPrices.rates;
  if (!rates.USDXAU || !rates.USDXAG || !rates.USDXPD) {
    if (!rates.XAU || !rates.XAG || !rates.XPD) throw new Error("Required rate fields missing");
  }
  const goldUsd = rates.USDXAU ? String(rates.USDXAU) : String(1 / rates.XAU);
  const silverUsd = rates.USDXAG ? String(rates.USDXAG) : String(1 / rates.XAG);
  const rareUsd = rates.USDXPD ? String(rates.USDXPD) : String(1 / rates.XPD);
  return { goldUsd, silverUsd, rareUsd };
}

function randomMultiplier(percent) {
  const p = Math.max(0, percent);
  const delta = (Math.random() * 2 - 1) * (p / 100);
  return 1 + delta;
}

function toUintDecimals8(rateStr) {
  const num = parseFloat(rateStr);
  const rounded = num.toFixed(8);
  return ethers.parseUnits(rounded, 8);
}

function applyRandomChangeToRates(ratesObj) {
  const mult = {
    gold: randomMultiplier(VOLATILITY_PERCENT),
    silver: randomMultiplier(VOLATILITY_PERCENT),
    rare: randomMultiplier(VOLATILITY_PERCENT)
  };
  const gold = (parseFloat(ratesObj.goldUsd) * mult.gold).toFixed(8);
  const silver = (parseFloat(ratesObj.silverUsd) * mult.silver).toFixed(8);
  const rare = (parseFloat(ratesObj.rareUsd) * mult.rare).toFixed(8);
  return { goldUsd: String(gold), silverUsd: String(silver), rareUsd: String(rare) };
}

async function updatePricesOnce() {
  const signerAddress = await wallet.getAddress();
  const contractOwner = await contract.owner();
  if (signerAddress.toLowerCase() !== contractOwner.toLowerCase()) {
    console.error("Signer is not the contract owner. Owner:", contractOwner, "Signer:", signerAddress);
    return;
  }
  const tokens = await contract.getTokenAddresses();
  if (tokens[0] === ethers.AddressZero || tokens[1] === ethers.AddressZero || tokens[2] === ethers.AddressZero) {
    console.error("Token addresses are not set on the oracle contract");
    return;
  }
  let rates;
  try {
    rates = await fetchApiRates();
    rates = applyRandomChangeToRates(rates);
    console.log("Fetched + randomized rates:", {
      gold: rates.goldUsd,
      silver: rates.silverUsd,
      rare: rates.rareUsd
    });
  } catch (e) {
    console.error("Failed to fetch API rates:", e.message || e);
    return;
  }
oraclePrices = {
  goldUsd: rates.goldUsd,
  silverUsd: rates.silverUsd,
  rareUsd: rates.rareUsd
}
  const goldPrice = toUintDecimals8(rates.goldUsd);
  const silverPrice = toUintDecimals8(rates.silverUsd);
  const rarePrice = toUintDecimals8(rates.rareUsd);


  console.log("Prices in uint decimals(8):", {
    gold: goldPrice.toString(),
    silver: silverPrice.toString(),
    rare: rarePrice.toString()
  });

  try {
    const tx = await contract.updateAllPrices(goldPrice, silverPrice, rarePrice);
    console.log("Submitted tx", tx.hash);
    const receipt = await tx.wait();
    console.log("Tx mined", receipt.hash, "status", receipt.status);

    const goldPriceData = await contract.tokenPrices(tokens[0]);
    const silverPriceData = await contract.tokenPrices(tokens[1]);
    const rarePriceData = await contract.tokenPrices(tokens[2]);

    console.log("Stored prices:", {
      gold: goldPriceData.price.toString(),
      silver: silverPriceData.price.toString(),
      rare: rarePriceData.price.toString(),
      lastUpdated: goldPriceData.lastUpdated.toString()
    });
  } catch (e) {
    console.error("Failed to update prices:", e.message || e);
  }
}

(async function main() {
  try {
    await updatePricesOnce();
    setInterval(updatePricesOnce, POLL_INTERVAL_MS);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

const app = express();
app.get('/', (req, res) => res.send('Oracle price updater running', oraclePrices));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));