import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { Coins, Users, TrendingUp, FileText, Plus, Edit, Play } from 'lucide-react';
import { ethers } from 'ethers';
const Dashboard: React.FC = () => {
  const { tokens, investors, transactions, fetchAndUpdateTokens } = useData();
  // const addedTokens = localStorage.getItem('tokensData')
  // console.log("addedTokens", addedTokens);

  console.log("tokens :::", tokens);

  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState('');

  const initializeSigner = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const accounts = signer.address;
    setAccount(accounts);
    setSigner(signer);
    console.log("Account :", accounts);
    
  }

  useEffect(() => {
    initializeSigner();
  },[account, tokens]);

  let filterdTokens: any =[];
  if(!account){
    initializeSigner();
  }
  if(tokens.length > 0 && account){
    filterdTokens = tokens.filter((token: any) => (token.ownerAddress).toLowerCase() == (account).toLowerCase() );
  }


  console.log("filterdTokens", filterdTokens);
  
  useEffect(() => {
    console.log("Dashboard mounted or route changed - fetching tokens:",account);
    fetchAndUpdateTokens();
    if(tokens.length > 0 && account){
      filterdTokens = tokens.filter((token: any) => (token.ownerAddress).toLowerCase() == (account).toLowerCase() );
    }
  }, [account]);

  console.log("Current tokens:", tokens);

  // stfTokens()

  const stats = [
    {
      name: 'Total Tokens',
      value: filterdTokens.length,
      icon: Coins,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Investors',
      value: investors.filter(i => i.status === 'Qualified').length,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Total Transactions',
      value: transactions.length,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      name: 'Documents',
      value: 12,
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your token ecosystem</p>
        </div>
        <Link
          to="/token-creation"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Token</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tokens Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <button onClick={() => fetchAndUpdateTokens()} className="text-lg font-semibold text-gray-900">Your Tokens</button>
        </div>
        <div className="p-6">
          {tokens.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens yet</h3>
              <p className="text-gray-600 mb-4">Create your first security token to get started</p>
              <Link
                to="/token-creation"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Token</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterdTokens.map((token: { id: React.Key | null | undefined; symbol: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; tokenAddress: any; type: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; decimals: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; network: { chainId: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }; currency: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => (
                <div key={token.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Coins className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{token.symbol}</h3>
                        <p className="text-sm text-gray-600">{token.name}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/token-actions/${token.tokenAddress}`}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Get Details</span>
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token type:</span>
                      <span className="font-medium">{token.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decimals:</span>
                      <span className="font-medium">{token.decimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain network:</span>
                      <span className="font-medium">{token.network.chainId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base currency:</span>
                      <span className="font-medium">{token.currency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.type}</p>
                      <p className="text-sm text-gray-600">{transaction.amount} tokens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{transaction.status}</p>
                    <p className="text-xs text-gray-600">{transaction.timestamp.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;