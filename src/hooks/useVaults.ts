import { useState, useEffect } from 'react';

export interface Vault {
  id: string;
  name: string;
  address: string;
  balance: string;
  value: string;
  change24h: number;
  tokens: Array<{
    symbol: string;
    address: string;
    amount: string;
    value: number;
  }>;
  riskScore?: number;
  lastActivity?: string;
  policy?: {
    riskTolerance: number;
    maxTradePercent: number;
    emergencyThreshold: number;
    allowedDex: string[];
    isActive: boolean;
  };
  recentExecutions?: Array<{
    id: string;
    action: string;
    timestamp: string;
    txHash: string;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useVaults = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/vaults`);
      if (!response.ok) {
        throw new Error(`Failed to fetch vaults: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVaults(data);
    } catch (err) {
      console.error('Error fetching vaults:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vaults');
      
      // Fallback to real contract data if API fails
      const realVaults = [
        {
          id: '1',
          name: 'SOMI Sentinel Vault',
          address: '0x94C5661Ff1D5D914C01248baC4B348Fd03023FEB',
          balance: '0.0',
          value: '0.00',
          change24h: 0.0,
          riskScore: 0,
          lastActivity: 'Just deployed',
          tokens: [
            { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', amount: '0.0', value: 0 },
            { symbol: 'USDC', address: '0x0000000000000000000000000000000000000001', amount: '0.0', value: 0 },
            { symbol: 'WBTC', address: '0x0000000000000000000000000000000000000002', amount: '0.0', value: 0 },
          ],
        },
      ];
      setVaults(realVaults);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, []);

  const addVault = (newVault: Vault) => {
    setVaults(prev => [...prev, newVault]);
  };

  const refreshVaults = () => {
    fetchVaults();
  };

  return { vaults, isLoading, error, addVault, refreshVaults };
};

export const useVault = (id: string) => {
  const [vault, setVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/vaults/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch vault: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVault(data);
      } catch (err) {
        console.error('Error fetching vault:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vault');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVault();
    }
  }, [id]);

  return { vault, isLoading, error };
};
