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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface CreateVaultDialogProps {
  onVaultCreated?: (vaultData: any) => void;
}

export const CreateVaultDialog = ({ onVaultCreated }: CreateVaultDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    riskTolerance: "medium",
    maxTradePercent: "10",
    emergencyThreshold: "90",
  });
  const { isConnected, address } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    
    try {
      // Call the backend API to create the vault
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/vaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          riskTolerance: formData.riskTolerance,
          maxTradePercent: formData.maxTradePercent,
          emergencyThreshold: formData.emergencyThreshold,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Vault creation failed:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to create vault');
      }

      const vaultData = await response.json();
      
      onVaultCreated?.(vaultData);
      setOpen(false);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        riskTolerance: "medium",
        maxTradePercent: "10",
        emergencyThreshold: "90",
      });
      
      alert("Vault created successfully! It has been saved to the database.");
    } catch (error: any) {
      console.error("Error creating vault:", error);
      alert(`Failed to create vault: ${error.message || 'Unknown error'}\n\nPlease check:\n1. Backend is running (npm run dev:backend)\n2. Console for detailed error`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Vault</DialogTitle>
          <DialogDescription>
            Create a new DeFi vault with custom risk parameters and policies.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vault Name</Label>
            <Input
              id="name"
              placeholder="e.g., DeFi Growth Vault"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your vault strategy..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">Risk Tolerance</Label>
            <Select value={formData.riskTolerance} onValueChange={(value) => handleInputChange("riskTolerance", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxTradePercent">Max Trade Percentage</Label>
            <Input
              id="maxTradePercent"
              type="number"
              min="1"
              max="100"
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
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Vault"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
