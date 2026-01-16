'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSheet } from '@/lib/api';
import { useSession } from 'next-auth/react';
import useDrivePicker from 'react-google-drive-picker';

interface Sheet {
    id: string;
    name: string;
}

export default function SetupPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [openPicker, authResponse] = useDrivePicker();

    // State
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [newSheetName, setNewSheetName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('selected_sheet_name');
        if (saved) setSelectedSheet(saved);
    }, []);

    const handleOpenPicker = () => {
        // @ts-ignore - session.accessToken is injected by our auth config
        const token = session?.accessToken;

        if (!token) {
            setError("Authentication token missing. Please sign in again.");
            return;
        }

        openPicker({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            developerKey: "", // Not strictly needed if using valid OAuth token for many scopes, but good to have if issues arise. 
            // For this lib with OAuth token, usually apiKey is optional or can be empty if token provided.
            viewId: "SPREADSHEETS",
            token: token,
            showUploadView: false,
            showViewList: true,
            supportDrives: true,
            multiselect: false,
            callbackFunction: (data) => {
                if (data.action === 'picked') {
                    const doc = data.docs[0];
                    handleSelect({ id: doc.id, name: doc.name });
                } else if (data.action === 'cancel') {
                    // User cancelled
                }
            },
        });
    };

    const handleSelect = (sheet: Sheet) => {
        localStorage.setItem('selected_sheet_id', sheet.id); // Save ID for backend headers
        localStorage.setItem('selected_sheet_name', sheet.name);
        setSelectedSheet(sheet.name);
        // Slight delay for UX
        setTimeout(() => router.push('/'), 500);
    };

    const handleCreateSheet = async () => {
        if (!newSheetName.trim()) return;
        setCreating(true);
        setError(null);
        try {
            const result = await createSheet(newSheetName.trim());
            if (result.success && result.sheet) {
                // Auto-select the new sheet
                localStorage.setItem('selected_sheet_id', result.sheet.url); // For created ones we might use URL or ID? 
                // Backend create returns ID and URL. 
                // Existing logic uses name/id. 
                // Let's stick to ID usage for consistency if possible, 
                // but backend mainly cares about opening it.
                // Sheets API open() takes name/url/key.

                // Ideally we store the ID.
                localStorage.setItem('selected_sheet_id', result.sheet.id);
                localStorage.setItem('selected_sheet_name', result.sheet.name);

                setNewSheetName('');
                router.push('/');
            }
        } catch (err) {
            setError('Failed to create sheet. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-[var(--bg-paper)]">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-muted)] mb-4 text-3xl">
                    📊
                </div>
                <h1 className="text-3xl font-serif font-bold text-[var(--color-ink)] mb-3">
                    Choose Your Database
                </h1>
                <p className="text-[var(--color-ink-muted)] text-lg max-w-xl mx-auto">
                    SheetyCRM connects directly to your Google Sheets. Select an existing sheet or create a new one to get started.
                </p>
            </div>

            {/* Main Action Card */}
            <div className="max-w-md mx-auto">
                {/* 1. Pick from Drive */}
                <button
                    onClick={handleOpenPicker}
                    className="w-full group relative flex items-center p-6 mb-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-md transition-all text-left"
                >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm mr-4 group-hover:scale-110 transition-transform">
                        📂
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-[var(--color-ink)] text-lg group-hover:text-[var(--accent)] transition-colors">Select from Google Drive</h3>
                        <p className="text-sm text-[var(--color-ink-muted)]">Open the Google Picker to choose a sheet</p>
                    </div>
                    <div className="text-[var(--border-strong)] group-hover:text-[var(--accent)] transition-colors">
                        →
                    </div>
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                    <span className="flex-shrink-0 mx-4 text-[var(--color-ink-muted)] text-sm uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                </div>

                {/* 2. Create New */}
                {!showCreateForm ? (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full group flex items-center p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:shadow-md transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm mr-4 group-hover:scale-110 transition-transform">
                            ✨
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-[var(--color-ink)] text-lg group-hover:text-[var(--accent)] transition-colors">Create New CRM Sheet</h3>
                            <p className="text-sm text-[var(--color-ink-muted)]">We'll set up the columns for you</p>
                        </div>
                        <div className="text-[var(--border-strong)] group-hover:text-[var(--accent)] transition-colors">
                            +
                        </div>
                    </button>
                ) : (
                    <div className="p-6 rounded-xl border border-[var(--accent)] bg-[var(--bg-paper)] shadow-sm animate-fade-in">
                        <h3 className="font-semibold text-[var(--color-ink)] mb-4">Name your new sheet</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSheetName}
                                onChange={(e) => setNewSheetName(e.target.value)}
                                placeholder="My Sales Pipeline"
                                autoFocus
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-color)] focus:border-[var(--accent)] focus:outline-none"
                            />
                            <button
                                onClick={handleCreateSheet}
                                disabled={creating || !newSheetName.trim()}
                                className="px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
                            >
                                {creating ? '...' : 'Create'}
                            </button>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-xs text-[var(--color-ink-muted)] mt-3 hover:text-[var(--color-ink)]"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Templates */}
                <div className="mt-8 flex justify-center gap-4 text-sm text-[var(--accent)]">
                    <a href="/templates/leads-template.csv" download className="hover:underline">Detailed Leads Template</a>
                    <span>•</span>
                    <a href="/templates/opportunities-template.csv" download className="hover:underline">Opportunities Template</a>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                        {error}
                    </div>
                )}
            </div>

            {/* Selected Indicator (Bottom fixed or simple status) */}
            {selectedSheet && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-[var(--color-ink)] text-white rounded-full shadow-lg flex items-center gap-3 animate-fade-in">
                    <span className="text-green-400">✓</span>
                    <span className="font-medium">Connected: {selectedSheet}</span>
                    <button
                        onClick={() => router.push('/')}
                        className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs uppercase tracking-wide transition-colors"
                    >
                        Go
                    </button>
                </div>
            )}
        </div>
    );
}
