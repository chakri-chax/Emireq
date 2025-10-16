import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MarketHeader } from './components/MarketHeader';
import { Dashboard } from './pages/Dashboard';
import { Faucet } from './pages/Faucet';
import { dummyMarketData } from './lib/dummyData.ts';
import { supabase, MarketData, UserPosition } from './lib/supabase';
// @ts-ignore
import { useMetaMask } from './hooks/useMetaMask';
function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'faucet'>('dashboard');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(false);

  // Use the MetaMask hook
  const {
    connectedAddress,
    isConnected,
    error: walletError,
    handleConnect,
    handleDisconnect,
    formatAddress,
    isMetaMaskInstalled
  } = useMetaMask();

  useEffect(() => {
    loadMarketData();
  }, []);

  // Load user positions when wallet connects/disconnects
  useEffect(() => {
    loadUserPositions();
  }, [connectedAddress]);

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
    setMarketData(dummyMarketData);
    // try {
    //   // Try to load from Supabase first
    //   const { data, error } = await supabase
    //     .from('market_data')
    //     .select('*')
    //     .order('asset_symbol');
      
    //   if (data && !error) {
    //     setMarketData(data);
    //   } else {
    //     // Fallback to dummy data if Supabase fails
    //     console.log('Using dummy market data');
    //     setMarketData(dummyMarketData);
    //   }
    // } catch (error) {
    //   // Fallback to dummy data on error
    //   console.log('Error loading market data, using dummy data:', error);
    //   setMarketData(dummyMarketData);
    // } finally {
    //   setLoading(false);
    // }
  };


  const loadUserPositions = async () => {
    if (!connectedAddress) {
      setUserPositions([]);
      return;
    }

    const { data, error } = await supabase
      .from('user_positions')
      .select('*')
      .eq('user_address', connectedAddress.toLowerCase()); // Ensure case consistency

    if (data && !error) {
      setUserPositions(data);
    }
  };

  const handleSupply = async (symbol: string, amount: number, enableCollateral: boolean) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

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
          user_address: connectedAddress.toLowerCase(),
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
      user_address: connectedAddress.toLowerCase(),
      transaction_type: 'supply',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleBorrow = async (symbol: string, amount: number) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

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
          user_address: connectedAddress.toLowerCase(),
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
      user_address: connectedAddress.toLowerCase(),
      transaction_type: 'borrow',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleWithdraw = async (symbol: string, amount: number) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

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
      user_address: connectedAddress.toLowerCase(),
      transaction_type: 'withdraw',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleRepay = async (symbol: string, amount: number) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

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
      user_address: connectedAddress.toLowerCase(),
      transaction_type: 'repay',
      asset_symbol: symbol,
      amount,
      status: 'confirmed',
      tx_hash: `0x${Math.random().toString(16).slice(2)}`,
    });
  };

  const handleToggleCollateral = async (positionId: string) => {
    if (!connectedAddress) {
      alert('Please connect your wallet first');
      return;
    }

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
      <Header
        connectedAddress={connectedAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        formatAddress={formatAddress}
        walletError={walletError}
        isMetaMaskInstalled={isMetaMaskInstalled}
      />
      {currentPage === 'dashboard' && (
        <>
          <MarketHeader
            netWorth={calculateNetWorth()}
            netApy={0.01}
            availableRewards={0}
            isConnected={isConnected}
          />
          <Dashboard
            marketData={marketData}
            userPositions={userPositions}
            onSupply={handleSupply}
            onBorrow={handleBorrow}
            onWithdraw={handleWithdraw}
            onRepay={handleRepay}
            onToggleCollateral={handleToggleCollateral}
            isConnected={isConnected}
          />
        </>
      )}
      {currentPage === 'faucet' && (
        <Faucet
          assets={marketData}
          onClaim={handleFaucetClaim}
          isConnected={isConnected}
        />
      )}
    </div>
  );
}

export default App;