import { ethers } from 'ethers';
import { Proposal, ExecutionReport, Logger } from './types';

export class Signer {
  private wallet: ethers.Wallet;
  private logger: Logger;
  private nonceTracker: Map<string, number> = new Map();

  constructor(privateKey: string, logger: Logger) {
    this.wallet = new ethers.Wallet(privateKey);
    this.logger = logger;
  }

  /**
   * Sign a proposal
   */
  async signProposal(proposal: Proposal): Promise<string> {
    this.logger.info(`Signing proposal for vault ${proposal.vault}`);
    
    try {
      // Encode the proposal
      const encodedProposal = this.encodeProposal(proposal);
      
      // Create the message hash
      const messageHash = ethers.utils.keccak256(encodedProposal);
      
      // Sign the message hash
      const signature = await this.wallet.signMessage(ethers.utils.arrayify(messageHash));
      
      this.logger.info('Proposal signed successfully');
      return signature;
    } catch (error) {
      this.logger.error('Error signing proposal:', error);
      throw error;
    }
  }

  /**
   * Encode a proposal for signing
   */
  encodeProposal(proposal: Proposal): string {
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint8', 'bytes', 'bytes32', 'uint256', 'uint256'],
      [
        proposal.vault,
        proposal.actionType,
        proposal.params,
        proposal.ipfsHash,
        proposal.nonce,
        proposal.deadline
      ]
    );
  }

  /**
   * Get the next nonce for a vault
   */
  getNextNonce(vaultAddress: string): number {
    const currentNonce = this.nonceTracker.get(vaultAddress) || 0;
    const nextNonce = currentNonce + 1;
    this.nonceTracker.set(vaultAddress, nextNonce);
    return nextNonce;
  }

  /**
   * Create a proposal
   */
  createProposal(
    vaultAddress: string,
    actionType: number,
    params: string,
    ipfsHash: string,
    deadlineOffset: number = 3600 // 1 hour default
  ): Proposal {
    const nonce = this.getNextNonce(vaultAddress);
    const deadline = Math.floor(Date.now() / 1000) + deadlineOffset;

    return {
      vault: vaultAddress,
      actionType,
      params,
      ipfsHash,
      nonce,
      deadline
    };
  }

  /**
   * Verify a signature
   */
  verifySignature(proposal: Proposal, signature: string): boolean {
    try {
      const encodedProposal = this.encodeProposal(proposal);
      const messageHash = ethers.utils.keccak256(encodedProposal);
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(messageHash),
        signature
      );
      
      return recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      this.logger.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Get the agent address
   */
  getAgentAddress(): string {
    return this.wallet.address;
  }

  /**
   * Create a complete execution report
   */
  async createExecutionReport(
    vaultAddress: string,
    actionType: number,
    params: string,
    ipfsHash: string,
    deadlineOffset: number = 3600
  ): Promise<ExecutionReport> {
    const proposal = this.createProposal(
      vaultAddress,
      actionType,
      params,
      ipfsHash,
      deadlineOffset
    );

    const signature = await this.signProposal(proposal);

    return {
      proposal,
      simulation: {
        actionType,
        params,
        expectedOutcome: 0, // Will be filled by simulator
        priceImpact: 0,
        slippage: 0,
        gasEstimate: 0,
        riskScore: 0,
        confidence: 0,
        timestamp: Date.now()
      },
      rationale: {
        summary: '',
        reasoning: '',
        riskAssessment: '',
        recommendation: '',
        confidence: 0,
        timestamp: Date.now()
      },
      ipfsHash,
      signature,
      timestamp: Date.now()
    };
  }

  /**
   * Validate proposal parameters
   */
  validateProposal(proposal: Proposal): boolean {
    try {
      // Check basic parameters
      if (!proposal.vault || !ethers.utils.isAddress(proposal.vault)) {
        this.logger.error('Invalid vault address');
        return false;
      }

      if (proposal.actionType < 0 || proposal.actionType > 5) {
        this.logger.error('Invalid action type');
        return false;
      }

      if (!proposal.params || proposal.params.length === 0) {
        this.logger.error('Invalid params');
        return false;
      }

      if (!proposal.ipfsHash || proposal.ipfsHash.length !== 66) {
        this.logger.error('Invalid IPFS hash');
        return false;
      }

      if (proposal.nonce < 0) {
        this.logger.error('Invalid nonce');
        return false;
      }

      if (proposal.deadline <= Math.floor(Date.now() / 1000)) {
        this.logger.error('Deadline has passed');
        return false;
      }

      // Check deadline is not too far in the future (max 24 hours)
      const maxDeadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      if (proposal.deadline > maxDeadline) {
        this.logger.error('Deadline too far in the future');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating proposal:', error);
      return false;
    }
  }

  /**
   * Get proposal hash for external verification
   */
  getProposalHash(proposal: Proposal): string {
    const encodedProposal = this.encodeProposal(proposal);
    return ethers.utils.keccak256(encodedProposal);
  }

  /**
   * Reset nonce for a vault (for testing)
   */
  resetNonce(vaultAddress: string): void {
    this.nonceTracker.set(vaultAddress, 0);
  }

  /**
   * Get current nonce for a vault
   */
  getCurrentNonce(vaultAddress: string): number {
    return this.nonceTracker.get(vaultAddress) || 0;
  }

  /**
   * Check if a nonce has been used
   */
  isNonceUsed(vaultAddress: string, nonce: number): boolean {
    const currentNonce = this.nonceTracker.get(vaultAddress) || 0;
    return nonce <= currentNonce;
  }
}
