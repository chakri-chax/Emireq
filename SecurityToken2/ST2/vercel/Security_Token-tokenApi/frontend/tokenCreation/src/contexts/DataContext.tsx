import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// const {getSTData} = require('../services/stf');
import { getSTData } from '../services/stf';
// import {listTokenInstances} from '../pi-apis/entity';
export interface Token {
  id: string;
  name: string;
  symbol: string;
  prefix?: string;
  description?: string;
  type: 'Debt' | 'Equity' | 'Fund' | string; // Added string for flexibility
  currency: string;
  network: {
    chainId: number;
    name: string;
    rpcUrl: string;
  };
  totalSupply?: number; // Made optional as it's not in the source data
  status: 'Active' | 'Paused' | 'Draft' | string; // Added string for flexibility
  createdAt: Date;
  updatedAt?: Date;
  decimals: number;
  logo?: string;
  tokenAddress: string;
  contractSuite?: {
    data: {
      claimTopicsRegistryAddress: string;
      identityRegistryAddress: string;
      identityRegistryStorageAddress: string;
      modularComplianceAddress: string;
      trustedIssuerRegistryAddress: string;
    };
  };
  modules?: {
    data: Record<string, any[]>;
  };
  objective?: string;
  irAgentAddress?: {
    data: string[];
  };
  tokenDocs?: {
    data: string;
  };
  claimData?: {
    data?: Array<{
      issuer: string;
      name: string;
    }>;
    claimable?: boolean;
    startDate?: string;
    endDate?: string;
  };
  ownerAddress?: string;
  tokenAgentAddress?: {
    data: string[];
  };
}

export interface Investor {
  walletAddress: any;
  id: string;
  name: string;
  email: string;
  wallet: string;
  type: 'Individual' | 'Institution';
  status: 'Qualified' | 'Pending' | 'Blocked';
  country: string;
  balance: number;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  joinedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'Mint' | 'Burn' | 'Transfer' | 'Block' | 'Unblock';
  tokenId: string;
  fromAddress?: string;
  toAddress?: string;
  amount: number;
  timestamp: Date;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash: string;
}

interface DataContextType {
  tokens: Token[];
  investors: Investor[];
  transactions: Transaction[];
  selectedInvestors: string[];
  setSelectedInvestors: (ids: string[]) => void;
  addToken: (token: Omit<Token, 'id' | 'createdAt'>) => void;
  updateInvestor: (id: string, updates: Partial<Investor>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  fetchAndUpdateTokens: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}


const mockTokens: Token[] = [];

const mockInvestors: Investor[] = [
  {
    id: '1',
    name: 'Jo Nesbe',
    email: 'dnb.individual@yogmail.com',
    wallet: '0xAC618A51312...Sfif',
    type: 'Individual',
    status: 'Qualified',
    country: 'NOR',
    balance: 0,
    kycStatus: 'Verified',
    joinedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Dale of Norway',
    email: 'dnb.institution@yogmail.com',
    wallet: '0x6c8824F7bEf0...af02',
    type: 'Institution',
    status: 'Qualified',
    country: 'NOR',
    balance: 0,
    kycStatus: 'Verified',
    joinedAt: new Date('2024-01-12')
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'Mint',
    tokenId: '1',
    toAddress: '0xAC618A51312...Sfif',
    amount: 1000,
    timestamp: new Date('2024-01-20'),
    status: 'Completed',
    txHash: '0x1234567890abcdef...'
  }
];

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [investors, setInvestors] = useState<Investor[]>(mockInvestors);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);

  const addToken = (tokenData: Omit<Token, 'id' | 'createdAt'>) => {
    const newToken: Token = {
      ...tokenData,
      id: (tokens.length + 1).toString(),
      createdAt: new Date()
    };
    setTokens([...tokens, newToken]);
  };


  const fetchAndUpdateTokens = async () => {
    try {
      const data = await getSTData();
      const tokensSTData = data.content;
      
      const newTokens = tokensSTData.map((tokenData: any, index: number) => ({
        id: tokenData.tokenAddress || (tokens.length + index + 1).toString(),
        name: tokenData.name,
        symbol: tokenData.symbol,
        prefix: tokenData.prefix,
        description: tokenData.description,
        type: 'Fund', // Default or extract from data if available
        currency: 'USD', // Default or extract from data if available
        network: tokenData.network,
        status: 'Active', // Default or extract from data if available
        createdAt: new Date(tokenData.createdAt) || new Date(),
        updatedAt: tokenData.updatedAt ? new Date(tokenData.updatedAt) : undefined,
        decimals: tokenData.decimals,
        logo: tokenData.logo,
        tokenAddress: tokenData.tokenAddress,
        contractSuite: tokenData.contractSuite,
        modules: tokenData.modules,
        objective: tokenData.objective,
        irAgentAddress: tokenData.irAgentAddress,
        tokenDocs: tokenData.tokenDocs,
        claimData: tokenData.claimData,
        ownerAddress: tokenData.ownerAddress,
        tokenAgentAddress: tokenData.tokenAgentAddress
      }));

      // console.log("Transformed tokens:", newTokens);
      
      // Merge with existing tokens, avoiding duplicates
      setTokens(prevTokens => {
        const existingAddresses = new Set(prevTokens.map(t => t.tokenAddress));
        const uniqueNewTokens = newTokens.filter((t: { tokenAddress: string; }) => !existingAddresses.has(t.tokenAddress));
        return [...prevTokens, ...uniqueNewTokens];
      });
      
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };
  useEffect(() => {
    // setInterval(fetchAndUpdateTokens, 5000);
    fetchAndUpdateTokens();
  }, []);

  const updateInvestor = (id: string, updates: Partial<Investor>) => {
    setInvestors(investors.map(investor => 
      investor.id === id ? { ...investor, ...updates } : investor
    ));
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: (transactions.length + 1).toString(),
      timestamp: new Date()
    };
    setTransactions([...transactions, newTransaction]);
  };

  const value = {
    tokens,
    investors,
    transactions,
    selectedInvestors,
    setSelectedInvestors,
    fetchAndUpdateTokens,
    addToken,
    updateInvestor,
    addTransaction
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};