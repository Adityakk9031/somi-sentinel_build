import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import winston from 'winston';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import prisma from '../prisma/client.js';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vaults storage file
const VAULTS_FILE = path.join(__dirname, '../../data/vaults.json');

// Contract ABIs (simplified for demo)
const VAULT_ABI = [
  "function getBalance(address user, address token) external view returns (uint256)",
  "function getVaultBalance(address token) external view returns (uint256)",
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function executeAction(uint8 actionType, bytes calldata params) external",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
  "event ActionExecuted(address indexed executor, uint8 actionType, bytes params, uint256 timestamp)"
];

const POLICY_MANAGER_ABI = [
  "function getPolicy(address vault) external view returns (tuple(uint256 riskTolerance, uint256 maxTradePercent, uint256 emergencyThreshold, address[] allowedDex, bool isActive, uint256 createdAt, uint256 updatedAt))",
  "function hasActivePolicy(address vault) external view returns (bool)",
  "function validateAction(address vault, uint8 actionType, bytes calldata params) external view returns (bool isValid, string memory message)"
];

const EXECUTOR_ABI = [
  "function getNextNonce(address vault) external view returns (uint256)",
  "function isNonceUsed(uint256 nonce) external view returns (bool)",
  "function getProposalHash(address vault, uint8 actionType, bytes calldata params, bytes32 ipfsHash, uint256 nonce, uint256 deadline) external pure returns (bytes32)"
];

const AUDIT_LOG_ABI = [
  "function getExecution(bytes32 proposalHash) external view returns (tuple(address vault, address executor, uint8 actionType, bytes params, bytes32 proposalHash, bytes32 ipfsHash, uint256 timestamp, uint256 blockNumber, bool exists))",
  "function getVaultExecutions(address vault) external view returns (bytes32[])",
  "function getAllExecutions(uint256 offset, uint256 limit) external view returns (bytes32[])",
  "function totalExecutions() external view returns (uint256)"
];

class BackendAPI {
  private app: express.Application;
  private provider: ethers.providers.JsonRpcProvider;
  private logger: winston.Logger;
  private contracts: {
    vault: ethers.Contract;
    policyManager: ethers.Contract;
    executor: ethers.Contract;
    auditLog: ethers.Contract;
  };

  // Load stored vaults from file
  private async loadStoredVaults(): Promise<any[]> {
    try {
      await fs.access(VAULTS_FILE);
      const data = await fs.readFile(VAULTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.info('No existing vaults file found, creating new one');
      await this.saveStoredVaults([]);
      return [];
    }
  }

  // Save vaults to file
  private async saveStoredVaults(vaults: any[]): Promise<void> {
    try {
      const dir = path.dirname(VAULTS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(VAULTS_FILE, JSON.stringify(vaults, null, 2));
    } catch (error) {
      this.logger.error('Failed to save vaults file', error);
      throw error;
    }
  }

  constructor() {
    this.app = express();
    this.logger = this.createLogger();
    this.setupMiddleware();
    this.setupContracts();
    this.setupRoutes();
  }

  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'somi-sentinel-backend' },
      transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupContracts(): void {
    const rpcUrl = process.env.SOMNIA_RPC || 'https://rpc.testnet.somnia.network';
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Contract addresses from environment
    const vaultAddress = process.env.VAULT_ADDRESS;
    const policyManagerAddress = process.env.POLICY_MANAGER_ADDRESS;
    const executorAddress = process.env.EXECUTOR_ADDRESS;
    const auditLogAddress = process.env.AUDIT_LOG_ADDRESS;

    if (!vaultAddress || !policyManagerAddress || !executorAddress || !auditLogAddress) {
      throw new Error('Missing contract addresses in environment variables');
    }

    this.contracts = {
      vault: new ethers.Contract(vaultAddress, VAULT_ABI, this.provider),
      policyManager: new ethers.Contract(policyManagerAddress, POLICY_MANAGER_ABI, this.provider),
      executor: new ethers.Contract(executorAddress, EXECUTOR_ABI, this.provider),
      auditLog: new ethers.Contract(auditLogAddress, AUDIT_LOG_ABI, this.provider)
    };

    this.logger.info('Contracts initialized', {
      vault: vaultAddress,
      policyManager: policyManagerAddress,
      executor: executorAddress,
      auditLog: auditLogAddress
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const blockNumber = await this.provider.getBlockNumber();
        res.json({
          status: 'ok',
          blockNumber,
          timestamp: new Date().toISOString(),
          contracts: {
            vault: process.env.VAULT_ADDRESS,
            policyManager: process.env.POLICY_MANAGER_ADDRESS,
            executor: process.env.EXECUTOR_ADDRESS,
            auditLog: process.env.AUDIT_LOG_ADDRESS
          }
        });
      } catch (error) {
        this.logger.error('Health check failed', error);
        res.status(500).json({
          status: 'error',
          error: 'Health check failed'
        });
      }
    });

    // Get vault data
    this.app.get('/api/vaults/:id', async (req, res) => {
      try {
        const vaultId = req.params.id;
        const vaultAddress = process.env.VAULT_ADDRESS;

        if (!vaultAddress) {
          return res.status(500).json({ error: 'Vault address not configured' });
        }

        // Get vault balance for different tokens
        const mockTokens = [
          { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
          { address: '0x0000000000000000000000000000000000000001', symbol: 'USDC', decimals: 6 },
          { address: '0x0000000000000000000000000000000000000002', symbol: 'WBTC', decimals: 8 }
        ];

        const tokenBalances = [];
        for (const token of mockTokens) {
          try {
            // Check if this is ETH (address(0))
            if (token.address === '0x0000000000000000000000000000000000000000') {
              // For ETH, get the vault's native balance
              const balance = await this.provider.getBalance(this.contracts.vault.address);
              tokenBalances.push({
                symbol: token.symbol,
                address: token.address,
                amount: ethers.utils.formatEther(balance),
                value: parseFloat(ethers.utils.formatEther(balance)) * this.getTokenPrice(token.symbol)
              });
            } else {
              // For ERC20 tokens, check if the contract exists first
              const code = await this.provider.getCode(token.address);
              if (code === '0x') {
                // Contract doesn't exist, skip this token silently for demo mock tokens
                if (!token.address.startsWith('0x000000000000000000000000000000000000000')) {
                  this.logger.warn(`Token contract ${token.symbol} does not exist at ${token.address}`);
                }
                continue;
              }
              
              const balance = await this.contracts.vault.getVaultBalance(token.address);
              tokenBalances.push({
                symbol: token.symbol,
                address: token.address,
                amount: ethers.utils.formatUnits(balance, token.decimals),
                value: parseFloat(ethers.utils.formatUnits(balance, token.decimals)) * this.getTokenPrice(token.symbol)
              });
            }
          } catch (error) {
            this.logger.warn(`Failed to get balance for ${token.symbol}`, error);
          }
        }

        // Get policy data
        let policy = null;
        try {
          const policyData = await this.contracts.policyManager.getPolicy(vaultAddress);
          policy = {
            riskTolerance: policyData.riskTolerance.toNumber(),
            maxTradePercent: policyData.maxTradePercent.toNumber(),
            emergencyThreshold: policyData.emergencyThreshold.toNumber(),
            allowedDex: policyData.allowedDex,
            isActive: policyData.isActive
          };
        } catch (error) {
          this.logger.warn('Failed to get policy data', error);
        }

        // Get recent executions
        let recentExecutions = [];
        try {
          const executionHashes = await this.contracts.auditLog.getVaultExecutions(vaultAddress);
          const recentHashes = executionHashes.slice(-5); // Get last 5 executions

          for (const hash of recentHashes) {
            try {
              const execution = await this.contracts.auditLog.getExecution(hash);
              recentExecutions.push({
                id: hash,
                action: this.getActionName(execution.actionType),
                timestamp: new Date(execution.timestamp.toNumber() * 1000).toISOString(),
                txHash: hash
              });
            } catch (error) {
              this.logger.warn(`Failed to get execution ${hash}`, error);
            }
          }
        } catch (error) {
          this.logger.warn('Failed to get recent executions', error);
        }

        const vaultData = {
          id: vaultId,
          name: this.getVaultName(vaultId),
          address: vaultAddress,
          balance: tokenBalances.reduce((sum, token) => sum + parseFloat(token.amount), 0).toFixed(2),
          value: tokenBalances.reduce((sum, token) => sum + token.value, 0).toFixed(2),
          change24h: this.getRandomChange(),
          riskScore: this.getRandomRiskScore(),
          lastActivity: recentExecutions.length > 0 ? recentExecutions[0].timestamp : new Date().toISOString(),
          tokens: tokenBalances,
          policy,
          recentExecutions
        };

        res.json(vaultData);
      } catch (error) {
        this.logger.error('Error fetching vault data', error);
        res.status(500).json({ error: 'Failed to fetch vault data' });
      }
    });

    // Get proposal data
    this.app.get('/api/proposals/:id', async (req, res) => {
      try {
        const proposalId = req.params.id;
        
        // Try to get execution data from contract
        let executionData = null;
        try {
          executionData = await this.contracts.auditLog.getExecution(proposalId);
        } catch (error) {
          this.logger.warn(`Proposal ${proposalId} not found in contract`);
        }

        if (executionData && executionData.exists) {
          const proposal = {
            id: proposalId,
            vault: executionData.vault,
            summary: this.getActionName(executionData.actionType),
            ipfs: executionData.ipfsHash,
            status: 'executed',
            createdAt: new Date(executionData.timestamp.toNumber() * 1000).toISOString(),
            executedAt: new Date(executionData.timestamp.toNumber() * 1000).toISOString(),
            txHash: proposalId,
            rationale: {
              summary: 'Action executed successfully',
              reasoning: 'Policy validation passed and signature verified',
              riskAssessment: 'Risk within acceptable limits',
              recommendation: 'Execute',
              confidence: 0.85
            },
            simulation: {
              expectedOutcome: 5000,
              priceImpact: 0.012,
              slippage: 0.005,
              riskScore: 35
            }
          };
          res.json(proposal);
        } else {
          // Return mock data for demo
          const proposal = {
            id: proposalId,
            vault: process.env.VAULT_ADDRESS,
            summary: 'Rebalance ETH position: Swap 2.5 ETH → USDC on Uniswap V3',
            ipfs: 'QmT4Zx8...3Np7',
            status: 'executed',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            executedAt: new Date(Date.now() - 3600000).toISOString(),
            gasUsed: 150000,
            gasPrice: '20000000000',
            txHash: proposalId,
            rationale: {
              summary: 'Market volatility detected. Oracle price deviation of 1.2% suggests potential downside.',
              reasoning: 'Recommend reducing exposure by 25% to maintain risk tolerance within policy limits.',
              riskAssessment: 'Medium risk due to market volatility and oracle drift.',
              recommendation: 'Execute rebalancing to reduce ETH exposure',
              confidence: 0.85
            },
            simulation: {
              expectedOutcome: 5000,
              priceImpact: 0.012,
              slippage: 0.005,
              riskScore: 35
            }
          };
          res.json(proposal);
        }
      } catch (error) {
        this.logger.error('Error fetching proposal data', error);
        res.status(500).json({ error: 'Failed to fetch proposal data' });
      }
    });

    // Get all vaults
    this.app.get('/api/vaults', async (req, res) => {
      try {
        const vaults = [];
        const vaultAddresses = (process.env.VAULT_ADDRESS || '').split(',').filter(addr => addr.trim());
        
        for (let i = 0; i < vaultAddresses.length; i++) {
          const vaultAddress = vaultAddresses[i];
          try {
            const response = await fetch(`${req.protocol}://${req.get('host')}/api/vaults/${i + 1}`);
            const vaultData = await response.json();
            vaults.push(vaultData);
          } catch (error) {
            this.logger.warn(`Failed to fetch vault ${i + 1}`, error);
          }
        }

        // Load vaults from Prisma database
        const dbVaults = await prisma.vault.findMany({
          include: {
            policies: {
              where: { active: true },
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        });

        // Merge stored vaults with deployed vaults (avoid duplicates)
        const deployedAddresses = new Set(vaults.map(v => v.address.toLowerCase()));
        for (const dbVault of dbVaults) {
          if (!deployedAddresses.has(dbVault.vaultAddress.toLowerCase())) {
            vaults.push({
              id: dbVault.id,
              name: dbVault.name || 'Untitled Vault',
              address: dbVault.vaultAddress,
              balance: '0.0',
              value: dbVault.totalValueUsd?.toString() || '0.00',
              change24h: 0,
              riskScore: (dbVault.policies[0]?.policyJson as any)?.riskTolerance || 50,
              lastActivity: dbVault.createdAt.toISOString(),
              tokens: Array.isArray(dbVault.supportedTokens) ? dbVault.supportedTokens : [],
              policy: dbVault.policies[0]?.policyJson || null,
            });
          }
        }

        res.json(vaults);
      } catch (error) {
        this.logger.error('Error fetching vaults', error);
        res.status(500).json({ error: 'Failed to fetch vaults' });
      }
    });

    // Create a new vault (POST)
    this.app.post('/api/vaults', async (req, res) => {
      try {
        const { name, description, riskTolerance, maxTradePercent, emergencyThreshold } = req.body;

        if (!name || !riskTolerance || !maxTradePercent || !emergencyThreshold) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate a mock vault address
        const vaultAddress = `0x${Date.now().toString(16).padStart(40, '0')}`;
        const owner = req.body.ownerWallet || '0x0000000000000000000000000000000000000000';

        // Create policy data
        const policyJson = {
          riskTolerance: riskTolerance === 'low' ? 25 : riskTolerance === 'medium' ? 50 : 75,
          maxTradePercent: parseInt(maxTradePercent),
          emergencyThreshold: parseInt(emergencyThreshold),
          allowedDex: ['0x1111111111111111111111111111111111111111'],
          maxSlippage: 0.5,
          minLiquidity: 10000,
          allowedTokens: ['ETH', 'USDC', 'WBTC'],
        };

        // Save to Prisma database
        const dbVault = await prisma.vault.create({
          data: {
            vaultAddress,
            ownerWallet: owner,
            name,
            description: description || '',
            totalValueUsd: 0,
            supportedTokens: [],
            onchainCreatedAt: new Date(),
          },
        });

        // Create policy
        await prisma.policy.create({
          data: {
            vaultAddress,
            policyJson,
            active: true,
            version: 1,
            setBy: owner,
          },
        });

        // Format response to match frontend expectations
        const newVault = {
          id: dbVault.id,
          name: dbVault.name,
          description: dbVault.description || '',
          address: dbVault.vaultAddress,
          balance: '0.0',
          value: '0.00',
          change24h: 0,
          riskScore: policyJson.riskTolerance,
          lastActivity: new Date().toISOString(),
          tokens: [],
          policy: {
            ...policyJson,
            isActive: true,
          },
        };

        this.logger.info(`Created new vault in database: ${dbVault.id} - ${dbVault.name}`);
        res.status(201).json(newVault);
      } catch (error: any) {
        this.logger.error('Error creating vault', error);
        res.status(500).json({ 
          error: 'Failed to create vault',
          details: error.message || String(error)
        });
      }
    });

    // Get all policies (GET)
    this.app.get('/api/policies', async (req, res) => {
      try {
        const vaultAddress = req.query.vaultAddress as string | undefined;
        
        const policies = await prisma.policy.findMany({
          where: vaultAddress ? { vaultAddress } : undefined,
          include: {
            vault: {
              select: {
                id: true,
                name: true,
                vaultAddress: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        res.json(policies);
      } catch (error: any) {
        this.logger.error('Error fetching policies', error);
        res.status(500).json({
          error: 'Failed to fetch policies',
          details: error.message || String(error)
        });
      }
    });

    // Create or update a policy (POST)
    this.app.post('/api/policies', async (req, res) => {
      try {
        const { vaultAddress, vaultId, riskTolerance, maxTradePercent, emergencyThreshold, allowedDex, setBy, deployedTx } = req.body;

        this.logger.info('Policy creation request received', {
          hasVaultAddress: !!vaultAddress,
          hasVaultId: !!vaultId,
          riskTolerance,
          maxTradePercent,
          emergencyThreshold,
          allowedDexType: typeof allowedDex
        });

        // Validate required fields - allow empty strings to be treated as missing
        const hasVaultIdentifier = (vaultAddress && vaultAddress.trim()) || (vaultId && vaultId.trim());
        const hasRiskTolerance = riskTolerance !== undefined && riskTolerance !== null;
        const hasMaxTradePercent = maxTradePercent !== undefined && maxTradePercent !== null && maxTradePercent !== '';
        const hasEmergencyThreshold = emergencyThreshold !== undefined && emergencyThreshold !== null && emergencyThreshold !== '';

        if (!hasVaultIdentifier || !hasRiskTolerance || !hasMaxTradePercent || !hasEmergencyThreshold) {
          const missing = [];
          if (!hasVaultIdentifier) missing.push('vaultAddress or vaultId');
          if (!hasRiskTolerance) missing.push('riskTolerance');
          if (!hasMaxTradePercent) missing.push('maxTradePercent');
          if (!hasEmergencyThreshold) missing.push('emergencyThreshold');
          
          this.logger.warn('Missing required fields for policy creation', { missing, body: req.body });
          return res.status(400).json({ 
            error: `Missing required fields: ${missing.join(', ')}`,
            details: req.body
          });
        }

        // Check if vault exists - support both vaultAddress and vaultId (UUID)
        let vault;
        if (vaultAddress) {
          vault = await prisma.vault.findUnique({
            where: { vaultAddress },
          });
        } else if (vaultId) {
          vault = await prisma.vault.findUnique({
            where: { id: vaultId },
          });
        }

        if (!vault) {
          return res.status(404).json({ error: `Vault not found. Please check that the vault exists in the database.` });
        }

        // Use the actual vault address from the database
        const actualVaultAddress = vault.vaultAddress;

        // Convert allowedDex array or object to array format
        let dexArray: string[] = [];
        if (Array.isArray(allowedDex)) {
          dexArray = allowedDex;
        } else if (typeof allowedDex === 'object' && allowedDex !== null) {
          // Handle object format like { "Uniswap V3": true, "Curve": false }
          dexArray = Object.entries(allowedDex)
            .filter(([_, isSelected]) => isSelected)
            .map(([dex, _]) => dex);
        }

        if (dexArray.length === 0) {
          return res.status(400).json({ error: 'At least one DEX must be selected' });
        }

        // Create policy data
        const policyJson = {
          riskTolerance: parseInt(riskTolerance),
          maxTradePercent: parseInt(maxTradePercent),
          emergencyThreshold: parseInt(emergencyThreshold),
          allowedDex: dexArray,
          maxSlippage: req.body.maxSlippage || 0.5,
          minLiquidity: req.body.minLiquidity || 10000,
          allowedTokens: req.body.allowedTokens || ['ETH', 'USDC', 'WBTC'],
        };

        // Check for existing active policy
        const existingPolicy = await prisma.policy.findFirst({
          where: {
            vaultAddress: actualVaultAddress,
            active: true,
          },
          orderBy: {
            version: 'desc',
          },
        });

        const nextVersion = existingPolicy ? existingPolicy.version + 1 : 1;

        // Deactivate old policy if exists
        if (existingPolicy) {
          await prisma.policy.update({
            where: { id: existingPolicy.id },
            data: { active: false, updatedAt: new Date() },
          });
        }

        // Create new policy
        const policy = await prisma.policy.create({
          data: {
            vaultAddress: actualVaultAddress,
            policyJson,
            active: true,
            version: nextVersion,
            setBy: setBy || vault.ownerWallet,
            deployedTx: deployedTx || null,
          },
        });

        this.logger.info(`Created new policy in database: ${policy.id} for vault ${actualVaultAddress}, version ${nextVersion}`);
        
        res.status(201).json({
          id: policy.id,
          vaultAddress: policy.vaultAddress,
          policy: policyJson,
          active: policy.active,
          version: policy.version,
          setBy: policy.setBy,
          deployedTx: policy.deployedTx,
          createdAt: policy.createdAt,
        });
      } catch (error: any) {
        this.logger.error('Error creating policy', error);
        res.status(500).json({
          error: 'Failed to create policy',
          details: error.message || String(error)
        });
      }
    });

    // Get agent status
    this.app.get('/api/agent/status', async (req, res) => {
      try {
        const agentUrl = process.env.AGENT_URL || 'http://localhost:3002';
        const response = await fetch(`${agentUrl}/status`);
        const agentStatus = await response.json();
        res.json(agentStatus);
      } catch (error) {
        this.logger.warn('Agent not available', error);
        res.json({
          isRunning: false,
          error: 'Agent service not available'
        });
      }
    });

    // Get relayer status
    this.app.get('/api/relayer/status', async (req, res) => {
      try {
        const relayerUrl = process.env.RELAYER_URL || 'http://localhost:3001';
        const response = await fetch(`${relayerUrl}/status`);
        const relayerStatus = await response.json();
        res.json(relayerStatus);
      } catch (error) {
        this.logger.warn('Relayer not available', error);
        res.json({
          error: 'Relayer service not available'
        });
      }
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found'
      });
    });
  }

  private getTokenPrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'ETH': 2000,
      'USDC': 1,
      'WBTC': 50000,
      'LINK': 15,
      'AAVE': 80
    };
    return prices[symbol] || 1;
  }

  private getVaultName(id: string): string {
    const names: { [key: string]: string } = {
      '1': 'DeFi Growth Vault',
      '2': 'Stablecoin Reserve',
      '3': 'High Yield Strategy'
    };
    return names[id] || `Vault ${id}`;
  }

  private getActionName(actionType: number): string {
    const actions: { [key: number]: string } = {
      0: 'Swap',
      1: 'Lend',
      2: 'Borrow',
      3: 'Add Liquidity',
      4: 'Remove Liquidity',
      5: 'Emergency Withdraw'
    };
    return actions[actionType] || 'Unknown Action';
  }

  private getRandomChange(): number {
    return (Math.random() - 0.5) * 10; // -5% to +5%
  }

  private getRandomRiskScore(): number {
    return Math.floor(Math.random() * 100);
  }

  async start(): Promise<void> {
    const port = parseInt(process.env.BACKEND_PORT || '3000');
    
    try {
      // Test contract connections
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.info(`Connected to blockchain at block ${blockNumber}`);

      this.app.listen(port, () => {
        this.logger.info(`Backend API server started on port ${port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start backend server', error);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Main execution
async function main() {
  const api = new BackendAPI();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  try {
    await api.start();
  } catch (error) {
    console.error('Failed to start backend API:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url.endsWith(process.argv[1]) || import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}

export { BackendAPI };
