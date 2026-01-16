'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSheets } from '@/lib/api';
import { useSession } from 'next-auth/react';

export default function SetupPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [sheets, setSheets] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;

        async function loadSheets() {
            try {
                const data = await getSheets();
                // @ts-ignore
                if (data.sheets) {
                    // @ts-ignore
                    setSheets(data.sheets);
                } else if (Array.isArray(data)) {
                    // @ts-ignore
                    setSheets(data);
                }
            } catch (err) {
                setError('Failed to load sheets. Make sure backend is running.');
            } finally {
                setLoading(false);
            }
        }
        loadSheets();
    }, [session]);

    const handleSelect = (sheetId: string) => {
        localStorage.setItem('selected_sheet_id', sheetId);
        // Force a hard reload or just push? Hard reload ensures API client picks up new ID if outside component lifecycle (though we check localStorage on every fetch)
        // Pushing is fine.
        router.push('/');
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading sheets...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-paper)] p-4">
            <div className="glass-card max-w-2xl w-full p-8">
                <h1 className="text-2xl font-serif font-bold text-[var(--accent)] mb-2">
                    Select CRM Sheet
                </h1>
                <p className="text-[var(--color-ink-muted)] mb-8">
                    Choose which Google Sheet to use as your database.
                </p>

                {error && (
                    <div className="p-4 mb-4 bg-red-900/20 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {sheets.length === 0 && !error && (
                        <p className="text-center text-zinc-500">No sheets found.</p>
                    )}

                    {sheets.map((sheet) => (
                        <button
                            key={sheet.id}
                            onClick={() => handleSelect(sheet.name)} // Backend expects Name or ID. using Name is friendlier if unique, but ID is safer. Backend supports both.
                            // However, src/sheets.py get_sheet uses name_or_url. ID works too if "SpreadsheetNotFound" triggers and it tries open_by_key.
                            // But list_files returns 'id' and 'name'.
                            // Let's use ID for robustness?  wait, src/sheets.py:37 `gc.open(name_or_url)`.
                            // If I pass ID to gc.open(), gspread might not like it.
                            // But lines 38-40 handle exception and try `open_by_key`. So ID is fine.
                            // But let's verify if `sheet.name` is safer for user recognition if displayed in UI?
                            // Actually, backend uses `x-sheet-id` as the argument to CRMManager.
                            // CRMManager passes it to SheetManager.
                            // So I will pass `sheet.name` if it's a valid name, or `sheet.id`?
                            // If I pass name "Sales Pipeline 2026", it works.
                            // If I pass ID, it goes to exception handler and works.
                            // Let's use ID to avoid name collisions, but wait...
                            // If I use ID, I won't know the name in the Sidebar later.
                            // For now, let's use ID for `x-sheet-id`.
                            className="w-full flex items-center justify-between p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-md transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-[var(--color-ink-muted)] group-hover:text-[var(--accent)]">
                                    📊
                                </span>
                                <div>
                                    <p className="font-medium text-[var(--color-ink)]">
                                        {sheet.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-ink-muted)]">
                                        {sheet.id}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                                Select →
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
                    <p className="text-sm text-[var(--color-ink-muted)]">
                        Don't have a CRM sheet?
                        Run <code className="bg-zinc-800 px-1 rounded">make crm-init</code> locally to create one.
                    </p>
                </div>
            </div>
        </div>
    );
}
