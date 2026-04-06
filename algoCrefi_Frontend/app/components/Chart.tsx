import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const API_URL = "https://algocrefi-backend.onrender.com/api/pool/pool-info";
const POLL_INTERVAL_MS = 5000;
const MAX_POINTS = 100;

type PoolPoint = {
    time: string;
    ts: number;
    balanceAlgo: number;
    totalShares: number;
    sharePrice: number;
};

type PoolStats = {
    balance: number;
    totalShares: number;
    sharePrice: number;
};

type ApiResponse = {
    success: boolean;
    pool: {
        balance: number | string;
        totalShares: number | string;
        sharePrice: number | string;
    };
    error?: string;
};

export default function PoolLiveGraph() {
    const [data, setData] = useState<PoolPoint[]>([]);
    const [stats, setStats] = useState<PoolStats>({
        balance: 0,
        totalShares: 0,
        sharePrice: 0,
    });
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const fetchPool = async () => {
            try {
                const res = await fetch(API_URL);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const json: ApiResponse = await res.json();

                if (!json.success || !json.pool) {
                    throw new Error(json.error || "Invalid API response");
                }

                const balance = Number(json.pool.balance ?? 0);
                const totalShares = Number(json.pool.totalShares ?? 0);
                const sharePrice = Number(json.pool.sharePrice ?? 0);

                setStats({ balance, totalShares, sharePrice });

                const point: PoolPoint = {
                    time: new Date().toLocaleTimeString(),
                    ts: Date.now(),
                    balanceAlgo: balance / 1_000_000,
                    totalShares,
                    sharePrice,
                };

                setData((prev) => {
                    const next = [...prev, point];
                    return next.length > MAX_POINTS
                        ? next.slice(next.length - MAX_POINTS)
                        : next;
                });

                setError("");
            } catch (e: unknown) {
                const message =
                    e instanceof Error ? e.message : "Unknown error";
                setError(message);
            }
        };

        fetchPool();
        timer = setInterval(fetchPool, POLL_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []);

    const yDomain = useMemo<[number, number]>(() => {
        if (!data.length) return [0, 1];

        const vals = data.map((d) => d.balanceAlgo);
        const min = Math.min(...vals);
        const max = Math.max(...vals);

        return [
            Math.max(0, min * 0.98),
            max > 0 ? max * 1.02 : 1,
        ];
    }, [data]);

    return (
        <div className="w-full p-6 border border-white/10 rounded-xl bg-neutral-900/70 backdrop-blur-md">

            <h3 className="text-lg font-light mb-4">
                Pool Balance
            </h3>

            <div className="flex gap-6 mb-4 text-sm text-gray-300">
                <div>
                    <span className="text-gray-400">Balance:</span>{" "}
                    {(stats.balance / 1_000_000).toFixed(6)} ALGO
                </div>
                <div>
                    <span className="text-gray-400">Shares:</span>{" "}
                    {stats.totalShares}
                </div>
                <div>
                    <span className="text-gray-400">Price:</span>{" "}
                    {stats.sharePrice}
                </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm mb-3">
                    Error: {error}
                </div>
            )}

            <div className="w-full h-[300px]">
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />

                        <XAxis
                            dataKey="time"
                            minTickGap={30}
                            stroke="#888"
                        />

                        <YAxis
                            domain={yDomain}
                            stroke="#888"
                        />

                        <Tooltip
                            formatter={(v: number) => [
                                `${v.toFixed(6)} ALGO`,
                                "Balance",
                            ]}
                        />

                        <Line
                            type="monotone"
                            dataKey="balanceAlgo"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}