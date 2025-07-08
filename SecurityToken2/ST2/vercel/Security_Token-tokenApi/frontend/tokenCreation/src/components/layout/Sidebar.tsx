import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Coins, 
  Plus, 
  Settings, 
  Users, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Shield,
  Building2
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tokens', href: '/tokens', icon: Coins },
  { name: 'Token Creation', href: '/token-creation', icon: Plus },
  // { name: 'Token Actions', href: '/token-actions', icon: Settings },
  { name: 'Investors', href: '/investors', icon: Users },
  { name: 'Primary Market', href: '/primary-market', icon: TrendingUp },
  { name: 'Secondary Market', href: '/secondary-market', icon: BarChart3 },
  { name: 'Transactions', href: '/transactions', icon: FileText },
  { name: 'Documents', href: '/documents', icon: Shield },
  { name: 'Token Management', href: '/token-management', icon: Building2 }
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold">MOBIUS</h1>
            <p className="text-sm text-gray-400">Servicing</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;