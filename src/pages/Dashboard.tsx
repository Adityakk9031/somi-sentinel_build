import { TopNav } from "@/components/TopNav";
import { VaultCard } from "@/components/VaultCard";
import { RiskFeed } from "@/components/RiskFeed";
import { ProposalCard } from "@/components/ProposalCard";
import { PolicyEditor } from "@/components/PolicyEditor";
import { useVaults } from "@/hooks/useVaults";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { vaults, isLoading } = useVaults();

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your vaults, manage policies, and review AI-powered risk assessments
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Vaults & Policy */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Your Vaults</h3>
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {vaults.slice(0, 2).map((vault, index) => (
                    <motion.div
                      key={vault.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <VaultCard {...vault} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <PolicyEditor />
          </div>

          {/* Right Column - Risk Feed & Proposals */}
          <div className="space-y-6">
            <RiskFeed />
            
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

export default Dashboard;
