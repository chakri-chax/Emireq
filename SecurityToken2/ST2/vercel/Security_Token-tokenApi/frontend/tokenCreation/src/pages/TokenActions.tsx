import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/shared/Modal';
import { Filter, X, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { getSTData } from '../services/stf';
import { useParams } from 'react-router-dom';
import { getCliamslist } from '../services/stf';
import idFactoryABI from '../artifacts/identityRegistryABI.json';
import tokenABI from '../artifacts/tokenABI.json';
import { ethers } from 'ethers';
const TokenActions: React.FC = () => {
  const { investors, selectedInvestors, setSelectedInvestors, addTransaction } = useData();
  const [activeTab, setActiveTab] = useState<'mint' | 'burn' | 'block' | 'unblock' | 'force' | 'suite'>('mint');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mintAmounts, setMintAmounts] = useState<{ [key: string]: number }>({});
  const [tokenData, setTokenData] = useState<any>([]);
  const [investorsClaims, setInvestorsClaims] = useState<any>([]);
  const [tokenContract, setTokenContract] = useState<any>(null);
  const [investorStatus, setInvestorStatus] = useState<any>("13200");
  const [investorStatusName, setInvestorStatusName] = useState<any>("Register");
  const { tokenAddress } = useParams();
  const [showMintModal, setShowMintModal] = useState(false);
  // const handleTokenActions = () => {
  //   if (activeTab === 'mint') {
  //     setShowMintModal(true);
  //   }
  // };

  console.log("tokenAddress", tokenAddress);

  const filteredInvestors = investors.filter(investor => {
    if (activeTab === 'block') return investor.status !== 'Blocked';
    if (activeTab === 'unblock') return investor.status === 'Blocked';
    return true;
  });
  const [mintAction, setMintAction] = useState(false);

  const handleTokenActions = () => {
    if (activeTab === 'mint') {
      setMintAction(true); // Show the mint UI
      setShowMintModal(true);

    }
  };

  const statusMaps = {
    I: ['Not created', 'Created', 'Error', 'Under review'],
    C: ['Not submitted', 'Pending', 'Rejected', 'Approved'],
    U: ['Not added', 'Incomplete', 'Validated'],
    R: ['Not added', 'Pending', 'Added', 'Failed'],
    M: ['Not eligible', 'Eligible', 'Minted', 'Mint failed']
  };
  
  const getStatusLabel = (code: string): string => {
  
    // const [i, c, u, r, m] = code.split('').map(Number);
    // return `I: ${statusMaps.I[i] || 'Unknown'}, C: ${statusMaps.C[c] || 'Unknown'}, U: ${statusMaps.U[u] || 'Unknown'}, R: ${statusMaps.R[r] || 'Unknown'}, M: ${statusMaps.M[m] || 'Unknown'}`;
    
    if (!code || code.length !== 5) return 'Unknown';

    const [i, c, u, r, m] = code.split('').map(Number);
  
    if (m === 1 && r === 2) return 'Qualified';
    if (r === 0 && u === 2) return 'Register';
    if (u === 1) return 'User Claim Incomplete';
  
    return 'Qualify';
  };
  
  // switch(investorStatus){
  //   case "13200":
  //     setInvestorStatusName("Register");
  //     break;
  //   case "13210":
  //     setInvestorStatusName("Mint");
  //     break;
  //   case "13212":
  //     console.log("13212");
  //     break;
  //   case "13213":
  //     console.log("13213");
  //     break;
  //   case "13214":
  //     console.log("13214");
  //     break;
  //   case "13215":
  //     console.log("13215");
  //     break;
  // }

  const handleInvestorSelect = (investorId: string) => {
    if (selectedInvestors.includes(investorId)) {
      setSelectedInvestors(selectedInvestors.filter(id => id !== investorId));
    } else {
      setSelectedInvestors([...selectedInvestors, investorId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = investorsClaims.map(claim => claim.investorId);

    if (selectedInvestors.length === allIds.length) {
      setSelectedInvestors([]);
    } else {
      setSelectedInvestors(allIds);
    }
  };


  const handleMintAmountChange = (investorId: string, amount: number) => {
    setMintAmounts(prev => ({ ...prev, [investorId]: amount }));
  };

  const executeAction = () => {
    if (activeTab === 'mint') {
      const investorList: string[] = [];
      const amountList: number[] = [];

      selectedInvestors.forEach(investorId => {
        const amount = mintAmounts[investorId] || 0;

        if (amount > 0) {
          const claim = investorsClaims.find(c => c.investorId === investorId);
          const wallet = claim?.InvestorDetails?.walletAddress || investorId;

          investorList.push(wallet);
          amountList.push(amount);

          addTransaction({
            type: 'Mint',
            tokenId: tokenData?.id,
            toAddress: wallet,
            amount,
            status: 'Completed',
            txHash: `0x${Math.random().toString(16).substr(2, 8)}...`
          });
        }
      });

      console.log("Final investorList:", investorList);
      console.log("Final amountList:", amountList);

      if (investorList.length === amountList.length && tokenContract != null) {
        if(signer == null) return;

        const tokenContractWithSigner = tokenContract.connect(signer);

        tokenContractWithSigner.batchMint(investorList, amountList).then((tx: any) => {
          console.log(tx);
          // addTransaction(tx);
         

        }).catch((error: any) => {
          console.log(error);
        });
        setShowConfirmModal(false);
        setSelectedInvestors([]);
        setMintAmounts({});

      }
      // If you're calling a batch smart contract function, you now have both lists ready:
      // await contract.batchMint(investorList, amountList);

      // Clear modal
    
    }
  };




  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState('');

  const initializeSigner = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const accounts = signer.address;
    setAccount(accounts);
    setSigner(signer);
  }

  React.useEffect(() => {
    initializeSigner();
  }, []);
  console.log(account);



  const idFactoryContract = async () => {
    if (signer == null) {
      await initializeSigner();
    }

    if (!tokenData.contractSuite.data.identityRegistryAddress) {
      return;
    }

    const contract = new ethers.Contract(tokenData.contractSuite.data.identityRegistryAddress, idFactoryABI, signer);

    return contract;
  }




  useEffect(() => {
    const setupContract = async () => {
      if (!tokenAddress) {
        return
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
      setTokenContract(contract);
    };

    setupContract();
  }, []);
  const handleInvestorRegister = async (investorAddress: any, identityAddress: any, country: any) => {
    const contract = await idFactoryContract();
    if (contract == null) {
      return;
    }
    let countryCodeNumber = parseInt(country, 10);
    console.log("inputs:::::", investorAddress, identityAddress, countryCodeNumber);

    const tx = await contract.registerIdentity(investorAddress, identityAddress, countryCodeNumber);
    console.log(tx);
  };
  const claims = async (tokenAddress: any) => {
    const InvestorsClaims = await getCliamslist(tokenAddress);
    console.log("InvestorsClaims", InvestorsClaims);
    setInvestorsClaims(InvestorsClaims);
  }

 
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
          </div>
          <div className="overflow-y-auto max-h-[80vh]">{children}</div>
        </div>
      </div>
    );
  };
  const [balances, setBalances] = useState<{ [key: string]: string }>({});

  const tokenBalance = async (walletAddress: string) => {
    const balance = await tokenContract.balanceOf(walletAddress);
    return balance.toString();
  }

  useEffect(() => {
    const fetchBalances = async () => {
      const updatedBalances: Record<string, string> = {};
      console.log("investorsClaims", investorsClaims);

      if (!tokenContract || investorsClaims.length === 0) {
        // tokenContractInstance();
        console.warn("tokenContract or investorsClaims not ready");
        return;
      }

      for (const claim of investorsClaims) {
        const wallet = claim.investorAddress;
        console.log("Processing wallet:", wallet);

        if (wallet) {
          try {
            const balance = await tokenContract.balanceOf(wallet);
            updatedBalances[wallet] = balance.toString();
            console.log(`Balance for ${wallet}:`, balance.toString());
          } catch (error) {
            console.error(`Failed to fetch balance for ${wallet}`, error);
          }
        }
      }

      setBalances(updatedBalances);
      console.log("Final updatedBalances", updatedBalances);
    };

    fetchBalances();
  }, [investorsClaims, tokenContract]);



  async function getTokenData() {
    const token = tokenAddress;
    const data = await getSTData();
    const fileterData = data.content.filter((item: any) => item.tokenAddress === token);

    setTokenData(fileterData[0]);
    console.log("fileterData", tokenData);
  }

  // getTokenData();
  React.useEffect(() => {


    getTokenData()
    claims(tokenAddress)
    // claims(tokenAddress)
    // claims(tokenData.tokenAddress)
  }, [activeTab]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Token actions</h1>
          <p className="text-gray-600 mt-1">Select investors to mint, burn, block, unblock or transfer their tokens</p>
        </div>
        {selectedInvestors.length > 0 && (

          <button onClick={handleTokenActions} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
            Token Actions ({selectedInvestors.length})
          </button>
        )}
      </div>


      {/* Action Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['mint', 'burn', 'block', 'unblock', 'suite'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        {/* <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters (1)</span>
            </button>
            <button className="text-gray-600 hover:text-gray-800 flex items-center space-x-2">
              <X className="h-4 w-4" />
              <span>Clear filters</span>
            </button>
          </div>
        </div> */}


        {/* Action Section */}






        <Modal isOpen={showMintModal} onClose={() => setShowMintModal(false)} title="Mint Tokens">
          <div className="space-y-4">
            {investorsClaims.filter((claim) => selectedInvestors.includes(claim.investorId)).map((claim, index) => {
              const { investorId, InvestorDetails } = claim;
              const tokenName = tokenData?.name;
              const tokenSymbol = tokenData?.symbol;
              const name = InvestorDetails?.fullName || 'Unknown';
              // const symbol =
              const walletAddress = InvestorDetails?.walletAddress || investorId;
              const currentBalance = 0;
              const newMintAmount = mintAmounts[investorId] || 0;
              const newBalance = currentBalance + newMintAmount;

              return (
                <div
                  key={investorId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-gray-200 shadow"
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <span className="font-medium">({index + 1}) {name} </span>
                    {/* <span className="text-gray-500">{(walletAddress).slice(0, 6)}...{(walletAddress).slice(-4)}</span> */}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold truncate max-w-[180px]" title={name}>{(walletAddress).slice(0, 6)}...{(walletAddress).slice(-4)}</span>

                    <div className="flex items-center space-x-2">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">⊘ {currentBalance}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">⊕ {newMintAmount}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={mintAmounts[investorId] || ''}
                        onChange={(e) =>
                          handleMintAmountChange(investorId, parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        placeholder="100"
                      />
                      <span className="text-gray-600">{tokenName}</span>
                    </div>

                    <div className="text-sm text-gray-600 text-right">
                      <div>NEW BALANCE</div>
                      <div className="text-gray-700 font-medium">{newBalance} {tokenSymbol}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1 text-right">Total tokens to mint</div>
            <div className="text-2xl font-bold text-indigo-700 text-right mb-4">
              {Object.values(mintAmounts).reduce((sum, amount) => sum + (amount || 0), 0)} {tokenData?.symbol}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowMintModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2 border border-gray-300 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>No, go back</span>
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(true);
                  setShowMintModal(false);
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={Object.values(mintAmounts).every(amount => !amount || amount === 0)}
              >
                Confirm Mint
              </button>
            </div>
          </div>

        </Modal>

        {activeTab === 'suite' && tokenData && (
          <div className="p-6 bg-blue-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Suite Contracts Section */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Suite Contracts</h3>
                <div className="space-y-3">
                  {tokenData.contractSuite?.data && Object.entries(tokenData.contractSuite.data).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm font-mono text-gray-800">
                        {key.replace('Address', '')} {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modules Section */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Modules</h3>
                {tokenData.modules?.data ? (
                  <div className="space-y-3">
                    {Object.entries(tokenData.modules.data).map(([moduleName, params]) => (
                      <div key={moduleName} className="flex flex-col">
                        <div className="font-medium text-gray-800">{moduleName}</div>
                        <div className="text-sm text-gray-600">
                          Parameters: {Array.isArray(params) ? params.join(', ') : JSON.stringify(params)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No modules configured</p>
                )}
              </div>

              {/* Claims Section */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Claims</h3>
                {tokenData.claimData?.data?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tokenData.claimData.data.map((claim: any, index: any) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{claim.contract}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.issuer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No claims configured</p>
                )}
              </div>

              {/* Token Information Section */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Token Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{tokenData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Symbol</label>
                    <p className="mt-1 text-sm text-gray-900">{tokenData.symbol}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decimals</label>
                    <p className="mt-1 text-sm text-gray-900">{tokenData.decimals}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Token Address</label>
                    <div className="mt-1 flex items-center">
                      <span className="text-sm font-mono text-gray-900">{(tokenData.tokenAddress).slice(0, 10)}...{(tokenData.tokenAddress).slice(-10)}</span>
                      <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => navigator.clipboard.writeText(tokenData.tokenAddress)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Network</label>
                    <p className="mt-1 text-sm text-gray-900">{tokenData.network.name} (Chain ID: {tokenData.network.chainId})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner Address</label>
                    <div className="mt-1 flex items-center">
                      <span className="text-sm font-mono text-gray-900">{(tokenData.ownerAddress).slice(0, 10)}...{(tokenData.ownerAddress).slice(-10)}</span>
                      <button
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => navigator.clipboard.writeText(tokenData.ownerAddress)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* {adsfasdf} */}

        {/* Investors Table */}
        {/* <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvestors.length === filteredInvestors.length && filteredInvestors.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country of Residence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvestors.map((investor) => (
                <tr key={investor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedInvestors.includes(investor.id)}
                      onChange={() => handleInvestorSelect(investor.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">{investor.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {investor.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{investor.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{investor.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      {investor.wallet}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${investor.type === 'Individual'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                      }`}>
                      {investor.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{investor.country}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{investor.balance} T</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvestors.length > 0 &&
                      selectedInvestors.length === investorsClaims.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />

                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  identity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country of Residence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investorsClaims.map((claim) => {
                const investorId = claim.investorId;
                const investor = claim.InvestorDetails;
                const identity = claim.investorIdentityAddress;
                const isSelected = selectedInvestors.includes(investorId);
                const wallet = claim.investorAddress;
                const balance = balances[wallet] || '...';
                // const balance = ethers.formatUnits(balances[wallet] || '0', 18);
                const statusname = getStatusLabel(claim.status);

                return (
                  <tr key={investorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleInvestorSelect(investorId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <button onClick={() => handleInvestorRegister(investor.walletAddress, identity, investor.countryCode)} className="text-sm text-gray-900">{statusname}</button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {investor?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {investor?.fullName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{investor?.email || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span
                          title={investor?.walletAddress}
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(investor?.walletAddress);
                            // You might want to add a toast notification here
                          }}
                        >
                          {investor?.walletAddress?.slice(0, 6)}...{investor?.walletAddress?.slice(-4)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(investor?.walletAddress)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copy address"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span
                          title={identity}
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(identity);
                            // You might want to add a toast notification here
                          }}
                        >
                          {identity?.slice(0, 6)}...{identity?.slice(-4)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(identity)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copy address"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Individual
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {investor?.countryOfResidence || '—'}
                    </td>
                    {/* balance */}
                    <td className="px-6 py-4 text-sm text-gray-900">{balance} {tokenData.symbol}</td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {filteredInvestors.length} items - Items per page: 50
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">Prev</span>
            <span className="px-3 py-1 bg-indigo-600 text-white rounded">1</span>
            <span className="text-sm text-gray-700">Next</span>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {/* <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm mint of tokens"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-900">
            Are you sure do you want to mint {Object.values(mintAmounts).reduce((sum, amount) => sum + (amount || 0), 0)} MGBT?
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>No, go back</span>
            </button>
            <button
              onClick={executeAction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Yes, mint tokens</span>
            </button>
          </div>
        </div>
      </Modal> */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm mint of tokens"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-900">
            Are you sure you want to mint {Object.values(mintAmounts).reduce((sum, amount) => sum + (amount || 0), 0)} {tokenData?.symbol} tokens?
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>No, go back</span>
            </button>
            <button
              onClick={executeAction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Yes, mint tokens</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Tutorial Overlay */}
      {/* {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-indigo-600 text-white p-6 rounded-lg max-w-md mx-4">
            <p className="mb-4">{tutorialSteps[tutorialStep]}</p>
            <div className="text-sm text-indigo-200 mb-4">
              {tutorialStep + 1} of {tutorialSteps.length}
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevTutorialStep}
                disabled={tutorialStep === 0}
                className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-400 disabled:opacity-50 flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextTutorialStep}
                className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-400 flex items-center space-x-2"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default TokenActions;