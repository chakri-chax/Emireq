const axios = require('axios');
const { createIdentity } = require('../IdentityFunctions/IdentityFactory');
const { getIdentity } = require('../IdentityFunctions/IdentityFactory');
const {signClaim} = require('../FrontendIntegration/addClaim');
const ethers = require('ethers');
const schemaId = '6863defa2ec4242da906ed9d';
const bearerToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3NDg2MjYwMzEsImlhdCI6MTc0ODU5MDAzMSwianRpIjoiZjhjZjAyZmYtNjRlOC00NWJiLTg0YWQtNjljOTNiNjEyOWY2IiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLXNlcnZpY2Uua2V5Y2xvYWsuc3ZjLmNsdXN0ZXIubG9jYWw6ODA4MC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImJhNzc4OTZmLTdjMWYtNDUwMS1iNGY2LTU0N2E3ZDI2ZGRlNiIsInR5cCI6IkJlYXJlciIsImF6cCI6IkhPTEFDUkFDWV9tb2JpdXMiLCJzaWQiOiI3YjYyYWIwYy0zYjZmLTQ1MzEtOTE0Yy0xMDhmNzczMGI3NTQiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW1hc3RlciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJIT0xBQ1JBQ1lfbW9iaXVzIjp7InJvbGVzIjpbIkhPTEFDUkFDWV9VU0VSIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJ4cHggeHB4IiwidGVuYW50SWQiOiJiYTc3ODk2Zi03YzFmLTQ1MDEtYjRmNi01NDdhN2QyNmRkZTYiLCJwbGF0Zm9ybUlkIjoibW9iaXVzIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicGFzc3dvcmRfdGVuYW50X3hweEBnYWlhbnNvbHV0aW9ucy5jb20iLCJnaXZlbl9uYW1lIjoieHB4IiwiZmFtaWx5X25hbWUiOiJ4cHgiLCJlbWFpbCI6InBhc3N3b3JkX3RlbmFudF94cHhAZ2FpYW5zb2x1dGlvbnMuY29tIn0.dSNWRM9s4nfxcNlMC8iUM_IbX7WIUm-BESIANlW7aourbKxJ_RxLmFacGLBHhbnJzDH1O2uzPPAg2ApwSEG7DV_tdw16oJZlzYLAMNfl9lZzBH9el3VgzAY1ke6SKZeNGacUookgwtgevkXrsnPnXQJvknfGetYCo-WkrNardJs0_kUBJDmFRfU2QLbG_pZ07Dznqoeo418imx3OB9AhyXo0wVWNOJiG2iXgxXSKtEU2x5-mPcU7XocMJ91G0_Vb9_I62krG6mmHteP2J-v0OEc3J1h-WTUp5HsEug0Ouq1B46mGdHdaJwiwcjHYpduR6FBGXbNEEIvCwwc6CBMJXA'
async function getInvestorList(page = 0, size = 50) {
    const url = `https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances/list`;

    try {
        const response = await axios({
            method: 'POST',
            url: url,
            params: {
                page: page,
                size: size,
                showDBaaSReservedKeywords: true,
                showPageableMetaData: true
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            },
            data: {
                dbType: 'TIDB'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching investor list:', error);
        throw error;
    }
}

function needsIdentityCreation(investor) {
    // Check if investorIdentityAddress is missing or invalid (not 42 chars including 0x)

    return !investor.investorIdentityAddress ||
        investor.investorIdentityAddress === '0x0' ||
        investor.investorIdentityAddress === '0x2' ||
        investor.investorIdentityAddress === '0x0000000000000000000000000000000000000000' ||
        investor.investorIdentityAddress.length !== 42;
}

async function createIdentitiesForInvestors() {
    
    try {
        const allInvestors = await getInvestorList();
        const investors = allInvestors.content;

        const investorsNeedingIdentity = investors.filter(needsIdentityCreation);

        if (investorsNeedingIdentity.length === 0) {
            console.log('All investors already have valid identity addresses');
            return;
        }

        // console.log(`Found ${investorsNeedingIdentity.length} investors needing identity creation`);



        for (const investor of investorsNeedingIdentity) {
            try {
                const salt = investor.investorId;

                let identityAddress =await getIdentity(investor.investorAddress);
                if (identityAddress === null || identityAddress === ethers.ZeroAddress) {
                    identityAddress = await createIdentity(investor.investorAddress, salt);

                }

                const instancesId = investor.piMetadata.entityId;
                const transactionId = investor.piMetadata.entityId;
                if(!ethers.isAddress(identityAddress)){
                    break;
                }
                const cliams = await claimsForInvestor(investor.claimData.data,identityAddress);
                console.log("cliams", cliams);
                const claimForUser = {
                    data:cliams
                }
                
                if(identityAddress.length === 42){

                    let status = "13200";
                await updateIdentityAddress(instancesId, identityAddress,status,claimForUser);
                    
                }
            } catch (err) {
                console.error(`Failed to create identity for investor ${investor.investorAddress}:`, err);
            }
        }

        return investorsNeedingIdentity.length - 2;

    } catch (error) {
        console.error('Error in createIdentitiesForInvestors:', error);
        throw error;
    }
}

const updateIdentityAddress = async function (instanceId, identityAddress,status,claimData) {
    const url = `https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances/${instanceId}`;

    try {
        const response = await axios({
            method: 'PATCH',
            url: url,

            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            },
            data: {
                dbType: "TIDB",
                partialUpdateRequests: [
                    {
                        filter: {
                            status: "1"
                        },
                        patch: [
                            {
                                operation: "REPLACE",
                                path: "status",
                                value: status
                            },
                            {
                                operation: "REPLACE",
                                path: "investorIdentityAddress",
                                value: identityAddress
                            },
                            {
                                operation: "REPLACE",
                                path: "claimForUser",
                                value: claimData
                            }

                        ]
                    }
                ]
            }
        });
        // console.log(response.data);

        return response.data;
    } catch (error) {
        console.error('Error fetching investor list:', error.response.data);
        throw error.data;
    }
}

const claimsForInvestor = async (claimData,identityAddress) => {
    // console.log("claimData", claimData);
    // console.log("identityAddress", identityAddress);
    
    
    let claims = [];
    if(claimData.length == 0) return null;
    
    for(let i = 0; i < claimData.length; i++){
        claimIssuer = claimData[i].contract;
        claimTopic = claimData[i].name;

        const claimForInvestor = await signClaim(claimIssuer, identityAddress,claimTopic);
        claims.push(claimForInvestor);
      
    }
 
    return claims;
    
}

//   Example usage:
createIdentitiesForInvestors()
    .then(count => console.log(`[${new Date().toLocaleString()}] : Created identities for ${count} investors`))
    .catch(console.error);

module.exports = {
    getInvestorList,
    createIdentitiesForInvestors,
    needsIdentityCreation
};