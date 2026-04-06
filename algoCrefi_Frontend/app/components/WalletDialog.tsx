import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type WalletDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isConnecting: boolean;
    onWalletSelect: (wallet: 'lute' | 'pera' | 'exodus') => void;
};

const WalletDialog = ({
    open,
    onOpenChange,
    isConnecting,
    onWalletSelect
}: WalletDialogProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const spinnerRef = useRef<HTMLDivElement>(null);

    const wallets = [
        { id: 'lute' as const, name: 'Lute' },
        { id: 'pera' as const, name: 'Pera' },
        { id: 'exodus' as const, name: 'Exodus' },
    ];

    // Animate dialog entrance
    useGSAP(() => {
        if (open && contentRef.current) {
            gsap.fromTo(contentRef.current, 
                { opacity: 0, scale: 0.95, y: 10 },
                { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0, 
                    duration: 0.3, 
                    ease: 'power2.out' 
                }
            );
            
            // Animate wallet buttons (all at once with scale)
            if (buttonsRef.current) {
                const buttons = buttonsRef.current.querySelectorAll('button');
                gsap.fromTo(buttons,
                    { opacity: 0, scale: 0.9 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.3,
                        ease: 'back.out(1.1)',
                        delay: 0.1
                    }
                );
            }
        }
    }, { dependencies: [open], scope: contentRef });

    // Animate loading spinner
    useGSAP(() => {
        if (isConnecting && spinnerRef.current) {
            gsap.fromTo(spinnerRef.current,
                { opacity: 0, scale: 0.8 },
                { 
                    opacity: 1, 
                    scale: 1,
                    duration: 0.3,
                    ease: 'back.out(1.5)'
                }
            );
        }
    }, { dependencies: [isConnecting] });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                ref={contentRef}
                className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 max-w-md"
                showCloseButton={!isConnecting}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white text-center">
                        Select Wallet
                    </DialogTitle>
                </DialogHeader>

                <div ref={buttonsRef} className="space-y-4">
                    {wallets.map((wallet) => (
                        <button
                            key={wallet.id}
                            onClick={() => {
                                if (!isConnecting) onWalletSelect(wallet.id);
                            }}
                            disabled={isConnecting}
                            className={`
                                w-full p-[2px] rounded-lg
                                bg-gray-400
                                transition
                                ${isConnecting
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:scale-[1.02]"
                                }
                            `}
                        >
                            <div className="
                                w-full px-6 py-4 rounded-lg
                                bg-neutral-950 text-white
                                font-semibold text-lg
                                flex justify-center items-center
                            ">
                                {wallet.name}
                            </div>
                        </button>
                    ))}

                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={isConnecting}
                        className={`
                            w-full px-6 py-4 rounded-xl
                            bg-white/5 text-gray-300 border border-white/10 font-semibold transition
                            ${isConnecting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-white/10"
                            }
                        `}
                    >
                        Cancel
                    </button>
                </div>

                {/* Loading Spinner Overlay */}
                {isConnecting && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                        <div ref={spinnerRef} className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                            <p className="text-white text-sm">Connecting wallet...</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WalletDialog;
