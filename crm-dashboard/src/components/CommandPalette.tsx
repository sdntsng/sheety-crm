'use client';

import { Command } from 'cmdk';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { search, SearchResults, Lead, Opportunity } from '@/lib/api';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface CommandPaletteProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
    const router = useRouter();

    // Toggle logic (internal state or controlled)
    const isOpen = controlledOpen ?? open;
    const setIsOpen = onOpenChange ?? setOpen;

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // We need to handle both controlled and uncontrolled usage
                // For this specific shortcut, we want to toggle.
                // If controlled (onOpenChange provided), we rely on the parent to handle it, but we can't easily "toggle" without knowing current 'isOpen' inside the effect if it's stale.
                // However, 'isOpen' is in dep array of effect below? No, it wasn't.
                // Let's just use the current 'isOpen' value from the component scope which is updated.
                setIsOpen(!isOpen);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setIsOpen, isOpen]); // Added isOpen to deps

    // Search Logic
    useEffect(() => {
        if (!isOpen || query.length < 2) {
            setSearchResults(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await search(query);
                setSearchResults(data);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, isOpen]);

    const handleSelect = useCallback((action: () => void) => {
        action();
        setIsOpen(false);
        setQuery('');
    }, [setIsOpen]);

    const navigate = (path: string) => {
        handleSelect(() => router.push(path));
    };

    return (
        <Command.Dialog
            open={isOpen}
            onOpenChange={setIsOpen}
            label="Command Menu"
            loop
        >
            <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search..."
            />

            <Command.List>
                {loading && <Command.Loading>Loading results...</Command.Loading>}

                {!loading && query.length >= 2 && searchResults?.total === 0 && (
                    <Command.Empty>No results found.</Command.Empty>
                )}

                {/* Default Actions (when no search query or explicitly shown) */}
                {query.length === 0 && (
                    <>
                        <Command.Group heading="Navigation">
                            <Command.Item onSelect={() => navigate('/dashboard')}>
                                <span className="mr-2">🏠</span> Dashboard
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/pipeline')}>
                                <span className="mr-2">📊</span> Pipeline
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/leads')}>
                                <span className="mr-2">👥</span> Leads
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/settings')}>
                                <span className="mr-2">⚙️</span> Settings
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Actions">
                            <Command.Item onSelect={() => {
                                // We can't easily open modals from here without context or URL params
                                // For now, let's assume we navigate to the page and maybe use query param to open modal?
                                // Or use a global UI context (which we don't have fully set up for modals yet)
                                // Let's try navigating to page with ?action=new
                                navigate('/leads?action=new');
                            }}>
                                <span className="mr-2">✨</span> New Lead
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/pipeline?action=new')}>
                                <span className="mr-2">💰</span> New Opportunity
                            </Command.Item>
                            <Command.Item onSelect={() => {
                                const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                                document.documentElement.setAttribute('data-theme', newTheme);
                                localStorage.setItem('theme', newTheme);
                                handleSelect(() => { }); // Just close
                            }}>
                                <span className="mr-2">🌓</span> Toggle Dark/Light Mode
                            </Command.Item>
                        </Command.Group>
                    </>
                )}

                {/* Search Results */}
                {searchResults && (
                    <>
                        {searchResults.results.leads.length > 0 && (
                            <Command.Group heading="Leads">
                                {searchResults.results.leads.map((lead) => (
                                    <Command.Item
                                        key={lead.lead_id}
                                        onSelect={() => navigate(`/leads?highlight=${lead.lead_id}`)}
                                        value={`lead ${lead.company_name} ${lead.contact_name}`} // optimize search filtering by cmdk
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold">{lead.company_name}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">{lead.contact_name}</span>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        {searchResults.results.opportunities.length > 0 && (
                            <Command.Group heading="Opportunities">
                                {searchResults.results.opportunities.map((opp) => (
                                    <Command.Item
                                        key={opp.opp_id}
                                        onSelect={() => navigate(`/pipeline?highlight=${opp.opp_id}`)} // Pipeline page might not support highlight yet, but good for future
                                        value={`opportunity ${opp.title} ${opp.lead?.company_name}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold">{opp.title}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">{opp.lead?.company_name} • ${opp.value}</span>
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </>
                )}

            </Command.List>
        </Command.Dialog>
    );
}
