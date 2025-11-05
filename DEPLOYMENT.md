# SOMI Sentinel Contract Deployment Guide

## 🚀 Complete Deployment Process

### Step 1: Environment Setup

1. **Create `.env` file in root directory:**
```bash
# Copy the environment template
cp env.example .env
```

2. **Edit `.env` file with your values:**
```env
# Network Configuration
SOMNIA_RPC=https://rpc.testnet.somnia.network
SOMNIA_CHAIN_ID=1946

# Your private key (replace with your actual key)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# AI Services (optional for deployment)
GEMINI_API_KEY=your_gemini_api_key
NFT_STORAGE_KEY=your_nft_storage_key
```

### Step 2: Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Return to root
cd ..
```

### Step 3: Compile Contracts

```bash
cd contracts
npm run compile
```

### Step 4: Run Tests (Optional)

```bash
cd contracts
npm test
```

### Step 5: Deploy to Somnia Testnet

```bash
cd contracts
npm run deploy:somnia
```

### Step 6: Update Environment Variables

After deployment, the script will output contract addresses. Update your `.env` file:

```env
EXECUTOR_ADDRESS=0x... # From deployment output
POLICY_MANAGER_ADDRESS=0x... # From deployment output
VAULT_ADDRESS=0x... # From deployment output
AUDIT_LOG_ADDRESS=0x... # From deployment output
AMM_ADAPTER_ADDRESS=0x... # From deployment output
```

### Step 7: Fund Test Vault (Optional)

```bash
# Fund the deployed vault with test tokens
bash scripts/fund-test-vault.sh
```

## 🔧 Deployment Commands

### Available Commands:

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npm run deploy:local

# Deploy to Somnia Testnet
npm run deploy:somnia

# Start local Hardhat node
npm run node

# Clean artifacts
npm run clean
```

## 📋 Deployment Checklist

- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Contracts compiled
- [ ] Tests passed (optional)
- [ ] Deployed to Somnia Testnet
- [ ] Contract addresses updated in .env
- [ ] Vault funded (optional)

## 🚨 Important Notes

1. **Private Key Security**: Never commit your private key to Git
2. **Testnet Only**: This deploys to Somnia Testnet, not mainnet
3. **Gas Fees**: You need some SOMI tokens for gas fees
4. **Network**: Make sure you're connected to Somnia Testnet

## 🔍 Verification

After deployment, you can verify the contracts on Somnia Explorer:
- Go to https://explorer.testnet.somnia.network
- Search for your contract addresses
- Verify the deployment was successful

## 🆘 Troubleshooting

### Common Issues:

1. **"Invalid private key"**: Make sure your private key is correct
2. **"Insufficient funds"**: Get testnet SOMI tokens from faucet
3. **"Network error"**: Check your RPC URL and network connection
4. **"Gas estimation failed"**: Try increasing gas limit

### Getting Testnet Tokens:

1. Visit Somnia Testnet Faucet
2. Connect your wallet
3. Request testnet SOMI tokens
4. Wait for confirmation

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify your environment variables
3. Ensure you have testnet tokens
4. Check network connectivity
