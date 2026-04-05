import { useEffect, useState } from "react";
import algosdk from "algosdk";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../app/components/ui/dialog";
import {
    checkOptInStatus,
    createOptInTransaction,
    createDepositTransaction,
    signTransactionWithWallet,
    submitOptIn,
    submitDeposit
} from "../utils/poolService";

type Props = {
    openInvest: boolean;
    setOpenInvest: (v: boolean) => void;
    openBorrow: boolean;
    setOpenBorrow: (v: boolean) => void;
    walletAddress: string;
    walletType: 'lute' | 'pera' | 'exodus' | null;
};

const algodClient = new algosdk.Algodv2(
    "",
    "https://testnet-api.algonode.cloud",
    ""
);

const FinanceDialog = ({
                           openInvest,
                           setOpenInvest,
                           openBorrow,
                           setOpenBorrow,
                           walletAddress,
                           walletType,
                       }: Props) => {

    const [balance, setBalance] = useState<number>(0);

    // INVEST STATE
    const [depositAmount, setDepositAmount] = useState("");
    const [isDepositMode, setIsDepositMode] = useState(false);

    // OPT-IN STATE
    const [isOptedIn, setIsOptedIn] = useState<boolean>(false);
    const [isCheckingOptIn, setIsCheckingOptIn] = useState(false);

    // PROCESSING STATE
    const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

    // BORROW STATE
    const [borrowAmount, setBorrowAmount] = useState("");
    const [collateralAddress, setCollateralAddress] = useState("");
    const [hasCollateral, setHasCollateral] = useState<null | boolean>(null);

    // ================= BALANCE =================
    const fetchBalance = async () => {
        try {
            const accountInfo = await algodClient.accountInformation(walletAddress).do();
            setBalance(Number(accountInfo.amount) / 1e6);
        } catch (err) {
            console.error("Balance fetch failed", err);
        }
    };

    useEffect(() => {
        if (!walletAddress) return;
        fetchBalance();
    }, [walletAddress]);

    // ================= CHECK OPT-IN STATUS =================
    useEffect(() => {
        if (openInvest && walletAddress) {
            const checkStatus = async () => {
                setIsCheckingOptIn(true);
                try {
                    const status = await checkOptInStatus(walletAddress);
                    setIsOptedIn(status);
                    console.log('[FinanceDialog] Opt-in status:', status);
                } catch (error) {
                    console.error('[FinanceDialog] Error checking opt-in:', error);
                    setIsOptedIn(false);
                } finally {
                    setIsCheckingOptIn(false);
                }
            };
            checkStatus();
        }
    }, [openInvest, walletAddress]);

    // ================= RESET INVEST ON CLOSE =================
    useEffect(() => {
        if (!openInvest) {
            setDepositAmount("");
            setIsDepositMode(false);
        }
    }, [openInvest]);

    // ================= RESET BORROW ON CLOSE =================
    useEffect(() => {
        if (!openBorrow) {
            setBorrowAmount("");
            setCollateralAddress("");
            setHasCollateral(null);
        }
    }, [openBorrow]);

    // ================= HANDLE DEPOSIT =================
    const handleDepositConfirm = async () => {
        if (!walletType || (walletType !== 'lute' && walletType !== 'pera')) {
            toast.error('Unsupported wallet type');
            return;
        }

        const amountNum = Number(depositAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Invalid deposit amount');
            return;
        }

        if (amountNum > balance) {
            toast.error('Amount exceeds wallet balance');
            return;
        }

        try {
            setIsProcessingDeposit(true);
            let toastId: string | number;

            // Step 1: Check opt-in and perform if needed
            if (!isOptedIn) {
                toastId = toast.loading('Opting into pool...');
                console.log('[FinanceDialog] Creating opt-in transaction...');
                
                const optInTxn = await createOptInTransaction(walletAddress);
                
                toast.loading('Please sign the opt-in transaction in your wallet...', { id: toastId });
                const signedOptIn = await signTransactionWithWallet(optInTxn, walletType, walletAddress);
                
                toast.loading('Submitting opt-in transaction...', { id: toastId });
                await submitOptIn(signedOptIn, walletAddress);
                
                toast.success('Successfully opted into pool!', { id: toastId });
                setIsOptedIn(true);
                
                // Small delay before next transaction
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Step 2: Create deposit transaction
            toastId = toast.loading('Creating deposit transaction...');
            console.log('[FinanceDialog] Creating deposit transaction...');
            const depositTxn = await createDepositTransaction(walletAddress, amountNum);

            // Step 3: Sign deposit transaction
            toast.loading('Please sign the deposit transaction in your wallet...', { id: toastId });
            const signedDeposit = await signTransactionWithWallet(depositTxn, walletType, walletAddress);

            // Step 4: Submit deposit transaction
            toast.loading('Submitting deposit transaction...', { id: toastId });
            await submitDeposit(signedDeposit, walletAddress, amountNum);

            // Step 5: Success!
            toast.success(`Successfully deposited ${amountNum} ALGO!`, { id: toastId });

            // Step 6: Refresh balance
            console.log('[FinanceDialog] Refreshing balance...');
            await fetchBalance();

            // Step 7: Reset state and close dialog
            setDepositAmount("");
            setIsDepositMode(false);
            setOpenInvest(false);

        } catch (error: any) {
            console.error('[FinanceDialog] Deposit failed:', error);
            
            // User-friendly error messages
            let errorMessage = 'Deposit failed. Please try again.';
            
            if (error.message?.includes('cancelled') || error.message?.includes('rejected')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message?.includes('insufficient')) {
                errorMessage = 'Insufficient funds for transaction';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsProcessingDeposit(false);
        }
    };

    const isInvalidDeposit =
        depositAmount !== "" && Number(depositAmount) > balance;

    const isProcessing = isProcessingDeposit || isCheckingOptIn;

    return (
        <>
            {/* ================= INVEST ================= */}
            <Dialog open={openInvest} onOpenChange={setOpenInvest}>
                <DialogContent className="bg-neutral-900 border border-white/10 text-white max-w-lg p-8 relative">

                    {/* Loading Overlay */}
                    {isProcessingDeposit && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                                <p className="text-sm text-gray-300">Processing transaction...</p>
                            </div>
                        </div>
                    )}

                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">
                            Investment
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-gray-400">
                        Wallet Balance
                    </div>

                    <div className="text-2xl font-light mb-2">
                        {balance.toFixed(4)} ALGO
                    </div>

                    {/* Opt-in Status Indicator */}
                    {isCheckingOptIn ? (
                        <div className="text-xs text-gray-500 mb-4">
                            Checking pool opt-in status...
                        </div>
                    ) : (
                        <div className="text-xs mb-4">
                            {isOptedIn ? (
                                <span className="text-green-400">✓ Opted into pool</span>
                            ) : (
                                <span className="text-yellow-400">⚠ Not opted-in (will auto opt-in on deposit)</span>
                            )}
                        </div>
                    )}

                    {isDepositMode && (
                        <input
                            type="number"
                            placeholder="Enter amount"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            disabled={isProcessing}
                            className="w-full p-4 mb-4 bg-black border border-white/10 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    )}

                    {isInvalidDeposit && (
                        <p className="text-red-400 text-sm mb-3">
                            Amount exceeds wallet balance
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-5">

                        <button
                            onClick={() => setIsDepositMode(true)}
                            disabled={isProcessing}
                            className={`
                                p-4 border border-white/10 rounded-xl transition
                                ${isProcessing 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "hover:bg-white/5"}
                            `}
                        >
                            Deposit
                        </button>

                        <button
                            disabled={true}
                            className="p-4 border border-white/10 rounded-xl opacity-40 cursor-not-allowed"
                            title="Withdraw not yet implemented"
                        >
                            Withdraw
                        </button>
                    </div>

                    {isDepositMode && !isInvalidDeposit && depositAmount && (
                        <button
                            onClick={handleDepositConfirm}
                            disabled={isProcessing}
                            className={`
                                mt-6 w-full p-4 border border-white/10 rounded-xl transition
                                ${isProcessing 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "hover:bg-white/5"}
                            `}
                        >
                            {isProcessingDeposit ? "Processing..." : "Confirm Deposit"}
                        </button>
                    )}

                </DialogContent>
            </Dialog>

            {/* ================= BORROW ================= */}
            <Dialog open={openBorrow} onOpenChange={setOpenBorrow}>
                <DialogContent className="bg-neutral-900 border border-white/10 text-white max-w-lg p-8">

                    <DialogHeader>
                        <DialogTitle className="text-xl font-light">
                            Borrow
                        </DialogTitle>
                    </DialogHeader>

                    {/* STEP 1: ASK COLLATERAL */}
                    {hasCollateral === null && (
                        <div className="space-y-4">
                            <p className="text-gray-400">
                                Do you have collateral?
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setHasCollateral(true)}
                                    className="p-4 border border-white/10 rounded-xl hover:bg-white/5 transition"
                                >
                                    Yes
                                </button>

                                <button
                                    onClick={() => setHasCollateral(false)}
                                    className="p-4 border border-white/10 rounded-xl hover:bg-white/5 transition"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: NO COLLATERAL */}
                    {hasCollateral === false && (
                        <p className="text-red-400">
                            Sorry, this is unavailable.
                        </p>
                    )}

                    {/* STEP 3: FULL FORM */}
                    {hasCollateral === true && (
                        <>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={borrowAmount}
                                onChange={(e) => setBorrowAmount(e.target.value)}
                                className="w-full p-4 bg-black border border-white/10 rounded-xl text-white mb-4"
                            />

                            <input
                                type="text"
                                placeholder="Collateral Address"
                                value={collateralAddress}
                                onChange={(e) => setCollateralAddress(e.target.value)}
                                className="w-full p-4 bg-black border border-white/10 rounded-xl text-white mb-6"
                            />

                            <button
                                onClick={() => {
                                    console.log("Borrow:", borrowAmount, collateralAddress);
                                    setOpenBorrow(false);
                                }}
                                className="w-full p-4 border border-white/10 rounded-xl hover:bg-white/5 transition"
                            >
                                Borrow
                            </button>
                        </>
                    )}

                </DialogContent>
            </Dialog>
        </>
    );
};

export default FinanceDialog;
