import { Moon, Sun, Network, Key, Server } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useWallet } from "@/hooks/useWallet";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { network, setNetwork } = useWallet();
  const isDark = theme === "dark";

  // Settings state
  const [customRPC, setCustomRPC] = useState("");
  const [aiModel, setAIModel] = useState("gemini-pro");
  const [gasLimit, setGasLimit] = useState("500000");
  const [maxGasPrice, setMaxGasPrice] = useState("100");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage
      const settings = {
        customRPC,
        aiModel,
        gasLimit,
        maxGasPrice,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem('somi-sentinel-settings', JSON.stringify(settings));
      
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setCustomRPC("");
      setAIModel("gemini-pro");
      setGasLimit("500000");
      setMaxGasPrice("100");
      
      localStorage.removeItem('somi-sentinel-settings');
      
      alert("Settings have been reset to defaults.");
    }
  };

  const handleNetworkChange = (value: string) => {
    setNetwork(value);
    alert(`Network changed to ${value}. Please reconnect your wallet.`);
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('somi-sentinel-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.customRPC) setCustomRPC(settings.customRPC);
        if (settings.aiModel) setAIModel(settings.aiModel);
        if (settings.gasLimit) setGasLimit(settings.gasLimit);
        if (settings.maxGasPrice) setMaxGasPrice(settings.maxGasPrice);
      } catch (error) {
        console.error("Error loading saved settings:", error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">
            Configure your SOMI Sentinel preferences and network settings
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch checked={isDark} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network
              </CardTitle>
              <CardDescription>
                Select your preferred blockchain network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Active Network</Label>
                <Select value={network} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="somnia-testnet">Somnia Testnet</SelectItem>
                    <SelectItem value="ethereum-mainnet">Ethereum Mainnet</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rpc">Custom RPC URL (Optional)</Label>
                <Input
                  id="rpc"
                  placeholder="https://..."
                  className="mt-2"
                  value={customRPC}
                  onChange={(e) => setCustomRPC(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Agent Configuration
              </CardTitle>
              <CardDescription>
                Configure AI agent and execution parameters (Demo only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="signer">Agent Signer Address</Label>
                <Input
                  id="signer"
                  placeholder="0x..."
                  className="mt-2 font-mono"
                  defaultValue="0x742d35Cc6634C0532925a3b844Bc9e7595f4a9e"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Read-only in demo mode
                </p>
              </div>

              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={aiModel} onValueChange={setAIModel}>
                  <SelectTrigger className="mt-2" id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Relayer Settings
              </CardTitle>
              <CardDescription>
                Configure transaction relay parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gasLimit">Default Gas Limit</Label>
                <Input
                  id="gasLimit"
                  type="number"
                  placeholder="500000"
                  className="mt-2"
                  value={gasLimit}
                  onChange={(e) => setGasLimit(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="maxGasPrice">Max Gas Price (Gwei)</Label>
                <Input
                  id="maxGasPrice"
                  type="number"
                  placeholder="100"
                  className="mt-2"
                  value={maxGasPrice}
                  onChange={(e) => setMaxGasPrice(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleResetDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
