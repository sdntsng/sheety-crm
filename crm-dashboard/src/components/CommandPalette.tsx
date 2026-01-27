'use client';

import { Command } from 'cmdk';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { search, SearchResults } from '@/lib/api';
import { useKeyboardShortcutsContext } from '@/providers/KeyboardShortcutsContext';
import {
    LayoutDashboard,
    Trello,
    Users,
    Settings,
    Plus,
    Moon,
    BarChart3,
    Search,
    DollarSign
} from 'lucide-react';

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
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();

    // Toggle logic (internal state or controlled)
    const isOpen = controlledOpen ?? open;
    const setIsOpen = onOpenChange ?? setOpen;

    // Register shortcut for Help Menu display
    useEffect(() => {
        registerShortcut({
            key: '⌘K',
            description: 'Open Command Menu',
            section: 'General'
        });
        return () => unregisterShortcut('⌘K');
    }, [registerShortcut, unregisterShortcut]);

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setIsOpen]);

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
            <div className="flex items-center border-b border-[var(--border-pencil)] px-3">
                <Search className="w-5 h-5 text-[var(--text-muted)] mr-2" />
                <Command.Input
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Type a command or search..."
                    className="flex-1"
                />
            </div>

            <Command.List>
                {loading && <Command.Loading>Loading results...</Command.Loading>}

                {!loading && query.length >= 2 && searchResults?.total === 0 && (
                    <Command.Empty>No results found.</Command.Empty>
                )}

                {/* Default Actions (when no search query) */}
                {query.length === 0 && (
                    <>
                        <Command.Group heading="Navigation">
                            <Command.Item onSelect={() => navigate('/dashboard')}>
                                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/dashboard')}>
                                <BarChart3 className="mr-2 w-4 h-4" /> Go to Analytics
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/pipeline')}>
                                <Trello className="mr-2 w-4 h-4" /> Pipeline
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/leads')}>
                                <Users className="mr-2 w-4 h-4" /> Leads
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/settings')}>
                                <Settings className="mr-2 w-4 h-4" /> Settings
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Actions">
                            <Command.Item onSelect={() => navigate('/leads?action=new')}>
                                <Plus className="mr-2 w-4 h-4" /> New Lead
                            </Command.Item>
                            <Command.Item onSelect={() => navigate('/pipeline?action=new')}>
                                <Plus className="mr-2 w-4 h-4" /> New Opportunity
                            </Command.Item>
                            <Command.Item onSelect={() => {
                                const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                                document.documentElement.setAttribute('data-theme', newTheme);
                                localStorage.setItem('theme', newTheme);
                                handleSelect(() => { });
                            }}>
                                <Moon className="mr-2 w-4 h-4" /> Toggle Dark/Light Mode
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
                                        value={`lead ${lead.company_name} ${lead.contact_name}`}
                                    >
                                        <Users className="mr-2 w-4 h-4 text-[var(--text-muted)]" />
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
                                        onSelect={() => navigate(`/pipeline?highlight=${opp.opp_id}`)}
                                        value={`opportunity ${opp.title} ${opp.lead?.company_name}`}
                                    >
                                        <DollarSign className="mr-2 w-4 h-4 text-[var(--text-muted)]" />
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
