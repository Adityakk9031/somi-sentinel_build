import { ethers } from 'ethers';
import { MarketSignal, VaultData, PolicyData, Logger } from './types';

export class Collector {
  private provider: ethers.providers.JsonRpcProvider;
  private logger: Logger;
  private signals: MarketSignal[] = [];

  constructor(rpcUrl: string, logger: Logger) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.logger = logger;
  }

  /**
   * Collect market signals from various sources
   */
  async collectSignals(): Promise<MarketSignal[]> {
    this.logger.info('Collecting market signals...');
    
    try {
      // Collect price change signals
      const priceSignals = await this.collectPriceSignals();
      
      // Collect volume spike signals
      const volumeSignals = await this.collectVolumeSignals();
      
      // Collect oracle drift signals
      const oracleSignals = await this.collectOracleSignals();
      
      // Collect liquidity change signals
      const liquiditySignals = await this.collectLiquiditySignals();
      
      const allSignals = [
        ...priceSignals,
        ...volumeSignals,
        ...oracleSignals,
        ...liquiditySignals
      ];
      
      this.signals = allSignals;
      this.logger.info(`Collected ${allSignals.length} market signals`);
      
      return allSignals;
    } catch (error) {
      this.logger.error('Error collecting signals:', error);
      throw error;
    }
  }

  /**
   * Collect price change signals
   */
  private async collectPriceSignals(): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      // Mock price data - in production, this would come from price oracles
      const tokens = ['ETH', 'USDC', 'WBTC', 'LINK'];
      
      for (const token of tokens) {
        // Simulate price changes
        const priceChange = (Math.random() - 0.5) * 10; // -5% to +5%
        const severity = this.getSeverityFromChange(Math.abs(priceChange));
        
        if (severity !== 'low') {
          signals.push({
            type: 'price_change',
            severity,
            token,
            value: priceChange,
            threshold: 2.0, // 2% threshold
            timestamp: Date.now(),
            source: 'price_oracle'
          });
        }
      }
    } catch (error) {
      this.logger.error('Error collecting price signals:', error);
    }
    
    return signals;
  }

  /**
   * Collect volume spike signals
   */
  private async collectVolumeSignals(): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      // Mock volume data
      const tokens = ['ETH', 'USDC', 'WBTC'];
      
      for (const token of tokens) {
        const volumeChange = Math.random() * 200; // 0% to 200%
        const severity = this.getSeverityFromChange(volumeChange);
        
        if (severity !== 'low') {
          signals.push({
            type: 'volume_spike',
            severity,
            token,
            value: volumeChange,
            threshold: 50.0, // 50% threshold
            timestamp: Date.now(),
            source: 'dex_analytics'
          });
        }
      }
    } catch (error) {
      this.logger.error('Error collecting volume signals:', error);
    }
    
    return signals;
  }

  /**
   * Collect oracle drift signals
   */
  private async collectOracleSignals(): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      // Mock oracle drift detection
      const pairs = ['ETH/USDC', 'WBTC/USDC', 'LINK/USDC'];
      
      for (const pair of pairs) {
        const drift = Math.random() * 3; // 0% to 3% drift
        const severity = this.getSeverityFromChange(drift);
        
        if (severity !== 'low') {
          signals.push({
            type: 'oracle_drift',
            severity,
            token: pair,
            value: drift,
            threshold: 0.5, // 0.5% threshold
            timestamp: Date.now(),
            source: 'oracle_comparison'
          });
        }
      }
    } catch (error) {
      this.logger.error('Error collecting oracle signals:', error);
    }
    
    return signals;
  }

  /**
   * Collect liquidity change signals
   */
  private async collectLiquiditySignals(): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      // Mock liquidity data
      const pools = ['ETH/USDC', 'WBTC/USDC'];
      
      for (const pool of pools) {
        const liquidityChange = (Math.random() - 0.5) * 20; // -10% to +10%
        const severity = this.getSeverityFromChange(Math.abs(liquidityChange));
        
        if (severity !== 'low') {
          signals.push({
            type: 'liquidity_change',
            severity,
            token: pool,
            value: liquidityChange,
            threshold: 5.0, // 5% threshold
            timestamp: Date.now(),
            source: 'pool_analytics'
          });
        }
      }
    } catch (error) {
      this.logger.error('Error collecting liquidity signals:', error);
    }
    
    return signals;
  }

  /**
   * Get severity level from change value
   */
  private getSeverityFromChange(change: number): 'low' | 'medium' | 'high' | 'critical' {
    if (change >= 10) return 'critical';
    if (change >= 5) return 'high';
    if (change >= 2) return 'medium';
    return 'low';
  }

  /**
   * Get vault data from blockchain
   */
  async getVaultData(vaultAddress: string): Promise<VaultData> {
    try {
      // Mock vault data - in production, this would read from contracts
      return {
        id: vaultAddress,
        address: vaultAddress,
        balance: '1000',
        value: '50000',
        tokens: [
          {
            symbol: 'ETH',
            address: '0x0000000000000000000000000000000000000000',
            amount: '10',
            value: '20000',
            price: 2000
          },
          {
            symbol: 'USDC',
            address: '0x0000000000000000000000000000000000000001',
            amount: '30000',
            value: '30000',
            price: 1
          }
        ],
        riskScore: 35,
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting vault data:', error);
      throw error;
    }
  }

  /**
   * Get policy data for a vault
   */
  async getPolicyData(vaultAddress: string): Promise<PolicyData> {
    try {
      // Mock policy data - in production, this would read from PolicyManager contract
      return {
        vaultId: vaultAddress,
        riskTolerance: 50,
        maxTradePercent: 10,
        emergencyThreshold: 90,
        allowedDex: [
          '0x1111111111111111111111111111111111111111', // Uniswap V3
          '0x2222222222222222222222222222222222222222'  // Curve
        ],
        isActive: true
      };
    } catch (error) {
      this.logger.error('Error getting policy data:', error);
      throw error;
    }
  }

  /**
   * Get recent signals
   */
  getRecentSignals(limit: number = 10): MarketSignal[] {
    return this.signals
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get signals by severity
   */
  getSignalsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): MarketSignal[] {
    return this.signals.filter(signal => signal.severity === severity);
  }

  /**
   * Clear old signals
   */
  clearOldSignals(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.signals = this.signals.filter(signal => signal.timestamp > cutoff);
  }
}
