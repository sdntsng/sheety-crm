'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { search, SearchResults } from '@/lib/api';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await search(query);
                setResults(data);
                setSelectedIndex(0);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Keyboard shortcut: / to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus search on '/' key (outside input fields)
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
            // Close on Escape
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Get all results as flat list for keyboard navigation
    const allResults = results ? [
        ...results.results.leads.map(l => ({ ...l, _type: 'lead' as const })),
        ...results.results.opportunities.map(o => ({ ...o, _type: 'opportunity' as const })),
    ] : [];

    // Handle keyboard navigation in dropdown
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || allResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && allResults[selectedIndex]) {
            e.preventDefault();
            navigateToResult(allResults[selectedIndex]);
        }
    };

    const navigateToResult = (result: { _type: 'lead' | 'opportunity'; lead_id?: string; opp_id?: string }) => {
        setIsOpen(false);
        setQuery('');
        if (result._type === 'lead') {
            router.push(`/leads?highlight=${result.lead_id}`);
        } else {
            router.push(`/pipeline`);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    className="input w-48 pl-8 pr-7 h-8 text-[13px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                />
                <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                {/* Keyboard hint */}
                {!query && (
                    <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-surface)] px-1 py-0.5 rounded border border-[var(--border-color)]">
                        /
                    </kbd>
                )}
                {loading && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs animate-spin">
                        ⏳
                    </span>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-72 bg-[var(--bg-paper)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 overflow-hidden">
                    {results && results.total > 0 ? (
                        <div className="max-h-72 overflow-y-auto">
                            {/* Leads Section */}
                            {results.results.leads.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] uppercase tracking-wider">
                                        Leads
                                    </div>
                                    {results.results.leads.map((lead, idx) => (
                                        <button
                                            key={lead.lead_id}
                                            className={`w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2.5 ${selectedIndex === idx ? 'bg-[var(--bg-hover)]' : ''
                                                }`}
                                            onClick={() => navigateToResult({ ...lead, _type: 'lead' })}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] text-xs font-semibold">
                                                {lead.company_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                                    {lead.company_name}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-secondary)] truncate">
                                                    {lead.contact_name} • {lead.status}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Opportunities Section */}
                            {results.results.opportunities.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-surface)] uppercase tracking-wider">
                                        Opportunities
                                    </div>
                                    {results.results.opportunities.map((opp, idx) => {
                                        const actualIdx = results.results.leads.length + idx;
                                        return (
                                            <button
                                                key={opp.opp_id}
                                                className={`w-full px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2.5 ${selectedIndex === actualIdx ? 'bg-[var(--bg-hover)]' : ''
                                                    }`}
                                                onClick={() => navigateToResult({ ...opp, _type: 'opportunity' })}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 text-xs">
                                                    💰
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                                                        {opp.title}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                                                        {opp.lead?.company_name || 'Unknown'} • ${opp.value.toLocaleString()}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : results && results.total === 0 ? (
                        <div className="px-4 py-5 text-center text-[var(--text-secondary)] text-[13px]">
                            No results for "{query}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

