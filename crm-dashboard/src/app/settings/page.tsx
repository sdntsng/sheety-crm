'use client';

import { useEffect, useState } from 'react';
import { getConfig, Config } from '@/lib/api';
import { useSettings } from '@/providers/SettingsProvider';
import ThemeToggle from '@/components/ThemeToggle';

export default function SettingsPage() {
    const { hiddenStages, hiddenStatuses, toggleStage, toggleStatus } = useSettings();
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<string>('dark');

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

        // Get current theme
        const stored = localStorage.getItem('theme') || 'dark';
        setCurrentTheme(stored);

        // Listen for theme changes (both same tab and other tabs)
        const handleThemeChange = (e: Event) => {
            const newTheme = (e as CustomEvent).detail || localStorage.getItem('theme') || 'dark';
            setCurrentTheme(newTheme);
        };
        const handleStorage = () => {
            const stored = localStorage.getItem('theme') || 'dark';
            setCurrentTheme(stored);
        };
        
        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleStorage);
        
        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-[var(--bg-surface)] rounded w-1/4"></div>
                    <div className="h-64 bg-white rounded border border-gray-200"></div>
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
                {/* Theme Settings */}
                <section>
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Appearance
                    </h2>
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <p className="font-mono text-xs text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                            Choose your preferred color scheme
                        </p>
                        <div className="flex items-center justify-between p-4 border border-[var(--border-pencil)] border-dashed rounded">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <ThemeToggle />
                                    <div>
                                        <p className="font-sans font-bold text-[var(--text-primary)]">
                                            {currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                        </p>
                                        <p className="font-mono text-xs text-[var(--text-secondary)]">
                                            Current theme
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-pencil)] rounded">
                                <kbd className="font-mono text-xs font-bold text-[var(--text-secondary)]">⌘K</kbd>
                                <span className="font-mono text-xs text-[var(--text-muted)]">or</span>
                                <kbd className="font-mono text-xs font-bold text-[var(--text-secondary)]">Ctrl+K</kbd>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pipeline Settings */}
                <section>
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Pipeline Stages
                    </h2>
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
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
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
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
