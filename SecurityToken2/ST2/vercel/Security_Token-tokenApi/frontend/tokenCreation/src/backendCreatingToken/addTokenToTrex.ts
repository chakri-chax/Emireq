import axios from 'axios';

interface TokenData {
    ownerAddress: string;
    irAgentAddress: string[];
    tokenAgentAddress: string[];
    name: string;
    symbol: string;
    prefix: string;
    decimals: number;
    modules: {
        MaxBalanceModule?: number[];
        // CountryAllowModule?: number[];
        // CountryRestrictModule?: number[];
    };
}

interface ClaimData {
    claimTopics: string[];
    claimIissuers: string[];
    issuerClaims: string[];
}
interface TokenCreationResponse {
    [x: string]: { data: any; };
    success: boolean;
    message: string;
    tokenAddress: string;
    tokenLockSmartContract?: string;
    contractSuite?: {
        identityRegistryAddress: string;
        identityRegistryStorageAddress: string;
        trustedIssuerRegistryAddress: string;
        claimTopicsRegistryAddress: string;
        modularComplianceAddress: string;
    };
    details?: {
        explorerLink: string;
        timestamp: string;
    };
}


export default async function addTokenToTrex(
    tokenData: TokenData,
    claimData: ClaimData
): Promise<TokenCreationResponse> {
    try {
        const payload = {
            tokenData,
            claimData
        };
console.log('Payload:', payload);

        const response = await axios.post('http://localhost:8000/api/token/createToken', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', response);
        
        return response.data; // Adjust this based on actual API response
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message);
        } else {
            console.error('Unexpected error:', error);
            throw error;
        }
    }
}