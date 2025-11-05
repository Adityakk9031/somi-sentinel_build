import { ethers } from 'ethers';
import winston from 'winston';

export interface RelayerConfig {
  rpcUrl: string;
  chainId: number;
  relayerPrivateKey: string;
  executorAddress: string;
  port: number;
  maxGasPrice: string;
  maxGasLimit: number;
  timeout: number;
  authToken: string;
  enableDebugLogs: boolean;
}

export interface RelayRequest {
  proposal: {
    vault: string;
    actionType: number;
    params: string;
    ipfsHash: string;
    nonce: number;
    deadline: number;
  };
  signature: string;
}

export interface RelayResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: number;
  gasPrice?: string;
}

export class RelayerController {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private executor: ethers.Contract;
  private logger: winston.Logger;
  private config: RelayerConfig;

  constructor(config: RelayerConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.relayerPrivateKey, this.provider);
    
    // Load Executor contract ABI (simplified for demo)
    const executorABI = [
      "function executeProposal(address vault, uint8 actionType, bytes calldata params, bytes32 ipfsHash, uint256 nonce, uint256 deadline, bytes calldata signature) external",
      "function getProposalHash(address vault, uint8 actionType, bytes calldata params, bytes32 ipfsHash, uint256 nonce, uint256 deadline) external pure returns (bytes32)",
      "function isNonceUsed(uint256 nonce) external view returns (bool)"
    ];
    
    this.executor = new ethers.Contract(config.executorAddress, executorABI, this.wallet);
  }

  /**
   * Relay a proposal to the executor contract
   */
  async relayProposal(request: RelayRequest): Promise<RelayResponse> {
    this.logger.info('Processing relay request', { 
      vault: request.proposal.vault,
      actionType: request.proposal.actionType,
      nonce: request.proposal.nonce
    });

    try {
      // Validate the request
      const validation = await this.validateRequest(request);
      if (!validation.valid) {
        this.logger.warn('Invalid relay request', { error: validation.error });
        return {
          success: false,
          error: validation.error
        };
      }

      // Check gas price
      const gasPrice = await this.provider.getGasPrice();
      if (gasPrice.gt(this.config.maxGasPrice)) {
        this.logger.warn('Gas price too high', { 
          current: gasPrice.toString(),
          max: this.config.maxGasPrice
        });
        return {
          success: false,
          error: 'Gas price too high'
        };
      }

      // Estimate gas
      const gasEstimate = await this.estimateGas(request);
      if (gasEstimate.gt(this.config.maxGasLimit)) {
        this.logger.warn('Gas limit too high', { 
          estimate: gasEstimate.toString(),
          max: this.config.maxGasLimit
        });
        return {
          success: false,
          error: 'Gas limit too high'
        };
      }

      // Execute the transaction
      const tx = await this.executeTransaction(request, gasEstimate);
      
      this.logger.info('Transaction submitted', { txHash: tx.hash });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      this.logger.info('Transaction confirmed', { 
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status
      });

      return {
        success: true,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toNumber(),
        gasPrice: gasPrice.toString()
      };

    } catch (error) {
      this.logger.error('Error relaying proposal', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate a relay request
   */
  private async validateRequest(request: RelayRequest): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check basic structure
      if (!request.proposal || !request.signature) {
        return { valid: false, error: 'Missing proposal or signature' };
      }

      const { proposal } = request;

      // Validate vault address
      if (!ethers.utils.isAddress(proposal.vault)) {
        return { valid: false, error: 'Invalid vault address' };
      }

      // Validate action type
      if (proposal.actionType < 0 || proposal.actionType > 5) {
        return { valid: false, error: 'Invalid action type' };
      }

      // Validate params
      if (!proposal.params || proposal.params.length === 0) {
        return { valid: false, error: 'Invalid params' };
      }

      // Validate IPFS hash
      if (!proposal.ipfsHash || proposal.ipfsHash.length !== 66) {
        return { valid: false, error: 'Invalid IPFS hash' };
      }

      // Validate nonce
      if (proposal.nonce < 0) {
        return { valid: false, error: 'Invalid nonce' };
      }

      // Validate deadline
      const now = Math.floor(Date.now() / 1000);
      if (proposal.deadline <= now) {
        return { valid: false, error: 'Deadline has passed' };
      }

      // Check if nonce has been used
      const nonceUsed = await this.executor.isNonceUsed(proposal.nonce);
      if (nonceUsed) {
        return { valid: false, error: 'Nonce already used' };
      }

      // Verify signature
      const proposalHash = await this.executor.getProposalHash(
        proposal.vault,
        proposal.actionType,
        proposal.params,
        proposal.ipfsHash,
        proposal.nonce,
        proposal.deadline
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ['string', 'bytes32'],
          ['\x19Ethereum Signed Message:\n32', proposalHash]
        )
      );

      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(messageHash),
        request.signature
      );

      // In production, you would check if recoveredAddress matches the expected agent signer
      if (!recoveredAddress) {
        return { valid: false, error: 'Invalid signature' };
      }

      return { valid: true };

    } catch (error) {
      this.logger.error('Error validating request', error);
      return { valid: false, error: 'Validation error' };
    }
  }

  /**
   * Estimate gas for the transaction
   */
  private async estimateGas(request: RelayRequest): Promise<ethers.BigNumber> {
    try {
      const { proposal } = request;
      
      const gasEstimate = await this.executor.estimateGas.executeProposal(
        proposal.vault,
        proposal.actionType,
        proposal.params,
        proposal.ipfsHash,
        proposal.nonce,
        proposal.deadline,
        request.signature
      );

      // Add 20% buffer
      return gasEstimate.mul(120).div(100);
    } catch (error) {
      this.logger.error('Error estimating gas', error);
      // Return a default gas limit if estimation fails
      return ethers.BigNumber.from(300000);
    }
  }

  /**
   * Execute the transaction
   */
  private async executeTransaction(request: RelayRequest, gasEstimate: ethers.BigNumber): Promise<ethers.providers.TransactionResponse> {
    const { proposal } = request;
    
    const gasPrice = await this.provider.getGasPrice();
    
    const tx = await this.executor.executeProposal(
      proposal.vault,
      proposal.actionType,
      proposal.params,
      proposal.ipfsHash,
      proposal.nonce,
      proposal.deadline,
      request.signature,
      {
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        timeout: this.config.timeout
      }
    );

    return tx;
  }

  /**
   * Get relayer status
   */
  async getStatus(): Promise<any> {
    try {
      const balance = await this.wallet.getBalance();
      const gasPrice = await this.provider.getGasPrice();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        address: this.wallet.address,
        balance: ethers.utils.formatEther(balance),
        gasPrice: gasPrice.toString(),
        blockNumber,
        chainId: this.config.chainId,
        executorAddress: this.config.executorAddress
      };
    } catch (error) {
      this.logger.error('Error getting status', error);
      throw error;
    }
  }

  /**
   * Test connection to the network
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      await this.wallet.getBalance();
      return true;
    } catch (error) {
      this.logger.error('Connection test failed', error);
      return false;
    }
  }
}
