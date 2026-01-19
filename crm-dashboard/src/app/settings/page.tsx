'use client';

import { useEffect, useState } from 'react';
import { getConfig, Config } from '@/lib/api';
import { useSettings } from '@/providers/SettingsProvider';
import { SkeletonBox } from '@/components/SkeletonLoader';

export default function SettingsPage() {
    const { hiddenStages, hiddenStatuses, toggleStage, toggleStatus } = useSettings();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConfig() {
            try {
                const data = await getConfig();
                setConfig(data);
            } catch (err) {
                console.error('Failed to fetch config for settings:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <div className="h-12 bg-[var(--bg-surface)] rounded w-1/3 mb-8 animate-pulse border-b-4 border-[var(--text-primary)] pb-2"></div>

                <div className="space-y-12">
                    {/* Pipeline Settings Skeleton */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <SkeletonBox className="w-6 h-6" />
                            <SkeletonBox className="h-8 w-48" />
                        </div>
                        <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                            <SkeletonBox className="h-4 w-64 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <SkeletonBox key={i} className="h-12" />
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Lead Settings Skeleton */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <SkeletonBox className="w-6 h-6" />
                            <SkeletonBox className="h-8 w-40" />
                        </div>
                        <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                            <SkeletonBox className="h-4 w-64 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <SkeletonBox key={i} className="h-12" />
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)] mb-8 border-b-4 border-[var(--text-primary)] pb-2">
                Workspace Settings
            </h1>

            <div className="space-y-12">
                {/* Pipeline Settings */}
                <section>
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Pipeline Stages
                    </h2>
                    <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <p className="font-mono text-xs text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                            Select which stages to display on your board
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {config?.pipeline_stages.map((stage) => (
                                <label key={stage} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer border border-[var(--border-pencil)] border-dashed rounded transition-colors select-none">
                                    <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${!hiddenStages.includes(stage) ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--text-secondary)] bg-transparent'}`}>
                                        {!hiddenStages.includes(stage) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={!hiddenStages.includes(stage)}
                                        onChange={() => toggleStage(stage)}
                                    />
                                    <span className={`font-sans font-bold ${hiddenStages.includes(stage) ? 'text-[var(--text-secondary)] line-through decoration-2' : 'text-[var(--text-primary)]'}`}>
                                        {stage}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Leads Settings */}
                <section>
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-green)]">■</span> Lead Statuses
                    </h2>
                    <div className="bg-white border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <p className="font-mono text-xs text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                            Select which status tabs to display in the ledger
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {config?.lead_statuses.map((status) => (
                                <label key={status} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] cursor-pointer border border-[var(--border-pencil)] border-dashed rounded transition-colors select-none">
                                    <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${!hiddenStatuses.includes(status) ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--text-secondary)] bg-transparent'}`}>
                                        {!hiddenStatuses.includes(status) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={!hiddenStatuses.includes(status)}
                                        onChange={() => toggleStatus(status)}
                                    />
                                    <span className={`font-sans font-bold ${hiddenStatuses.includes(status) ? 'text-[var(--text-secondary)] line-through decoration-2' : 'text-[var(--text-primary)]'}`}>
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
