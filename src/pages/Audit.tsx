import { useState } from "react";
import { Filter, Download } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { AuditTimeline } from "@/components/AuditTimeline";
import { GenerateAuditReportDialog } from "@/components/GenerateAuditReportDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditEventsMockData } from "@/mocks/audit";

const Audit = () => {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [vaultFilter, setVaultFilter] = useState<string>("all");
  const [auditEvents, setAuditEvents] = useState(auditEventsMockData);

  const filteredEvents = auditEvents.filter((event) => {
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    const matchesVault = vaultFilter === "all" || event.vaultId === vaultFilter;
    return matchesSeverity && matchesVault;
  });

  const uniqueVaults = Array.from(new Set(auditEvents.map(e => e.vaultName)));

  const handleExportCSV = () => {
    const csvContent = [
      // CSV Header
      "Timestamp,Type,Severity,Vault,Message,TxHash,IPFS Hash",
      // CSV Data
      ...filteredEvents.map(event => 
        `"${event.timestamp}","${event.type}","${event.severity}","${event.vaultName}","${event.message}","${event.txHash}","${event.ipfsHash}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleReportGenerated = (reportData: any) => {
    // Add the new report to the audit events
    setAuditEvents(prev => [reportData, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Audit Trail</h2>
          <p className="text-muted-foreground">
            Track all on-chain events, proposals, and risk alerts with IPFS verification
          </p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vaultFilter} onValueChange={setVaultFilter}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Vault" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vaults</SelectItem>
              {uniqueVaults.map((vault) => (
                <SelectItem key={vault} value={vault}>
                  {vault}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <GenerateAuditReportDialog onReportGenerated={handleReportGenerated} />
        </div>

        <AuditTimeline events={filteredEvents} />
      </main>
    </div>
  );
};

export default Audit;
