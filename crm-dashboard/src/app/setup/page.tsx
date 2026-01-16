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
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('selected_sheet_id');
        if (saved) setSelectedSheet(saved);
    }, []);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) return;

        async function loadSheets() {
            setLoading(true);
            setError(null);
            try {
                const data = await getSheets();
                if (data.sheets) {
                    setSheets(data.sheets);
                }
            } catch (err) {
                setError('Unable to connect to the database service. Please try again.');
            } finally {
                setLoading(false);
            }
        }
        loadSheets();
    }, [session, status, retryCount]);

    const handleSelect = (sheet: Sheet) => {
        localStorage.setItem('selected_sheet_id', sheet.name);
        localStorage.setItem('selected_sheet_name', sheet.name);
        setSelectedSheet(sheet.name);
        setTimeout(() => router.push('/'), 300);
    };

    const handleRetry = () => setRetryCount(c => c + 1);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
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
                        Choose Your Database
                    </h1>
                </div>
                <p className="text-[var(--color-ink-muted)] text-lg">
                    Select a Google Sheet to use as your CRM database.
                </p>
            </div>

            {/* Current Selection */}
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
                    <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl">⚡</span>
                            <div className="flex-1">
                                <p className="font-medium text-[var(--color-ink)] mb-1">Connection Issue</p>
                                <p className="text-[var(--color-ink-muted)] text-sm mb-4">
                                    We couldn't connect to fetch your sheets. This usually means the backend service needs to be started.
                                </p>
                                <button
                                    onClick={handleRetry}
                                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sheets List */}
            <div className="max-w-4xl mx-auto">
                {sheets.length === 0 && !error && (
                    <div className="text-center py-16 glass-card">
                        <span className="text-5xl mb-4 block">📭</span>
                        <h3 className="text-xl font-medium text-[var(--color-ink)] mb-2">No CRM Sheets Found</h3>
                        <p className="text-[var(--color-ink-muted)] mb-6 max-w-md mx-auto">
                            Create a new Google Sheet with the required CRM structure to get started.
                        </p>
                        <a
                            href="https://docs.google.com/spreadsheets/create"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
                        >
                            <span>+</span> Create in Google Sheets
                        </a>
                    </div>
                )}

                {sheets.length > 0 && (
                    <div className="grid gap-3">
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
                                                Modified {formatDate(sheet.modifiedTime)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {isSelected ? (
                                            <span className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-white text-sm font-medium">
                                                Connected
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-paper)] text-[var(--color-ink-muted)] text-sm group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                                                Select →
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
