import { Plus, Edit, Trash2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { CreatePolicyDialog } from "@/components/CreatePolicyDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePolicies, Policy } from "@/hooks/usePolicy";
import { motion } from "framer-motion";
import { useState } from "react";

const Policies = () => {
  const { policies, isLoading } = usePolicies();
  const [policiesList, setPoliciesList] = useState<Policy[]>([]);

  const handlePolicyCreated = (policyData: Policy) => {
    setPoliciesList(prev => [policyData, ...prev]);
  };

  const handleEditPolicy = (policyId: string) => {
    console.log("Edit policy:", policyId);
    // TODO: Implement edit functionality
  };

  const handleDeletePolicy = (policyId: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      setPoliciesList(prev => prev.filter(policy => policy.id !== policyId));
      console.log("Delete policy:", policyId);
    }
  };

  // Use local state if we have created policies, otherwise use hook data
  const displayPolicies = policiesList.length > 0 ? policiesList : policies;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">Policies</h2>
            <p className="text-muted-foreground">
              Manage vault policies and risk parameters
            </p>
          </div>
          <CreatePolicyDialog onPolicyCreated={handlePolicyCreated} />
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayPolicies.map((policy, index) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{policy.vaultName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={policy.isActive ? "success" : "secondary"}>
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPolicy(policy.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Risk Tolerance</p>
                        <p className="text-lg font-semibold">{policy.riskTolerance}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Max Trade %</p>
                        <p className="text-lg font-semibold">{policy.maxTradePercent}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Emergency Threshold</p>
                        <p className="text-lg font-semibold">{policy.emergencyThreshold}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Allowed DEX</p>
                        <p className="text-sm">{policy.allowedDex.length} protocols</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-xl">
                      <p className="text-xs font-medium mb-2">Allowed DEX Protocols</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.allowedDex.map((dex) => (
                          <Badge key={dex} variant="secondary">{dex}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Policies;
