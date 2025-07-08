
const { id } = require('ethers');
const { createIdentity, getIdentity } = require('../scripts/integration/IdentityFunctions/IdentityFactory');
const { getKeyFromIdentity } = require('../scripts/integration/IdentityFunctions/identity');
exports.createIdentity = async (req, res) => {
    try {
        const { userAddress, salt } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                message: 'User address is required'
            });
        }
        if (!salt) {
            return res.status(400).json({
                success: false,
                message: 'Salt is required'
            });
        }

        const identityAddress = await createIdentity(userAddress, salt);
        console.log("identityAddress", identityAddress);

        if (!identityAddress) {
            return res.status(400).json({
                success: false,
                message: 'Identity creation failed'
            });
        }

        res.status(200).json({
            success: true,
            identityAddress: identityAddress.toString(),
            message: 'Identity created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create identity'
        });
    }
}

exports.idFactoryAddress = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            address: '0x94Fa0D9A39b5D95eA4E3630Bf29C7e18AA4C6F1a',
            message: 'Identity created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create identity'
        });
    }
}

exports.getIdentity = async (req, res) => {
    try {
        const { userAddress } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                message: 'User address is required',
            });
        }

        const identity = await getIdentity(userAddress);

        if (!identity) {
            return res.status(400).json({
                success: false,
                message: 'Identity not found',
            });
        }

        return res.status(200).json({
            success: true,
            identityAddress: identity,
            message: 'Identity fetched successfully',
        });
    } catch (error) {
        console.error('Error in getIdentity:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve identity',
        });
    }
};

exports.getKeyData = async (req, res) => {
    try {
        const { userAddress } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                message: 'User address is required',
            });
        }

        const keyData = await getKeyFromIdentity(userAddress);

        if (!keyData || !keyData[0] || !keyData[1] || !keyData[2]) {
            return res.status(404).json({
                success: false,
                message: 'Key data not found',
            });
        }

        // Convert BigInt to string for JSON serialization
        const convertBigIntToString = (data) => {
            if (typeof data === 'bigint') return data.toString();
            if (Array.isArray(data)) return data.map(convertBigIntToString);
            return data;
        };

        const processedData = {
            keys: convertBigIntToString(keyData[0]), 
            type: convertBigIntToString(keyData[1]),
            key: keyData[2] 
        };

        return res.status(200).json({
            success: true,
            data: processedData,
            message: 'Key data retrieved successfully',
        });

    } catch (error) {
        // console.error('Error in getKeyData:', error);
        
        const statusCode = error.message.includes('valid address') || 
                          error.message.includes('No Identity') ? 400 : 500;
        
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve key data',
        });
    }
};