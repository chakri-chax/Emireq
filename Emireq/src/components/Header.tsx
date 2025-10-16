import { Settings } from 'lucide-react';

interface HeaderProps {
  connectedAddress?: string;
  onConnect: () => void;
}

export function Header({ connectedAddress, onConnect }: HeaderProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-[#1c1f2e] border-b border-gray-800 px-6 py-3">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-white font-semibold text-lg">aave</span>
            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded-full border border-pink-500/30">
              TESTNET
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
              Dashboard
            </a>
            <a href="#markets" className="text-white border-b-2 border-blue-500 pb-1 text-sm">
              Markets
            </a>
            <a href="#governance" className="text-gray-400 hover:text-white transition-colors text-sm">
              Governance
            </a>
            <a href="#faucet" className="text-gray-400 hover:text-white transition-colors text-sm">
              Faucet
            </a>
            <a href="#savings" className="text-gray-400 hover:text-white transition-colors text-sm">
              Savings
            </a>
            <a href="#staking" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
              Staking
              <span className="text-xs">▼</span>
            </a>
            <a href="#more" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
              More
              <span className="text-xs">•••</span>
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2">
            Bridge GHO
            <span className="text-xs">⚙</span>
          </button>
          <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2">
            Swap
            <span className="text-xs">↗</span>
          </button>
          {connectedAddress ? (
            <button className="px-4 py-1.5 bg-[#2a2d3f] hover:bg-[#33364a] text-white text-sm rounded-lg transition-colors flex items-center gap-2 border border-gray-700">
              <span className="text-xs">🦊</span>
              {formatAddress(connectedAddress)}
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          )}
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
