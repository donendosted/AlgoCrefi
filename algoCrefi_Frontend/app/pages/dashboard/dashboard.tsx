import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getWalletData, clearWalletData, disconnectPeraWallet } from '../../utils/walletService';
import Dither from "../../components/Dither";
import PoolLiveGraph from "~/components/Chart";

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [walletType, setWalletType] = useState<'lute' | 'pera' | 'exodus' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const checkWallet = () => {
            try {
                const walletData = getWalletData();

                if (!walletData) {
                    if (isMounted) navigate('/');
                    return;
                }

                if (isMounted) {
                    setWalletAddress(walletData.address);
                    setWalletType(walletData.walletType);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error checking wallet data:', error);
                if (isMounted) navigate('/');
            }
        };

        checkWallet();
        return () => { isMounted = false; };
    }, [navigate]);

    const handleLogout = async () => {
        if (walletType === 'pera') {
            await disconnectPeraWallet();
        }
        clearWalletData();
        localStorage.clear();
        navigate('/');
    };

    const truncate = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-6)}`;

    if (isLoading) {
        return (
            <div className="relative min-h-screen text-white flex items-center justify-center">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <Dither />
                </div>
                <div className="z-10 flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white rounded-full"></div>
                    <p className="text-sm text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!walletAddress) return null;

    return (
        <div className="relative min-h-screen text-white overflow-hidden">

            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Dither />
            </div>

            {/* MAIN CONTENT */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* NAVBAR */}
                <div className="border-b border-white/10 bg-neutral-900/60 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
                        <h1 className="text-lg font-light">Algo Crefi</h1>

                        <div className="flex items-center gap-4 text-sm">

                            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                {truncate(walletAddress)}
                                <span className="ml-2 text-yellow-400">12 AURA</span>
                            </span>

                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 border border-white/20 rounded-md hover:bg-red-500/20 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 max-w-6xl mx-auto px-6 py-10 space-y-8">

                    {/* TOP */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl mb-3">Dashboard</h2>
                                <p className="text-sm text-gray-400">
                                    Invest or borrow. Track performance in real time.
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-6">
                                Built for precision.
                            </p>
                        </div>

                        <div className="md:col-span-2 bg-neutral-900/70 border border-white/10 rounded-xl p-4 h-[460px]">
                            <PoolLiveGraph />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <button
                            onClick={() => navigate('/pool', { state: { action: 'invest' } })}
                            className="bg-neutral-900/70 border border-white/10 rounded-xl p-6 hover:bg-neutral-900/50 transition"
                        >
                            <h3 className="text-lg mb-1">Invest</h3>
                            <p className="text-sm text-gray-500">
                                Allocate capital into markets.
                            </p>
                        </button>

                        <button
                            onClick={() => navigate('/pool', { state: { action: 'borrow' } })}
                            className="bg-neutral-900/70 border border-white/10 rounded-xl p-6 hover:bg-neutral-900/50 transition"
                        >
                            <h3 className="text-lg mb-1">Borrow</h3>
                            <p className="text-sm text-gray-500">
                                Access liquidity instantly.
                            </p>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;