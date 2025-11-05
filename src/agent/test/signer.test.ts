import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers } from 'ethers';
import { Signer } from '../src/signer';
import { Proposal } from '../src/types';

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('Signer', () => {
  let signer: Signer;
  let wallet: ethers.Wallet;

  beforeEach(() => {
    wallet = ethers.Wallet.createRandom();
    signer = new Signer(wallet.privateKey, mockLogger);
  });

  describe('createProposal', () => {
    it('should create a valid proposal', () => {
      const vaultAddress = '0x1234567890123456789012345678901234567890';
      const actionType = 0;
      const params = '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}';
      const ipfsHash = 'QmT4Zx8...3Np7';

      const proposal = signer.createProposal(vaultAddress, actionType, params, ipfsHash);

      expect(proposal.vault).toBe(vaultAddress);
      expect(proposal.actionType).toBe(actionType);
      expect(proposal.params).toBe(params);
      expect(proposal.ipfsHash).toBe(ipfsHash);
      expect(proposal.nonce).toBeGreaterThan(0);
      expect(proposal.deadline).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should increment nonce for same vault', () => {
      const vaultAddress = '0x1234567890123456789012345678901234567890';
      
      const proposal1 = signer.createProposal(vaultAddress, 0, 'params1', 'hash1');
      const proposal2 = signer.createProposal(vaultAddress, 0, 'params2', 'hash2');

      expect(proposal2.nonce).toBe(proposal1.nonce + 1);
    });

    it('should use different nonces for different vaults', () => {
      const vault1 = '0x1111111111111111111111111111111111111111';
      const vault2 = '0x2222222222222222222222222222222222222222';
      
      const proposal1 = signer.createProposal(vault1, 0, 'params1', 'hash1');
      const proposal2 = signer.createProposal(vault2, 0, 'params2', 'hash2');

      expect(proposal1.nonce).toBe(1);
      expect(proposal2.nonce).toBe(1);
    });
  });

  describe('signProposal', () => {
    it('should sign a proposal correctly', async () => {
      const proposal = signer.createProposal(
        '0x1234567890123456789012345678901234567890',
        0,
        '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
        'QmT4Zx8...3Np7'
      );

      const signature = await signer.signProposal(proposal);

      expect(signature).toBeDefined();
      expect(signature.length).toBe(132); // 0x + 64 hex chars
      expect(signature.startsWith('0x')).toBe(true);
    });

    it('should produce different signatures for different proposals', async () => {
      const proposal1 = signer.createProposal('0x1111111111111111111111111111111111111111', 0, 'params1', 'hash1');
      const proposal2 = signer.createProposal('0x2222222222222222222222222222222222222222', 0, 'params2', 'hash2');

      const sig1 = await signer.signProposal(proposal1);
      const sig2 = await signer.signProposal(proposal2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should verify correct signatures', async () => {
      const proposal = signer.createProposal(
        '0x1234567890123456789012345678901234567890',
        0,
        '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
        'QmT4Zx8...3Np7'
      );

      const signature = await signer.signProposal(proposal);
      const isValid = signer.verifySignature(proposal, signature);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const proposal = signer.createProposal(
        '0x1234567890123456789012345678901234567890',
        0,
        '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
        'QmT4Zx8...3Np7'
      );

      const invalidSignature = '0x' + '1'.repeat(64);
      const isValid = signer.verifySignature(proposal, invalidSignature);

      expect(isValid).toBe(false);
    });
  });

  describe('validateProposal', () => {
    it('should validate correct proposals', () => {
      const proposal: Proposal = {
        vault: '0x1234567890123456789012345678901234567890',
        actionType: 0,
        params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
        ipfsHash: 'QmT4Zx8...3Np7',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      expect(signer.validateProposal(proposal)).toBe(true);
    });

    it('should reject invalid proposals', () => {
      const invalidProposals = [
        {
          vault: 'invalid-address',
          actionType: 0,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          ipfsHash: 'QmT4Zx8...3Np7',
          nonce: 1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        },
        {
          vault: '0x1234567890123456789012345678901234567890',
          actionType: 99,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          ipfsHash: 'QmT4Zx8...3Np7',
          nonce: 1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        },
        {
          vault: '0x1234567890123456789012345678901234567890',
          actionType: 0,
          params: '',
          ipfsHash: 'QmT4Zx8...3Np7',
          nonce: 1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        },
        {
          vault: '0x1234567890123456789012345678901234567890',
          actionType: 0,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          ipfsHash: 'invalid-hash',
          nonce: 1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        },
        {
          vault: '0x1234567890123456789012345678901234567890',
          actionType: 0,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          ipfsHash: 'QmT4Zx8...3Np7',
          nonce: -1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        },
        {
          vault: '0x1234567890123456789012345678901234567890',
          actionType: 0,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          ipfsHash: 'QmT4Zx8...3Np7',
          nonce: 1,
          deadline: Math.floor(Date.now() / 1000) - 3600
        }
      ];

      invalidProposals.forEach(proposal => {
        expect(signer.validateProposal(proposal)).toBe(false);
      });
    });
  });

  describe('nonce management', () => {
    it('should track nonces correctly', () => {
      const vaultAddress = '0x1234567890123456789012345678901234567890';
      
      expect(signer.getCurrentNonce(vaultAddress)).toBe(0);
      
      signer.createProposal(vaultAddress, 0, 'params1', 'hash1');
      expect(signer.getCurrentNonce(vaultAddress)).toBe(1);
      
      signer.createProposal(vaultAddress, 0, 'params2', 'hash2');
      expect(signer.getCurrentNonce(vaultAddress)).toBe(2);
    });

    it('should reset nonce correctly', () => {
      const vaultAddress = '0x1234567890123456789012345678901234567890';
      
      signer.createProposal(vaultAddress, 0, 'params1', 'hash1');
      expect(signer.getCurrentNonce(vaultAddress)).toBe(1);
      
      signer.resetNonce(vaultAddress);
      expect(signer.getCurrentNonce(vaultAddress)).toBe(0);
    });

    it('should check nonce usage correctly', () => {
      const vaultAddress = '0x1234567890123456789012345678901234567890';
      
      expect(signer.isNonceUsed(vaultAddress, 0)).toBe(false);
      expect(signer.isNonceUsed(vaultAddress, 1)).toBe(false);
      
      signer.createProposal(vaultAddress, 0, 'params1', 'hash1');
      
      expect(signer.isNonceUsed(vaultAddress, 0)).toBe(false);
      expect(signer.isNonceUsed(vaultAddress, 1)).toBe(true);
      expect(signer.isNonceUsed(vaultAddress, 2)).toBe(false);
    });
  });
});
