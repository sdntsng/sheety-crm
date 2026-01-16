'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSheets, createSheet } from '@/lib/api';
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
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [newSheetName, setNewSheetName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

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
                setError('Unable to connect. Please check that you are signed in and try again.');
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

    const handleCreateSheet = async () => {
        if (!newSheetName.trim()) return;
        setCreating(true);
        try {
            const result = await createSheet(newSheetName.trim());
            if (result.success && result.sheet) {
                // Auto-select the new sheet
                localStorage.setItem('selected_sheet_id', result.sheet.name);
                localStorage.setItem('selected_sheet_name', result.sheet.name);
                // Refresh list
                setRetryCount(c => c + 1);
                setShowCreateForm(false);
                setNewSheetName('');
                // Redirect to dashboard
                router.push('/');
            }
        } catch (err) {
            setError('Failed to create sheet. Please try again.');
        } finally {
            setCreating(false);
        }
    };

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
                    Select a Google Sheet to use as your CRM database, or create a new one.
                </p>
            </div>

            {/* Current Selection */}
            {selectedSheet && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <span className="text-xl">✓</span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-400">Currently Connected</p>
                            <p className="text-[var(--color-ink)]">{selectedSheet}</p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                        >
                            Go to Dashboard →
                        </button>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl">⚡</span>
                            <div className="flex-1">
                                <p className="font-medium text-[var(--color-ink)] mb-1">Connection Issue</p>
                                <p className="text-[var(--color-ink-muted)] text-sm mb-4">{error}</p>
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

            {/* Action Buttons */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        <span>+</span> Create New CRM Sheet
                    </button>
                    <a
                        href="/templates/leads-template.csv"
                        download
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--color-ink)] hover:border-[var(--accent)] transition-colors"
                    >
                        📥 Download Leads Template
                    </a>
                    <a
                        href="/templates/opportunities-template.csv"
                        download
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--color-ink)] hover:border-[var(--accent)] transition-colors"
                    >
                        📥 Download Opportunities Template
                    </a>
                </div>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="p-6 rounded-xl bg-[var(--bg-default)] border border-[var(--border)]">
                        <h3 className="font-medium text-[var(--color-ink)] mb-4">Create New CRM Sheet</h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newSheetName}
                                onChange={(e) => setNewSheetName(e.target.value)}
                                placeholder="My Sales Pipeline 2026"
                                className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-paper)] border border-[var(--border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <button
                                onClick={handleCreateSheet}
                                disabled={creating || !newSheetName.trim()}
                                className="px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Sheet'}
                            </button>
                        </div>
                        <p className="text-sm text-[var(--color-ink-muted)] mt-3">
                            This will create a new Google Sheet with Leads, Opportunities, and Activities worksheets pre-configured.
                        </p>
                    </div>
                </div>
            )}

            {/* Sheets List */}
            <div className="max-w-4xl mx-auto">
                {sheets.length === 0 && !error && (
                    <div className="text-center py-16 glass-card">
                        <span className="text-5xl mb-4 block">📭</span>
                        <h3 className="text-xl font-medium text-[var(--color-ink)] mb-2">No Sheets Found</h3>
                        <p className="text-[var(--color-ink-muted)] mb-6 max-w-md mx-auto">
                            Create a new CRM sheet using the button above.
                        </p>
                    </div>
                )}

                {sheets.length > 0 && (
                    <>
                        <h3 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-4">
                            Your Google Sheets ({sheets.length})
                        </h3>
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
                    </>
                )}
            </div>
        </div>
    );
}
