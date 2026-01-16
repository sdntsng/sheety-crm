'use client';

import { useEffect, useState } from 'react';
import { getLeads, createLead, Lead, getConfig, Config } from '@/lib/api';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');

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

    const filteredLeads = statusFilter
        ? leads.filter(l => l.status === statusFilter)
        : leads;

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
                    <div className="h-64 bg-zinc-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="glass-card p-6 text-center">
                    <p className="text-red-400 mb-4">⚠️ {error}</p>
                    <p className="text-zinc-500 text-sm">
                        Make sure the API server is running
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Leads</h1>
                    <p className="text-zinc-500">{leads.length} total leads</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + Add Lead
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {config?.lead_statuses.map((status: string) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            {/* Leads Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Company</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Contact</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Email</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Source</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map(lead => (
                            <tr
                                key={lead.lead_id}
                                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                            >
                                <td className="p-4">
                                    <span className="font-medium text-zinc-100">{lead.company_name}</span>
                                </td>
                                <td className="p-4 text-zinc-400">{lead.contact_name}</td>
                                <td className="p-4 text-zinc-400">{lead.contact_email || '-'}</td>
                                <td className="p-4">
                                    <StatusBadge status={lead.status} />
                                </td>
                                <td className="p-4 text-zinc-400">{lead.source}</td>
                                <td className="p-4 text-zinc-500 text-sm">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-500">
                                    No leads found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Lead Modal */}
            {showModal && (
                <AddLeadModal
                    config={config}
                    onClose={() => setShowModal(false)}
                    onAdded={(lead) => {
                        setLeads([...leads, lead]);
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        New: 'bg-blue-500/20 text-blue-400',
        Contacted: 'bg-yellow-500/20 text-yellow-400',
        Qualified: 'bg-green-500/20 text-green-400',
        Unqualified: 'bg-zinc-500/20 text-zinc-400',
        Lost: 'bg-red-500/20 text-red-400',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-zinc-800 text-zinc-400'}`}>
            {status}
        </span>
    );
}

function AddLeadModal({
    config,
    onClose,
    onAdded,
}: {
    config: Config | null;
    onClose: () => void;
    onAdded: (lead: Lead) => void;
}) {
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass-card w-full max-w-md p-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-4">Add New Lead</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Company Name *</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Contact Name *</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.contact_name}
                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            className="input w-full"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                        <input
                            type="tel"
                            className="input w-full"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Source</label>
                        <select
                            className="input w-full"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        >
                            {config?.lead_sources.map((source: string) => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-100">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
