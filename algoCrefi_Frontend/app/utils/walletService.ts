// Dynamic import for lute-connect to avoid SSR "window not defined" error
// import LuteConnect from 'lute-connect'; // REMOVED - use dynamic import instead
// Dynamic import for @perawallet/connect to avoid SSR "window not defined" error
import algosdk from 'algosdk';

// TestNet Configuration
const TESTNET_ALGOD = {
    server: 'https://testnet-api.algonode.cloud',
    port: '',
    token: ''
};

// TestNet chainId for Pera Wallet
const TESTNET_CHAIN_ID = 416002;

const WALLET_STORAGE_KEY = 'algo_wallet';

export interface WalletData {
    address: string;
    walletType: 'lute' | 'exodus' | 'pera';
    connectedAt: string;
}

// Lazy initialization for browser-only instances
let luteInstance: any = null; // Using 'any' since we use dynamic import
let peraWalletInstance: any = null; // Using 'any' since we use dynamic import
let algodClientInstance: algosdk.Algodv2 | null = null;

/**
 * Get or create LuteConnect instance (browser-only)
 * Uses dynamic import to prevent SSR "window not defined" errors
 */
async function getLuteInstance(): Promise<any> {
    if (typeof window === 'undefined') {
        throw new Error('LuteConnect can only be used in browser context');
    }
    if (!luteInstance) {
        // Dynamic import only runs in browser context
        const { default: LuteConnect } = await import('lute-connect');
        luteInstance = new LuteConnect();
    }
    return luteInstance;
}

/**
 * Get or create PeraWalletConnect instance (browser-only)
 * Uses dynamic import to prevent SSR "window not defined" errors
 */
async function getPeraWalletInstance(): Promise<any> {
    if (typeof window === 'undefined') {
        throw new Error('PeraWalletConnect can only be used in browser context');
    }
    if (!peraWalletInstance) {
        // Dynamic import only runs in browser context
        const { PeraWalletConnect } = await import('@perawallet/connect');
        peraWalletInstance = new PeraWalletConnect({
            chainId: TESTNET_CHAIN_ID,
            shouldShowSignTxnToast: true
        });
    }
    return peraWalletInstance;
}

/**
 * Get or create Algod Client instance
 */
function getAlgodClient(): algosdk.Algodv2 {
    if (!algodClientInstance) {
        algodClientInstance = new algosdk.Algodv2(
            TESTNET_ALGOD.token,
            TESTNET_ALGOD.server,
            TESTNET_ALGOD.port
        );
    }
    return algodClientInstance;
}

/**
 * Connect to Lute Wallet on TestNet
 */
export async function connectLuteWallet(): Promise<string> {
    try {
        // Get TestNet genesis information
        const algodClient = getAlgodClient();
        const genesisString = await algodClient.genesis().do();
        
        // Parse the JSON string returned by the genesis API
        const genesisData = JSON.parse(genesisString);
        const genesisID = `${genesisData.network}-${genesisData.id}`;
        
        console.log('[Lute Wallet] Connecting with genesisID:', genesisID);
        
        // Connect to Lute Wallet (dynamic import, browser-only)
        const lute = await getLuteInstance();
        const addresses = await lute.connect(genesisID);
        
        if (!addresses || addresses.length === 0) {
            throw new Error('No addresses returned from Lute Wallet');
        }
        
        // Use the first address
        const address = addresses[0];
        
        // Store wallet data in localStorage
        saveWalletData({
            address,
            walletType: 'lute',
            connectedAt: new Date().toISOString()
        });
        
        return address;
    } catch (error) {
        console.error('[Lute Wallet] Connection error:', error);
        throw error;
    }
}

/**
 * Connect to Pera Wallet on TestNet
 */
export async function connectPeraWallet(): Promise<string> {
    try {
        console.log('[Pera Wallet] Connecting to TestNet...');
        
        // Get Pera Wallet instance (dynamic import, browser-only)
        const peraWallet = await getPeraWalletInstance();
        
        // Connect to Pera Wallet
        const accounts = await peraWallet.connect();
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from Pera Wallet');
        }
        
        // Use the first account
        const address = accounts[0];
        
        console.log('[Pera Wallet] Connected:', address);
        
        // Store wallet data in localStorage
        saveWalletData({
            address,
            walletType: 'pera',
            connectedAt: new Date().toISOString()
        });
        
        // Setup disconnect event listener
        peraWallet.connector?.on('disconnect', () => {
            console.log('[Pera Wallet] Disconnected via wallet');
            clearWalletData();
        });
        
        return address;
    } catch (error: any) {
        console.error('[Pera Wallet] Connection error:', error);
        
        // Handle modal close gracefully
        if (error?.data?.type === 'CONNECT_MODAL_CLOSED') {
            throw new Error('User cancelled connection');
        }
        
        throw error;
    }
}

/**
 * Reconnect to Pera Wallet session
 */
export async function reconnectPeraWallet(): Promise<string | null> {
    try {
        const peraWallet = await getPeraWalletInstance();
        const accounts = await peraWallet.reconnectSession();
        
        if (peraWallet.isConnected && accounts.length > 0) {
            const address = accounts[0];
            
            // Setup disconnect event listener
            peraWallet.connector?.on('disconnect', () => {
                console.log('[Pera Wallet] Disconnected via wallet');
                clearWalletData();
            });
            
            return address;
        }
        
        return null;
    } catch (error) {
        console.error('[Pera Wallet] Reconnection error:', error);
        return null;
    }
}

/**
 * Disconnect from Pera Wallet
 */
export async function disconnectPeraWallet(): Promise<void> {
    try {
        const peraWallet = await getPeraWalletInstance();
        await peraWallet.disconnect();
        console.log('[Pera Wallet] Disconnected successfully');
    } catch (error) {
        console.error('[Pera Wallet] Disconnect error:', error);
    }
}

/**
 * Save wallet data to localStorage
 */
export function saveWalletData(walletData: WalletData): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    }
}

/**
 * Get wallet data from localStorage
 */
export function getWalletData(): WalletData | null {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) return null;
    
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parsing wallet data:', error);
        return null;
    }
}

/**
 * Clear wallet data from localStorage
 */
export function clearWalletData(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(WALLET_STORAGE_KEY);
    }
}

/**
 * Check if user is connected
 */
export function isWalletConnected(): boolean {
    return getWalletData() !== null;
}

/**
 * Get current wallet type from localStorage
 */
export function getCurrentWalletType(): 'lute' | 'pera' | 'exodus' | null {
    const walletData = getWalletData();
    return walletData?.walletType || null;
}

/**
 * Export wallet instance getters for transaction signing
 */
export { getLuteInstance, getPeraWalletInstance };
