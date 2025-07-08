const path = require("path");
const {
  deployContractWithProxy,
} = require("../scripts/integration/Utils/deployHelper");

exports.deployModules = async (req, res) => {
  const { modules } = req.body;

  try {
    if (
      !modules ||
      typeof modules !== "object" ||
      Object.keys(modules).length === 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "modules object with at least one module is required in request body",
      });
    }

    const results = [];

    for (const moduleName of Object.keys(modules)) {
      try {
        let constructorArgs = modules[moduleName];

        if (moduleName === "MaxBalanceModule" && constructorArgs.length === 1) {
          constructorArgs = BigInt(constructorArgs[0]);
        }

        if (
          moduleName === "SupplyLimitModule" &&
          constructorArgs.length === 1
        ) {
          constructorArgs = BigInt(constructorArgs[0]);
        }

        if (
          ["CountryAllowModule", "CountryRestrictModule"].includes(moduleName)
        ) {
          constructorArgs = constructorArgs.map((code) => parseInt(code, 10));
        }

        if (moduleName === "TransferRestrictModule") {
          constructorArgs = constructorArgs.map((addr) => addr.toLowerCase());
        }

        // console.log(`🛠️ Deploying ${moduleName} with args:`, constructorArgs);

        const deployed = await deployContractWithProxy(
          moduleName,
          constructorArgs
        );

        results.push({
          module: moduleName,
          address: deployed,
        });
      } catch (err) {
        results.push({
          module: moduleName,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deploy modules",
      error: error.message,
    });
  }
};
