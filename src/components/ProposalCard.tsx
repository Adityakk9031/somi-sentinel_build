import { FileText, ExternalLink, TrendingUp, Zap, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { transactionManager } from "@/utils/transactionManager";

interface ProposalCardProps {
  action: string;
  estimatedGas: string;
  simulatedPnL: string;
  rationale: string;
  ipfsHash: string;
  canExecute: boolean;
  isSigned: boolean;
}

export const ProposalCard = ({
  action,
  estimatedGas,
  simulatedPnL,
  rationale,
  ipfsHash,
  canExecute,
  isSigned,
}: ProposalCardProps) => {
  const { isConnected } = useWallet();

  const handleViewReport = () => {
    // Generate a comprehensive mock report
    const mockReport = {
      metadata: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        agent: "SOMI_SENTINEL_V1",
        network: "Somnia Testnet",
        chainId: 50312
      },
      proposal: {
        action: action,
        estimatedGas: estimatedGas,
        simulatedPnL: simulatedPnL,
        rationale: rationale,
        ipfsHash: ipfsHash,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
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
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        checksum: ipfsHash,
        signatures: {
          agent: "0x742d35Cc6634C0532925a3b844Bc9e7595f4a9e",
          executor: "0x8E80a57A6805260eac17993Aa9FC9FaA3B8cc208"
        }
      }
    };

    // Create a downloadable JSON file
    const dataStr = JSON.stringify(mockReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `somi-sentinel-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("📊 Full report generated:", mockReport);
    alert(`📊 Full Report Generated!\n\nDownloaded: somi-sentinel-report-${Date.now()}.json\n\nReport includes:\n• Detailed simulation results\n• Risk assessment\n• Market analysis\n• Execution plan\n• Audit trail`);
  };

  const handleExecute = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!canExecute) {
      alert("Cannot execute this proposal. Please check the requirements.");
      return;
    }

    if (!isSigned) {
      alert("Proposal is not signed yet. Please wait for agent signature.");
      return;
    }

    const confirmMessage = `Execute this proposal?\n\nAction: ${action}\nEstimated Gas: ${estimatedGas}\nExpected P&L: ${simulatedPnL}\n\nThis will submit a transaction to the Somnia Testnet blockchain.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log("Executing proposal:", { action, estimatedGas, simulatedPnL });
      
      // Prepare proposal data for execution
      const proposalData = {
        vault: "0x94C5661Ff1D5D914C01248baC4B348Fd03023FEB", // Main vault address
        actionType: 0, // Swap action
        params: JSON.stringify({ action, estimatedGas, simulatedPnL }),
        ipfsHash: ipfsHash
      };

      console.log("📊 Executing proposal with data:", proposalData);

      // Execute the proposal transaction
      const result = await transactionManager.executeProposal(proposalData);
      
      if (result.success) {
        alert(`✅ Proposal executed successfully!\n\nTransaction Hash: ${result.hash}\nGas Used: ${estimatedGas}\nExpected P&L: ${simulatedPnL}\n\nView on Explorer: ${result.explorerUrl}`);
        console.log("Proposal execution successful:", result);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Error executing proposal:", error);
      alert(`❌ Failed to execute proposal: ${error.message}\n\nPlease check your wallet connection and try again.`);
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Agent Proposal</CardTitle>
          <Badge variant={isSigned ? "success" : "secondary"}>
            {isSigned ? "Signed" : "Unsigned"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Recommended Action</p>
          <p className="text-foreground">{action}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Est. Gas</p>
            <p className="font-mono text-sm">{estimatedGas}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Simulated P&L</p>
            <p className="font-mono text-sm text-success">{simulatedPnL}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            AI Rationale
          </p>
          <p className="text-sm text-muted-foreground italic">
            "{rationale}"
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span className="font-mono">{ipfsHash}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button 
            size="sm" 
            disabled={!canExecute}
            className="bg-accent hover:bg-accent/90"
            onClick={handleExecute}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Execute Proposal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
