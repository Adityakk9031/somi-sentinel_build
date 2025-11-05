import { AlertCircle, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RiskAlert {
  id: string;
  title: string;
  riskScore: number;
  timestamp: string;
  ipfsHash: string;
}

const getRiskColor = (score: number) => {
  if (score >= 80) return "destructive";
  if (score >= 50) return "warning";
  return "success";
};

const getRiskLabel = (score: number) => {
  if (score >= 80) return "Critical";
  if (score >= 50) return "Warning";
  return "Low";
};

export const RiskFeed = () => {
  const handleViewProposal = (alert: RiskAlert) => {
    console.log("View proposal:", alert);
    const ipfsUrl = `https://ipfs.io/ipfs/${alert.ipfsHash}`;
    window.open(ipfsUrl, '_blank');
  };
  const alerts: RiskAlert[] = [
    {
      id: "1",
      title: "Oracle Drift – USDC/ETH",
      riskScore: 85,
      timestamp: "2 min ago",
      ipfsHash: "QmX7Yn2...4Kp9",
    },
    {
      id: "2",
      title: "High Volatility – BTC Position",
      riskScore: 65,
      timestamp: "15 min ago",
      ipfsHash: "QmY8Zp3...5Lq0",
    },
    {
      id: "3",
      title: "Liquidity Pool Imbalance",
      riskScore: 45,
      timestamp: "1 hour ago",
      ipfsHash: "QmZ9Aq4...6Mr1",
    },
    {
      id: "4",
      title: "Gas Price Spike Detected",
      riskScore: 30,
      timestamp: "2 hours ago",
      ipfsHash: "QmA0Br5...7Ns2",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-accent" />
          Live Risk Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={alert.id}
                className="p-4 border rounded-2xl hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{alert.title}</h4>
                  <Badge variant={getRiskColor(alert.riskScore)}>
                    {getRiskLabel(alert.riskScore)} {alert.riskScore}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {alert.timestamp}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs">
                    {alert.ipfsHash}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewProposal(alert)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Proposal
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
