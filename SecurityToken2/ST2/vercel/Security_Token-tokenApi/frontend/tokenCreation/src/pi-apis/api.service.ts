import { ApiRequest, ApiResponse } from './api.interfaces';

const API_BASE_URL = 'https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0';

export async function listTokenInstances(
    token: string,
    schemaId: string,
    request: ApiRequest,
    page: number = 0,
    size: number = 50
): Promise<ApiResponse> {
    const url = `${API_BASE_URL}/schemas/${schemaId}/instances/list?page=${page}&size=${size}&showDBaaSReservedKeywords=false&showPageableMetaData=true`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json() as ApiResponse;
}

// Example usage:
/*
const requestData: ApiRequest = {
    dbType: "TIDB",
    filter: {}
};

const schemaId = "685e7a342ec4242da906daca";
const authToken = "....A";

listTokenInstances(authToken, schemaId, requestData)
    .then(response => {
        console.log("API Response:", response);
        // Handle the response here
    })
    .catch(error => {
        console.error("Error:", error);
    });
*/