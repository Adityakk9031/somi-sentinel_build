import { Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { transactionManager } from "@/utils/transactionManager";

export const PolicyEditor = () => {
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [maxTradePercent, setMaxTradePercent] = useState("10");
  const [emergencyThreshold, setEmergencyThreshold] = useState("90");
  const [allowedDex, setAllowedDex] = useState({
    "Uniswap V3": true,
    "Curve": false,
    "Balancer": false,
    "Aave": false,
  });
  const [isApplying, setIsApplying] = useState(false);
  const { isConnected, address } = useWallet();

  const dexOptions = [
    "Uniswap V3",
    "Curve",
    "Balancer",
    "Aave",
  ];

  const handleDexChange = (dex: string, checked: boolean) => {
    setAllowedDex(prev => ({ ...prev, [dex]: checked }));
  };

  const handleApplyPolicy = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    const selectedDex = Object.entries(allowedDex)
      .filter(([_, isSelected]) => isSelected)
      .map(([dex, _]) => dex);

    if (selectedDex.length === 0) {
      alert("Please select at least one DEX");
      return;
    }

    // Confirm transaction
    const policyData = {
      riskTolerance: riskTolerance[0],
      maxTradePercent: parseInt(maxTradePercent),
      emergencyThreshold: parseInt(emergencyThreshold),
      allowedDex: selectedDex
    };

    const confirmMessage = `Apply Policy On-Chain?\n\nRisk Tolerance: ${policyData.riskTolerance}%\nMax Trade: ${policyData.maxTradePercent}%\nEmergency Threshold: ${policyData.emergencyThreshold}%\nAllowed DEXs: ${selectedDex.join(', ')}\n\nThis will submit a transaction to the Somnia Testnet blockchain.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsApplying(true);
    
    try {
      console.log("Applying policy to blockchain:", policyData);
      
      const vaultAddress = "0x94C5661Ff1D5D914C01248baC4B348Fd03023FEB"; // Main vault address
      
      // Send transaction to apply policy on-chain
      const result = await transactionManager.applyPolicy(vaultAddress, policyData);
      
      if (result.success) {
        // After successful blockchain transaction, save to database
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const dbResponse = await fetch(`${API_BASE_URL}/api/policies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vaultAddress,
              riskTolerance: policyData.riskTolerance,
              maxTradePercent: policyData.maxTradePercent,
              emergencyThreshold: policyData.emergencyThreshold,
              allowedDex: policyData.allowedDex,
              setBy: address || undefined,
              deployedTx: result.hash, // Save transaction hash
            }),
          });

          if (!dbResponse.ok) {
            const errorData = await dbResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to save policy to database:', errorData);
            // Don't throw - blockchain transaction succeeded, database save is secondary
            alert(`✅ Policy applied on-chain successfully!\n\nTransaction Hash: ${result.hash}\n⚠️ Warning: Failed to save to database: ${errorData.error || 'Unknown error'}\n\nView on Explorer: ${result.explorerUrl}`);
          } else {
            const savedPolicy = await dbResponse.json();
            console.log("Policy saved to database:", savedPolicy);
            alert(`✅ Policy applied successfully!\n\n✅ Saved to database (version ${savedPolicy.version})\nTransaction Hash: ${result.hash}\n\nView on Explorer: ${result.explorerUrl}`);
          }
        } catch (dbError: any) {
          console.error("Error saving policy to database:", dbError);
          // Don't throw - blockchain transaction succeeded
          alert(`✅ Policy applied on-chain successfully!\n\nTransaction Hash: ${result.hash}\n⚠️ Warning: Failed to save to database\n\nView on Explorer: ${result.explorerUrl}`);
        }
        
        console.log("Policy transaction successful:", result);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Error applying policy:", error);
      alert(`❌ Failed to apply policy: ${error.message}\n\nPlease check your wallet connection and try again.`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Policy Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Risk Tolerance: {riskTolerance[0]}%</Label>
          <Slider
            value={riskTolerance}
            onValueChange={setRiskTolerance}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allowed DEX Protocols</Label>
          <div className="space-y-2">
            {dexOptions.map((dex) => (
              <div key={dex} className="flex items-center space-x-2">
                <Checkbox 
                  id={dex} 
                  checked={allowedDex[dex as keyof typeof allowedDex]}
                  onCheckedChange={(checked) => handleDexChange(dex, checked as boolean)}
                />
                <Label htmlFor={dex} className="text-sm font-normal">
                  {dex}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTrade">Max Trade % per Action</Label>
          <Input
            id="maxTrade"
            type="number"
            value={maxTradePercent}
            onChange={(e) => setMaxTradePercent(e.target.value)}
            placeholder="10"
            max={20}
          />
          <p className="text-xs text-muted-foreground">
            Maximum 20% of vault per transaction
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency">Emergency Threshold (%)</Label>
          <Input
            id="emergency"
            type="number"
            min="50"
            max="100"
            value={emergencyThreshold}
            onChange={(e) => setEmergencyThreshold(e.target.value)}
            placeholder="90"
          />
        </div>

        <div className="p-4 bg-muted rounded-xl space-y-2">
          <p className="text-sm font-medium">Policy Preview</p>
          <pre className="text-xs font-mono overflow-x-auto">
{`{
  "riskTolerance": ${riskTolerance[0]},
  "maxTradePercent": ${maxTradePercent},
  "emergencyThreshold": ${emergencyThreshold},
  "allowedDex": [${Object.entries(allowedDex)
    .filter(([_, isSelected]) => isSelected)
    .map(([dex, _]) => `"${dex}"`)
    .join(", ")}]
}`}
          </pre>
        </div>

        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleApplyPolicy}
          disabled={isApplying}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isApplying ? "Applying..." : "Apply Policy On-Chain"}
        </Button>
      </CardContent>
    </Card>
  );
};
