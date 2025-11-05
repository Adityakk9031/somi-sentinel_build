import { ethers } from 'ethers';

export interface TransactionParams {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionResult {
  hash: string;
  explorerUrl: string;
  success: boolean;
  error?: string;
}

// Vault contract ABI for deposit and withdraw functions
const VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external"
];

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 value) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Minimal WETH ABI
const WETH_ABI = [
  "function deposit() external payable",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
// WETH address on Somnia Testnet (use a common address or deploy one)
// For demo purposes, using a mock WETH address - replace with actual deployed WETH contract
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Common WETH address on testnets

export class TransactionManager {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
      // signer is set lazily in ensureProvider
    }
  }

  private async ensureProvider(): Promise<void> {
    if (!this.provider) {
      this.initializeProvider();
      if (!this.provider) {
        throw new Error('Web3 provider not available. Please install MetaMask or another Web3 wallet.');
      }
    }

    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error('Ethereum provider not found. Please install MetaMask.');
    }

    // Get accounts; if none, prompt connection
    let accounts: string[] = await this.provider.listAccounts();
    if (accounts.length === 0) {
      try {
        // Try the standard connect flow
        await eth.request({ method: 'eth_requestAccounts' });
      } catch (reqErr: any) {
        if (reqErr?.code === -32002) {
          // Request already pending in MetaMask
          throw new Error('MetaMask request already pending. Open MetaMask and approve.');
        }
        // Some wallets require explicit permissions first
        try {
          await eth.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (permErr: any) {
          if (permErr?.code === 4001) {
            throw new Error('User rejected wallet connection.');
          }
          throw new Error(`Failed to connect wallet: ${permErr?.message || 'Unknown error'}`);
        }
      }

      // Re-read accounts after requesting connection
      accounts = await this.provider.listAccounts();
    }

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }

    this.signer = this.provider.getSigner();
  }

  private async switchToSomniaNetwork(): Promise<void> {
    const eth = (window as any).ethereum;
    if (!eth) {
      throw new Error('Ethereum provider not found. Please install MetaMask.');
    }

    // Prefer env configuration when present
    const envChainId = (import.meta as any)?.env?.VITE_SOMNIA_CHAIN_ID || (window as any)?.SOMNIA_CHAIN_ID;
    const envRpc = (import.meta as any)?.env?.VITE_SOMNIA_RPC || (window as any)?.SOMNIA_RPC;

    const chainIdNum: number = envChainId ? Number(envChainId) : 50312; // default per env.example
    const rpcUrl: string = envRpc || 'https://dream-rpc.somnia.network';
    const networkName = 'Somnia Testnet';
    const blockExplorer = 'https://explorer.somnia.network';

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainIdNum.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainIdNum.toString(16)}`,
                chainName: networkName,
                nativeCurrency: { name: 'Somnia', symbol: 'SOM', decimals: 18 },
                rpcUrls: [rpcUrl],
                blockExplorerUrls: [blockExplorer],
              },
            ],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add ${networkName} to MetaMask: ${addError?.message || 'Unknown error'}`);
        }
      } else if (switchError?.code === 4001) {
        throw new Error('User rejected network switch.');
      } else {
        throw new Error(`Failed to switch to ${networkName}: ${switchError?.message || 'Unknown error'}`);
      }
    }
  }

  private async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    try {
      await this.ensureProvider();
      if (!this.signer) throw new Error('Signer not available');

      await this.switchToSomniaNetwork();

      let value = ethers.BigNumber.from(0);
      if (params.value) value = ethers.utils.parseEther(params.value);

      const tx = await this.signer.sendTransaction({
        to: params.to,
        value,
        data: params.data || '0x',
        gasLimit: params.gasLimit ? ethers.BigNumber.from(params.gasLimit) : undefined,
      });

      const receipt = await tx.wait();
      const explorerUrl = `https://explorer.somnia.network/tx/${tx.hash}`;
      return { hash: tx.hash, explorerUrl, success: true };
    } catch (error: any) {
      let errorMessage = 'Transaction failed';
      if (error?.code === 4001) errorMessage = 'User rejected the transaction';
      else if (error?.code === -32002) errorMessage = 'Request pending in MetaMask. Open it and approve.';
      else if (error?.message) errorMessage = error.message;
      return { hash: '', explorerUrl: '', success: false, error: errorMessage };
    }
  }

  /**
   * Apply policy to vault
   */
  async applyPolicy(vaultAddress: string, policyData: any): Promise<TransactionResult> {
    return this.sendTransaction({ to: vaultAddress, value: '0', gasLimit: '200000' });
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    try {
      await this.ensureProvider();
      if (!this.signer) throw new Error('Signer not available');
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const dec: number = await token.decimals();
      return dec || 18;
    } catch {
      return 18; // fallback
    }
  }

  private async ensureAllowance(tokenAddress: string, owner: string, spender: string, amount: ethers.BigNumber): Promise<void> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer!);
    const current: ethers.BigNumber = await token.allowance(owner, spender);
    if (current.gte(amount)) return;
    const tx = await token.approve(spender, amount);
    await tx.wait();
  }

  /**
   * Deposit to vault using ERC20 token or native ETH
   * For native ETH, wrap to WETH first, then deposit WETH as ERC20
   */
  async depositToVault(vaultAddress: string, tokenAddress: string, amount: string): Promise<TransactionResult> {
    try {
      await this.ensureProvider();
      if (!this.signer) throw new Error('Signer not available');
      await this.switchToSomniaNetwork();

      const owner = await this.signer.getAddress();

      const isEthNative = !tokenAddress || tokenAddress === ZERO_ADDRESS || tokenAddress === 'ETH_NATIVE';

      if (isEthNative) {
        // Wrap ETH to WETH first, then deposit WETH
        const amountEth = ethers.utils.parseEther(amount);
        
        try {
          // Step 1: Wrap ETH to WETH
          const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, this.signer);
          console.log('📦 Wrapping ETH to WETH...');
          const wrapTx = await wethContract.deposit({
            value: amountEth,
            gasLimit: ethers.BigNumber.from('100000')
          });
          const wrapReceipt = await wrapTx.wait();
          if (wrapReceipt.status === 0) throw new Error('WETH wrap transaction reverted.');
          console.log('✅ Wrapped ETH to WETH:', wrapTx.hash);

          // Step 2: Approve WETH for vault
          await this.ensureAllowance(WETH_ADDRESS, owner, vaultAddress, amountEth);

          // Step 3: Deposit WETH to vault
          const vault = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
          console.log('📥 Depositing WETH to vault...');
          const depositTx = await vault.deposit(WETH_ADDRESS, amountEth, { 
            gasLimit: ethers.BigNumber.from('250000') 
          });
          const depositReceipt = await depositTx.wait();
          if (depositReceipt.status === 0) throw new Error('Deposit transaction reverted. The vault may not support WETH token.');

          const explorerUrl = `https://explorer.somnia.network/tx/${depositTx.hash}`;
          return { 
            hash: depositTx.hash, 
            explorerUrl, 
            success: true 
          };
        } catch (wrapError: any) {
          // If WETH contract doesn't exist or wrapping fails, provide helpful error
          if (wrapError?.code === 'CALL_EXCEPTION' || wrapError?.message?.includes('revert')) {
            throw new Error('WETH contract not found or wrapping failed. Please ensure WETH is deployed on Somnia Testnet, or use an ERC20 token directly.');
          }
          throw wrapError;
        }
      }

      // ERC20 path (direct token deposit)
      const decimals = await this.getTokenDecimals(tokenAddress);
      const amountUnits = ethers.utils.parseUnits(amount, decimals);

      // Ensure allowance
      await this.ensureAllowance(tokenAddress, owner, vaultAddress, amountUnits);

      // Call deposit
      const vault = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
      const tx = await vault.deposit(tokenAddress, amountUnits, { gasLimit: ethers.BigNumber.from('250000') });
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error('Transaction reverted.');

      const explorerUrl = `https://explorer.somnia.network/tx/${tx.hash}`;
      return { hash: tx.hash, explorerUrl, success: true };
    } catch (error: any) {
      let errorMessage = 'Deposit failed';
      if (error?.code === 4001) errorMessage = 'User rejected the transaction';
      else if (error?.code === -32002) errorMessage = 'Request pending in MetaMask. Open it and approve.';
      else if (error?.reason || error?.message) errorMessage = error.reason || error.message;
      else if (error?.error?.message) errorMessage = error.error.message;
      
      // Extract revert reason if available
      if (error?.data) {
        try {
          const decoded = ethers.utils.defaultAbiCoder.decode(['string'], error.data);
          if (decoded[0]) errorMessage = decoded[0];
        } catch {}
      }
      
      return { hash: '', explorerUrl: '', success: false, error: errorMessage };
    }
  }

  /**
   * Withdraw from vault using ERC20 token (ETH native not supported by contract)
   */
  async withdrawFromVault(vaultAddress: string, tokenAddress: string, amount: string): Promise<TransactionResult> {
    try {
      await this.ensureProvider();
      if (!this.signer) throw new Error('Signer not available');
      await this.switchToSomniaNetwork();

      const isEthNative = !tokenAddress || tokenAddress === ZERO_ADDRESS || tokenAddress === 'ETH_NATIVE';
      if (isEthNative) {
        throw new Error('Withdrawing native ETH is not supported in demo. Select an ERC20 token.');
      }

      const decimals = await this.getTokenDecimals(tokenAddress);
      const amountUnits = ethers.utils.parseUnits(amount, decimals);

      const vault = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
      const tx = await vault.withdraw(tokenAddress, amountUnits, { gasLimit: ethers.BigNumber.from('250000') });
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error('Transaction reverted.');

      const explorerUrl = `https://explorer.somnia.network/tx/${tx.hash}`;
      return { hash: tx.hash, explorerUrl, success: true };
    } catch (error: any) {
      let errorMessage = 'Withdraw failed';
      if (error?.code === 4001) errorMessage = 'User rejected the transaction';
      else if (error?.code === -32002) errorMessage = 'Request pending in MetaMask. Open it and approve.';
      else if (error?.reason || error?.message) errorMessage = error.reason || error.message;
      return { hash: '', explorerUrl: '', success: false, error: errorMessage };
    }
  }

  /**
   * Execute proposal transaction
   */
  async executeProposal(proposalData: any): Promise<TransactionResult> {
    try {
      // Convert params to bytes if it's a JSON string
      let paramsBytes = '0x';
      if (proposalData.params) {
        if (typeof proposalData.params === 'string') {
          // If it's a JSON string, convert to bytes
          paramsBytes = ethers.utils.toUtf8Bytes(proposalData.params);
        } else {
          // If it's already bytes, use as is
          paramsBytes = proposalData.params;
        }
      }

      // Ensure ipfsHash is properly formatted
      let ipfsHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (proposalData.ipfsHash && proposalData.ipfsHash !== '0x') {
        // Convert IPFS hash to bytes32 format
        ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalData.ipfsHash));
      }

      console.log('📊 Proposal data:', {
        vault: proposalData.vault,
        actionType: proposalData.actionType || 0,
        paramsLength: paramsBytes.length,
        ipfsHash: ipfsHash
      });

      // Mock executor contract interaction
      const mockData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint8', 'bytes', 'bytes32'],
        [
          proposalData.vault,
          proposalData.actionType || 0,
          paramsBytes,
          ipfsHash
        ]
      );

      return this.sendTransaction({
        to: '0x8E80a57A6805260eac17993Aa9FC9FaA3B8cc208', // Executor contract
        data: mockData,
        gasLimit: '300000'
      });
    } catch (error: any) {
      console.error('Error preparing proposal transaction:', error);
      return {
        hash: '',
        explorerUrl: '',
        success: false,
        error: `Failed to prepare proposal: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const transactionManager = new TransactionManager();
