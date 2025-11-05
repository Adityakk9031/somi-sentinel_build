import 'dotenv/config';
import { ethers } from 'ethers';
import winston from 'winston';
import express from 'express';
import cors from 'cors';
import { Collector } from './collector';
import { Simulator } from './simulator';
import { GeminiClient } from './gemini-client';
import { Signer } from './signer';
import { Uploader } from './uploader';
import { AgentConfig, MarketSignal, ExecutionReport, Logger } from './types';

class Agent {
  private config: AgentConfig;
  private logger: Logger;
  private collector: Collector;
  private simulator: Simulator;
  private geminiClient: GeminiClient;
  private signer: Signer;
  private uploader: Uploader;
  private provider: ethers.providers.JsonRpcProvider;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private app: express.Application;
  private server: any;
  private activityLog: Array<{
    timestamp: string;
    type: string;
    data: any;
  }> = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.logger = this.createLogger();
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.collector = new Collector(config.rpcUrl, this.logger);
    this.simulator = new Simulator(this.logger);
    this.geminiClient = new GeminiClient(config.geminiApiKey, this.logger);
    this.signer = new Signer(config.agentPrivateKey, this.logger);
    this.uploader = new Uploader(config.nftStorageKey, this.logger);
    this.app = express();
    this.setupHttpServer();
  }

  /**
   * Setup HTTP server for status endpoints
   */
  private setupHttpServer(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        agent: {
          isRunning: this.isRunning,
          address: this.signer.getAgentAddress()
        }
      });
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      res.json(this.getStatus());
    });

    // Activity log endpoint - shows recent AI outputs
    this.app.get('/activity', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 50;
      res.json({
        status: 'ok',
        activity: this.activityLog.slice(-limit),
        totalEntries: this.activityLog.length
      });
    });

    // Start server
    const port = process.env.AGENT_PORT || 3002;
    this.server = this.app.listen(port, () => {
      this.logger.info(`Agent HTTP server started on port ${port}`);
    });
  }

  /**
   * Create logger instance
   */
  private createLogger(): Logger {
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'somi-sentinel-agent' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    return logger;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing SOMI Sentinel Agent...');

    try {
      // Test connections
      await this.testConnections();

      // Initialize components
      await this.collector.collectSignals();
      
      this.logger.info('Agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agent:', error);
      throw error;
    }
  }

  /**
   * Test all connections
   */
  private async testConnections(): Promise<void> {
    this.logger.info('Testing connections...');

    // Test RPC connection
    try {
      await this.provider.getBlockNumber();
      this.logger.info('RPC connection: OK');
    } catch (error) {
      this.logger.error('RPC connection failed:', error);
      throw error;
    }

    // Test Gemini connection
    const geminiOk = await this.geminiClient.testConnection();
    if (!geminiOk) {
      this.logger.error('Gemini connection failed');
      throw new Error('Gemini connection failed');
    }
    this.logger.info('Gemini connection: OK');

    // Test IPFS connection
    const ipfsOk = await this.uploader.testConnection();
    if (!ipfsOk) {
      this.logger.error('IPFS connection failed');
      throw new Error('IPFS connection failed');
    }
    this.logger.info('IPFS connection: OK');
  }

  /**
   * Start the agent main loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    this.logger.info('Starting SOMI Sentinel Agent...');
    this.isRunning = true;

    // Run immediately
    await this.runCycle();

    // Set up interval
    this.intervalId = setInterval(async () => {
      try {
        await this.runCycle();
      } catch (error) {
        this.logger.error('Error in agent cycle:', error);
      }
    }, this.config.pollingInterval);

    this.logger.info(`Agent started with ${this.config.pollingInterval}ms polling interval`);
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Agent is not running');
      return;
    }

    this.logger.info('Stopping SOMI Sentinel Agent...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.info('Agent stopped');
  }

  /**
   * Run one cycle of the agent
   */
  private async runCycle(): Promise<void> {
    this.logger.info('Running agent cycle...');

    try {
      // 1. Collect market signals
      this.logger.info('Collecting market signals...');
      const signals = await this.collector.collectSignals();
      this.logger.info(`Collected ${signals.length} market signals`);
      
      // Log activity
      this.addActivityLog('signals_collected', { 
        count: signals.length, 
        signals: signals.map(s => ({ type: s.type, severity: s.severity, value: s.value }))
      });

      // 2. Analyze signals and determine actions
      const actions = await this.analyzeSignals(signals);
      this.logger.info(`Determined ${actions.length} actions to take`);
      
      // Log activity
      this.addActivityLog('actions_determined', { count: actions.length });

      // 3. Process each action
      for (const action of actions) {
        await this.processAction(action);
      }

      // 4. Clean up old data
      this.collector.clearOldSignals();

      this.logger.info('Agent cycle completed');
    } catch (error) {
      this.logger.error('Error in agent cycle:', error);
      throw error;
    }
  }

  /**
   * Analyze signals and determine actions
   */
  private async analyzeSignals(signals: MarketSignal[]): Promise<any[]> {
    const actions: any[] = [];

    // Filter high-priority signals
    const highPrioritySignals = signals.filter(signal => 
      signal.severity === 'high' || signal.severity === 'critical'
    );

    for (const signal of highPrioritySignals) {
      // Determine action based on signal type
      if (signal.type === 'price_change' && signal.severity === 'critical') {
        actions.push({
          type: 'rebalance',
          signal,
          vault: this.config.vaultAddresses[0], // Use first vault for demo
          priority: 'high'
        });
      } else if (signal.type === 'oracle_drift' && signal.severity === 'high') {
        actions.push({
          type: 'hedge',
          signal,
          vault: this.config.vaultAddresses[0],
          priority: 'medium'
        });
      }
    }

    return actions;
  }

  /**
   * Process a single action
   */
  private async processAction(action: any): Promise<void> {
    this.logger.info(`Processing action: ${action.type}`);

    try {
      // 1. Simulate the action
      const simulation = await this.simulateAction(action);
      
      // 2. Generate rationale
      this.logger.info('AI generating rationale...');
      const rationale = await this.geminiClient.generateRationale(simulation);
      this.logger.info('AI rationale generated:', rationale);
      
      // Log AI output
      this.addActivityLog('ai_rationale_generated', {
        actionType: action.type,
        vault: action.vault,
        rationale: {
          summary: rationale.summary,
          confidence: rationale.confidence,
          riskFactors: rationale.riskFactors,
          recommendations: rationale.recommendations
        }
      });
      
      // 3. Upload report to IPFS
      const ipfsHash = await this.uploader.uploadReport({
        proposal: {
          vault: action.vault,
          actionType: 0, // Swap action
          params: JSON.stringify(action),
          ipfsHash: '',
          nonce: 0,
          deadline: 0
        },
        simulation,
        rationale,
        ipfsHash: '',
        signature: '',
        timestamp: Date.now()
      });

      // 4. Create and sign proposal
      const proposal = this.signer.createProposal(
        action.vault,
        0, // Swap action
        JSON.stringify(action),
        ipfsHash
      );

      const signature = await this.signer.signProposal(proposal);

      // 5. Send to relayer
      await this.sendToRelayer(proposal, signature);

      this.logger.info(`Action processed successfully: ${action.type}`);
    } catch (error) {
      this.logger.error(`Error processing action ${action.type}:`, error);
      throw error;
    }
  }

  /**
   * Simulate an action
   */
  private async simulateAction(action: any): Promise<any> {
    switch (action.type) {
      case 'rebalance':
        return await this.simulator.simulateSwap(
          'ETH',
          'USDC',
          1000,
          '0x1111111111111111111111111111111111111111'
        );
      case 'hedge':
        return await this.simulator.simulateLending(
          'USDC',
          5000,
          'Aave'
        );
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send proposal to relayer
   */
  private async sendToRelayer(proposal: any, signature: string): Promise<void> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add authentication token if configured
      if (this.config.relayerAuthToken) {
        headers['Authorization'] = `Bearer ${this.config.relayerAuthToken}`;
      }

      const response = await fetch(`${this.config.relayerUrl}/relay`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          proposal,
          signature
        })
      });

      if (!response.ok) {
        throw new Error(`Relayer request failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.info(`Proposal sent to relayer: ${result.txHash}`);
    } catch (error) {
      this.logger.error('Error sending to relayer:', error);
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping agent...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.server) {
      this.server.close();
    }
    
    this.logger.info('Agent stopped');
  }

  /**
   * Add activity log entry
   */
  private addActivityLog(type: string, data: any): void {
    this.activityLog.push({
      timestamp: new Date().toISOString(),
      type,
      data
    });
    
    // Keep only last 100 entries
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }
  }

  /**
   * Get agent status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      agentAddress: this.signer.getAgentAddress(),
      config: {
        rpcUrl: this.config.rpcUrl,
        chainId: this.config.chainId,
        executorAddress: this.config.executorAddress,
        vaultAddresses: this.config.vaultAddresses,
        pollingInterval: this.config.pollingInterval
      }
    };
  }
}

// Main execution
async function main() {
  const config: AgentConfig = {
    rpcUrl: process.env.SOMNIA_RPC || 'https://rpc.testnet.somnia.network',
    chainId: parseInt(process.env.SOMNIA_CHAIN_ID || '1946'),
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',
    executorAddress: process.env.EXECUTOR_ADDRESS || '',
    policyManagerAddress: process.env.POLICY_MANAGER_ADDRESS || '',
    vaultAddresses: (process.env.VAULT_ADDRESS || '').split(',').filter(addr => addr.trim()),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    nftStorageKey: process.env.NFT_STORAGE_KEY || '',
    relayerUrl: process.env.RELAYER_URL || 'http://localhost:3001',
    pollingInterval: parseInt(process.env.POLLING_INTERVAL || '60000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    timeout: parseInt(process.env.TIMEOUT || '30000'),
    reportDir: process.env.REPORT_DIR || './reports',
    agentName: process.env.AGENT_NAME || 'SOMI_SENTINEL_V1',
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    relayerAuthToken: process.env.RELAYER_AUTH_TOKEN || ''
  };

  // Validate required environment variables
  const requiredVars = ['AGENT_PRIVATE_KEY', 'GEMINI_API_KEY', 'NFT_STORAGE_KEY'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  }

  const agent = new Agent(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  try {
    await agent.initialize();
    await agent.start();
  } catch (error) {
    console.error('Failed to start agent:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url.endsWith(process.argv[1]) || import.meta.url.includes('index.ts')) {
  main().catch(console.error);
}

export { Agent };
