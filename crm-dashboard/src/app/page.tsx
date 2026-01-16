'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard, DashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

    useEffect(() => {
        // Check if a sheet is selected
        const saved = localStorage.getItem('selected_sheet_name');
        if (!saved) {
            // Redirect to setup if no sheet selected
            router.push('/setup');
            return;
        }
        setSelectedSheet(saved);
    }, [router]);

    useEffect(() => {
        if (!selectedSheet) return;

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
    }, [selectedSheet]);

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
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-[var(--bg-default)] rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-[var(--bg-default)] rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-[var(--bg-default)] rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-lg mx-auto mt-20">
                    <div className="glass-card p-8 text-center">
                        <span className="text-4xl mb-4 block">⚠️</span>
                        <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-2">Connection Error</h2>
                        <p className="text-[var(--color-ink-muted)] mb-6">{error}</p>
                        <div className="space-y-3">
                            <p className="text-sm text-[var(--color-ink-muted)]">
                                Make sure the API server is running:
                            </p>
                            <code className="block bg-zinc-800 px-4 py-2 rounded-lg text-sm">
                                make crm-dev
                            </code>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Check if this is an empty CRM
    const isEmpty = data.total_leads === 0 && data.total_opportunities === 0;

    if (isEmpty) {
        return (
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--color-ink)]">Dashboard</h1>
                    <p className="text-[var(--color-ink-muted)]">
                        Connected to: <span className="font-medium">{selectedSheet}</span>
                    </p>
                </div>

                {/* Empty State */}
                <div className="max-w-lg mx-auto mt-12">
                    <div className="glass-card p-8 text-center">
                        <span className="text-5xl mb-4 block">🚀</span>
                        <h2 className="text-2xl font-serif font-bold text-[var(--color-ink)] mb-2">
                            Welcome to Vinci CRM
                        </h2>
                        <p className="text-[var(--color-ink-muted)] mb-6">
                            Your CRM is ready! Start by adding your first lead.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link
                                href="/leads"
                                className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Add First Lead
                            </Link>
                            <Link
                                href="/setup"
                                className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--color-ink)] hover:border-[var(--accent)] transition-colors"
                            >
                                Change Sheet
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--color-ink)]">Dashboard</h1>
                <p className="text-[var(--color-ink-muted)]">
                    Connected to: <span className="font-medium text-[var(--accent)]">{selectedSheet}</span>
                </p>
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
                <h2 className="text-lg font-semibold mb-4 text-[var(--color-ink)]">Pipeline by Stage</h2>
                <div className="space-y-3">
                    {Object.entries(data.pipeline_by_stage).map(([stage, stageData]: [string, { count: number; total_value: number; expected_value: number }]) => {
                        const percentage = data.total_pipeline_value > 0
                            ? (stageData.total_value / data.total_pipeline_value) * 100
                            : 0;

                        return (
                            <div key={stage} className="flex items-center gap-4">
                                <div className="w-28 text-sm text-[var(--color-ink-muted)]">{stage}</div>
                                <div className="flex-1">
                                    <div className="h-6 bg-[var(--bg-default)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(percentage, 2)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-24 text-right text-sm font-medium text-[var(--color-ink)]">
                                    {formatCurrency(stageData.total_value)}
                                </div>
                                <div className="w-10 text-right text-xs text-[var(--color-ink-muted)]">
                                    {stageData.count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leads by Status */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 text-[var(--color-ink)]">Leads by Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(data.leads_by_status).map(([status, count]: [string, number]) => (
                        <div key={status} className="text-center p-4 bg-[var(--bg-default)] rounded-lg border border-[var(--border)]">
                            <p className="text-2xl font-bold text-[var(--color-ink)]">{count}</p>
                            <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
