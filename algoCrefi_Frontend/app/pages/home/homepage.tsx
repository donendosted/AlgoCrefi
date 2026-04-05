import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import WalletDialog from '../../components/WalletDialog';
import LoginDialog from '../../components/LoginDialog';
import SignupDialog from '../../components/SignupDialog';
import DotGrid from '../../components/DotGrid';
import { connectLuteWallet, connectPeraWallet } from '../../utils/walletService';
import { toast } from "sonner";

const BACKEND = "https://algocrefi-backend.onrender.com"; // change this

const Index = () => {
    const navigate = useNavigate();

    const [authStep, setAuthStep] = useState<'wallet' | 'login' | 'signup' | null>(null);
    const [walletAddress, setWalletAddress] = useState<string>("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isConnecting, setIsConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ✅ Check token on load
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const openWalletConnect = () => {
        setAuthStep('wallet');
        setErrorMessage(null);
        setPassword("");
        setConfirmPassword("");
    };

    // ✅ WALLET SELECT
    const handleWalletSelect = async (wallet: 'lute' | 'pera' | 'exodus') => {
        try {
            setIsConnecting(true);
            setErrorMessage(null);

            let address = "";

            if (wallet === 'lute') {
                address = await connectLuteWallet();
                toast.success("Lute wallet connected!", {
                    duration: 3000,
                });
            }
            else if (wallet === 'pera') {
                address = await connectPeraWallet();
                toast.success("Pera wallet connected!", {
                    duration: 3000,
                });
            }
            else if (wallet === 'exodus') {
                toast.info("Exodus wallet support coming soon!", {
                    duration: 3000,
                });
                setAuthStep(null);
                return;
            }

            setWalletAddress(address);
            setAuthStep('login');

        } catch (err: any) {
            toast.error("Wallet connection failed");
            setErrorMessage("Wallet connection failed");
        } finally {
            setIsConnecting(false);
        }
    };

    // ✅ LOGIN
    const handleLogin = async () => {
        try {
            const res = await axios.post(`${BACKEND}/api/auth/login`, {
                address: walletAddress,
                password
            });

            // ✅ ONLY on success
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("address", walletAddress);

            toast.success("Login successful!");
            navigate("/dashboard");

        } catch (err: any) {
            setAuthStep('signup');
            setErrorMessage("User not found. Create account.");
        }
    };

    // ✅ SIGNUP
    const handleSignup = async () => {
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        try {
            await axios.post(`${BACKEND}/api/auth/signup`, {
                address: walletAddress,
                password
            });

            toast.success("Signup successful! Please login.", {
                duration: 3000,
            });
            window.location.reload();

        } catch (err: any) {
            toast.error("Signup failed");
            setErrorMessage("Signup failed");
        }
    };

    return (
        <div className="relative h-screen bg-gray-900 overflow-hidden">

            {/* DotGrid */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <DotGrid
                    dotSize={5}
                    gap={15}
                    baseColor="#271E37"
                    activeColor="#5227FF"
                    proximity={120}
                    shockRadius={250}
                    shockStrength={5}
                    resistance={750}
                    returnDuration={1.5}
                />
            </div>

            {/* Center */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">

                <div className="p-[2px] rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                    <button
                        onClick={openWalletConnect}
                        disabled={isConnecting}
                        className={`
                            group px-16 py-6 rounded-full bg-neutral-950 text-white font-semibold flex gap-3 items-center transition
                            ${isConnecting ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
                        `}
                    >
                        {isConnecting ? "Connecting..." : "Get Started →"}
                    </button>
                </div>

                {errorMessage && (
                    <div className="mt-4 text-red-400 text-center max-w-md">
                        {errorMessage}
                    </div>
                )}
            </div>

            {/* Dialogs - always rendered, controlled by 'open' prop */}
            <WalletDialog
                open={authStep === 'wallet'}
                onOpenChange={(open) => {
                    if (!open) setAuthStep(null);
                }}
                isConnecting={isConnecting}
                onWalletSelect={handleWalletSelect}
            />

            <LoginDialog
                open={authStep === 'login'}
                onOpenChange={(open) => {
                    if (!open) {
                        setAuthStep(null);
                        setPassword("");
                    }
                }}
                walletAddress={walletAddress}
                password={password}
                setPassword={setPassword}
                errorMessage={errorMessage}
                onLogin={handleLogin}
            />

            <SignupDialog
                open={authStep === 'signup'}
                onOpenChange={(open) => {
                    if (!open) {
                        setAuthStep(null);
                        setPassword("");
                        setConfirmPassword("");
                    }
                }}
                walletAddress={walletAddress}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                errorMessage={errorMessage}
                onSignup={handleSignup}
            />
        </div>
    );
};

export default Index;
