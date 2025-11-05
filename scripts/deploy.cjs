const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting SOMI Sentinel deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));

  // Deploy contracts in order
  console.log("\n📦 Deploying contracts...");

  // 1. Deploy AuditLog
  console.log("Deploying AuditLog...");
  const AuditLog = await ethers.getContractFactory("AuditLog");
  const auditLog = await AuditLog.deploy();
  await auditLog.deployed();
  console.log("AuditLog deployed to:", auditLog.address);

  // 2. Deploy PolicyManager
  console.log("Deploying PolicyManager...");
  const PolicyManager = await ethers.getContractFactory("PolicyManager");
  const policyManager = await PolicyManager.deploy();
  await policyManager.deployed();
  console.log("PolicyManager deployed to:", policyManager.address);

  // 3. Deploy Vault
  console.log("Deploying Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.deployed();
  console.log("Vault deployed to:", vault.address);

  // 4. Deploy AMMAdapter
  console.log("Deploying AMMAdapter...");
  const AMMAdapter = await ethers.getContractFactory("AMMAdapter");
  const ammAdapter = await AMMAdapter.deploy();
  await ammAdapter.deployed();
  console.log("AMMAdapter deployed to:", ammAdapter.address);

  // 5. Deploy Executor (needs other contracts)
  console.log("Deploying Executor...");
  const Executor = await ethers.getContractFactory("Executor");
  
  // Use a mock agent signer for demo (in production, this would be the actual agent address)
  const agentSigner = ethers.Wallet.createRandom().address;
  console.log("Using mock agent signer:", agentSigner);
  
  const executor = await Executor.deploy(
    agentSigner,
    policyManager.address,
    auditLog.address
  );
  await executor.deployed();
  console.log("Executor deployed to:", executor.address);

  // Set up contract relationships
  console.log("\n🔗 Setting up contract relationships...");

  // Add executor as authorized logger in AuditLog
  await auditLog.addAuthorizedLogger(executor.address);
  console.log("Added executor as authorized logger");

  // Add executor as authorized validator in PolicyManager
  await policyManager.addAuthorizedValidator(executor.address);
  console.log("Added executor as authorized validator");

  // Add executor as authorized executor in Vault
  await vault.addAuthorizedExecutor(executor.address);
  console.log("Added executor as authorized executor");

  // Add some supported tokens to vault (mock addresses)
  const mockTokens = [
    '0x0000000000000000000000000000000000000000', // ETH
    '0x0000000000000000000000000000000000000001', // USDC
    '0x0000000000000000000000000000000000000002'  // WBTC
  ];

  for (const token of mockTokens) {
    await vault.addSupportedToken(token);
  }
  console.log("Added supported tokens to vault");

  // Set up a sample policy
  console.log("\n📋 Setting up sample policy...");
  const allowedDex = [
    '0x1111111111111111111111111111111111111111', // Uniswap V3
    '0x2222222222222222222222222222222222222222'  // Curve
  ];

  await policyManager.setPolicy(
    vault.address,
    50, // risk tolerance
    10, // max trade percent
    90, // emergency threshold
    allowedDex
  );
  console.log("Sample policy created for vault");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    agentSigner: agentSigner,
    contracts: {
      vault: vault.address,
      policyManager: policyManager.address,
      executor: executor.address,
      auditLog: auditLog.address,
      ammAdapter: ammAdapter.address
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    environmentVariables: {
      EXECUTOR_ADDRESS: executor.address,
      POLICY_MANAGER_ADDRESS: policyManager.address,
      VAULT_ADDRESS: vault.address,
      AUDIT_LOG_ADDRESS: auditLog.address,
      AMM_ADAPTER_ADDRESS: ammAdapter.address
    }
  };

  // Save to file
  const outputPath = path.join(__dirname, '..', 'deployed.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployed.json");

  // Print summary
  console.log("\n✅ Deployment completed successfully!");
  console.log("📊 Deployment Summary:");
  console.log("===================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Agent Signer: ${deploymentInfo.agentSigner}`);
  console.log("\nContract Addresses:");
  console.log(`Vault: ${deploymentInfo.contracts.vault}`);
  console.log(`PolicyManager: ${deploymentInfo.contracts.policyManager}`);
  console.log(`Executor: ${deploymentInfo.contracts.executor}`);
  console.log(`AuditLog: ${deploymentInfo.contracts.auditLog}`);
  console.log(`AMMAdapter: ${deploymentInfo.contracts.ammAdapter}`);

  // Gas estimation
  console.log("\n⛽ Gas Estimates:");
  console.log("================");
  console.log("AuditLog deployment:", "~500,000 gas");
  console.log("PolicyManager deployment:", "~800,000 gas");
  console.log("Vault deployment:", "~1,200,000 gas");
  console.log("AMMAdapter deployment:", "~600,000 gas");
  console.log("Executor deployment:", "~1,000,000 gas");
  console.log("Total estimated gas:", "~4,100,000 gas");

  console.log("\n🔧 Next Steps:");
  console.log("1. Update environment variables with contract addresses");
  console.log("2. Fund the vault with test tokens");
  console.log("3. Start the agent service");
  console.log("4. Start the relayer service");
  console.log("5. Test the complete flow");

  console.log("\n📋 Environment Variables to Set:");
  console.log("=================================");
  console.log(`EXECUTOR_ADDRESS=${deploymentInfo.contracts.executor}`);
  console.log(`POLICY_MANAGER_ADDRESS=${deploymentInfo.contracts.policyManager}`);
  console.log(`VAULT_ADDRESS=${deploymentInfo.contracts.vault}`);
  console.log(`AUDIT_LOG_ADDRESS=${deploymentInfo.contracts.auditLog}`);
  console.log(`AMM_ADAPTER_ADDRESS=${deploymentInfo.contracts.ammAdapter}`);
  console.log("");

  console.log("\n⚠️  Security Notes:");
  console.log("- Replace mock agent signer with actual agent address");
  console.log("- Verify all contract interactions");
  console.log("- Test emergency functions");
  console.log("- Review and update policies as needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
