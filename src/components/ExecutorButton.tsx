import { useState } from "react";
import { TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useExecutor } from "@/hooks/useExecutor";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ExecutorButtonProps {
  proposalId: string;
  isSigned: boolean;
  isExecuted?: boolean;
  canExecute: boolean;
  action: string;
}

export const ExecutorButton = ({
  proposalId,
  isSigned,
  isExecuted = false,
  canExecute,
  action,
}: ExecutorButtonProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { executeProposal, isExecuting } = useExecutor();

  const handleExecute = async () => {
    try {
      const result = await executeProposal(proposalId);
      toast({
        title: "Proposal Executed",
        description: `Transaction hash: ${(result as any).txHash}`,
      });
      setShowConfirmDialog(false);
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (isExecuted) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Executed
      </Badge>
    );
  }

  return (
    <>
      <Button
        size="sm"
        disabled={!canExecute || !isSigned}
        onClick={() => setShowConfirmDialog(true)}
        className="bg-accent hover:bg-accent/90"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Execute
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Execution</DialogTitle>
            <DialogDescription>
              Review the proposal before executing on-chain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium mb-2">Action</p>
              <p className="text-sm">{action}</p>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Status:</p>
              <Badge variant={isSigned ? "success" : "secondary"}>
                {isSigned ? "Signed" : "Unsigned"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Confirm Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
