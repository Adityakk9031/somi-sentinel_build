export interface VaultData {
  id: string;
  address: string;
  balance: string;
  value: string;
  tokens: TokenData[];
  riskScore: number;
  lastActivity: string;
}

export interface TokenData {
  symbol: string;
  address: string;
  amount: string;
  value: string;
  price: number;
}

export interface PolicyData {
  vaultId: string;
  riskTolerance: number;
  maxTradePercent: number;
  emergencyThreshold: number;
  allowedDex: string[];
  isActive: boolean;
}

export interface MarketSignal {
  type: 'price_change' | 'volume_spike' | 'oracle_drift' | 'liquidity_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  token: string;
  value: number;
  threshold: number;
  timestamp: number;
  source: string;
}

export interface Proposal {
  vault: string;
  actionType: number;
  params: string;
  ipfsHash: string;
  nonce: number;
  deadline: number;
}

export interface SimulationResult {
  actionType: number;
  params: string;
  expectedOutcome: number;
  priceImpact: number;
  slippage: number;
  gasEstimate: number;
  riskScore: number;
  confidence: number;
  timestamp: number;
}

export interface RationaleData {
  summary: string;
  reasoning: string;
  riskAssessment: string;
  recommendation: string;
  confidence: number;
  timestamp: number;
}

export interface ExecutionReport {
  proposal: Proposal;
  simulation: SimulationResult;
  rationale: RationaleData;
  ipfsHash: string;
  signature: string;
  timestamp: number;
}

export interface AgentConfig {
  rpcUrl: string;
  chainId: number;
  agentPrivateKey: string;
  executorAddress: string;
  policyManagerAddress: string;
  vaultAddresses: string[];
  geminiApiKey: string;
  nftStorageKey: string;
  relayerUrl: string;
  pollingInterval: number;
  maxRetries: number;
  timeout: number;
  reportDir: string;
  agentName: string;
  enableDebugLogs: boolean;
  relayerAuthToken: string;
}

export interface ContractAddresses {
  vault: string;
  policyManager: string;
  executor: string;
  auditLog: string;
  ammAdapter: string;
}

export enum ActionType {
  SWAP = 0,
  LEND = 1,
  BORROW = 2,
  ADD_LIQUIDITY = 3,
  REMOVE_LIQUIDITY = 4,
  EMERGENCY_WITHDRAW = 5
}

export enum RiskLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
