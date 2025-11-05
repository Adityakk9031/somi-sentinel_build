import { TrendingUp, Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { Vault } from "@/hooks/useVaults";
import { useWallet } from "@/hooks/useWallet";
import { transactionManager } from "@/utils/transactionManager";
import { useState, useMemo, useEffect } from "react";

interface VaultCardProps extends Vault {}

// Simple price map for USDC conversion (demo)
const PRICE_USDC: Record<string, number> = {
  ETH: Number((import.meta as any)?.env?.VITE_PRICE_ETH_USDC || 2000),
  WETH: Number((import.meta as any)?.env?.VITE_PRICE_ETH_USDC || 2000),
  USDC: 1,
  WBTC: 50000,
};

const ETH_ZERO = '0x0000000000000000000000000000000000000000';

export const VaultCard = ({ 
  id,
  name, 
  address, 
  balance, 
  value, 
  tokens, 
  change24h, 
  riskScore,
  lastActivity,
  policy,
  recentExecutions 
}: VaultCardProps) => {
  const navigate = useNavigate();
  const { isConnected, connect } = useWallet();

  // Always include ETH in the selector, then append provided tokens (dedup by address)
  const selectableTokens = useMemo(() => {
    const list: any[] = [{ symbol: 'ETH', address: ETH_ZERO }];
    (tokens || []).forEach((t: any) => {
      if (!t?.address) return;
      if (!list.find((x) => x.address.toLowerCase() === t.address.toLowerCase())) {
        list.push(t);
      }
    });
    return list;
  }, [tokens]);

  const defaultToken = useMemo(() => {
    // prefer ETH
    const eth = selectableTokens.find((t: any) => t?.address === ETH_ZERO);
    return eth?.address || selectableTokens[0]?.address || ETH_ZERO;
  }, [selectableTokens]);

  const [selectedToken, setSelectedToken] = useState<string>(defaultToken);

  // Keep selection in sync when token list changes
  useEffect(() => {
    setSelectedToken((prev) => prev || defaultToken);
  }, [defaultToken]);

  const getSymbol = (addr: string) => {
    const found = selectableTokens.find((t: any) => t.address === addr);
    if (!found) return 'TOKEN';
    if (found.address === ETH_ZERO) return 'ETH';
    return found.symbol || 'TOKEN';
  };

  const toUsdc = (symbol: string, amountStr: string) => {
    const px = PRICE_USDC[symbol] || 1;
    const n = Number(amountStr);
    if (!isFinite(n)) return '0';
    return (n * px).toFixed(2);
  };

  const resolveTokenForTM = (addr: string) => {
    if (!addr || addr === ETH_ZERO) return 'ETH_NATIVE';
    return addr;
  };

  const ensureConnected = async () => {
    if (isConnected) return true;
    try {
      await connect();
      return true;
    } catch (e: any) {
      alert(`Please connect your wallet to continue. ${e?.message ? `\n\n${e.message}` : ''}`);
      return false;
    }
  };

  const handleDeposit = async () => {
    const ok = await ensureConnected();
    if (!ok) return;

    const tokenAddr = selectedToken || defaultToken;
    if (!tokenAddr) {
      alert("Please select a token to deposit.");
      return;
    }

    const symbol = getSymbol(tokenAddr);
    const amount = prompt(`Deposit to ${name}\n\nEnter amount to deposit (${symbol}):`);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return;
    }

    const approxUSDC = toUsdc(symbol === 'ETH' ? 'ETH' : symbol, amount);
    const confirmMessage = `Deposit ${amount} ${symbol} (≈ ${approxUSDC} USDC) to ${name}?\n\nVault: ${address}\nToken: ${symbol}\n\nThis may submit approval + deposit on Somnia Testnet.`;
    if (!confirm(confirmMessage)) return;

    try {
      const tokenForTM = resolveTokenForTM(tokenAddr);
      const result = await transactionManager.depositToVault(address, tokenForTM, amount);
      if (result.success) {
        alert(`✅ Deposit successful!\n\nTx: ${result.hash}\nAmount: ${amount} ${symbol} (≈ ${approxUSDC} USDC)\n\nExplorer: ${result.explorerUrl}`);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error: any) {
      alert(`❌ Failed to deposit: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    const ok = await ensureConnected();
    if (!ok) return;

    const tokenAddr = selectedToken || defaultToken;
    if (!tokenAddr) {
      alert("Please select a token to withdraw.");
      return;
    }

    const symbol = getSymbol(tokenAddr);
    const amount = prompt(`Withdraw from ${name}\n\nEnter amount to withdraw (${symbol}):`);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return;
    }

    const approxUSDC = toUsdc(symbol === 'ETH' ? 'ETH' : symbol, amount);
    const confirmMessage = `Withdraw ${amount} ${symbol} (≈ ${approxUSDC} USDC) from ${name}?\n\nVault: ${address}`;
    if (!confirm(confirmMessage)) return;

    try {
      const tokenForTM = resolveTokenForTM(tokenAddr);
      const result = await transactionManager.withdrawFromVault(address, tokenForTM, amount);
      if (result.success) {
        alert(`✅ Withdrawal successful!\n\nTx: ${result.hash}\nAmount: ${amount} ${symbol} (≈ ${approxUSDC} USDC)\n\nExplorer: ${result.explorerUrl}`);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error: any) {
      alert(`❌ Failed to withdraw: ${error.message}`);
    }
  };

  const handleViewVault = () => {
    navigate(`/vaults/${id}`);
  };

  const handleSetPolicy = () => {
    navigate('/policies');
  };
  const getRiskColor = (score: number) => {
    if (score >= 70) return "destructive";
    if (score >= 40) return "warning";
    return "success";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Badge variant={getRiskColor(riskScore)}>{getRiskLabel(riskScore)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token selector (ETH always available) */}
        {selectableTokens.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Token:</label>
            <select
              value={selectedToken || defaultToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="border rounded px-2 py-1 bg-background text-foreground text-sm"
            >
              {selectableTokens.map((t: any) => (
                <option key={t.address} value={t.address}>
                  {t.address === ETH_ZERO ? 'ETH (send native)' : (t.symbol || 'TOKEN')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleDeposit}>Deposit</Button>
          <Button variant="outline" size="sm" onClick={handleWithdraw}>Withdraw</Button>
          <Button variant="secondary" size="sm" className="col-span-2" onClick={handleViewVault}>
            View Vault
          </Button>
          <Button size="sm" className="col-span-2" onClick={handleSetPolicy}>
            Set Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
