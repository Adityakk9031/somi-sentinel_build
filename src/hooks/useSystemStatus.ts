import { useState, useEffect } from 'react';

export interface AgentStatus {
  isRunning: boolean;
  agentAddress?: string;
  config?: {
    rpcUrl: string;
    chainId: number;
    executorAddress: string;
    vaultAddresses: string[];
    pollingInterval: number;
  };
  error?: string;
}

export interface RelayerStatus {
  address?: string;
  balance?: string;
  gasPrice?: string;
  blockNumber?: number;
  chainId?: number;
  executorAddress?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAgentStatus = () => {
  const [status, setStatus] = useState<AgentStatus>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/agent/status`);
        if (!response.ok) {
          throw new Error(`Failed to fetch agent status: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('Error fetching agent status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch agent status');
        setStatus({ isRunning: false, error: 'Agent service not available' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchAgentStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { status, isLoading, error };
};

export const useRelayerStatus = () => {
  const [status, setStatus] = useState<RelayerStatus>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelayerStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/relayer/status`);
        if (!response.ok) {
          throw new Error(`Failed to fetch relayer status: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('Error fetching relayer status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch relayer status');
        setStatus({ error: 'Relayer service not available' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelayerStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchRelayerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { status, isLoading, error };
};

export const useSystemStatus = () => {
  const agentStatus = useAgentStatus();
  const relayerStatus = useRelayerStatus();
  
  const isSystemHealthy = agentStatus.status.isRunning && !relayerStatus.status.error;
  
  return {
    isSystemHealthy,
    agent: agentStatus,
    relayer: relayerStatus,
    isLoading: agentStatus.isLoading || relayerStatus.isLoading
  };
};
