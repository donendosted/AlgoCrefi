import algosdk from 'algosdk';
import axios from 'axios';

// ===================== CONSTANTS =====================
const POOL_APP_ID = 758287713;
const BACKEND_URL = "https://algocrefi-backend.onrender.com";
const ALGOD_SERVER = "https://testnet-api.algonode.cloud";

// ===================== ALGOD CLIENT =====================
let algodClientInstance: algosdk.Algodv2 | null = null;

function getAlgodClient(): algosdk.Algodv2 {
    if (!algodClientInstance) {
        algodClientInstance = new algosdk.Algodv2('', ALGOD_SERVER, '');
    }
    return algodClientInstance;
}

// ===================== WALLET INSTANCES =====================
/**
 * Get Lute wallet instance (dynamic import for SSR safety)
 */
async function getLuteInstance(): Promise<any> {
    if (typeof window === 'undefined') {
        throw new Error('LuteConnect can only be used in browser context');
    }
    const { default: LuteConnect } = await import('lute-connect');
    return new LuteConnect();
}

/**
 * Get Pera wallet instance (dynamic import for SSR safety)
 */
async function getPeraWalletInstance(): Promise<any> {
    if (typeof window === 'undefined') {
        throw new Error('PeraWalletConnect can only be used in browser context');
    }
    const { PeraWalletConnect } = await import('@perawallet/connect');
    return new PeraWalletConnect({
        chainId: 416002, // TestNet
        shouldShowSignTxnToast: true
    });
}

// ===================== OPT-IN STATUS CHECK =====================
/**
 * Check if a user is opted into the pool smart contract
 * @param address - User's Algorand address
 * @returns Promise<boolean> - true if opted-in, false otherwise
 */
export async function checkOptInStatus(address: string): Promise<boolean> {
    try {
        const algodClient = getAlgodClient();
        await algodClient.accountApplicationInformation(address, POOL_APP_ID).do();
        return true; // If no error, user is opted-in
    } catch (error: any) {
        // Error means user is not opted-in
        if (error.message?.includes('application does not exist')) {
            return false;
        }
        // Re-throw unexpected errors
        console.error('[Pool Service] Error checking opt-in status:', error);
        throw new Error('Failed to check opt-in status');
    }
}

// ===================== CREATE OPT-IN TRANSACTION =====================
/**
 * Create an unsigned opt-in transaction for the pool smart contract
 * @param address - User's Algorand address
 * @returns Promise<Uint8Array> - Unsigned transaction bytes
 */
export async function createOptInTransaction(address: string): Promise<Uint8Array> {
    try {
        const algodClient = getAlgodClient();
        const suggestedParams = await algodClient.getTransactionParams().do();

        // Create ABI method for opt-in
        const method = algosdk.ABIMethod.fromSignature('opt_in()void');

        // Build atomic transaction composer
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addMethodCall({
            appID: POOL_APP_ID,
            method,
            methodArgs: [],
            sender: address,
            signer: algosdk.makeEmptyTransactionSigner(), // Wallet will sign
            suggestedParams,
            onComplete: algosdk.OnApplicationComplete.OptInOC
        });

        // Build and return unsigned transaction
        const txnGroup = atc.buildGroup();
        return txnGroup[0].txn.toByte();
    } catch (error) {
        console.error('[Pool Service] Error creating opt-in transaction:', error);
        throw new Error('Failed to create opt-in transaction');
    }
}

// ===================== CREATE DEPOSIT TRANSACTION =====================
/**
 * Create an unsigned deposit transaction for the pool smart contract
 * @param address - User's Algorand address
 * @param amountInAlgo - Amount to deposit in ALGO (will be converted to microAlgos)
 * @returns Promise<Uint8Array> - Unsigned transaction bytes
 */
export async function createDepositTransaction(
    address: string,
    amountInAlgo: number
): Promise<Uint8Array> {
    try {
        const algodClient = getAlgodClient();
        const suggestedParams = await algodClient.getTransactionParams().do();

        // Convert ALGO to microAlgos
        const amountInMicroAlgos = Math.floor(amountInAlgo * 1e6);

        // Create ABI method for deposit
        const method = algosdk.ABIMethod.fromSignature('deposit(uint64)uint64');

        // Build atomic transaction composer
        const atc = new algosdk.AtomicTransactionComposer();
        atc.addMethodCall({
            appID: POOL_APP_ID,
            method,
            methodArgs: [amountInMicroAlgos],
            sender: address,
            signer: algosdk.makeEmptyTransactionSigner(), // Wallet will sign
            suggestedParams
        });

        // Build and return unsigned transaction
        const txnGroup = atc.buildGroup();
        return txnGroup[0].txn.toByte();
    } catch (error) {
        console.error('[Pool Service] Error creating deposit transaction:', error);
        throw new Error('Failed to create deposit transaction');
    }
}

// ===================== SIGN TRANSACTION WITH WALLET =====================
/**
 * Sign a transaction using the connected wallet (Lute or Pera)
 * @param txnBytes - Unsigned transaction bytes
 * @param walletType - Type of wallet ('lute' or 'pera')
 * @param address - User's Algorand address (needed for Pera)
 * @returns Promise<string> - Base64-encoded signed transaction
 */
export async function signTransactionWithWallet(
    txnBytes: Uint8Array,
    walletType: 'lute' | 'pera',
    address: string
): Promise<string> {
    try {
        if (walletType === 'lute') {
            // Sign with Lute Wallet
            const lute = await getLuteInstance();
            const signedTxns = await lute.signTransaction([txnBytes]);
            
            if (!signedTxns || signedTxns.length === 0) {
                throw new Error('No signed transaction returned from Lute Wallet');
            }
            
            // Convert Uint8Array to base64
            return Buffer.from(signedTxns[0]).toString('base64');
        } else if (walletType === 'pera') {
            // Sign with Pera Wallet
            const peraWallet = await getPeraWalletInstance();
            
            // Pera expects array of transaction groups
            const txnGroup = [{
                txn: algosdk.decodeUnsignedTransaction(txnBytes),
                signers: [address]
            }];
            
            const signedTxns = await peraWallet.signTransaction([txnGroup]);
            
            if (!signedTxns || signedTxns.length === 0) {
                throw new Error('No signed transaction returned from Pera Wallet');
            }
            
            // Convert Uint8Array to base64
            return Buffer.from(signedTxns[0]).toString('base64');
        } else {
            throw new Error(`Unsupported wallet type: ${walletType}`);
        }
    } catch (error: any) {
        console.error('[Pool Service] Error signing transaction:', error);
        
        // Handle user cancellation
        if (error.message?.includes('cancelled') || error.message?.includes('rejected')) {
            throw new Error('Transaction cancelled by user');
        }
        
        throw new Error(error.message || 'Failed to sign transaction');
    }
}

// ===================== SUBMIT OPT-IN TRANSACTION =====================
/**
 * Submit signed opt-in transaction to backend
 * @param signedTxBase64 - Base64-encoded signed transaction
 * @param address - User's Algorand address
 * @returns Promise<void>
 */
export async function submitOptIn(
    signedTxBase64: string,
    address: string
): Promise<void> {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/pool/opt-in`, {
            signedOptInTx: signedTxBase64,
            sender: address
        });
        
        if (response.status !== 200 && response.status !== 201) {
            throw new Error('Backend returned error status');
        }
        
        console.log('[Pool Service] Opt-in submitted successfully:', response.data);
    } catch (error: any) {
        console.error('[Pool Service] Error submitting opt-in:', error);
        
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw new Error('Failed to submit opt-in transaction');
    }
}

// ===================== SUBMIT DEPOSIT TRANSACTION =====================
/**
 * Submit signed deposit transaction to backend
 * @param signedTxBase64 - Base64-encoded signed transaction
 * @param address - User's Algorand address
 * @param amountInAlgo - Amount deposited in ALGO
 * @returns Promise<void>
 */
export async function submitDeposit(
    signedTxBase64: string,
    address: string,
    amountInAlgo: number
): Promise<void> {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/pool/deposit`, {
            signedDepositTx: signedTxBase64,
            sender: address,
            amount: amountInAlgo
        });
        
        if (response.status !== 200 && response.status !== 201) {
            throw new Error('Backend returned error status');
        }
        
        console.log('[Pool Service] Deposit submitted successfully:', response.data);
    } catch (error: any) {
        console.error('[Pool Service] Error submitting deposit:', error);
        
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw new Error('Failed to submit deposit transaction');
    }
}

// ===================== COMBINED DEPOSIT FLOW =====================
/**
 * Complete deposit flow: check opt-in, opt-in if needed, then deposit
 * @param address - User's Algorand address
 * @param amountInAlgo - Amount to deposit in ALGO
 * @param walletType - Type of wallet ('lute' or 'pera')
 * @param onProgress - Callback for progress updates
 * @returns Promise<void>
 */
export async function performDeposit(
    address: string,
    amountInAlgo: number,
    walletType: 'lute' | 'pera',
    onProgress?: (step: string) => void
): Promise<void> {
    try {
        // Step 1: Check opt-in status
        onProgress?.('Checking opt-in status...');
        const isOptedIn = await checkOptInStatus(address);
        
        // Step 2: Opt-in if needed
        if (!isOptedIn) {
            onProgress?.('Opting into pool...');
            const optInTxn = await createOptInTransaction(address);
            
            onProgress?.('Please sign the opt-in transaction in your wallet...');
            const signedOptIn = await signTransactionWithWallet(optInTxn, walletType, address);
            
            onProgress?.('Submitting opt-in transaction...');
            await submitOptIn(signedOptIn, address);
        }
        
        // Step 3: Create deposit transaction
        onProgress?.('Creating deposit transaction...');
        const depositTxn = await createDepositTransaction(address, amountInAlgo);
        
        // Step 4: Sign deposit transaction
        onProgress?.('Please sign the deposit transaction in your wallet...');
        const signedDeposit = await signTransactionWithWallet(depositTxn, walletType, address);
        
        // Step 5: Submit deposit transaction
        onProgress?.('Submitting deposit transaction...');
        await submitDeposit(signedDeposit, address, amountInAlgo);
        
        onProgress?.('Deposit completed successfully!');
    } catch (error: any) {
        console.error('[Pool Service] Deposit flow failed:', error);
        throw error;
    }
}
