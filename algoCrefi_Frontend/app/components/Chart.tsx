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

const API_URL = "http://localhost:5000/api/pool/pool-info";
const POLL_INTERVAL_MS = 5000;
const MAX_POINTS = 100;

interface PoolDataPoint {
    time: string;
    ts: number;
    balanceAlgo: number;
    totalShares: number;
    sharePrice: number;
}

export default function PoolLiveGraph() {
    const [data, setData] = useState<PoolDataPoint[]>([]);
    const [stats, setStats] = useState({ balance: 0, totalShares: 0, sharePrice: 0 });
    const [error, setError] = useState("");

    useEffect(() => {
        let timer;

        const fetchPool = async () => {
            try {
                const res = await fetch(API_URL);
                const json = await res.json();

                if (!json.success) {
                    throw new Error(json.error || "Failed to fetch pool info");
                }

                const balance = Number(json.pool.balance || 0);
                const totalShares = Number(json.pool.totalShares || 0);
                const sharePrice = Number(json.pool.sharePrice || 0);

                setStats({ balance, totalShares, sharePrice });

                const point = {
                    time: new Date().toLocaleTimeString(),
                    ts: Date.now(),
                    balanceAlgo: balance / 1_000_000,
                    totalShares,
                    sharePrice,
                };

                setData((prev) => {
                    const next = [...prev, point];
                    return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
                });

                setError("");
            } catch (e: any) {
                setError(e.message || 'Failed to fetch pool data');
            }
        };

        fetchPool();
        timer = setInterval(fetchPool, POLL_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []);

    const yDomain = useMemo(() => {
        if (!data.length) return [0, 1];
        const vals = data.map((d) => d.balanceAlgo);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        return [Math.max(0, min * 0.98), max * 1.02 || 1];
    }, [data]);

    return (
        <div style={{ width: "100%", padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>Pool Balance (Live)</h3>

            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <div><b>Balance:</b> {(stats.balance / 1_000_000).toFixed(6)} ALGO</div>
                <div><b>Total Shares:</b> {stats.totalShares}</div>
                <div><b>Share Price:</b> {stats.sharePrice}</div>
            </div>

            {error && <div style={{ color: "crimson", marginBottom: 8 }}>Error: {error}</div>}

            <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" minTickGap={30} />
                        <YAxis domain={yDomain} />
                        <Tooltip formatter={(v) => [`${Number(v).toFixed(6)} ALGO`, "Balance"]} />
                        <Line
                            type="monotone"
                            dataKey="balanceAlgo"
                            stroke="#1d7afc"
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