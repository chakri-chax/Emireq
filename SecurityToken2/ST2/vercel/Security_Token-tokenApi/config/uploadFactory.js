const fs = require("fs");
const path = require("path");

/**
 * Update the configuration file with all the addresses and ABIs of the deployed contracts
 * before app initialization.
 */
function uploadFactory(
  trexFactoryContractAddress,
  gatewayContractAddress,
  claimIssuerContractAddress,
  tokenLockSmartContract,
  deployer,
  irAgent,
  tokenAgent,
  user,
  claimIssuer
) {
  // Update the configuration file with the address of the deployed factory
  const configFilePath = path.resolve(__dirname, "../../configFactory.json");

  try {
    const configData = {
      trexFactoryContractAddress: trexFactoryContractAddress,
      gatewayContractAddress: gatewayContractAddress,
      claimIssuerContractAddress: claimIssuerContractAddress,
      tokenLockSmartContract: tokenLockSmartContract,
      deployer: deployer,
      irAgent: irAgent,
      tokenAgent: tokenAgent,
      user: user,
      claimIssuer: claimIssuer,
    };

    // Write the updated config object to the file
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(configData, null, 2),
      "utf8"
    );
  } catch (err) {
    console.error(`[x] Error updating the configuration file: ${err}`);
    return;
  }

  console.log(`[✓] Added the onchainid and trex to configurations`);
}

module.exports = { uploadFactory };
