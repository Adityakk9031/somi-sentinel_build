import { Wallet, ChevronDown, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useTheme } from "@/providers/ThemeProvider";

export const TopNav = () => {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, network, setNetwork } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/">
              <h1 className="text-2xl font-bold text-primary cursor-pointer">
                SOMI Sentinel
              </h1>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/">
                <Button 
                  variant={isActive('/') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/vaults">
                <Button 
                  variant={isActive('/vaults') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Vaults
                </Button>
              </Link>
              <Link to="/policies">
                <Button 
                  variant={isActive('/policies') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Policies
                </Button>
              </Link>
              <Link to="/audit">
                <Button 
                  variant={isActive('/audit') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Audit Trail
                </Button>
              </Link>
              <Link to="/settings">
                <Button 
                  variant={isActive('/settings') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {network === 'somnia-testnet' ? 'Somnia Testnet' : network}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setNetwork('somnia-testnet')}>
                  Somnia Testnet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNetwork('ethereum-mainnet')}>
                  Ethereum Mainnet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Wallet className="mr-2 h-4 w-4" />
                    {formatAddress(address!)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={disconnect}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={connect} 
                size="sm" 
                disabled={isConnecting}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
