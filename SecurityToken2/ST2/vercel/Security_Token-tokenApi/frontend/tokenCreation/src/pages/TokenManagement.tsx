import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Shield, 
  Globe, 
  Package, 
  ArrowRightLeft, 
  DollarSign,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Play,
  AlertCircle
} from 'lucide-react';

interface Module {
  name: string;
  values: any[];
  icon: React.ComponentType<any>;
  description: string;
  category: string;
  isActive: boolean;
}

interface Country {
  code: number;
  name: string;
}

const countries: Country[] = [
  { code: 840, name: "United States" },
  { code: 826, name: "United Kingdom" },
  { code: 276, name: "Germany" },
  { code: 250, name: "France" },
  { code: 392, name: "Japan" },
  { code: 156, name: "China" },
  { code: 124, name: "Canada" },
  { code: 36, name: "Australia" },
  { code: 380, name: "Italy" },
  { code: 724, name: "Spain" },
  { code: 528, name: "Netherlands" },
  { code: 756, name: "Switzerland" },
  { code: 752, name: "Sweden" },
  { code: 578, name: "Norway" },
  { code: 208, name: "Denmark" },
  { code: 246, name: "Finland" },
  { code: 40, name: "Austria" },
  { code: 56, name: "Belgium" },
  { code: 372, name: "Ireland" },
  { code: 620, name: "Portugal" }
];

const predefinedModules: Module[] = [
  { 
    name: "MaxBalanceModule", 
    values: [10000],
    icon: Package,
    description: "Set maximum balance limit per investor",
    category: "Supply Control",
    isActive: false
  },
  { 
    name: "SupplyLimitModule", 
    values: [1000000],
    icon: DollarSign,
    description: "Set total supply limit for the token",
    category: "Supply Control",
    isActive: false
  },
  { 
    name: "CountryAllowModule", 
    values: [],
    icon: Globe,
    description: "Allow token transfers only from specific countries",
    category: "Jurisdiction",
    isActive: false
  },
  { 
    name: "CountryRestrictModule", 
    values: [],
    icon: Shield,
    description: "Restrict token transfers from specific countries",
    category: "Jurisdiction",
    isActive: false
  },
  { 
    name: "TransferRestrictModule", 
    values: [],
    icon: ArrowRightLeft,
    description: "Set transfer limits and approval requirements",
    category: "Transfer Control",
    isActive: false
  }
];

export function TokenManagement() {
  const [modules, setModules] = useState<Record<string, any[]>>({
    MaxBalanceModule: [10000],
    SupplyLimitModule: [1000000],
    CountryAllowModule: [840, 826, 276] // US, UK, Germany
  });
  
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any[]>([]);
  const [showAddModule, setShowAddModule] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Supply Control": true,
    "Jurisdiction": true,
    "Transfer Control": true
  });

  const getAvailableModules = () => {
    const currentModuleNames = Object.keys(modules);
    return predefinedModules.filter(
      (module) => !currentModuleNames.includes(module.name)
    );
  };

  const addNewModule = (module: Module) => {
    setModules({
      ...modules,
      [module.name]: [...module.values],
    });
    setShowAddModule(false);
  };

  const removeModule = (moduleName: string) => {
    const newModules = { ...modules };
    delete newModules[moduleName];
    setModules(newModules);
  };

  const startEditing = (moduleName: string) => {
    setEditingModule(moduleName);
    setEditValues([...modules[moduleName]]);
  };

  const saveEditing = () => {
    if (editingModule) {
      setModules({
        ...modules,
        [editingModule]: [...editValues]
      });
      setEditingModule(null);
      setEditValues([]);
    }
  };

  const cancelEditing = () => {
    setEditingModule(null);
    setEditValues([]);
  };

  const addValue = () => {
    setEditValues([...editValues, ""]);
  };

  const updateValue = (index: number, value: any) => {
    const newValues = [...editValues];
    newValues[index] = value;
    setEditValues(newValues);
  };

  const removeValue = (index: number) => {
    const newValues = editValues.filter((_, i) => i !== index);
    setEditValues(newValues);
  };

  const getModuleConfig = (moduleName: string) => {
    return predefinedModules.find(m => m.name === moduleName);
  };

  const renderModuleValues = (moduleName: string, values: any[]) => {
    if (moduleName.includes("Country")) {
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((countryCode, index) => {
            const country = countries.find(c => c.code === countryCode);
            return (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {country ? country.name : `Code: ${countryCode}`}
              </span>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        ))}
      </div>
    );
  };

  const renderEditForm = (moduleName: string) => {
    if (moduleName.includes("Country")) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Configure Countries</h4>
            <div className="flex space-x-2">
              <button
                onClick={saveEditing}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {editValues.map((countryCode, index) => (
              <div key={index} className="flex items-center space-x-3">
                <select
                  value={countryCode}
                  onChange={(e) => updateValue(index, parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeValue(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <button
              onClick={addValue}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Country
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Configure Values</h4>
          <div className="flex space-x-2">
            <button
              onClick={saveEditing}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditing}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {editValues.map((value, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="number"
                value={value}
                onChange={(e) => updateValue(index, parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter value"
              />
              <button
                onClick={() => removeValue(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button
            onClick={addValue}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Value
          </button>
        </div>
      </div>
    );
  };

  const executeModuleFunction = (moduleName: string, functionName: string) => {
    console.log(`Executing ${functionName} on ${moduleName}`, modules[moduleName]);
    alert(`Executing ${functionName} on ${moduleName} with values: ${JSON.stringify(modules[moduleName])}`);
  };

  const getModuleFunctions = (moduleName: string) => {
    const functions: Record<string, string[]> = {
      MaxBalanceModule: ["setMaxBalance", "preSetModuleState", "batchPreSetModuleState"],
      SupplyLimitModule: ["setSupplyLimit"],
      CountryAllowModule: ["addAllowedCountry", "batchAllowCountries", "removeAllowedCountry", "batchDisallowCountries"],
      CountryRestrictModule: ["addCountryRestriction", "batchRestrictCountries", "removeCountryRestriction", "batchUnrestrictCountries"],
      TransferRestrictModule: ["allowUser", "batchAllowUsers", "disallowUser", "batchDisallowUsers"]
    };
    
    return functions[moduleName] || [];
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const groupedModules = Object.entries(modules).reduce((acc, [moduleName, values]) => {
    const config = getModuleConfig(moduleName);
    if (config) {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push({ name: moduleName, values, config });
    }
    return acc;
  }, {} as Record<string, Array<{ name: string; values: any[]; config: Module }>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            Configure compliance modules for your token. Add modules to enable specific compliance features.
          </span>
        </div>
        <button
          onClick={() => setShowAddModule(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </button>
      </div>

      {/* Active Modules */}
      <div className="space-y-4">
        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <div key={category} className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-medium text-gray-900">{category}</h3>
              {expandedCategories[category] ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedCategories[category] && (
              <div className="px-6 pb-6 space-y-4">
                {categoryModules.map(({ name: moduleName, values, config }) => {
                  const Icon = config.icon;
                  const isEditing = editingModule === moduleName;
                  const functions = getModuleFunctions(moduleName);
                  
                  return (
                    <div key={moduleName} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {moduleName.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                            
                            {!isEditing && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Configuration:</p>
                                {renderModuleValues(moduleName, values)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => startEditing(moduleName)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeModule(moduleName)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isEditing ? (
                        renderEditForm(moduleName)
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Available Smart Contract Functions:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {functions.map(func => (
                                <button
                                  key={func}
                                  onClick={() => executeModuleFunction(moduleName, func)}
                                  className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                  <Play className="w-3 h-3 mr-2" />
                                  {func}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowAddModule(false)} />
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add New Module</h2>
                <button
                  onClick={() => setShowAddModule(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {getAvailableModules().map((module) => {
                  const Icon = module.icon;
                  
                  return (
                    <div
                      key={module.name}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => addNewModule(module)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {module.name.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {module.category}
                          </span>
                        </div>
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
                
                {getAvailableModules().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>All available modules are already added</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}