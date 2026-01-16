'use client';

import { useState } from 'react';
import { Lead, createOpportunity, updateLead, createActivity, getConfig, Config } from '@/lib/api';

interface ConvertLeadModalProps {
    lead: Lead;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ConvertLeadModal({ lead, onClose, onSuccess }: ConvertLeadModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: `${lead.company_name} - New Opportunity`,
        value: 0,
        probability: 50,
        close_date: '',
        product: '',
        notes: `Converted from lead: ${lead.company_name}`,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create the opportunity
            await createOpportunity({
                lead_id: lead.lead_id,
                title: formData.title,
                stage: 'Prospecting',
                value: formData.value,
                probability: formData.probability,
                close_date: formData.close_date || undefined,
                product: formData.product || undefined,
                notes: formData.notes || undefined,
            });

            // 2. Update lead status to Qualified
            await updateLead(lead.lead_id, {
                status: 'Qualified',
            });

            // 3. Log conversion activity
            await createActivity({
                lead_id: lead.lead_id,
                type: 'Note',
                subject: 'Lead Converted to Opportunity',
                description: `Created opportunity: ${formData.title} with value $${formData.value}`,
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to convert lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="glass-card w-full max-w-lg p-6 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="text-green-600 text-lg">🚀</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Convert to Opportunity</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Create a new opportunity from {lead.company_name}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lead Info Summary */}
                    <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
                        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Lead Information</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-[var(--text-secondary)]">Company:</span>{' '}
                                <span className="text-[var(--text-primary)]">{lead.company_name}</span>
                            </div>
                            <div>
                                <span className="text-[var(--text-secondary)]">Contact:</span>{' '}
                                <span className="text-[var(--text-primary)]">{lead.contact_name}</span>
                            </div>
                            {lead.contact_email && (
                                <div className="col-span-2">
                                    <span className="text-[var(--text-secondary)]">Email:</span>{' '}
                                    <span className="text-[var(--text-primary)]">{lead.contact_email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Opportunity Title */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Opportunity Title *</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Value and Probability */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Deal Value ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                className="input w-full"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Probability (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="input w-full"
                                value={formData.probability}
                                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Close Date */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Expected Close Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            value={formData.close_date}
                            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                        />
                    </div>

                    {/* Product */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Product/Service</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="e.g., Premium Plan, Consulting, Enterprise License"
                            value={formData.product}
                            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                        <textarea
                            className="input w-full h-20 resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Converting...
                                </>
                            ) : (
                                <>
                                    🚀 Convert to Opportunity
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
