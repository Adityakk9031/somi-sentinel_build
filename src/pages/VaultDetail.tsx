import { useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { PolicyEditor } from "@/components/PolicyEditor";
import { ProposalCard } from "@/components/ProposalCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVault } from "@/hooks/useVaults";
import { useNavigate } from "react-router-dom";

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { vault, isLoading } = useVault(id || '');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-8">
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-8">
          <p>Vault not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vaults')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vaults
        </Button>

        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">{vault.name}</h2>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold">${vault.value}</p>
            <div className={`flex items-center gap-1 ${vault.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              {vault.change24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className="font-medium">
                {vault.change24h >= 0 ? '+' : ''}{vault.change24h}% (24h)
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vault.tokens.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-lg font-bold">
                          {token.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{token.symbol}</p>
                          <p className="text-sm text-muted-foreground">{token.amount} tokens</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold">{token.value || '$0'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 bg-muted rounded-xl">
                    <span>Rebalance to USDC</span>
                    <span className="text-muted-foreground">2h ago</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-xl">
                    <span>Policy updated</span>
                    <span className="text-muted-foreground">1d ago</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-xl">
                    <span>Deposit: 2.5 ETH</span>
                    <span className="text-muted-foreground">3d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <PolicyEditor />
            
            <ProposalCard
              action="Rebalance ETH position: Swap 2.5 ETH → USDC on Uniswap V3"
              estimatedGas="0.008 ETH"
              simulatedPnL="+$127"
              rationale="Market volatility detected. Oracle price deviation of 1.2% suggests potential downside. Recommend reducing exposure by 25%."
              ipfsHash="QmT4Zx8...3Np7"
              canExecute={true}
              isSigned={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VaultDetail;
