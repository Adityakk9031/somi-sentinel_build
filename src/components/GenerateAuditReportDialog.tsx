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
import { FileText, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface GenerateAuditReportDialogProps {
  onReportGenerated?: (reportData: any) => void;
}

export const GenerateAuditReportDialog = ({ onReportGenerated }: GenerateAuditReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    vaultId: "",
    reportType: "risk_assessment",
    severity: "info",
    description: "",
    customMessage: "",
  });
  const { isConnected, address } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate generating an audit report
      const reportData = {
        id: `audit_${Date.now()}`,
        vaultId: formData.vaultId || "1",
        vaultName: "SOMI Sentinel Vault",
        type: formData.reportType,
        severity: formData.severity,
        message: formData.description || formData.customMessage || "Manual audit report generated",
        timestamp: new Date().toISOString(),
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        ipfsHash: `QmAudit${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        executor: address,
        status: "completed",
      };

      // Simulate API call to generate report
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      onReportGenerated?.(reportData);
      setOpen(false);
      
      // Reset form
      setFormData({
        vaultId: "",
        reportType: "risk_assessment",
        severity: "info",
        description: "",
        customMessage: "",
      });
      
      alert("Audit report generated successfully!");
    } catch (error) {
      console.error("Error generating audit report:", error);
      alert("Failed to generate audit report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Audit Report</DialogTitle>
          <DialogDescription>
            Create a new audit report for risk assessment or compliance tracking.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaultId">Vault ID</Label>
            <Input
              id="vaultId"
              placeholder="e.g., 1"
              value={formData.vaultId}
              onChange={(e) => handleInputChange("vaultId", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={formData.reportType} onValueChange={(value) => handleInputChange("reportType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                <SelectItem value="compliance_check">Compliance Check</SelectItem>
                <SelectItem value="performance_analysis">Performance Analysis</SelectItem>
                <SelectItem value="security_audit">Security Audit</SelectItem>
                <SelectItem value="custom">Custom Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => handleInputChange("severity", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon("info")}
                    Info
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon("warning")}
                    Warning
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon("error")}
                    Error
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the audit findings..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          {formData.reportType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customMessage">Custom Message</Label>
              <Input
                id="customMessage"
                placeholder="Enter custom audit message..."
                value={formData.customMessage}
                onChange={(e) => handleInputChange("customMessage", e.target.value)}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
