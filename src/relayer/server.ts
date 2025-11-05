import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import winston from 'winston';
import { RelayerController, RelayerConfig, RelayRequest } from './relayController';

class RelayerServer {
  private app: express.Application;
  private controller: RelayerController;
  private logger: winston.Logger;
  private config: RelayerConfig;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.app = express();
    this.logger = this.createLogger();
    this.controller = new RelayerController(config, this.logger);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Create logger instance
   */
  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'somi-sentinel-relayer' },
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
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
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

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const isConnected = await this.controller.testConnection();
        res.json({
          status: 'ok',
          connected: isConnected,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: 'Health check failed'
        });
      }
    });

    // Status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const status = await this.controller.getStatus();
        res.json(status);
      } catch (error) {
        this.logger.error('Error getting status', error);
        res.status(500).json({
          error: 'Failed to get status'
        });
      }
    });

    // Relay endpoint
    this.app.post('/relay',
      [
        body('proposal.vault').isEthereumAddress().withMessage('Invalid vault address'),
        body('proposal.actionType').isInt({ min: 0, max: 5 }).withMessage('Invalid action type'),
        body('proposal.params').isString().isLength({ min: 1 }).withMessage('Invalid params'),
        body('proposal.ipfsHash').isString().isLength({ min: 1 }).withMessage('Invalid IPFS hash'),
        body('proposal.nonce').isInt({ min: 0 }).withMessage('Invalid nonce'),
        body('proposal.deadline').isInt({ min: 1 }).withMessage('Invalid deadline'),
        body('signature').isString().isLength({ min: 1 }).withMessage('Invalid signature')
      ],
      async (req, res) => {
        try {
          // Check validation errors
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({
              success: false,
              error: 'Validation failed',
              details: errors.array()
            });
          }

          const request: RelayRequest = req.body;
          const result = await this.controller.relayProposal(request);

          if (result.success) {
            res.json(result);
          } else {
            res.status(400).json(result);
          }
        } catch (error) {
          this.logger.error('Error processing relay request', error);
          res.status(500).json({
            success: false,
            error: 'Internal server error'
          });
        }
      }
    );

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found'
      });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Test connection before starting
      const isConnected = await this.controller.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to blockchain');
      }

      this.app.listen(this.config.port, () => {
        this.logger.info(`Relayer server started on port ${this.config.port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start server', error);
      throw error;
    }
  }

  /**
   * Get the Express app (for testing)
   */
  getApp(): express.Application {
    return this.app;
  }
}

// Main execution
async function main() {
  const config: RelayerConfig = {
    rpcUrl: process.env.SOMNIA_RPC || 'https://rpc.testnet.somnia.network',
    chainId: parseInt(process.env.SOMNIA_CHAIN_ID || '1946'),
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '',
    executorAddress: process.env.EXECUTOR_ADDRESS || '',
    port: parseInt(process.env.PORT || '3001'),
    maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000', // 100 gwei
    maxGasLimit: parseInt(process.env.MAX_GAS_LIMIT || '500000'),
    timeout: parseInt(process.env.TIMEOUT || '300000'), // 5 minutes
    authToken: process.env.RELAYER_AUTH_TOKEN || 'somi-relay-secret',
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true'
  };

  // Validate required environment variables
  const requiredVars = ['RELAYER_PRIVATE_KEY', 'EXECUTOR_ADDRESS'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  }

  const server = new RelayerServer(config);

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
    await server.start();
  } catch (error) {
    console.error('Failed to start relayer server:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url.endsWith(process.argv[1]) || import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}

export { RelayerServer };
