import { ExecutionReport, Logger } from './types';

export class MockReportGenerator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate a comprehensive mock execution report
   */
  generateMockReport(action: string, estimatedGas: string, simulatedPnL: string, rationale: string): any {
    const timestamp = new Date().toISOString();
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const mockIpfsHash = `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    return {
      metadata: {
        version: "1.0",
        timestamp: timestamp,
        agent: "SOMI_SENTINEL_V1",
        network: "Somnia Testnet",
        chainId: 50312
      },
      proposal: {
        action: action,
        estimatedGas: estimatedGas,
        simulatedPnL: simulatedPnL,
        rationale: rationale,
        ipfsHash: mockIpfsHash,
        txHash: mockTxHash,
        status: "pending_execution"
      },
      simulation: {
        priceImpact: "0.12%",
        slippage: "0.08%",
        gasEstimate: estimatedGas,
        expectedOutcome: simulatedPnL,
        riskScore: 65,
        confidence: 0.78,
        executionTime: "~2.3 seconds",
        successProbability: "94%"
      },
      marketAnalysis: {
        volatility: "High",
        liquidity: "Good",
        oracleDeviation: "1.2%",
        recommendedAction: "Proceed with caution",
        marketConditions: {
          trend: "Bearish",
          volume: "Above average",
          spread: "Normal"
        }
      },
      riskAssessment: {
        factors: [
          "Market volatility",
          "Liquidity constraints", 
          "Gas price fluctuations",
          "Oracle price deviation"
        ],
        mitigation: [
          "Use limit orders",
          "Monitor slippage",
          "Set gas limits",
          "Implement stop-loss"
        ],
        confidence: "75%",
        riskLevel: "Medium"
      },
      executionPlan: {
        steps: [
          "Validate proposal parameters",
          "Check policy compliance",
          "Estimate gas costs",
          "Submit transaction",
          "Monitor execution",
          "Verify results"
        ],
        estimatedDuration: "5-10 minutes",
        fallbackPlan: "Cancel if gas price exceeds threshold"
      },
      auditTrail: {
        created: timestamp,
        lastModified: timestamp,
        version: 1,
        checksum: mockIpfsHash,
        signatures: {
          agent: "0x742d35Cc6634C0532925a3b844Bc9e7595f4a9e",
          executor: "0x8E80a57A6805260eac17993Aa9FC9FaA3B8cc208"
        }
      }
    };
  }

  /**
   * Generate a downloadable report file
   */
  generateDownloadableReport(action: string, estimatedGas: string, simulatedPnL: string, rationale: string): void {
    const report = this.generateMockReport(action, estimatedGas, simulatedPnL, rationale);
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `somi-sentinel-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.logger.info('Mock report generated and downloaded:', report.metadata);
  }

  /**
   * Generate a formatted HTML report
   */
  generateHTMLReport(action: string, estimatedGas: string, simulatedPnL: string, rationale: string): string {
    const report = this.generateMockReport(action, estimatedGas, simulatedPnL, rationale);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SOMI Sentinel Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e8f4fd; border-radius: 4px; }
        .risk-high { color: #d32f2f; }
        .risk-medium { color: #f57c00; }
        .risk-low { color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 SOMI Sentinel Execution Report</h1>
        <p><strong>Generated:</strong> ${report.metadata.timestamp}</p>
        <p><strong>Agent:</strong> ${report.metadata.agent}</p>
        <p><strong>Network:</strong> ${report.metadata.network}</p>
    </div>

    <div class="section">
        <h2>📋 Proposal Details</h2>
        <p><strong>Action:</strong> ${report.proposal.action}</p>
        <p><strong>Estimated Gas:</strong> ${report.proposal.estimatedGas}</p>
        <p><strong>Expected P&L:</strong> ${report.proposal.simulatedPnL}</p>
        <p><strong>Rationale:</strong> ${report.proposal.rationale}</p>
    </div>

    <div class="section">
        <h2>📊 Simulation Results</h2>
        <div class="metric"><strong>Price Impact:</strong> ${report.simulation.priceImpact}</div>
        <div class="metric"><strong>Slippage:</strong> ${report.simulation.slippage}</div>
        <div class="metric"><strong>Risk Score:</strong> ${report.simulation.riskScore}</div>
        <div class="metric"><strong>Confidence:</strong> ${(report.simulation.confidence * 100).toFixed(1)}%</div>
    </div>

    <div class="section">
        <h2>⚠️ Risk Assessment</h2>
        <p><strong>Risk Level:</strong> <span class="risk-${report.riskAssessment.riskLevel.toLowerCase()}">${report.riskAssessment.riskLevel}</span></p>
        <p><strong>Risk Factors:</strong></p>
        <ul>
            ${report.riskAssessment.factors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
        <p><strong>Mitigation Strategies:</strong></p>
        <ul>
            ${report.riskAssessment.mitigation.map(strategy => `<li>${strategy}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>🔍 Market Analysis</h2>
        <p><strong>Volatility:</strong> ${report.marketAnalysis.volatility}</p>
        <p><strong>Liquidity:</strong> ${report.marketAnalysis.liquidity}</p>
        <p><strong>Oracle Deviation:</strong> ${report.marketAnalysis.oracleDeviation}</p>
        <p><strong>Recommendation:</strong> ${report.marketAnalysis.recommendedAction}</p>
    </div>

    <div class="section">
        <h2>📝 Audit Trail</h2>
        <p><strong>Report Hash:</strong> <code>${report.auditTrail.checksum}</code></p>
        <p><strong>Agent Address:</strong> <code>${report.auditTrail.signatures.agent}</code></p>
        <p><strong>Executor Address:</strong> <code>${report.auditTrail.signatures.executor}</code></p>
    </div>
</body>
</html>`;
  }
}
