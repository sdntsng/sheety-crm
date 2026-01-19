'use client';

import { useEffect, useState } from 'react';
import { getLeads, createLead, Lead, getConfig, Config } from '@/lib/api';
import ConvertLeadModal from '@/components/modals/ConvertLeadModal';
import { useSettings } from '@/providers/SettingsProvider';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
    const { hiddenStatuses } = useSettings();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setShowModal(true);
            // Clean up URL
            router.replace('/leads');
        }
    }, [searchParams, router]);

    const fetchLeads = async () => {
        try {
            const leadsData = await getLeads();
            setLeads(leadsData.leads);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch leads');
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const [leadsData, configData] = await Promise.all([
                    getLeads(),
                    getConfig(),
                ]);
                setLeads(leadsData.leads);
                setConfig(configData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch leads');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useKeyboardShortcut({
        key: 'n',
        description: 'New Lead',
        section: 'Actions',
        onKeyPressed: () => setShowModal(true)
    });

    const filteredLeads = statusFilter
        ? leads.filter(l => l.status === statusFilter)
        : leads;

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

    if (error) return <div className="p-8 text-red-500 font-mono">Error: {error}</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end border-b-4 border-[var(--text-primary)] pb-4">
                <div>
                    <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)] leading-none">Values Ledger</h1>
                    <p className="font-mono text-sm text-[var(--text-secondary)] mt-2 uppercase tracking-widest">
                        {leads.length} Records Found • {new Date().toLocaleDateString()}
                    </p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
                    <span className="text-xl leading-none">+</span> New Entry
                </button>
            </div>

            {/* Filters - Tabs Style */}
            <div className="mb-6 flex justify-between items-end">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-all border-b-2 whitespace-nowrap ${statusFilter === '' ? 'border-[var(--accent-blue)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        All Entries
                    </button>
                    {config?.lead_statuses
                        .filter(status => !hiddenStatuses.includes(status))
                        .map((status: string) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-all border-b-2 whitespace-nowrap ${statusFilter === status ? 'border-[var(--accent-blue)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {status}
                            </button>
                        ))}
                </div>
            </div>

            {/* Leads Table - Ledger Style */}
            <div className="bg-white border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-ink)]">
                            <tr>
                                <th className="p-4 font-sans font-bold text-[var(--text-primary)] border-r border-[var(--border-pencil)]">Company</th>
                                <th className="p-4 font-sans font-bold text-[var(--text-primary)] border-r border-[var(--border-pencil)]">Contact Person</th>
                                <th className="p-4 font-sans font-bold text-[var(--text-primary)] border-r border-[var(--border-pencil)]">Contact Info</th>
                                <th className="p-4 font-sans font-bold text-[var(--text-primary)] border-r border-[var(--border-pencil)] w-32 text-center">Status</th>
                                <th className="p-4 font-sans font-bold text-[var(--text-primary)] w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-pencil)] divide-dashed">
                            {filteredLeads.map(lead => (
                                <tr key={lead.lead_id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                    <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
                                        <span className="font-sans font-bold text-lg text-[var(--text-primary)]">{lead.company_name}</span>
                                        <div className="font-mono text-[10px] text-[var(--text-secondary)] uppercase mt-1">{lead.source}</div>
                                    </td>
                                    <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
                                        <span className="font-sans text-[var(--text-primary)]">{lead.contact_name}</span>
                                    </td>
                                    <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
                                        <div className="font-mono text-xs text-[var(--text-secondary)]">
                                            {lead.contact_email && <div>✉️ {lead.contact_email}</div>}
                                            {lead.contact_phone && <div>📞 {lead.contact_phone}</div>}
                                        </div>
                                    </td>
                                    <td className="p-4 border-r border-[var(--border-pencil)] border-dashed text-center">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="p-4 text-center">
                                        {lead.status !== 'Qualified' && lead.status !== 'Lost' && lead.status !== 'Unqualified' && (
                                            <button
                                                className="px-3 py-1 font-mono text-[10px] uppercase font-bold border border-[var(--border-pencil)] rounded bg-white hover:bg-[var(--accent-green)] hover:text-white hover:border-[var(--accent-green)] transition-all shadow-sm"
                                                onClick={() => setLeadToConvert(lead)}
                                            >
                                                Convert →
                                            </button>
                                        )}
                                        {lead.status === 'Qualified' && (
                                            <span className="font-sans italic text-xs text-green-600">✓ In Pipeline</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-[var(--text-secondary)] font-sans italic border-b border-[var(--border-pencil)]">
                                        No entries found in the ledger.
                                    </td>
                                </tr>
                            )}
                            {/* Empty rows filler for ledger look */}
                            {[1, 2, 3].map(i => (
                                <tr key={`empty-${i}`} className="h-16">
                                    <td className="border-r border-[var(--border-pencil)] border-dashed"></td>
                                    <td className="border-r border-[var(--border-pencil)] border-dashed"></td>
                                    <td className="border-r border-[var(--border-pencil)] border-dashed"></td>
                                    <td className="border-r border-[var(--border-pencil)] border-dashed"></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

            {/* Add Lead Modal */ }
    {
        showModal && (
            <AddLeadModal
                config={config}
                onClose={() => setShowModal(false)}
                onAdded={(lead) => {
                    setLeads([...leads, lead]);
                    setShowModal(false);
                }}
            />
        )
    }

    {/* Convert Lead Modal */ }
    {
        leadToConvert && (
            <ConvertLeadModal
                lead={leadToConvert}
                onClose={() => setLeadToConvert(null)}
                onSuccess={() => {
                    setLeadToConvert(null);
                    fetchLeads();
                }}
            />
        )
    }
        </div >
    );
}

function StatusBadge({ status }: { status: string }) {
    // "Stamped" look
    const colors: Record<string, string> = {
        New: 'border-blue-500 text-blue-600',
        Contacted: 'border-yellow-500 text-yellow-600',
        Qualified: 'border-green-500 text-green-600 transform -rotate-2', // Qualified gets a jaunty tilt
        Unqualified: 'border-gray-400 text-gray-500',
        Lost: 'border-red-500 text-red-600 opacity-70',
    };

    return (
        <span className={`inline-block px-3 py-1 text-xs font-mono font-bold uppercase border-2 rounded ${colors[status] || 'border-gray-800 text-gray-800'}`}>
            {status}
        </span>
    );
}

function AddLeadModal({ config, onClose, onAdded }: { config: Config | null; onClose: () => void; onAdded: (lead: Lead) => void; }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        source: 'Other',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const lead = await createLead(formData);
            onAdded(lead);
        } catch (err) {
            console.error('Failed to create lead:', err);
        } finally {
            setLoading(false);
        }
    };

    useKeyboardShortcut({
        key: 'Escape',
        description: 'Close Modal',
        section: 'Navigation',
        onKeyPressed: onClose
    });

    useKeyboardShortcut({
        key: 's',
        description: 'Save Entry',
        section: 'Actions',
        onKeyPressed: () => {
            const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
            handleSubmit(fakeEvent);
        }
    });

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[8px_8px_0px_rgba(0,0,0,0.1)] w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <div className="bg-[var(--bg-paper)] p-4 border-b-2 border-[var(--border-ink)] flex justify-between items-center">
                    <h2 className="font-sans font-bold text-xl">New Lead Entry</h2>
                    <button onClick={onClose} className="font-bold text-xl hover:text-red-500">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">Company Name *</label>
                        <input
                            type="text"
                            className="w-full bg-transparent border-b-2 border-[var(--border-pencil)] px-2 py-1 font-sans text-lg focus:border-[var(--accent-blue)] focus:outline-none"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">Contact Name *</label>
                        <input
                            type="text"
                            className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-sans"
                            value={formData.contact_name}
                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-mono text-xs font-bold uppercase mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono text-xs"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-mono text-xs font-bold uppercase mb-1">Phone</label>
                            <input
                                type="tel"
                                className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono text-xs"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">Source</label>
                        <select
                            className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-sans"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        >
                            {config?.lead_sources.map((source: string) => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-pencil)] border-dashed mt-6">
                        <button type="button" onClick={onClose} className="font-mono text-xs uppercase hover:underline">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Writing...' : 'Add Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
