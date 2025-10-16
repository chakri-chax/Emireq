// src/lib/dummyData.ts
import { MarketData } from './supabase';

export const dummyMarketData: MarketData[] = [
  {
    id: '1',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    supply_apy: 0.0245, // 2.45%
    borrow_apy_variable: 0.0345, // 3.45%
    borrow_apy_stable: 0.0289, // 2.89%
    total_supplied: 125000000,
    total_borrowed: 75000000,
    utilization_rate: 0.60, // 60%
    ltv: 0.82, // 82%
    liquidation_threshold: 0.85, // 85%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    asset_symbol: 'USDC',
    asset_name: 'USD Coin',
    supply_apy: 0.0189, // 1.89%
    borrow_apy_variable: 0.0295, // 2.95%
    borrow_apy_stable: 0.0245, // 2.45%
    total_supplied: 89000000,
    total_borrowed: 45000000,
    utilization_rate: 0.51, // 51%
    ltv: 0.89, // 89%
    liquidation_threshold: 0.92, // 92%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    asset_symbol: 'WBTC',
    asset_name: 'Wrapped Bitcoin',
    supply_apy: 0.0156, // 1.56%
    borrow_apy_variable: 0.0267, // 2.67%
    borrow_apy_stable: 0.0218, // 2.18%
    total_supplied: 45000000,
    total_borrowed: 22000000,
    utilization_rate: 0.49, // 49%
    ltv: 0.78, // 78%
    liquidation_threshold: 0.82, // 82%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    asset_symbol: 'DAI',
    asset_name: 'Dai Stablecoin',
    supply_apy: 0.0201, // 2.01%
    borrow_apy_variable: 0.0312, // 3.12%
    borrow_apy_stable: 0.0267, // 2.67%
    total_supplied: 67000000,
    total_borrowed: 38000000,
    utilization_rate: 0.57, // 57%
    ltv: 0.87, // 87%
    liquidation_threshold: 0.90, // 90%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    asset_symbol: 'LINK',
    asset_name: 'Chainlink',
    supply_apy: 0.0123, // 1.23%
    borrow_apy_variable: 0.0234, // 2.34%
    borrow_apy_stable: 0.0189, // 1.89%
    total_supplied: 28000000,
    total_borrowed: 15000000,
    utilization_rate: 0.54, // 54%
    ltv: 0.65, // 65%
    liquidation_threshold: 0.75, // 75%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    asset_symbol: 'UNI',
    asset_name: 'Uniswap',
    supply_apy: 0.0089, // 0.89%
    borrow_apy_variable: 0.0198, // 1.98%
    borrow_apy_stable: 0.0156, // 1.56%
    total_supplied: 19000000,
    total_borrowed: 8500000,
    utilization_rate: 0.45, // 45%
    ltv: 0.62, // 62%
    liquidation_threshold: 0.72, // 72%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '7',
    asset_symbol: 'AAVE',
    asset_name: 'Aave Token',
    supply_apy: 0.0056, // 0.56%
    borrow_apy_variable: 0.0167, // 1.67%
    borrow_apy_stable: 0.0123, // 1.23%
    total_supplied: 15000000,
    total_borrowed: 6000000,
    utilization_rate: 0.40, // 40%
    ltv: 0.58, // 58%
    liquidation_threshold: 0.68, // 68%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '8',
    asset_symbol: 'MATIC',
    asset_name: 'Polygon',
    supply_apy: 0.0145, // 1.45%
    borrow_apy_variable: 0.0256, // 2.56%
    borrow_apy_stable: 0.0201, // 2.01%
    total_supplied: 32000000,
    total_borrowed: 18000000,
    utilization_rate: 0.56, // 56%
    ltv: 0.70, // 70%
    liquidation_threshold: 0.80, // 80%
    can_be_collateral: true,
    updated_at: new Date().toISOString()
  }
];