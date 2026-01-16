'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSheets } from '@/lib/api';
import { useSession } from 'next-auth/react';

interface Sheet {
    id: string;
    name: string;
    createdTime?: string;
    modifiedTime?: string;
}

export default function SetupPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

    useEffect(() => {
        // Check if sheet is already selected
        const saved = localStorage.getItem('selected_sheet_id');
        if (saved) {
            setSelectedSheet(saved);
        }
    }, []);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) return;

        async function loadSheets() {
            try {
                const data = await getSheets();
                if (data.sheets) {
                    setSheets(data.sheets);
                }
            } catch (err) {
                setError('Failed to load sheets. Make sure the API server is running.');
            } finally {
                setLoading(false);
            }
        }
        loadSheets();
    }, [session, status]);

    const handleSelect = (sheet: Sheet) => {
        localStorage.setItem('selected_sheet_id', sheet.name);
        localStorage.setItem('selected_sheet_name', sheet.name);
        setSelectedSheet(sheet.name);

        // Small delay for visual feedback
        setTimeout(() => {
            router.push('/');
        }, 300);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-ink-muted)]">Loading your sheets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📊</span>
                    <h1 className="text-3xl font-serif font-bold text-[var(--color-ink)]">
                        Choose Your CRM Database
                    </h1>
                </div>
                <p className="text-[var(--color-ink-muted)] text-lg">
                    Select which Google Sheet to use as your sales pipeline database.
                </p>
            </div>

            {/* Current Selection Banner */}
            {selectedSheet && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <span className="text-xl">✓</span>
                        <div>
                            <p className="text-sm font-medium text-green-400">Currently Connected</p>
                            <p className="text-[var(--color-ink)]">{selectedSheet}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                        <p className="font-medium">⚠️ {error}</p>
                        <p className="text-sm mt-1 opacity-75">
                            Run <code className="bg-zinc-800 px-2 py-0.5 rounded">make crm-dev</code> to start the servers.
                        </p>
                    </div>
                </div>
            )}

            {/* Sheets Grid */}
            <div className="max-w-4xl mx-auto">
                {sheets.length === 0 && !error && (
                    <div className="text-center py-12 glass-card">
                        <span className="text-4xl mb-4 block">📭</span>
                        <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">No Sheets Found</h3>
                        <p className="text-[var(--color-ink-muted)] mb-4">
                            Create a CRM sheet first using the CLI.
                        </p>
                        <code className="bg-zinc-800 px-4 py-2 rounded-lg text-sm">
                            make crm-init
                        </code>
                    </div>
                )}

                <div className="grid gap-4">
                    {sheets.map((sheet) => {
                        const isSelected = selectedSheet === sheet.name;
                        return (
                            <button
                                key={sheet.id}
                                onClick={() => handleSelect(sheet)}
                                className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all duration-200 text-left group
                                    ${isSelected
                                        ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10'
                                        : 'bg-[var(--bg-default)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors
                                        ${isSelected ? 'bg-[var(--accent)]/20' : 'bg-[var(--bg-paper)]'}`}>
                                        📋
                                    </div>
                                    <div>
                                        <p className={`font-medium text-lg ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--color-ink)]'}`}>
                                            {sheet.name}
                                        </p>
                                        <p className="text-sm text-[var(--color-ink-muted)]">
                                            Last modified: {formatDate(sheet.modifiedTime)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {isSelected ? (
                                        <span className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-sm font-medium">
                                            Connected
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-[var(--bg-paper)] text-[var(--color-ink-muted)] text-sm group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                                            Select →
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Help Section */}
                <div className="mt-12 pt-8 border-t border-[var(--border)]">
                    <h3 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-4">
                        Getting Started
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-default)] border border-[var(--border)]">
                            <p className="font-medium text-[var(--color-ink)] mb-1">Create a new CRM sheet</p>
                            <code className="text-sm text-[var(--color-ink-muted)]">make crm-init</code>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-default)] border border-[var(--border)]">
                            <p className="font-medium text-[var(--color-ink)] mb-1">Add a test lead</p>
                            <code className="text-sm text-[var(--color-ink-muted)]">make crm-add-lead COMPANY="..."</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
