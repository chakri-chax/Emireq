const { createToken } = require('../scripts/integration/tokenCreation/createToken');
const { deployContractWithProxy } = require('../scripts/integration/Utils/deployHelper');
const { ethers } = require('ethers');
exports.createToken = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || !req.body.tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required tokenData in request body',
        details: 'Expected structure: { tokenData: { ownerAddress, irAgentAddress, tokenAgentAddress, name, symbol, prefix } }'
      });
    }

    const { tokenData, claimData } = req.body;
    console.log(' ::: createToken ::: ', tokenData, claimData);

    // Validate required fields
    const requiredFields = ['ownerAddress', 'irAgentAddress', 'tokenAgentAddress', 'name', 'symbol', 'prefix'];
    const missingFields = requiredFields.filter(field => !tokenData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields in tokenData',
        missingFields,
        details: `Please provide: ${missingFields.join(', ')}`
      });
    }

    // complaince data

    const modules = tokenData.modules;
    // const modules = {
    //     CountryAllowModule: [10, 97, 10],
    //     CountryRestrictModule: [15, 25, 30],
    //     MaxBalanceModule: [10000]
    //   };

    const complainceMissingFields = [];
    if (modules.CountryAllowModule && modules.CountryAllowModule.length === 0) {
      complainceMissingFields.push('CountryAllowModule');
    }
    if (modules.CountryRestrictModule && modules.CountryRestrictModule.length === 0) {
      complainceMissingFields.push('CountryRestrictModule');
    }
    if (modules.MaxBalanceModule && modules.MaxBalanceModule.length !== 1) {
      complainceMissingFields.push('MaxBalanceModule (should have exactly one value)');
    }

    if (complainceMissingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid fields in tokenData',
        complainceMissingFields,
        details: `Please provide: ${complainceMissingFields.join(', ')}`
      });
    }


    const results = [];

    for (const moduleKey of Object.keys(modules)) {
      try {
        console.log('moduleKey ::: ', moduleKey);
        console.log('modules[moduleKey] ::: ', modules[moduleKey]);

        const deployed = await deployContractWithProxy(moduleKey, modules[moduleKey]);
        results.push(deployed);
      } catch (err) {
        results.push({
          moduleKey,
          error: err.message
        });
      }
    }


    console.log('results ::: ', results);

    const complianceModules = results.filter((result) => !result.error).map((result) => result.proxyAddress);
    const complianceSettings = results.filter((result) => !result.error).map((result) => result.complianceSettings);

    let { claimTopics, claimIissuers, issuerClaims } = claimData;

    if (claimIissuers.length !== issuerClaims.length) {
      return res.status(400).json({
        success: false,
        message: 'Issuer claim mismatch',
        details: `Please provide: claimIssuer and claimTopics`
      });
    }
    if (!Array.isArray(claimTopics)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claimTopic array',
        details: 'Please provide an array of valid claimTopics'
      });
    }

    if (!Array.isArray(claimIissuers) || !claimIissuers.every(ethers.isAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claimIssuer addresses',
        details: 'Please provide an array of valid claimIssuer addresses'
      });
    }
    if (!Array.isArray(issuerClaims)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issuerClaim array',
        details: 'Please provide an array of valid issuerClaim '
      });
    }

    claimTopics = claimTopics.map((claimTopic) => ethers.id(claimTopic));

    issuerClaimsIndArray = issuerClaims.map((issuerClaim) => ethers.id(issuerClaim));
    issuerClaims = issuerClaimsIndArray.map((issuerClaim) => [issuerClaim]);




    // Call the createToken function
    const result = await createToken(
      tokenData.ownerAddress,
      tokenData.irAgentAddress,
      tokenData.tokenAgentAddress,
      tokenData.name,
      tokenData.symbol,
      tokenData.decimals,
      tokenData.prefix,
      complianceModules,
      complianceSettings,
      claimTopics,
      claimIissuers,
      issuerClaims
    );

     



    // Handle the response from createToken
    if (!result.success) {
      console.error('Token creation failed:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Token creation failed',
        error: result.error.message,
        errorType: result.error.name,
        ...(process.env.NODE_ENV === 'development' && { stack: result.error.stack })
      });
    }

    console.log('Token created successfully:', {
      tokenAddress: result.data.tokenAddress,
      tokenLockSmartContract: result.data.tokenLockSmartContract,
      contractSuite: result.data.contractSuite,
      modules:{
        data:results
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Token created successfully',
      tokenAddress: result.data.tokenAddress,
      tokenLockSmartContract: result.data.tokenLockSmartContract,
      contractSuite: result.data.contractSuite,
      modules:{
        data:results
      },
      details: {
        explorerLink: `${process.env.BLOCK_EXPLORER_URL}/address/${result.data.tokenAddress}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Unexpected error in createToken controller:', error);

    // Handle specific error types
    if (error.name === 'InputValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input parameters',
        error: error.message,
        errorType: error.name
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'Internal server error during token creation',
      error: error.message,
      errorType: error.name || 'UnknownError',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

exports.addCompliance = (req, res) => {

}
exports.getToken = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      address: '0x94Fa0D9A39b5D95eA4E3630Bf29C7e18AA4C6F1a',
      message: 'Token created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Create token'
    });
  }
}