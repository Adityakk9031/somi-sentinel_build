import { useState, useEffect } from 'react';
import { policiesMockData } from '@/mocks/policies';

export interface Policy {
  id: string;
  vaultId: string;
  vaultName: string;
  riskTolerance: number;
  allowedDex: string[];
  maxTradePercent: number;
  emergencyThreshold: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export const usePolicies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPolicies(policiesMockData);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const savePolicy = async (policy: Partial<Policy>) => {
    // Mock save
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Policy saved:', policy);
        resolve(policy);
      }, 1000);
    });
  };

  return { policies, isLoading, savePolicy };
};
