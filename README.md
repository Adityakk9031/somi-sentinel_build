# SOMI Sentinel

A comprehensive DeFi vault management system with AI-powered risk assessment and automated execution capabilities, built for the Somnia Testnet.

## 🏗️ Architecture

SOMI Sentinel consists of four main components:

- **Smart Contracts** - Core vault, policy management, and execution logic
- **Agent Service** - Off-chain AI agent for market analysis and proposal generation
- **Relayer Service** - Transaction relay and execution service
- **Frontend** - React-based user interface (already implemented)

## 📁 Project Structure

```
somi-sentinel-lovable-main/
├── src/                       # Frontend + Backend + Agent + Relayer + Contracts (integrated)
│   ├── backend/               # Backend API server (Express/TypeScript)
│   │   └── server.ts         # Main backend server
│   ├── agent/                 # AI Agent service (Node.js/TypeScript)
│   │   ├── collector.ts       # Market signal collection
│   │   ├── simulator.ts       # Deterministic simulation engine
│   │   ├── gemini-client.ts   # AI rationale generation
│   │   ├── signer.ts          # Proposal signing and validation
│   │   ├── uploader.ts        # IPFS report upload
│   │   ├── index.ts           # Main agent loop
│   │   └── test/              # Agent unit tests
│   ├── relayer/               # Relayer service (Express/TypeScript)
│   │   ├── server.ts          # Express server setup
│   │   └── relayController.ts # Transaction relay logic
│   ├── contracts/             # Smart contracts (Hardhat project)
│   │   ├── Vault.sol          # Core vault contract
│   │   ├── PolicyManager.sol  # Policy validation and management
│   │   ├── Executor.sol       # Proposal execution with signature verification
│   │   ├── AuditLog.sol       # On-chain execution logging
│   │   ├── adapters/          # Protocol adapters (AMM, lending)
│   │   ├── test/              # Contract unit tests
│   │   └── scripts/           # Deployment scripts
│   ├── components/            # React components
│   ├── hooks/                 # React hooks
│   ├── pages/                 # React pages
│   └── providers/             # React context providers
├── scripts/                   # Deployment and utility scripts
│   ├── deploy.js              # Contract deployment script
│   ├── start-all.sh           # Start all services
│   ├── start-integrated.sh    # Start frontend + backend
│   └── fund-test-vault.sh     # Test vault funding script
└── package.json               # Main project dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd somi-sentinel-lovable-main

# Clean install all dependencies (recommended)
bash scripts/clean-install.sh

# Or install manually:
# Install main dependencies (includes all services)
npm install
```

### 2. Environment Setup

Create `.env` files in each service directory:

**contracts/.env**
```env
SOMNIA_RPC=https://rpc.testnet.somnia.network
SOMNIA_CHAIN_ID=1946
DEPLOYER_PRIVATE_KEY=0x...
```

**Main .env (for agent, backend, and frontend)**
```env
SOMNIA_RPC=https://rpc.testnet.somnia.network
SOMNIA_CHAIN_ID=1946
AGENT_PRIVATE_KEY=0x...
EXECUTOR_ADDRESS=0x...
POLICY_MANAGER_ADDRESS=0x...
VAULT_ADDRESS=0x...
GEMINI_API_KEY=your_gemini_api_key
NFT_STORAGE_KEY=your_nft_storage_key
RELAYER_URL=http://localhost:3001
RELAYER_AUTH_TOKEN=somi-relay-secret
AGENT_NAME=SOMI_SENTINEL_V1
REPORT_DIR=./reports
ENABLE_DEBUG_LOGS=false
```

**Main .env (for all services)**
```env
SOMNIA_RPC=https://rpc.testnet.somnia.network
SOMNIA_CHAIN_ID=1946
RELAYER_PRIVATE_KEY=0x...
EXECUTOR_ADDRESS=0x...
RELAYER_AUTH_TOKEN=somi-relay-secret
PORT=3001
ENABLE_DEBUG_LOGS=false
```

### 3. Database Setup (Prisma ORM)

SOMI Sentinel uses Prisma ORM with PostgreSQL for persistent storage. Follow these steps to set up your database:

#### 3.1. Configure Database URL

Add the following to your `.env` file:

```env
# Database connection string
# For local PostgreSQL:
DATABASE_URL="postgresql://user:password@localhost:5432/somi_sentinel?schema=public"

# For Supabase:
# DATABASE_URL="postgresql://postgres:password@your-project.supabase.co:5432/postgres?schema=public"

# For other PostgreSQL providers, use their connection string
```

Replace the connection string with your actual database credentials.

#### 3.2. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client TypeScript types based on your schema.

#### 3.3. Run Database Migrations

```bash
npm run prisma:migrate
```

This creates the database tables (Vault, Policy, Proposal, AuditEvent, User).

#### 3.4. Seed the Database

```bash
npm run prisma:seed
```

This creates initial vault and policy data from your `deployed.json` file.

#### 3.5. (Optional) Open Prisma Studio

To view and manage your database visually:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can explore your database.

**Database Models:**
- `User` - User wallet addresses and profiles
- `Vault` - DeFi vault information and metadata
- `Policy` - Vault policy configurations with versioning
- `Proposal` - AI agent proposals with execution status
- `AuditEvent` - On-chain events and audit logs

### 4. Deploy Contracts

```bash
# Compile contracts
npm run compile

# Run tests
npm run test:contracts

# Deploy to Somnia Testnet
npm run deploy:somnia

# Or deploy locally
npm run deploy:local
```

### 5. Start the Application

**Option 1: Start Integrated Frontend + Backend (Recommended)**
```bash
# Start both frontend and backend together
npm run dev

# Or use the integrated script
bash scripts/start-integrated.sh
```

**Option 2: Start All Services (Full System)**
```bash
# Linux/Mac
bash scripts/start-all.sh

# Windows
scripts/start-all.bat
```

**Option 3: Start Services Individually**
```bash
# Terminal 1 - Frontend only
npm run dev:frontend

# Terminal 2 - Backend only
npm run dev:backend

# Terminal 3 - Agent only
npm run dev:agent

# Terminal 4 - Relayer only
npm run dev:relayer
```

### 5. Test Integration

```bash
# Run comprehensive integration tests
bash scripts/test-integration.sh

# Check system status
bash scripts/check-status.sh

# Stop all services
bash scripts/stop-all.sh
```

## 🏗️ Complete System Architecture

The SOMI Sentinel system consists of four main components working together:

### 1. **Frontend** (React + TypeScript)
- **Port**: 5173
- **Purpose**: User interface for vault management and monitoring
- **Features**: Real-time vault data, policy management, system status monitoring
- **Integration**: Connects to Backend API for all data operations

### 2. **Backend API** (Express + TypeScript)
- **Port**: 3000
- **Purpose**: Bridge between frontend and blockchain contracts
- **Features**: Contract data aggregation, API endpoints, health monitoring
- **Endpoints**:
  - `GET /api/vaults` - List all vaults
  - `GET /api/vaults/:id` - Get vault details
  - `GET /api/proposals/:id` - Get proposal details
  - `GET /api/agent/status` - Agent status
  - `GET /api/relayer/status` - Relayer status

### 3. **Agent Service** (Node.js + TypeScript)
- **Port**: 3002
- **Purpose**: AI-powered market monitoring and proposal generation
- **Features**: Signal collection, simulation, rationale generation, IPFS upload
- **Integration**: Sends signed proposals to Relayer

### 4. **Relayer Service** (Express + TypeScript)
- **Port**: 3001
- **Purpose**: Transaction execution on blockchain
- **Features**: Signature verification, gas estimation, transaction submission
- **Integration**: Receives proposals from Agent, executes on Executor contract

### 5. **Smart Contracts** (Solidity)
- **Network**: Somnia Testnet
- **Contracts**: Vault, PolicyManager, Executor, AuditLog, AMMAdapter
- **Purpose**: On-chain asset management and policy enforcement

## 🔄 Complete Data Flow

```
1. Agent monitors blockchain → Detects market signals
2. Agent simulates actions → Generates AI rationale
3. Agent uploads report to IPFS → Signs proposal
4. Agent sends to Relayer → Relayer verifies signature
5. Relayer executes on Executor → Contract validates policy
6. Contract executes on Vault → Emits audit event
7. Backend reads contract data → Serves to Frontend
8. Frontend displays results → User sees updated vault state
```

## 🔧 Configuration

The contracts support the following networks:
- `hardhat` - Local development
- `localhost` - Local Hardhat node
- `somniaTestnet` - Somnia Testnet

### Agent Configuration

The agent can be configured via environment variables:

- `POLLING_INTERVAL` - Signal collection interval (default: 60000ms)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)
- `TIMEOUT` - Request timeout (default: 30000ms)

### Relayer Configuration

The relayer supports the following settings:

- `MAX_GAS_PRICE` - Maximum gas price (default: 100 gwei)
- `MAX_GAS_LIMIT` - Maximum gas limit (default: 500000)
- `TIMEOUT` - Transaction timeout (default: 5 minutes)

## 🧪 Testing

### Contract Tests

```bash
cd contracts
npm test
```

### Agent Tests

```bash
cd agent
npm test
```

### Relayer Tests

```bash
cd relayer
npm test
```

## 📊 Demo Script

To demonstrate the complete system:

1. **Deploy contracts** to Somnia Testnet
2. **Fund test vault** with mock tokens
3. **Start agent** - it will detect market signals
4. **Start relayer** - it will execute proposals
5. **Monitor execution** - check logs and blockchain events

### Expected Flow

1. Agent collects market signals (price changes, volume spikes, oracle drift)
2. Agent simulates potential actions (swaps, lending, borrowing)
3. Agent generates AI rationale using Gemini
4. Agent uploads simulation report to IPFS
5. Agent signs proposal with ECDSA signature
6. Relayer validates signature and executes transaction
7. Executor contract verifies policy compliance
8. Transaction is executed and logged to AuditLog

## 🔒 Security Considerations

### Private Keys

- **Never commit private keys** to version control
- Use environment variables or secure key management
- Rotate keys regularly in production
- Consider using hardware wallets for production

### Agent Security

- Agent signer should have limited permissions
- Implement nonce-based replay protection
- Use deadline-based expiration
- Monitor for unusual activity

### Contract Security

- All contracts include emergency pause functionality
- Policy validation prevents unauthorized actions
- Signature verification ensures only authorized agents can execute
- Audit logging provides full transparency

## 🛠️ Development

### Adding New Action Types

1. Update `ActionType` enum in contracts and agent
2. Add validation logic in `PolicyManager`
3. Implement simulation in `Simulator`
4. Add tests for new action type

### Adding New Protocols

1. Create adapter contract in `adapters/`
2. Update `PolicyManager` to support new protocol
3. Add protocol-specific simulation logic
4. Update frontend to display new protocol

### Customizing AI Rationale

1. Modify prompts in `gemini-client.ts`
2. Adjust temperature and other parameters
3. Add custom validation logic
4. Test with different market conditions

## 📈 Monitoring

### Logs

All services use Winston for structured logging:
- Agent logs: `agent/logs/`
- Relayer logs: `relayer/logs/`

### Metrics

Key metrics to monitor:
- Signal detection rate
- Simulation accuracy
- Execution success rate
- Gas usage
- IPFS upload success

### Alerts

Set up alerts for:
- Failed transactions
- High gas prices
- Policy violations
- Agent downtime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the documentation
- Review the test cases
- Open an issue on GitHub
- Contact the development team

## 🔄 Updates

This system is designed to be modular and extensible. Regular updates will include:
- New protocol integrations
- Enhanced AI capabilities
- Improved security measures
- Performance optimizations

---

**⚠️ Disclaimer**: This is a demonstration system. For production use, conduct thorough security audits and testing.