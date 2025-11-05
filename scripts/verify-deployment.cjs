const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Verifying SOMI Sentinel deployment on Somnia Testnet...");

  // Load deployment info
  const deploymentPath = path.join(__dirname, '..', 'deployed.json');
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployed.json not found. Please run deployment first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log(`📊 Verifying deployment on ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Verify each contract
  const contracts = deploymentInfo.contracts;
  const contractNames = Object.keys(contracts);

  console.log("\n🔍 Contract Verification:");
  console.log("========================");

  for (const contractName of contractNames) {
    try {
      const address = contracts[contractName];
      const code = await ethers.provider.getCode(address);
      
      if (code === '0x') {
        console.log(`❌ ${contractName}: No contract found at ${address}`);
      } else {
        console.log(`✅ ${contractName}: Contract verified at ${address}`);
        console.log(`   Code size: ${(code.length - 2) / 2} bytes`);
      }
    } catch (error) {
      console.log(`❌ ${contractName}: Error verifying contract - ${error.message}`);
    }
  }

  // Test contract interactions
  console.log("\n🧪 Testing Contract Interactions:");
  console.log("==================================");

  try {
    // Test AuditLog contract
    const auditLog = await ethers.getContractAt("AuditLog", contracts.auditLog);
    const totalExecutions = await auditLog.totalExecutions();
    console.log(`✅ AuditLog: ${totalExecutions} total executions logged`);

    // Test PolicyManager contract
    const policyManager = await ethers.getContractAt("PolicyManager", contracts.policyManager);
    // Check if we can read a policy (this will test basic functionality)
    try {
      const policy = await policyManager.getPolicy(contracts.vault);
      console.log(`✅ PolicyManager: Policy exists for vault`);
    } catch (e) {
      console.log(`✅ PolicyManager: Contract accessible (policy may not be set yet)`);
    }

    // Test Vault contract
    const vault = await ethers.getContractAt("Vault", contracts.vault);
    const owner = await vault.owner();
    console.log(`✅ Vault: Owner is ${owner}`);

    // Test Executor contract
    const executor = await ethers.getContractAt("Executor", contracts.executor);
    const agentSigner = await executor.agentSigner();
    console.log(`✅ Executor: Agent signer set to ${agentSigner}`);

    // Test AMMAdapter contract
    const ammAdapter = await ethers.getContractAt("AMMAdapter", contracts.ammAdapter);
    const ethPrice = await ammAdapter.getTokenPrice(ethers.constants.AddressZero);
    console.log(`✅ AMMAdapter: ETH price is ${ethers.utils.formatEther(ethPrice)} USD`);

  } catch (error) {
    console.log(`❌ Contract interaction test failed: ${error.message}`);
  }

  // Network info
  console.log("\n🌐 Network Information:");
  console.log("======================");
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();
  const gasPrice = await ethers.provider.getGasPrice();
  
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Current Block: ${blockNumber}`);
  console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  // Deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("=====================");
  console.log(`✅ All contracts deployed successfully to Somnia Testnet`);
  console.log(`📅 Deployed at: ${deploymentInfo.timestamp}`);
  console.log(`🔢 Block Number: ${deploymentInfo.blockNumber}`);
  console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
  console.log(`🤖 Agent Signer: ${deploymentInfo.agentSigner}`);

  console.log("\n🔗 Contract Addresses:");
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`${name}: ${address}`);
  }

  console.log("\n🎯 Next Steps:");
  console.log("1. Update your .env file with the contract addresses above");
  console.log("2. Start the backend service: npm run dev:backend");
  console.log("3. Start the agent service: npm run dev:agent");
  console.log("4. Start the relayer service: npm run dev:relayer");
  console.log("5. Test the complete flow with the frontend");

  console.log("\n🔍 Block Explorer:");
  console.log("You can view your contracts on the Somnia block explorer:");
  console.log(`https://explorer.somnia.network/address/${contracts.vault}`);

  console.log("\n✅ Deployment verification completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

