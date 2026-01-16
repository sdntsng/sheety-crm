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
        <div className="relative">
            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search leads, opportunities..."
                    className="input w-64 pl-9 pr-8 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
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
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        /
                    </kbd>
                )}
                {loading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin">
                        ⏳
                    </span>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    {results && results.total > 0 ? (
                        <div className="max-h-80 overflow-y-auto">
                            {/* Leads Section */}
                            {results.results.leads.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-zinc-500 bg-zinc-800/50">
                                        Leads
                                    </div>
                                    {results.results.leads.map((lead, idx) => (
                                        <button
                                            key={lead.lead_id}
                                            className={`w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 ${selectedIndex === idx ? 'bg-zinc-800' : ''
                                                }`}
                                            onClick={() => navigateToResult({ ...lead, _type: 'lead' })}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                                                {lead.company_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-100 truncate">
                                                    {lead.company_name}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">
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
                                    <div className="px-3 py-2 text-xs font-medium text-zinc-500 bg-zinc-800/50">
                                        Opportunities
                                    </div>
                                    {results.results.opportunities.map((opp, idx) => {
                                        const actualIdx = results.results.leads.length + idx;
                                        return (
                                            <button
                                                key={opp.opp_id}
                                                className={`w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 ${selectedIndex === actualIdx ? 'bg-zinc-800' : ''
                                                    }`}
                                                onClick={() => navigateToResult({ ...opp, _type: 'opportunity' })}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm">
                                                    💰
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-zinc-100 truncate">
                                                        {opp.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
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
                        <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                            No results for "{query}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
