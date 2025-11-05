import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  balance: string;
  chainId: number | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: string) => void;
  switchToSomniaTestnet: () => Promise<void>;
}

// Somnia Testnet configuration
const SOMNIA_TESTNET = {
  chainId: '0xc4a8', // 50312 in hex
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://dream-rpc.somnia.network'],
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  blockExplorerUrls: ['https://explorer.somnia.network'],
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      address: null,
      isConnected: false,
      network: 'somnia-testnet',
      balance: '0.0',
      chainId: null,
      isConnecting: false,

      connect: async () => {
        try {
          // Check if MetaMask is installed
          if (!window.ethereum) {
            alert('Please install MetaMask to connect your wallet');
            return;
          }

          // Additional check for MetaMask
          if (!window.ethereum.isMetaMask) {
            console.warn('⚠️ Not using MetaMask, but ethereum provider found');
          }

          set({ isConnecting: true });

          console.log('🔗 Requesting wallet connection...');
          console.log('🌐 Ethereum provider:', window.ethereum);
          console.log('🔍 Is MetaMask:', window.ethereum.isMetaMask);
          
          // Request account access - this will show MetaMask permission prompt
          console.log('📱 Calling eth_requestAccounts - MetaMask should open now...');
          
          let accounts;
          try {
            accounts = await window.ethereum.request({
              method: 'eth_requestAccounts',
            });
          } catch (requestError: any) {
            console.error('❌ eth_requestAccounts failed:', requestError);
            
            // Fallback: try wallet_requestPermissions
            if (requestError.code === 4001) {
              throw new Error('Connection rejected by user');
            }
            
            console.log('🔄 Trying fallback method: wallet_requestPermissions...');
            try {
              await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
              });
              // Try eth_requestAccounts again
              accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
              });
            } catch (fallbackError: any) {
              console.error('❌ Fallback also failed:', fallbackError);
              throw fallbackError;
            }
          }

          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }

          const address = accounts[0];
          console.log('✅ Wallet connected:', address);
          
          // Get chain ID
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });

          console.log('🌐 Current chain ID:', parseInt(chainId, 16));

          // Get balance
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });

          // Convert balance from wei to ETH
          const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
          console.log('💰 Balance:', balanceInEth, 'ETH');

          set({
            address,
            isConnected: true,
            chainId: parseInt(chainId, 16),
            balance: balanceInEth,
            isConnecting: false,
          });

          // Check if we're on the correct network
          if (parseInt(chainId, 16) !== 50312) {
            console.log('🔄 Switching to Somnia Testnet...');
            await get().switchToSomniaTestnet();
          } else {
            console.log('✅ Already on Somnia Testnet');
          }

          // Show success message
          alert(`✅ Wallet connected successfully!\n\nAddress: ${address}\nBalance: ${balanceInEth} ETH\nNetwork: Somnia Testnet`);

        } catch (error: any) {
          console.error('❌ Failed to connect wallet:', error);
          set({ isConnecting: false });
          
          if (error.code === 4001) {
            alert('❌ Connection rejected by user\n\nPlease click "Connect Wallet" again and approve the connection in MetaMask.');
          } else if (error.code === -32002) {
            alert('❌ Connection request already pending\n\nPlease check MetaMask for the connection request.');
          } else {
            alert(`❌ Failed to connect wallet: ${error.message}\n\nPlease make sure MetaMask is installed and try again.`);
          }
        }
      },

      disconnect: () => {
        set({
          address: null,
          isConnected: false,
          balance: '0.0',
          chainId: null,
        });
      },

      setNetwork: (network: string) => set({ network }),

      switchToSomniaTestnet: async () => {
        try {
          if (!window.ethereum) {
            alert('Please install MetaMask to switch networks');
            return;
          }

          // Try to switch to Somnia Testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SOMNIA_TESTNET.chainId }],
          });
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [SOMNIA_TESTNET],
              });
            } catch (addError) {
              console.error('Failed to add Somnia Testnet:', addError);
              alert('Failed to add Somnia Testnet to MetaMask');
            }
          } else {
            console.error('Failed to switch to Somnia Testnet:', switchError);
            alert('Failed to switch to Somnia Testnet');
          }
        }
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
);

// Add window.ethereum type declaration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// Set up event listeners for wallet changes
if (typeof window !== 'undefined' && window.ethereum) {
  // Listen for account changes
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    console.log('🔄 Account changed:', accounts);
    if (accounts.length === 0) {
      // User disconnected
      useWallet.getState().disconnect();
    } else {
      // User switched accounts
      useWallet.getState().connect();
    }
  });

  // Listen for chain changes
  window.ethereum.on('chainChanged', (chainId: string) => {
    console.log('🔄 Chain changed:', parseInt(chainId, 16));
    const currentState = useWallet.getState();
    if (currentState.isConnected) {
      // Reconnect to update chain info
      currentState.connect();
    }
  });

  // Listen for connection status changes
  window.ethereum.on('connect', (connectInfo: any) => {
    console.log('🔗 Wallet connected:', connectInfo);
  });

  window.ethereum.on('disconnect', (error: any) => {
    console.log('❌ Wallet disconnected:', error);
    useWallet.getState().disconnect();
  });
}