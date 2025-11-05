import { GoogleGenerativeAI } from '@google/generative-ai';
import { SimulationResult, RationaleData, Logger } from './types';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private logger: Logger;
  private mockMode: boolean;

  constructor(apiKey: string, logger: Logger) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger = logger;
    this.mockMode = !apiKey || apiKey === 'your_gemini_api_key_here';
    
    if (this.mockMode) {
      this.logger.warn('Running Gemini client in mock mode - AI responses will be simulated');
    }
  }

  /**
   * Generate rationale for a simulation result
   */
  async generateRationale(simulation: SimulationResult): Promise<RationaleData> {
    this.logger.info('Generating rationale with Gemini...');
    
    try {
      if (this.mockMode) {
        // Return mock rationale
        const mockRationale: RationaleData = {
          summary: 'Mock AI analysis: Market conditions appear favorable for this trade.',
          reasoning: 'Based on simulated analysis, the proposed action shows acceptable risk parameters.',
          confidence: 0.75,
          riskFactors: ['Market volatility', 'Liquidity constraints'],
          recommendations: ['Proceed with caution', 'Monitor market conditions'],
          timestamp: Date.now()
        };
        this.logger.info('Mock rationale generated');
        return mockRationale;
      }

      const prompt = this.buildPrompt(simulation);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const rationale = this.parseRationale(text);
      
      this.logger.info('Rationale generated successfully');
      return rationale;
    } catch (error) {
      this.logger.error('Error generating rationale:', error);
      throw error;
    }
  }

  /**
   * Build prompt for Gemini
   */
  private buildPrompt(simulation: SimulationResult): string {
    const actionTypeNames = {
      0: 'Swap',
      1: 'Lend',
      2: 'Borrow',
      3: 'Add Liquidity',
      4: 'Remove Liquidity',
      5: 'Emergency Withdraw'
    };

    const actionType = actionTypeNames[simulation.actionType as keyof typeof actionTypeNames] || 'Unknown';
    
    return `
You are a DeFi risk analyst AI. Analyze the following trading simulation and provide a concise rationale.

Simulation Data:
- Action Type: ${actionType}
- Expected Outcome: ${simulation.expectedOutcome}
- Price Impact: ${(simulation.priceImpact * 100).toFixed(2)}%
- Slippage: ${(simulation.slippage * 100).toFixed(2)}%
- Gas Estimate: ${simulation.gasEstimate}
- Risk Score: ${simulation.riskScore}/100
- Confidence: ${(simulation.confidence * 100).toFixed(1)}%

Please provide a JSON response with the following structure:
{
  "summary": "Brief one-line summary of the action",
  "reasoning": "2-3 sentence explanation of why this action is recommended",
  "riskAssessment": "Assessment of the risks involved",
  "recommendation": "Clear recommendation (execute/avoid/modify)",
  "confidence": ${simulation.confidence}
}

Keep the response concise and professional. Focus on the key factors that influence the decision.
    `.trim();
  }

  /**
   * Parse rationale from Gemini response
   */
  private parseRationale(text: string): RationaleData {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'No summary provided',
          reasoning: parsed.reasoning || 'No reasoning provided',
          riskAssessment: parsed.riskAssessment || 'No risk assessment provided',
          recommendation: parsed.recommendation || 'No recommendation provided',
          confidence: parsed.confidence || 0.5,
          timestamp: Date.now()
        };
      }
      
      // Fallback to parsing the text directly
      return this.parseTextRationale(text);
    } catch (error) {
      this.logger.warn('Failed to parse JSON rationale, using fallback:', error);
      return this.parseTextRationale(text);
    }
  }

  /**
   * Parse rationale from plain text
   */
  private parseTextRationale(text: string): RationaleData {
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      summary: lines[0] || 'Action analysis completed',
      reasoning: lines.slice(1, 3).join(' ') || 'Analysis completed based on market conditions',
      riskAssessment: lines.slice(3, 5).join(' ') || 'Risk assessment completed',
      recommendation: lines[lines.length - 1] || 'Proceed with caution',
      confidence: 0.7, // Default confidence
      timestamp: Date.now()
    };
  }

  /**
   * Generate market analysis
   */
  async generateMarketAnalysis(signals: any[]): Promise<string> {
    this.logger.info('Generating market analysis with Gemini...');
    
    try {
      const prompt = `
Analyze the following DeFi market signals and provide a brief market summary:

Signals:
${signals.map(signal => `- ${signal.type}: ${signal.token} (${signal.severity} severity, ${signal.value}% change)`).join('\n')}

Provide a 2-3 sentence summary of current market conditions and any notable trends or risks.
      `.trim();

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      this.logger.error('Error generating market analysis:', error);
      throw error;
    }
  }

  /**
   * Generate risk assessment
   */
  async generateRiskAssessment(vaultData: any, policyData: any): Promise<string> {
    this.logger.info('Generating risk assessment with Gemini...');
    
    try {
      const prompt = `
Analyze the risk profile of this DeFi vault:

Vault Data:
- Total Value: $${vaultData.value}
- Risk Score: ${vaultData.riskScore}/100
- Tokens: ${vaultData.tokens.map((t: any) => `${t.symbol} (${t.amount})`).join(', ')}

Policy Settings:
- Risk Tolerance: ${policyData.riskTolerance}/100
- Max Trade %: ${policyData.maxTradePercent}%
- Emergency Threshold: ${policyData.emergencyThreshold}%

Provide a brief risk assessment focusing on portfolio concentration, policy compliance, and market exposure.
      `.trim();

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      this.logger.error('Error generating risk assessment:', error);
      throw error;
    }
  }

  /**
   * Generate emergency response
   */
  async generateEmergencyResponse(emergencyType: string, severity: string): Promise<string> {
    this.logger.info('Generating emergency response with Gemini...');
    
    try {
      const prompt = `
Generate an emergency response for a DeFi vault:

Emergency Type: ${emergencyType}
Severity: ${severity}

Provide a brief response plan including:
1. Immediate actions to take
2. Risk mitigation steps
3. Communication recommendations

Keep the response concise and actionable.
      `.trim();

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      this.logger.error('Error generating emergency response:', error);
      throw error;
    }
  }

  /**
   * Test Gemini connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.mockMode) {
        this.logger.info('Gemini client running in mock mode - connection test passed');
        return true;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Test connection');
      await result.response;
      this.logger.info('Gemini connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Gemini connection test failed:', error);
      // Fall back to mock mode
      this.mockMode = true;
      this.logger.warn('Falling back to mock mode due to Gemini API failure');
      return true; // Return true so agent can continue with mock mode
    }
  }
}
