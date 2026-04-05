import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getWalletData, clearWalletData, disconnectPeraWallet } from '../../utils/walletService';
import Dither from "../../components/Dither";
import FinanceDialog from "~/components/FinanceDialog";
import PoolLiveGraph from "~/components/Chart";

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [walletType, setWalletType] = useState<'lute' | 'pera' | 'exodus' | null>(null);

    const [openInvest, setOpenInvest] = useState(false);
    const [openBorrow, setOpenBorrow] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const walletData = getWalletData();

        if (!walletData) {
            navigate('/');
            return;
        }

        setWalletAddress(walletData.address);
        setWalletType(walletData.walletType);
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

    if (!walletAddress) return null;

    return (
        <div className="relative min-h-screen text-white font-serif overflow-hidden">

            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Dither
                    waveColor={[0.3, 0.3, 0.35]}
                    disableAnimation={false}
                    enableMouseInteraction
                    mouseRadius={0.3}
                    colorNum={4}
                    waveAmplitude={0.3}
                    waveFrequency={3}
                    waveSpeed={0.05}
                />
            </div>

            {/* CONTENT */}
            <div className="relative z-10">

                {/* NAVBAR */}
                <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-neutral-900/60 backdrop-blur-md transition hover:bg-neutral-900/40">
                    <h1 className="text-xl tracking-wide font-light">
                        Algo Crefi
                    </h1>

                    <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-300 bg-white/10 backdrop-blur-sm py-1 px-3 border border-white/20 rounded-full">
                            {truncate(walletAddress)}
                        </span>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-1.5 border border-white/20 rounded-md text-gray-300 hover:bg-red-500/20 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* MAIN */}
                <div className="px-8 py-10 max-w-6xl mx-auto space-y-10">

                    {/* TOP SECTION */}
                    <div className="grid grid-cols-3 gap-8">

                        {/* LEFT */}
                        <div className="col-span-1 flex flex-col justify-center bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-xl p-6 transition hover:bg-neutral-900/40">
                            <h2 className="text-2xl font-light mb-3">
                                Dashboard
                            </h2>

                            <p className="text-sm text-gray-400 leading-relaxed">
                                Hey users! You can invest your assets into various markets or borrow against your holdings. Explore the graph to track your portfolio performance and make informed decisions.
                            </p>

                            <p className="text-sm text-gray-500 mt-4">
                                Built for precision, not noise.
                            </p>
                        </div>

                        {/* GRAPH */}
                        <div className="col-span-2 bg-neutral-900/70 backdrop-blur-md border border-white/10 rounded-xl p-6 h-64 flex items-center justify-center transition hover:bg-neutral-900/50">
                            <PoolLiveGraph />
                        </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* INVEST */}
                        <button
                            onClick={() => setOpenInvest(true)}
                            className="bg-neutral-900/70 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left transition hover:bg-neutral-900/50"
                        >
                            <h3 className="text-lg font-light mb-2">Invest</h3>
                            <p className="text-sm text-gray-500">
                                Allocate capital into markets.
                            </p>
                        </button>

                        {/* BORROW */}
                        <button
                            onClick={() => setOpenBorrow(true)}
                            className="bg-neutral-900/70 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left transition hover:bg-neutral-900/50"
                        >
                            <h3 className="text-lg font-light mb-2">Borrow</h3>
                            <p className="text-sm text-gray-500">
                                Access liquidity instantly.
                            </p>
                        </button>

                    </div>
                </div>
            </div>

            {/* DIALOGS */}
            <FinanceDialog
                openInvest={openInvest}
                setOpenInvest={setOpenInvest}
                openBorrow={openBorrow}
                setOpenBorrow={setOpenBorrow}
                walletAddress={walletAddress}
                walletType={walletType}
            />

        </div>
    );
};

export default Dashboard;