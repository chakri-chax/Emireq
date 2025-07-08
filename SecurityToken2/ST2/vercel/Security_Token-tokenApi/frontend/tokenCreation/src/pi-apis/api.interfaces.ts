
export interface ApiRequest {
    dbType: string;
    filter: Record<string, unknown>;
}

export interface ContractSuiteData {
    claimTopicsRegistryAddress: string;
    identityRegistryAddress: string;
    identityRegistryStorageAddress: string;
    modularComplianceAddress: string;
    trustedIssuerRegistryAddress: string;
}

export interface ModulesData {
    MaxBalanceModule: number[];
}

export interface Network {
    chainId: number;
    name: string;
    rpcUrl: string;
}

export interface ClaimData {
    claimable: boolean;
    endDate: string;
    startDate: string;
}

export interface TokenInstance {
    symbol: string;
    prefix: string;
    description: string;
    contractSuite: {
        data: ContractSuiteData;
    };
    modules: {
        data: ModulesData;
    };
    objective: string;
    network: Network;
    tokenAddress: string;
    irAgentAddress: {
        data: string[];
    };
    createdAt: string;
    tokenDocs: {
        data: string;
    };
    decimals: number;
    name: string;
    logo: string;
    claimData: ClaimData;
    ownerAddress: string;
    tokenAgentAddress: {
        data: string[];
    };
    updatedAt: string;
}

export interface ApiResponse {
    pageNumber: number;
    pageSize: number;
    noOfInstances: number;
    totalInstances: number;
    totalPages: number;
    content: TokenInstance[];
    relations: unknown[];
}