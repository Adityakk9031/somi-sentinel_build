import { Activity, Server, Bot, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSystemStatus } from "@/hooks/useSystemStatus";

export const SystemStatus = () => {
  const { isSystemHealthy, agent, relayer, isLoading } = useSystemStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status</span>
          <Badge variant={isSystemHealthy ? "success" : "destructive"}>
            {isSystemHealthy ? "Healthy" : "Issues Detected"}
          </Badge>
        </div>

        {/* Agent Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="text-sm font-medium">AI Agent</span>
            <Badge variant={agent.status.isRunning ? "success" : "destructive"}>
              {agent.status.isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>
          
          {agent.status.isRunning && agent.status.config && (
            <div className="text-xs text-muted-foreground space-y-1 ml-6">
              <div>Address: {agent.status.config.executorAddress?.slice(0, 10)}...</div>
              <div>Polling: {agent.status.config.pollingInterval / 1000}s</div>
              <div>Vaults: {agent.status.config.vaultAddresses?.length || 0}</div>
            </div>
          )}
          
          {agent.error && (
            <div className="text-xs text-destructive ml-6">
              Error: {agent.error}
            </div>
          )}
        </div>

        {/* Relayer Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="text-sm font-medium">Relayer</span>
            <Badge variant={relayer.status.error ? "destructive" : "success"}>
              {relayer.status.error ? "Offline" : "Online"}
            </Badge>
          </div>
          
          {!relayer.status.error && relayer.status && (
            <div className="text-xs text-muted-foreground space-y-1 ml-6">
              <div>Address: {relayer.status.address?.slice(0, 10)}...</div>
              <div>Balance: {relayer.status.balance} ETH</div>
              <div>Gas Price: {relayer.status.gasPrice} wei</div>
              <div>Block: {relayer.status.blockNumber}</div>
            </div>
          )}
          
          {relayer.error && (
            <div className="text-xs text-destructive ml-6">
              Error: {relayer.error}
            </div>
          )}
        </div>

        {/* Blockchain Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Blockchain</span>
            <Badge variant="success">Connected</Badge>
          </div>
          
          {relayer.status && (
            <div className="text-xs text-muted-foreground space-y-1 ml-6">
              <div>Chain ID: {relayer.status.chainId}</div>
              <div>Executor: {relayer.status.executorAddress?.slice(0, 10)}...</div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};
