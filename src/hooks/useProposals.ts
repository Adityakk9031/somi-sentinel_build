import { useState, useEffect } from 'react';

export interface Proposal {
  id: string;
  vault: string;
  summary: string;
  ipfs: string;
  status: 'pending' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
  gasUsed?: number;
  gasPrice?: string;
  txHash?: string;
  rationale: {
    summary: string;
    reasoning: string;
    riskAssessment: string;
    recommendation: string;
    confidence: number;
  };
  simulation: {
    expectedOutcome: number;
    priceImpact: number;
    slippage: number;
    riskScore: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/proposals/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch proposal: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProposal(data);
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch proposal');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id]);

  return { proposal, isLoading, error };
};

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For now, we'll generate some mock proposal IDs
        // In a real implementation, this would fetch from an endpoint that lists all proposals
        const mockProposalIds = [
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          '0x3456789012345678901234567890123456789012345678901234567890123456'
        ];

        const proposalPromises = mockProposalIds.map(id => 
          fetch(`${API_BASE_URL}/api/proposals/${id}`)
            .then(res => res.json())
            .catch(err => {
              console.warn(`Failed to fetch proposal ${id}:`, err);
              return null;
            })
        );

        const proposalData = await Promise.all(proposalPromises);
        const validProposals = proposalData.filter(p => p !== null);
        setProposals(validProposals);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, []);

  return { proposals, isLoading, error };
};
