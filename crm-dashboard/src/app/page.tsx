'use client';

import { useEffect, useState } from 'react';
import { getDashboard, DashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const dashboard = await getDashboard();
                setData(dashboard);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-zinc-800 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="glass-card p-6 text-center">
                    <p className="text-red-400 mb-4">⚠️ {error}</p>
                    <p className="text-zinc-500 text-sm">
                        Make sure the API server is running: <code className="bg-zinc-800 px-2 py-1 rounded">uvicorn api.server:app --reload</code>
                    </p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
                <p className="text-zinc-500">Sales Pipeline Overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Leads"
                    value={data.total_leads}
                    subtitle="Active prospects"
                />
                <StatCard
                    title="Total Opportunities"
                    value={data.total_opportunities}
                    subtitle="In pipeline"
                />
                <StatCard
                    title="Pipeline Value"
                    value={formatCurrency(data.total_pipeline_value)}
                    subtitle="Total potential"
                    variant="warning"
                />
                <StatCard
                    title="Cash in Bank"
                    value={formatCurrency(data.cash_in_bank)}
                    subtitle="Collected revenue"
                    variant="success"
                />
            </div>

            {/* Pipeline by Stage */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Pipeline by Stage</h2>
                <div className="space-y-3">
                    {Object.entries(data.pipeline_by_stage).map(([stage, stageData]: [string, { count: number; total_value: number; expected_value: number }]) => {
                        const percentage = data.total_pipeline_value > 0
                            ? (stageData.total_value / data.total_pipeline_value) * 100
                            : 0;

                        return (
                            <div key={stage} className="flex items-center gap-4">
                                <div className="w-32 text-sm text-zinc-400">{stage}</div>
                                <div className="flex-1">
                                    <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(percentage, 1)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-24 text-right text-sm font-medium text-zinc-300">
                                    {formatCurrency(stageData.total_value)}
                                </div>
                                <div className="w-12 text-right text-xs text-zinc-500">
                                    {stageData.count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leads by Status */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Leads by Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(data.leads_by_status).map(([status, count]: [string, number]) => (
                        <div key={status} className="text-center p-4 bg-zinc-800/50 rounded-lg">
                            <p className="text-2xl font-bold text-zinc-100">{count}</p>
                            <p className="text-sm text-zinc-500">{status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
