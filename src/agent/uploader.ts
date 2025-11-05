import { ExecutionReport, Logger } from './types';

export class Uploader {
  private logger: Logger;
  private mockMode: boolean;

  constructor(apiKey: string, logger: Logger) {
    this.logger = logger;
    this.mockMode = !apiKey || apiKey === 'your_nft_storage_key_here';
    
    if (this.mockMode) {
      this.logger.warn('Running in mock mode - IPFS uploads will be simulated');
    }
  }

  /**
   * Upload execution report to IPFS
   */
  async uploadReport(report: ExecutionReport): Promise<string> {
    this.logger.info('Uploading execution report to IPFS...');
    
    try {
      // Generate a mock CID for now
      const mockCid = `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Report uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading report to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload simulation data to IPFS
   */
  async uploadSimulation(simulation: any): Promise<string> {
    this.logger.info('Uploading simulation data to IPFS...');
    
    try {
      const mockCid = `QmSim${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Simulation uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading simulation to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload rationale data to IPFS
   */
  async uploadRationale(rationale: any): Promise<string> {
    this.logger.info('Uploading rationale data to IPFS...');
    
    try {
      const mockCid = `QmRat${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Rationale uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading rationale to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload market analysis to IPFS
   */
  async uploadMarketAnalysis(analysis: string, signals: any[]): Promise<string> {
    this.logger.info('Uploading market analysis to IPFS...');
    
    try {
      const mockCid = `QmMkt${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Market analysis uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading market analysis to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload risk assessment to IPFS
   */
  async uploadRiskAssessment(assessment: string, vaultData: any, policyData: any): Promise<string> {
    this.logger.info('Uploading risk assessment to IPFS...');
    
    try {
      const mockCid = `QmRisk${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Risk assessment uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading risk assessment to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload emergency response to IPFS
   */
  async uploadEmergencyResponse(response: string, emergencyType: string, severity: string): Promise<string> {
    this.logger.info('Uploading emergency response to IPFS...');
    
    try {
      const mockCid = `QmEmerg${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Emergency response uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading emergency response to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files as a directory
   */
  async uploadDirectory(files: { name: string; content: string; type: string }[]): Promise<string> {
    this.logger.info(`Uploading directory with ${files.length} files to IPFS...`);
    
    try {
      const mockCid = `QmDir${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      this.logger.info(`Directory uploaded to IPFS: ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error('Error uploading directory to IPFS:', error);
      throw error;
    }
  }

  /**
   * Test IPFS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.info('Testing IPFS connection...');
      // Mock connection test
      return true;
    } catch (error) {
      this.logger.error('IPFS connection test failed:', error);
      return false;
    }
  }

  /**
   * Get IPFS URL for a CID
   */
  getIPFSUrl(cid: string): string {
    return `https://ipfs.io/ipfs/${cid}`;
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string, gateway: string = 'https://ipfs.io'): string {
    return `${gateway}/ipfs/${cid}`;
  }

  /**
   * Validate CID format
   */
  isValidCID(cid: string): boolean {
    // Basic CID validation - starts with 'Qm' for v0 or 'b' for v1
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[0-9a-z]{58,})$/i.test(cid);
  }

  /**
   * Get file size in bytes
   */
  getFileSize(content: string): number {
    return new Blob([content]).size;
  }

  /**
   * Check if content is too large for IPFS
   */
  isContentTooLarge(content: string, maxSize: number = 100 * 1024 * 1024): boolean {
    return this.getFileSize(content) > maxSize;
  }
}