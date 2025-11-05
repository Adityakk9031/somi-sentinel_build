import { useState } from "react";
import { Search } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { VaultCard } from "@/components/VaultCard";
import { CreateVaultDialog } from "@/components/CreateVaultDialog";
import { Input } from "@/components/ui/input";
import { useVaults } from "@/hooks/useVaults";
import { motion } from "framer-motion";

const Vaults = () => {
  const { vaults, isLoading, addVault, refreshVaults } = useVaults();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVaults = vaults.filter(vault =>
    vault.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Vaults</h2>
          <p className="text-muted-foreground">
            Manage your DeFi vaults and monitor their performance
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vaults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <CreateVaultDialog onVaultCreated={(vaultData) => {
            console.log("New vault created:", vaultData);
            // Refresh the list to get all vaults including stored ones
            refreshVaults();
          }} />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVaults.map((vault, index) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VaultCard {...vault} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Vaults;
