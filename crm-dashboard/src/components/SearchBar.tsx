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
        <div className="relative w-full" ref={containerRef}>
            {/* Search Input */}
            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-transparent border-b-2 border-[var(--border-pencil)] px-8 py-1.5 font-mono text-sm focus:border-[var(--accent-blue)] focus:outline-none transition-colors placeholder:text-[var(--text-muted)] group-hover:border-[var(--text-secondary)]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-blue)]">
                    🔍
                </span>

                {/* Keyboard hint */}
                {!query && (
                    <kbd className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-pencil)] px-1 rounded opacity-50">
                        /
                    </kbd>
                )}
                {loading && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs animate-spin">
                        ✎
                    </span>
                )}
            </div>

            {/* Results Dropdown - Paper Stack Style */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-ink)] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] z-50 p-2 animate-fade-in">
                    {results && results.total > 0 ? (
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {/* Leads Section */}
                            {results.results.leads.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-2 py-1 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-pencil)] mb-1">
                                        Leads
                                    </div>
                                    {results.results.leads.map((lead, idx) => (
                                        <button
                                            key={lead.lead_id}
                                            className={`w-full px-2 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 group ${selectedIndex === idx ? 'bg-[var(--bg-hover)]' : ''
                                                }`}
                                            onClick={() => navigateToResult({ ...lead, _type: 'lead' })}
                                        >
                                            <div className="w-6 h-6 flex items-center justify-center font-sans font-bold text-[var(--text-primary)] border border-[var(--border-pencil)] bg-white group-hover:border-[var(--accent-blue)] group-hover:text-[var(--accent-blue)]">
                                                {lead.company_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-sans font-semibold text-[var(--text-primary)] truncate">
                                                    {lead.company_name}
                                                </p>
                                                <p className="text-xs font-mono text-[var(--text-secondary)] truncate">
                                                    {lead.status}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Opportunities Section */}
                            {results.results.opportunities.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-pencil)] mb-1">
                                        Opportunities
                                    </div>
                                    {results.results.opportunities.map((opp, idx) => {
                                        const actualIdx = results.results.leads.length + idx;
                                        return (
                                            <button
                                                key={opp.opp_id}
                                                className={`w-full px-2 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 group ${selectedIndex === actualIdx ? 'bg-[var(--bg-hover)]' : ''
                                                    }`}
                                                onClick={() => navigateToResult({ ...opp, _type: 'opportunity' })}
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center text-[var(--accent-green)] border border-[var(--border-pencil)] bg-white group-hover:border-green-500">
                                                    $
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-sans font-semibold text-[var(--text-primary)] truncate">
                                                        {opp.title}
                                                    </p>
                                                    <p className="text-xs font-mono text-[var(--text-secondary)] truncate">
                                                        {opp.lead?.company_name} • ${opp.value.toLocaleString()}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : results && results.total === 0 ? (
                        <div className="px-4 py-6 text-center text-[var(--text-muted)] font-sans italic">
                            No matching records found.
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

