import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Shield } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Policy } from "@/hooks/usePolicy";

interface CreatePolicyDialogProps {
  onPolicyCreated?: (policyData: Policy) => void;
}

export const CreatePolicyDialog = ({ onPolicyCreated }: CreatePolicyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    vaultId: "",
    vaultName: "",
    riskTolerance: [50],
    maxTradePercent: "10",
    emergencyThreshold: "90",
    allowedDex: {
      "Uniswap V3": true,
      "Curve": false,
      "Balancer": false,
      "Aave": false,
    },
  });
  const { isConnected, address } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!formData.vaultId || !formData.vaultName) {
      alert("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    
    try {
      const selectedDex = Object.entries(formData.allowedDex)
        .filter(([_, isSelected]) => isSelected)
        .map(([dex, _]) => dex);

      if (selectedDex.length === 0) {
        alert("Please select at least one DEX");
        setIsCreating(false);
        return;
      }

      const policyData: Policy = {
        id: `policy_${Date.now()}`,
        vaultId: formData.vaultId,
        vaultName: formData.vaultName,
        riskTolerance: formData.riskTolerance[0],
        maxTradePercent: parseInt(formData.maxTradePercent),
        emergencyThreshold: parseInt(formData.emergencyThreshold),
        allowedDex: selectedDex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

            // Call the backend API to create the policy
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Prepare request payload
      const payload = {
        vaultId: formData.vaultId.trim(), // Send UUID, backend will look it up
        riskTolerance: formData.riskTolerance[0], // Number from array
        maxTradePercent: formData.maxTradePercent, // String, backend will parse
        emergencyThreshold: formData.emergencyThreshold, // String, backend will parse
        allowedDex: formData.allowedDex, // Send object format, backend will handle conversion
        setBy: address || undefined,
      };

      console.log('Sending policy creation request:', payload);
      
      // Send vaultId (UUID) to backend - backend will look up the vault address
      const response = await fetch(`${API_BASE_URL}/api/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Policy creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.details || `Failed to create policy (${response.status})`);
      }

      const savedPolicy = await response.json();
      
      // Update policyData with saved data
      policyData.id = savedPolicy.id;
      
      onPolicyCreated?.(policyData); 
      setOpen(false);
      
      // Reset form
      setFormData({
        vaultId: "",
        vaultName: "",
        riskTolerance: [50],
        maxTradePercent: "10",
        emergencyThreshold: "90",
        allowedDex: {
          "Uniswap V3": true,
          "Curve": false,
          "Balancer": false,
          "Aave": false,
        },
      });
      
      alert("Policy created successfully! It has been saved to the database.");
    } catch (error) {
      console.error("Error creating policy:", error);
      alert("Failed to create policy. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDexChange = (dex: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowedDex: { ...prev.allowedDex, [dex]: checked }
    }));
  };

  const dexOptions = [
    "Uniswap V3",
    "Curve", 
    "Balancer",
    "Aave",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create New Policy
          </DialogTitle>
          <DialogDescription>
            Create a new policy for vault risk management and trading parameters.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="vaultId">Vault ID</Label>
            <Input
              id="vaultId"
              placeholder="e.g., 1"
              value={formData.vaultId}
              onChange={(e) => handleInputChange("vaultId", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vaultName">Vault Name</Label>
            <Input
              id="vaultName"
              placeholder="e.g., DeFi Growth Vault"
              value={formData.vaultName}
              onChange={(e) => handleInputChange("vaultName", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label>Risk Tolerance: {formData.riskTolerance[0]}%</Label>
            <Slider
              value={formData.riskTolerance}
              onValueChange={(value) => handleInputChange("riskTolerance", value)}
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
            <Label htmlFor="maxTradePercent">Max Trade Percentage</Label>
            <Input
              id="maxTradePercent"
              type="number"
              min="1"
              max="50"
              value={formData.maxTradePercent}
              onChange={(e) => handleInputChange("maxTradePercent", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyThreshold">Emergency Threshold (%)</Label>
            <Input
              id="emergencyThreshold"
              type="number"
              min="50"
              max="100"
              value={formData.emergencyThreshold}
              onChange={(e) => handleInputChange("emergencyThreshold", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label>Allowed DEXs</Label>
            <div className="space-y-2">
              {dexOptions.map((dex) => (
                <div key={dex} className="flex items-center space-x-2">
                  <Checkbox
                    id={dex}
                    checked={formData.allowedDex[dex as keyof typeof formData.allowedDex]}
                    onCheckedChange={(checked) => handleDexChange(dex, checked as boolean)}
                  />
                  <Label htmlFor={dex} className="text-sm font-normal">
                    {dex}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-xl space-y-2">
            <p className="text-sm font-medium">Policy Preview</p>
            <pre className="text-xs font-mono overflow-x-auto">
{`{
  "vaultId": "${formData.vaultId}",
  "vaultName": "${formData.vaultName}",
  "riskTolerance": ${formData.riskTolerance[0]},
  "maxTradePercent": ${formData.maxTradePercent},
  "emergencyThreshold": ${formData.emergencyThreshold},
  "allowedDex": [${Object.entries(formData.allowedDex)
    .filter(([_, isSelected]) => isSelected)
    .map(([dex, _]) => `"${dex}"`)
    .join(", ")}]
}`}
            </pre>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
