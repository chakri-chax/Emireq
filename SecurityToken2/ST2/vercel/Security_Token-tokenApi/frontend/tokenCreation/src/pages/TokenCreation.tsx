import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Upload, Info, Check, Plus } from 'lucide-react';
import addTokenToTrex from '../backendCreatingToken/addTokenToTrex';
import { insertEntity } from '../services/stf';


const TokenCreation: React.FC = () => {
  const navigate = useNavigate();
  const { addToken } = useData();
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [tokenAddress, setTokenAddress] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  // const [showClaimDropdown, setShowClaimDropdown] = useState(false);
  // const [showComplainceDropdown, setShowComplianceDropdown] = useState(false);
  const [showComplianceDropdown, setShowComplianceDropdown] = useState(false);
  const [modules, setModules] = useState<Record<string, number[]>>({});

  const [claims, setClaims] = useState([
    {
      name: "KYC",
      issuer: "Onfido KYC",
      contract: "0xE2411b687F742b73e1690013E40889a6CbAB646F",
    },
  ]);
  const [showClaimOptions, setShowClaimOptions] = useState(false);
  const predefinedTopics = [
    {
      name: "KYC",
      issuer: "KYC Provider",
      enabled: false,
      contract: "0xE2411b687F742b73e1690013E40889a6CbAB646F",
    },
    {
      name: "AML",
      issuer: "Compliance Provider",
      enabled: false,
      contract: "0xE2411b687F742b73e1690013E40889a6CbAB646F",
    },
    {
      name: "COUNTRY",
      issuer: "Geo Verification",
      enabled: false,
      contract: "0xE2411b687F742b73e1690013E40889a6CbAB646F",
    },
    {
      name: "ACCREDITED_INVESTOR",
      issuer: "Verification Service",
      enabled: false,
      contract: "0xE2411b687F742b73e1690013E40889a6CbAB646F",
    },
  ];

  const getAvailableTopics = () => {
    const currentClaimNames = claims.map((claim) => claim.name);
    return predefinedTopics.filter(
      (topic) => !currentClaimNames.includes(topic.name)
    );
  };
  const addNewClaim = (topic: any) => {
    setClaims([
      ...claims,
      {
        name: topic.name,
        issuer: topic.issuer,
        contract: topic.contract,
      },
    ]);
  };

  const removeClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const handleValueChange = (moduleName: string, index: number, value: any) => {
    const updatedModules = { ...modules };
    updatedModules[moduleName][index] = Number(value);
    setModules(updatedModules);
  };

  interface TokenDetails {
    name: string;
    symbol: string;
    type: "Debt" | "Equity" | "Fund";
    currency: string;
    network: string;
    totalSupply: number;
    status: "Active" | "Paused" | "Draft";
    createdAt: Date;
    decimals: number;
    logo?: string;
  }

  interface ClaimDetails {
    name: string;
    symbol: string;
    type: "Debt" | "Equity" | "Fund";
    currency: string;
    network: string;
    totalSupply: number;
    status: "Active" | "Paused" | "Draft";
    createdAt: Date;
    decimals: number;
    logo?: string;
  }

  interface FormData {
    name: string;
    symbol: string;
    type: "Debt" | "Equity" | "Fund";
    currency: string;
    network: string;
    totalSupply: number;
    status: "Active" | "Paused" | "Draft";
    createdAt: Date;
    decimals: number;
    logo?: string;
  }
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>({
    name: "",
    symbol: "",
    type: "Debt",
    currency: "",
    network: "",
    totalSupply: 0,
    status: "Active",
    createdAt: new Date(),
    decimals: 0,
    logo: "",
  });
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [claimDetails, setClaimDetails] = useState<ClaimDetails>({
    name: "",
    symbol: "",
    type: "Debt",
    currency: "",
    network: "",
    totalSupply: 0,
    status: "Active",
    createdAt: new Date(),
    decimals: 0,
    logo: "",
  });
  const countries = [
    { name: "United States", code: 840 },
    { name: "Germany", code: 276 },
    { name: "India", code: 356 },
    { name: "France", code: 250 },
    { name: "Australia", code: 36 },
    { name: "Canada", code: 124 },
    { name: "Japan", code: 392 },
    { name: "Brazil", code: 76 },
    { name: "South Africa", code: 710 },
  ];
  const [showModuleOptions, setShowModuleOptions] = useState(false);

  const predefinedModules = [
    { name: "MaxBalanceModule", values: [10000] },
    { name: "MaxSupplyModule", values: [1000000] },
    { name: "CountryAllowModule", values: [] },
    { name: "CountryRestrictModule", values: [] },
    { name: "TransferRestrictionModule", values: [] },
  ];

  const getAvailableModules = () => {
    const currentModuleNames = Object.keys(modules);
    return predefinedModules.filter(
      (module) => !currentModuleNames.includes(module.name)
    );
  };

  // Add new module
  const addNewModule = (module: any) => {
    setModules({
      ...modules,
      [module.name]: [...module.values],
    });
  };
  const removeModule = (moduleName: string) => {
    const newModules = { ...modules };
    delete newModules[moduleName];
    setModules(newModules);
  };

  const createToken = async () => {
    setIsLoading(true);

    try {
      if (
        !formData.name ||
        !formData.symbol ||
        !formData.currency ||
        !formData.network ||
        !formData.totalSupply ||
        !formData.decimals
      ) {
        alert("Please fill in all fields");
      }
      const commonData = {
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        currency: formData.currency,
        network: formData.network,
        totalSupply: formData.totalSupply,
        status: "Active" as "Active",
        createdAt: new Date(),
        decimals: formData.decimals,
        logo: 'https://mobiusdtaas.atlassian.net/s/vf1kch/b/9/d4fd883e0d56e985038c7565d6082f2f/_/jira-logo-scaled.png',
        initialPrice:formData.tokenPrice
      };

      console.log("form data", formData);

      setTokenDetails(commonData);
      console.log("tokenDetails:", tokenDetails);
      // console.log('claimDetails:', claimDetails);
      console.log("modules:", modules);
      console.log("claims:", claims);
      // setClaimDetails(claims);

      const tokenDetailsData = {
        ownerAddress: walletAddress,
        irAgentAddress: [walletAddress],
        tokenAgentAddress: [walletAddress],
        name: formData.name,
        symbol: formData.symbol,
        prefix: formData.symbol,
        decimals: formData.decimals,
        modules: modules,
      };
      const claimDetailsData = {
        claimTopics: claims.map((claim) => claim.name),
        claimIissuers: claims.map((claim) => claim.contract),
        issuerClaims: claims.map((claim) => claim.name),
      };
      const addTokenToTrexResponse = await addTokenToTrex(
        tokenDetailsData,
        claimDetailsData
      );
      console.log("Token added to Trex:::", addTokenToTrexResponse);

      const data = {
        ownerAddress: walletAddress,
        irAgentAddress: {
          data: [walletAddress],
        },
        tokenAgentAddress: {
          data: [walletAddress],
        },
        name: formData.name,
        symbol: formData.symbol,
        prefix: formData.symbol,
        decimals: formData.decimals,
        initialPrice:formData.tokenPrice,
        description: "A utility token for the Trail ecosystem",
        logo: "https://example.com/logos/trailtoken.png",
        createdAt: "2023-05-15T10:30:00Z",
        updatedAt: "2023-06-20T14:45:00Z",
        objective: "To power the Trail decentralized platform",
        tokenDocs: {
          data: "https://example.com/logos/trailtoken.png",
        },
        network: {
          chainId: networkId,
          name: "Ethereum Sepolia",
          rpcUrl: "https://mainnet.infura.io/v3/",
        },
        claimData: {
          data: claims,
        },
        modules: {
          data: addTokenToTrexResponse.modules,
        },
        tokenAddress: addTokenToTrexResponse.tokenAddress,
        contractSuite: {
          data: {
            identityRegistryAddress: "0x0",
            identityRegistryStorageAddress: "0x0",
            trustedIssuerRegistryAddress: "0x0",
            claimTopicsRegistryAddress: "0x0",
            modularComplianceAddress: "0x0",
          },
        },
      };
      if (addTokenToTrexResponse) {
        data.tokenAddress = addTokenToTrexResponse.tokenAddress;
        if (addTokenToTrexResponse.contractSuite) {
          data.contractSuite.data = {
            identityRegistryAddress:
              addTokenToTrexResponse.contractSuite.identityRegistryAddress,
            identityRegistryStorageAddress:
              addTokenToTrexResponse.contractSuite
                .identityRegistryStorageAddress,
            trustedIssuerRegistryAddress:
              addTokenToTrexResponse.contractSuite.trustedIssuerRegistryAddress,
            claimTopicsRegistryAddress:
              addTokenToTrexResponse.contractSuite.claimTopicsRegistryAddress,
            modularComplianceAddress:
              addTokenToTrexResponse.contractSuite.modularComplianceAddress,
          };
        }
        data.modules = addTokenToTrexResponse?.modules
      }
      console.log("data :::::", data);

      insertSTEntity(data);

      navigate("/tokens");
    } catch (error) {
      console.error("Token creation failed:", error);
      // Handle error (show message to user, etc.)
    } finally {
      setIsLoading(false);
    }
  };
  const connectWallet = async () => {
    console.log("connect wallet......");

    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Wallet address:", walletAddress);
        }

        if (walletAddress) {
          const networkId = await window.ethereum.request({
            method: "net_version",
          });
          console.log("Network ID:", networkId);
        }
        setNetworkId(networkId);
        if (walletAddress) {
        }
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        console.log("Chain ID:", chainId);
        // hex to dec
        const chainIdDec = parseInt(chainId, 16);
        console.log("Chain ID (dec):", chainIdDec);

        setNetworkId(chainIdDec);
      } catch (err) {
        console.error("Failed to connect wallet", err);
      }
    } else {
      console.error("Please install MetaMask");
    }
  };

  React.useEffect(() => {
    // setInterval(() => {
    //   connectWallet();
    // }, 1000);
    connectWallet();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'Debt' as 'Debt' | 'Equity' | 'Fund',
    currency: 'USD',
    network: 'Sepolia',
    status: 'Active' as 'Active' | 'Paused' | 'Draft',
    totalSupply: 1000000,
    decimals: 18,
    description: '',
    tokenPrice: 0,
    tokenAddress: '',

  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToken(formData);
    // navigate('/tokens');
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalSupply" || name === "decimals" ? parseInt(value) : value,
    }));
  };

  const insertSTEntity = async (data: any) => {
    try {
      const response = await insertEntity([data]);
      return response;
    } catch (error) {}
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Token</h1>
            <p className="text-gray-600 mt-1">
              Configure your new security token
            </p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Mobius Token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="MOBIT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Debt">Debt</option>
                <option value="Equity">Equity</option>
                <option value="Fund">Fund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Price
              </label>
              <input
                type="number"
                name="tokenPrice"
                value={formData.tokenPrice}
                onChange={handleInputChange}
                min="0"
                max="18"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blockchain network
              </label>
              <select
                name="network"
                value={formData.network}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Mumbai">Sepolia</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Polygon">Polygon</option>
              </select>
            </div>

            <div> 
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decimals
              </label>
              <input
                type="number"
                name="decimals"
                value={formData.decimals}
                onChange={handleInputChange}
                min="0"
                max="18"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                Advanced settings
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You can either use the default configuration, or modify the
              settings
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Token ownership</p>
                    <p className="text-sm text-gray-600">
                      {walletAddress ? (
                        walletAddress
                      ) : (
                        <button onClick={connectWallet}>Connect Wallet</button>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Claims</p>
                    <p className="text-sm text-gray-600">Specific KYC status - Default</p>
                  </div>
                </div>
              </div> */}

              {/* {Claims} */}

              <div
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Claims</p>
                    <p className="text-sm text-gray-600">
                      Specific KYC status - Default
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropdown Content */}
              {showDropdown && (
                <div className="space-y-4">
                  {claims.map((claim, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Claim Name</p>
                          <p className="font-semibold text-gray-900">
                            {claim.name}
                          </p>
                        </div>
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClaim(index);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Trusted Claim Issuer
                        </p>
                        <p className="text-gray-800">{claim.issuer}</p>
                      </div>
                    </div>
                  ))}

                  {/* New Claim Dropdown - Only shows if there are available options */}
                  {getAvailableTopics().length > 0 && (
                    <div className="relative inline-block text-left ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClaimOptions(!showClaimOptions);
                        }}
                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:underline focus:outline-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Claim</span>
                      </button>

                      {showClaimOptions && (
                        <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            {getAvailableTopics().map((topic, index) => (
                              <button
                                key={index}
                                type="button"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addNewClaim(topic);
                                  setShowClaimOptions(false);
                                }}
                              >
                                {topic.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Compliance</p>
                    <p className="text-sm text-gray-600">No Rules - Default</p>
                  </div>
                </div>
              </div> */}

              {/* {Compliance} */}

              <div
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg cursor-pointer"
                onClick={() =>
                  setShowComplianceDropdown(!showComplianceDropdown)
                }
              >
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Compliance</p>
                    <p className="text-sm text-gray-600">
                      {Object.keys(modules).length === 0
                        ? "No Rules - Default"
                        : `${Object.keys(modules).length} Active Rules`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropdown Content */}
              {showComplianceDropdown && (
                <div className="space-y-4">
                  {Object.entries(modules).map(([moduleName, values]) => (
                    <div
                      key={moduleName}
                      className="p-4 border border-gray-200 rounded-lg bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Module Name</p>
                          <p className="font-semibold text-gray-900">
                            {moduleName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModule(moduleName);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      {moduleName === "CountryAllowModule" ||
                      moduleName === "CountryRestrictModule" ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Select a country
                            </label>
                            <select
                              onChange={(e) => {
                                const selectedCode = parseInt(e.target.value);
                                if (!selectedCode) return;

                                setModules((prev) => {
                                  const updated = { ...prev };
                                  if (!updated[moduleName])
                                    updated[moduleName] = [];
                                  if (
                                    !updated[moduleName].includes(selectedCode)
                                  )
                                    updated[moduleName].push(selectedCode);
                                  return updated;
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">-- Select Country --</option>
                              {countries.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Selected countries */}
                          {(modules[moduleName] || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {modules[moduleName].map((code) => {
                                const country = countries.find(
                                  (c) => c.code === code
                                );
                                return (
                                  <span
                                    key={code}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                                  >
                                    {country?.name || `Code ${code}`}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Render token input for other modules
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Parameters
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            {values.map((value, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) =>
                                    handleValueChange(
                                      moduleName,
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="w-20 px-2 py-1 border rounded text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Parameters</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {values.map((value, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="number"
                                value={value}
                                onChange={(e) =>
                                  handleValueChange(
                                    moduleName,
                                    index,
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                              {index === values.length - 1 && (
                                <span className="text-xs text-gray-500">
                                  {/* Tokens */}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* New Module Dropdown - Only shows if there are available options */}
                  {getAvailableModules().length > 0 && (
                    <div className="relative inline-block text-left ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModuleOptions(!showModuleOptions);
                        }}
                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:underline focus:outline-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Compliance Module</span>
                      </button>

                      {showModuleOptions && (
                        <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            {getAvailableModules().map((module, index) => (
                              <button
                                key={index}
                                type="button"
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addNewModule(module);
                                  setShowModuleOptions(false);
                                }}
                              >
                                {module.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Identity storage
                    </p>
                    <p className="text-sm text-gray-600">
                      Create new identity storage - Default
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              // onClick={() => navigate('/tokens')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              // className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={createToken}
            >
              {isLoading ? "Deploying..." : "Deploy Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TokenCreation;
