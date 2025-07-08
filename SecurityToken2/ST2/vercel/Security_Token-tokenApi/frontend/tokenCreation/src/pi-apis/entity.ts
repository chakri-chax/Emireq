// api.service.ts
import { ApiRequest, ApiResponse } from './api.interfaces';
import { BEARER_TOKEN, SECURITY_TOKEN_SCHEMA_ID } from './utils/constant';

const API_BASE_URL = 'https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0';
const requestData: ApiRequest = {
    dbType: "TIDB",
    filter: {}
};

// export async function listTokenInstances(
//     page: number = 0,
//     size: number = 50
// ): Promise<ApiResponse> {
    // const url = `${API_BASE_URL}/schemas/${SECURITY_TOKEN_SCHEMA_ID}/instances/list?page=${page}&size=${size}&showDBaaSReservedKeywords=false&showPageableMetaData=true`;

    // const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${BEARER_TOKEN}`
    //     },
    //     body: JSON.stringify(requestData)
    // });

    // const response = await fetch('http://localhost:8000/api/proxy', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         schemaId: SECURITY_TOKEN_SCHEMA_ID,
    //         page,
    //         size,
    //         token: BEARER_TOKEN,
    //         requestData: JSON.stringify(requestData)
    //     })
    // });

    // if (!response.ok) {
    //     throw new Error(`API request failed with status ${response.status}`);
    // }
    // // console.log("response",await response);

    // return await response.json() as ApiResponse;
// }

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