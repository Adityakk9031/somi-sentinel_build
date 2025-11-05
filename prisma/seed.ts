import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed script...\n');

  // Read deployed.json if it exists
  let deployedData: any = null;
  const deployedJsonPath = path.join(__dirname, '../deployed.json');
  
  try {
    const deployedJson = fs.readFileSync(deployedJsonPath, 'utf-8');
    deployedData = JSON.parse(deployedJson);
    console.log('✅ Found deployed.json with contract addresses');
    console.log(`   Vault: ${deployedData.vault || 'N/A'}`);
    console.log(`   PolicyManager: ${deployedData.policyManager || 'N/A'}\n`);
  } catch (error) {
    console.log('⚠️  No deployed.json found, using default values\n');
  }

  // Create or update vault
  const vaultAddress = deployedData?.vault || '0x94C5661Ff1D5D914C01248baC4B348Fd03023FEB';
  const ownerWallet = '0x2d93D0D8573745eb53B46BECc7cBF7E59f185d8D'; // Deployer wallet
  
  console.log(`📦 Creating/updating vault: ${vaultAddress}`);
  
  const vault = await prisma.vault.upsert({
    where: { vaultAddress },
    update: {
      name: 'SOMI Sentinel Vault',
      description: 'Main DeFi vault for SOMI Sentinel system',
      supportedTokens: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', address: '0x0000000000000000000000000000000000000001' },
        { symbol: 'WBTC', address: '0x0000000000000000000000000000000000000002' },
      ],
      updatedAt: new Date(),
    },
    create: {
      vaultAddress,
      ownerWallet,
      name: 'SOMI Sentinel Vault',
      description: 'Main DeFi vault for SOMI Sentinel system',
      supportedTokens: [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', address: '0x0000000000000000000000000000000000000001' },
        { symbol: 'WBTC', address: '0x0000000000000000000000000000000000000002' },
      ],
      totalValueUsd: 0,
      onchainCreatedAt: new Date(),
    },
  });

  console.log(`✅ Vault ${vault.id} created/updated\n`);

  // Create a sample policy for the vault
  console.log('📜 Creating sample policy...');
  
  const policyData = {
    riskTolerance: 50,
    maxTradePercent: 10,
    emergencyThreshold: 90,
    allowedDex: ['0x1111111111111111111111111111111111111111'],
    maxSlippage: 0.5,
    minLiquidity: 10000,
    allowedTokens: ['ETH', 'USDC', 'WBTC'],
  };

  // Check if there's already an active policy
  const existingPolicy = await prisma.policy.findFirst({
    where: {
      vaultAddress,
      active: true,
    },
  });

  if (existingPolicy) {
    console.log('⚠️  Active policy already exists, skipping policy creation');
  } else {
    const policy = await prisma.policy.create({
      data: {
        vaultAddress,
        policyJson: policyData,
        active: true,
        version: 1,
        setBy: ownerWallet,
        deployedTx: deployedData?.policyManager || null,
      },
    });
    
    console.log(`✅ Policy ${policy.id} created with version ${policy.version}\n`);
  }

  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Vaults: 1`);
  console.log(`   - Policies: ${existingPolicy ? '1 (existing)' : '1 (new)'}`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Start your backend: npm run dev:backend');
  console.log('   2. Start your agent: npm run dev:agent');
  console.log('   3. Start your frontend: npm run dev:frontend');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

