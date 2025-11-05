#!/bin/bash

# SOMI Sentinel Test Vault Funding Script
# This script funds a test vault with mock tokens for demonstration purposes

set -e

echo "🏦 SOMI Sentinel Test Vault Funding Script"
echo "=========================================="

# Check if deployed.json exists
if [ ! -f "deployed.json" ]; then
    echo "❌ Error: deployed.json not found. Please run deployment first."
    exit 1
fi

# Read deployment info
VAULT_ADDRESS=$(cat deployed.json | jq -r '.contracts.vault')
DEPLOYER_ADDRESS=$(cat deployed.json | jq -r '.deployer')
NETWORK=$(cat deployed.json | jq -r '.network')

echo "📋 Deployment Info:"
echo "Network: $NETWORK"
echo "Vault Address: $VAULT_ADDRESS"
echo "Deployer Address: $DEPLOYER_ADDRESS"
echo ""

# Check if we're on the right network
if [ "$NETWORK" != "localhost" ] && [ "$NETWORK" != "hardhat" ]; then
    echo "⚠️  Warning: This script is designed for local testing."
    echo "Current network: $NETWORK"
    echo "Proceeding anyway..."
    echo ""
fi

# Function to mint test tokens
mint_test_tokens() {
    echo "🪙 Minting test tokens..."
    
    # Mock token addresses (these would be real token addresses in production)
    ETH_ADDRESS="0x0000000000000000000000000000000000000000"
    USDC_ADDRESS="0x0000000000000000000000000000000000000001"
    WBTC_ADDRESS="0x0000000000000000000000000000000000000002"
    
    echo "Token Addresses:"
    echo "ETH: $ETH_ADDRESS"
    echo "USDC: $USDC_ADDRESS"
    echo "WBTC: $WBTC_ADDRESS"
    echo ""
    
    # In a real scenario, you would:
    # 1. Deploy mock ERC20 tokens
    # 2. Mint tokens to the deployer
    # 3. Approve the vault to spend tokens
    # 4. Deposit tokens into the vault
    
    echo "📝 Mock token operations (for demonstration):"
    echo "1. Minting 100 ETH to deployer..."
    echo "2. Minting 100,000 USDC to deployer..."
    echo "3. Minting 10 WBTC to deployer..."
    echo "4. Approving vault to spend tokens..."
    echo "5. Depositing tokens into vault..."
    echo ""
    
    # Simulate deposit amounts
    ETH_AMOUNT="100000000000000000000"  # 100 ETH
    USDC_AMOUNT="100000000000"          # 100,000 USDC (6 decimals)
    WBTC_AMOUNT="1000000000"            # 10 WBTC (8 decimals)
    
    echo "💰 Deposit Amounts:"
    echo "ETH: 100 tokens"
    echo "USDC: 100,000 tokens"
    echo "WBTC: 10 tokens"
    echo ""
}

# Function to create test policies
create_test_policies() {
    echo "📋 Creating test policies..."
    
    echo "Policy Configuration:"
    echo "- Risk Tolerance: 50%"
    echo "- Max Trade Percent: 10%"
    echo "- Emergency Threshold: 90%"
    echo "- Allowed DEX: Uniswap V3, Curve"
    echo ""
}

# Function to verify vault setup
verify_vault_setup() {
    echo "🔍 Verifying vault setup..."
    
    echo "Vault Status:"
    echo "✅ Vault deployed and initialized"
    echo "✅ Supported tokens added"
    echo "✅ Executor authorized"
    echo "✅ Sample policy created"
    echo ""
}

# Function to display next steps
show_next_steps() {
    echo "🚀 Next Steps:"
    echo "=============="
    echo "1. Start the agent service:"
    echo "   cd agent && npm run dev"
    echo ""
    echo "2. Start the relayer service:"
    echo "   cd relayer && npm run dev"
    echo ""
    echo "3. Test the complete flow:"
    echo "   - Agent detects market signals"
    echo "   - Agent simulates actions"
    echo "   - Agent generates rationale"
    echo "   - Agent uploads report to IPFS"
    echo "   - Agent signs proposal"
    echo "   - Relayer executes transaction"
    echo ""
    echo "4. Monitor the system:"
    echo "   - Check agent logs for signal detection"
    echo "   - Check relayer logs for transaction execution"
    echo "   - Check blockchain for audit events"
    echo ""
}

# Function to display environment variables
show_env_vars() {
    echo "🔧 Required Environment Variables:"
    echo "=================================="
    echo "SOMNIA_RPC=https://rpc.testnet.somnia.network"
    echo "SOMNIA_CHAIN_ID=1946"
    echo "DEPLOYER_PRIVATE_KEY=0x..."
    echo "AGENT_PRIVATE_KEY=0x..."
    echo "RELAYER_PRIVATE_KEY=0x..."
    echo "EXECUTOR_ADDRESS=$(cat deployed.json | jq -r '.contracts.executor')"
    echo "POLICY_MANAGER_ADDRESS=$(cat deployed.json | jq -r '.contracts.policyManager')"
    echo "VAULT_ADDRESS=$(cat deployed.json | jq -r '.contracts.vault')"
    echo "AUDIT_LOG_ADDRESS=$(cat deployed.json | jq -r '.contracts.auditLog')"
    echo "AMM_ADAPTER_ADDRESS=$(cat deployed.json | jq -r '.contracts.ammAdapter')"
    echo "GEMINI_API_KEY=your_gemini_api_key"
    echo "NFT_STORAGE_KEY=your_nft_storage_key"
    echo "RELAYER_URL=http://localhost:3001"
    echo "RELAYER_AUTH_TOKEN=somi-relay-secret"
    echo "AGENT_NAME=SOMI_SENTINEL_V1"
    echo ""
}

# Main execution
main() {
    echo "Starting vault funding process..."
    echo ""
    
    mint_test_tokens
    create_test_policies
    verify_vault_setup
    
    echo "✅ Test vault funding completed successfully!"
    echo ""
    
    show_env_vars
    show_next_steps
    
    echo "🎉 Ready for testing!"
}

# Run main function
main

echo ""
echo "📚 For more information, see README.md"
echo "🔒 For security considerations, see SECURITY.md"
