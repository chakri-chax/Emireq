
const axios = require('axios');
export async function getFilteredEntities(data, schemaId, token = accessToken, size = 200) {
    const body = {
    "dbType": "TIDB",
    "filter": {...data}
    }
    const url = `${devUrl}/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances/list?page=0&size=20&showDBaaSReservedKeywords=false&showPageableMetaData=true`
    try {
        var res = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (e) {
        // if(e.response.status==403){
        //   var res2 = await generatePortalsAccessToken();
        //   console.log(res2);
        //   return await getFilteredEntities(data, schemaId, res2);
        // }
        console.log("Error in Getting Filtered Entities", e);
        return false;
    }
}

export async function getSTData(data, schemaId, token = accessToken, size = 200) {
    const body = {
    "dbType": "TIDB",
    "filter": {...data}
    }
    const url = `${devUrl}/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances/list?page=0&size=20&showDBaaSReservedKeywords=false&showPageableMetaData=true`
    try {
        var res = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (e) {
        // if(e.response.status==403){
        //   var res2 = await generatePortalsAccessToken();
        //   console.log(res2);
        //   return await getFilteredEntities(data, schemaId, res2);
        // }
        console.log("Error in Getting Filtered Entities", e);
        return false;
    }
}


