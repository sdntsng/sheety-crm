'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getDashboard, DashboardData } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Link from 'next/link';
import SheetSelector from '@/components/SheetSelector';
import Loader from '@/components/Loader';

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [checkingStorage, setCheckingStorage] = useState(true);

    useEffect(() => {
        // Check for sheet selection in local storage
        const saved = localStorage.getItem('selected_sheet_name');
        if (saved) {
            setSelectedSheet(saved);
        }
        setCheckingStorage(false);
    }, []);

    const handleSheetSelection = (sheet: { id: string; name: string }) => {
        setSelectedSheet(sheet.name);
        setLoading(true); // Restart loading to fetch dashboard
    };

    useEffect(() => {
        if (!selectedSheet) return;

        async function fetchData() {
            setLoading(true); // Ensure loading is true when we start fetching
            try {
                const dashboard = await getDashboard();
                setData(dashboard);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
            } finally {
                setLoading(false);
            }
        }
        if (status === 'authenticated') {
            fetchData();
        }
    }, [selectedSheet, status]);

    // 1. Loading State (Init or Auth check)
    if (status === 'loading' || checkingStorage) {
        return <Loader text="Initializing Dashboard..." />;
    }

    // 2. Unauthenticated -> Redirect to Login
    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    // 3. Authenticated but No Sheet -> Sheet Selector (Inline)
    if (!selectedSheet) {
        return <SheetSelector onSheetSelected={handleSheetSelection} />;
    }

    // 4. Authenticated & Sheet Selected -> Dashboard
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return <Loader text="Fetching your data..." />;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-lg mx-auto mt-20">
                    <div className="paper-card p-8 text-center bg-white border border-[var(--border-ink)] shadow-[8px_8px_0px_var(--border-ink)]">
                        <span className="text-4xl mb-4 block">⚠️</span>
                        <h2 className="text-xl font-sans font-bold text-[var(--color-ink)] mb-2">Connection Error</h2>
                        <p className="font-mono text-sm text-[var(--color-ink-muted)] mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const isEmpty = data.total_leads === 0 && data.total_opportunities === 0;

    if (isEmpty) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[80vh]">
                <div className="paper-card p-12 text-center max-w-lg bg-white border-2 border-[var(--border-pencil)] shadow-[12px_12px_0px_rgba(0,0,0,0.05)] transform rotate-1">
                    <div className="w-20 h-20 bg-[var(--bg-paper)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border-pencil)]">
                        <span className="text-5xl">✨</span>
                    </div>
                    <h2 className="text-3xl font-sans font-bold text-[var(--text-primary)] mb-4">
                        A clean desk!
                    </h2>
                    <p className="font-sans italic text-[var(--text-secondary)] text-lg mb-8">
                        "The secret of getting ahead is getting started."
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/leads"
                            className="btn-primary"
                        >
                            Create First Lead
                        </Link>
                        <button
                            onClick={() => setSelectedSheet(null)}
                            className="font-mono text-xs underline hover:text-[var(--accent-blue)]"
                        >
                            Change Sheet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)] mb-2">
                    Start Your Day
                </h1>
                <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-pencil)] pb-2 inline-block">
                    Dashboard • {selectedSheet}
                </p>
            </div>

            {/* Stats Grid - Pinned Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Leads"
                    value={data.total_leads}
                    subtitle="Prospects"
                />
                <StatCard
                    title="Opportunities"
                    value={data.total_opportunities}
                    subtitle="In Pipeline"
                />
                <StatCard
                    title="Pipeline Value"
                    value={formatCurrency(data.total_pipeline_value)}
                    subtitle="Potential Revenue"
                    variant="warning"
                />
                <StatCard
                    title="Revenue"
                    value={formatCurrency(data.cash_in_bank)}
                    subtitle="Closed Won"
                    variant="success"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pipeline Stages - List on Paper */}
                <div className="lg:col-span-2 paper-card p-0 bg-white overflow-hidden">
                    <div className="p-4 border-b-2 border-[var(--border-ink)] bg-[var(--bg-paper)] flex justify-between items-center">
                        <h2 className="font-sans font-bold text-xl">Pipeline Health</h2>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[var(--accent-red)] border border-black/20"></div>
                            <div className="w-3 h-3 rounded-full bg-[var(--accent-yellow)] border border-black/20"></div>
                            <div className="w-3 h-3 rounded-full bg-[var(--accent-blue)] border border-black/20"></div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {Object.entries(data.pipeline_by_stage).map(([stage, stageData]: [string, { count: number; total_value: number }]) => {
                            const percentage = data.total_pipeline_value > 0
                                ? (stageData.total_value / data.total_pipeline_value) * 100
                                : 0;

                            return (
                                <div key={stage} className="flex items-center gap-4 group">
                                    <div className="w-32 font-mono text-xs font-bold text-[var(--text-secondary)] uppercase">{stage}</div>
                                    <div className="flex-1 h-3 bg-[var(--bg-paper)] border border-[var(--border-pencil)] p-[1px] rounded-full">
                                        <div
                                            className="h-full bg-[var(--text-primary)] rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                                            style={{ width: `${Math.max(percentage, 2)}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-24 text-right font-sans font-bold">{formatCurrency(stageData.total_value)}</div>
                                    <div className="w-8 text-center font-mono text-xs bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded">{stageData.count}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-[var(--bg-paper)] border-t border-[var(--border-pencil)] p-2 text-center">
                        <span className="font-sans italic text-xs text-[var(--text-secondary)]">Data refreshes automatically</span>
                    </div>
                </div>

                {/* Leads Breakdown - Notepad */}
                <div className="paper-card p-6 bg-[var(--bg-paper)] border-2 border-[var(--border-pencil)] relative">
                    {/* Spiral Binding Effect */}
                    <div className="absolute top-0 left-6 bottom-0 w-8 border-r-2 border-[var(--border-pencil)] border-double"></div>

                    <div className="pl-12">
                        <h2 className="font-sans font-bold text-xl mb-6 underline decoration-[var(--accent-blue)] decoration-2 underline-offset-4">Lead Status</h2>

                        <div className="space-y-4">
                            {Object.entries(data.leads_by_status).map(([status, count]: [string, number]) => (
                                <div key={status} className="flex justify-between items-end border-b border-[var(--border-pencil)] border-dashed pb-1">
                                    <span className="font-sans text-lg">{status}</span>
                                    <span className="font-mono font-bold text-xl">{count}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-4 border-t-2 border-[var(--border-ink)]">
                            <Link href="/leads" className="font-mono text-xs uppercase font-bold hover:underline flex items-center justify-between group">
                                <span>Go to Leads Ledger</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
