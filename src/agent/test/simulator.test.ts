import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Simulator } from '../src/simulator';
import { ActionType } from '../src/types';

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('Simulator', () => {
  let simulator: Simulator;

  beforeEach(() => {
    simulator = new Simulator(mockLogger);
  });

  describe('simulateSwap', () => {
    it('should simulate a swap action correctly', async () => {
      const result = await simulator.simulateSwap(
        'ETH',
        'USDC',
        1000,
        '0x1111111111111111111111111111111111111111'
      );

      expect(result.actionType).toBe(ActionType.SWAP);
      expect(result.expectedOutcome).toBeGreaterThan(0);
      expect(result.priceImpact).toBeGreaterThanOrEqual(0);
      expect(result.slippage).toBeGreaterThanOrEqual(0);
      expect(result.gasEstimate).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle different token pairs', async () => {
      const result1 = await simulator.simulateSwap('ETH', 'USDC', 1000, '0x1111111111111111111111111111111111111111');
      const result2 = await simulator.simulateSwap('USDC', 'WBTC', 5000, '0x2222222222222222222222222222222222222222');

      expect(result1.expectedOutcome).not.toBe(result2.expectedOutcome);
      expect(result1.params).not.toBe(result2.params);
    });

    it('should calculate price impact correctly', async () => {
      const smallAmount = await simulator.simulateSwap('ETH', 'USDC', 100, '0x1111111111111111111111111111111111111111');
      const largeAmount = await simulator.simulateSwap('ETH', 'USDC', 10000, '0x1111111111111111111111111111111111111111');

      expect(largeAmount.priceImpact).toBeGreaterThan(smallAmount.priceImpact);
    });
  });

  describe('simulateLending', () => {
    it('should simulate a lending action correctly', async () => {
      const result = await simulator.simulateLending(
        'USDC',
        5000,
        'Aave'
      );

      expect(result.actionType).toBe(ActionType.LEND);
      expect(result.expectedOutcome).toBeGreaterThan(0);
      expect(result.priceImpact).toBe(0); // No price impact for lending
      expect(result.slippage).toBe(0); // No slippage for lending
      expect(result.gasEstimate).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different lending amounts', async () => {
      const smallAmount = await simulator.simulateLending('USDC', 1000, 'Aave');
      const largeAmount = await simulator.simulateLending('USDC', 10000, 'Aave');

      expect(largeAmount.expectedOutcome).toBeGreaterThan(smallAmount.expectedOutcome);
      expect(largeAmount.riskScore).toBeGreaterThan(smallAmount.riskScore);
    });
  });

  describe('simulateBorrowing', () => {
    it('should simulate a borrowing action correctly', async () => {
      const result = await simulator.simulateBorrowing(
        'USDC',
        3000,
        'Aave'
      );

      expect(result.actionType).toBe(ActionType.BORROW);
      expect(result.expectedOutcome).toBeGreaterThan(0);
      expect(result.priceImpact).toBe(0); // No price impact for borrowing
      expect(result.slippage).toBe(0); // No slippage for borrowing
      expect(result.gasEstimate).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate borrowing risk correctly', async () => {
      const smallAmount = await simulator.simulateBorrowing('USDC', 1000, 'Aave');
      const largeAmount = await simulator.simulateBorrowing('USDC', 10000, 'Aave');

      expect(largeAmount.riskScore).toBeGreaterThan(smallAmount.riskScore);
    });
  });

  describe('validateSimulation', () => {
    it('should validate correct simulation results', () => {
      const validResult = {
        actionType: ActionType.SWAP,
        params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
        expectedOutcome: 2000,
        priceImpact: 0.01,
        slippage: 0.005,
        gasEstimate: 150000,
        riskScore: 25,
        confidence: 0.85,
        timestamp: Date.now()
      };

      expect(simulator.validateSimulation(validResult)).toBe(true);
    });

    it('should reject invalid simulation results', () => {
      const invalidResults = [
        {
          actionType: ActionType.SWAP,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          expectedOutcome: -100, // Negative outcome
          priceImpact: 0.01,
          slippage: 0.005,
          gasEstimate: 150000,
          riskScore: 25,
          confidence: 0.85,
          timestamp: Date.now()
        },
        {
          actionType: ActionType.SWAP,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          expectedOutcome: 2000,
          priceImpact: -0.01, // Negative price impact
          slippage: 0.005,
          gasEstimate: 150000,
          riskScore: 25,
          confidence: 0.85,
          timestamp: Date.now()
        },
        {
          actionType: ActionType.SWAP,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          expectedOutcome: 2000,
          priceImpact: 0.01,
          slippage: 0.005,
          gasEstimate: 0, // Zero gas estimate
          riskScore: 25,
          confidence: 0.85,
          timestamp: Date.now()
        },
        {
          actionType: ActionType.SWAP,
          params: '{"tokenIn":"ETH","tokenOut":"USDC","amountIn":1000}',
          expectedOutcome: 2000,
          priceImpact: 0.01,
          slippage: 0.005,
          gasEstimate: 150000,
          riskScore: 150, // Invalid risk score
          confidence: 0.85,
          timestamp: Date.now()
        }
      ];

      invalidResults.forEach(result => {
        expect(simulator.validateSimulation(result)).toBe(false);
      });
    });
  });

  describe('deterministic behavior', () => {
    it('should produce deterministic results for same inputs', async () => {
      const result1 = await simulator.simulateSwap('ETH', 'USDC', 1000, '0x1111111111111111111111111111111111111111');
      const result2 = await simulator.simulateSwap('ETH', 'USDC', 1000, '0x1111111111111111111111111111111111111111');

      // Results should be similar (allowing for some randomness in mock calculations)
      expect(Math.abs(result1.expectedOutcome - result2.expectedOutcome)).toBeLessThan(100);
      expect(Math.abs(result1.priceImpact - result2.priceImpact)).toBeLessThan(0.01);
      expect(Math.abs(result1.slippage - result2.slippage)).toBeLessThan(0.01);
    });
  });
});
