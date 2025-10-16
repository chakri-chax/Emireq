import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MarketHeader } from './components/MarketHeader';
import { Dashboard } from './pages/Dashboard';
import { Faucet } from './pages/Faucet';
import { supabase, MarketData, UserPosition } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'faucet'>('dashboard');
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
    loadUserPositions();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'faucet') {
        setCurrentPage('faucet');
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadMarketData = async () => {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('asset_symbol');

    if (data && !error) {
      setMarketData(data);
    }
    setLoading(false);
  };

  const loadUserPositions = async () => {
    if (!connectedAddress) return;

    const { data, error } = await supabase
      .from('user_positions')
      .select('*')
      .eq('user_address', connectedAddress);

    if (data && !error) {
      setUserPositions(data);
    }
  };

  const handleConnect = () => {
    const mockAddress = '0x31...3c20';
    setConnectedAddress(mockAddress);
  };

  const handleSupply = async (symbol: string, amount: number, enableCollateral: boolean) => {
    if (!connectedAddress) return;

    const asset = marketData.find((a) => a.asset_symbol === symbol);
    if (!asset) return;

    const existingPosition = userPositions.find(
      (p) => p.asset_symbol === symbol && p.position_type === 'supply'
    );

    if (existingPosition) {
      const { error } = await supabase
        .from('user_positions')
        .update({
          amount: existingPosition.amount + amount,
          is_collateral: enableCollateral,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    } else {
      const { error } = await supabase
        .from('user_positions')
        .insert({
          user_address: connectedAddress,
          asset_symbol: symbol,
          position_type: 'supply',
          amount,
          apy: asset.supply_apy,
          is_collateral: enableCollateral,
        });

      if (!error) {
        loadUserPositions();
      }
    }

    await supabase.from('transactions').insert({
      user_address: connectedAddress,
      transaction_type: 'supply',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleBorrow = async (symbol: string, amount: number) => {
    if (!connectedAddress) return;

    const asset = marketData.find((a) => a.asset_symbol === symbol);
    if (!asset) return;

    const existingPosition = userPositions.find(
      (p) => p.asset_symbol === symbol && p.position_type === 'borrow'
    );

    if (existingPosition) {
      const { error } = await supabase
        .from('user_positions')
        .update({
          amount: existingPosition.amount + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    } else {
      const { error } = await supabase
        .from('user_positions')
        .insert({
          user_address: connectedAddress,
          asset_symbol: symbol,
          position_type: 'borrow',
          amount,
          apy: asset.borrow_apy_variable,
          is_collateral: false,
        });

      if (!error) {
        loadUserPositions();
      }
    }

    await supabase.from('transactions').insert({
      user_address: connectedAddress,
      transaction_type: 'borrow',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleWithdraw = async (symbol: string, amount: number) => {
    if (!connectedAddress) return;

    const existingPosition = userPositions.find(
      (p) => p.asset_symbol === symbol && p.position_type === 'supply'
    );

    if (!existingPosition) return;

    const newAmount = existingPosition.amount - amount;

    if (newAmount <= 0) {
      const { error } = await supabase
        .from('user_positions')
        .delete()
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    } else {
      const { error } = await supabase
        .from('user_positions')
        .update({
          amount: newAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    }

    await supabase.from('transactions').insert({
      user_address: connectedAddress,
      transaction_type: 'withdraw',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleRepay = async (symbol: string, amount: number) => {
    if (!connectedAddress) return;

    const existingPosition = userPositions.find(
      (p) => p.asset_symbol === symbol && p.position_type === 'borrow'
    );

    if (!existingPosition) return;

    const newAmount = existingPosition.amount - amount;

    if (newAmount <= 0) {
      const { error } = await supabase
        .from('user_positions')
        .delete()
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    } else {
      const { error } = await supabase
        .from('user_positions')
        .update({
          amount: newAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);

      if (!error) {
        loadUserPositions();
      }
    }

    await supabase.from('transactions').insert({
      user_address: connectedAddress,
      transaction_type: 'repay',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleToggleCollateral = async (positionId: string) => {
    const position = userPositions.find((p) => p.id === positionId);
    if (!position) return;

    const { error } = await supabase
      .from('user_positions')
      .update({
        is_collateral: !position.is_collateral,
        updated_at: new Date().toISOString(),
      })
      .eq('id', positionId);

    if (!error) {
      loadUserPositions();
    }
  };

  const handleFaucetClaim = async (symbol: string) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

    alert(`Claimed 100 ${symbol} test tokens!`);
  };

  const calculateNetWorth = () => {
    const supplied = userPositions
      .filter((p) => p.position_type === 'supply')
      .reduce((sum, p) => sum + p.amount * 6000, 0);
    const borrowed = userPositions
      .filter((p) => p.position_type === 'borrow')
      .reduce((sum, p) => sum + p.amount * 138.6, 0);
    return supplied - borrowed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#16191f] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#16191f]">
      <Header connectedAddress={connectedAddress} onConnect={handleConnect} />
      {currentPage === 'dashboard' && (
        <>
          <MarketHeader
            netWorth={calculateNetWorth()}
            netApy={0.01}
            availableRewards={0}
          />
          <Dashboard
            marketData={marketData}
            userPositions={userPositions}
            onSupply={handleSupply}
            onBorrow={handleBorrow}
            onWithdraw={handleWithdraw}
            onRepay={handleRepay}
            onToggleCollateral={handleToggleCollateral}
          />
        </>
      )}
      {currentPage === 'faucet' && (
        <Faucet assets={marketData} onClaim={handleFaucetClaim} />
      )}
    </div>
  );
}

export default App;
