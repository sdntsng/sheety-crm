'use client';

import { useState } from 'react';
import { Lead, createOpportunity, updateLead, createActivity } from '@/lib/api';

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
        setError(null);
        if (formData.value < 0) {
            setError('Opportunity value must be 0 or greater.');
            return;
        }
        setLoading(true);

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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div
                className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[8px_8px_0px_rgba(0,0,0,0.15)] w-full max-w-lg p-0 relative transform rotate-1"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Tape Style */}
                <div className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-pencil)] p-6 relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-[var(--border-pencil)] opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)]"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-[var(--text-primary)] rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <div>
                            <h2 className="font-sans font-bold text-2xl text-[var(--text-primary)]">Convert Lead</h2>
                            <p className="font-mono text-xs text-[var(--text-secondary)] mt-1">
                                Turning <span className="underline decoration-dotted">{lead.company_name}</span> into gold.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-[var(--accent-red)] text-[var(--accent-red)] font-mono text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Lead Info Ticket */}
                        <div className="p-4 bg-[var(--bg-paper)] border border-[var(--border-pencil)] border-dashed relative">
                            <div className="absolute -top-3 left-4 bg-[var(--bg-card)] px-2 font-mono text-[10px] font-bold uppercase border border-[var(--border-pencil)]">
                                Source Lead
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-sans italic text-[var(--text-secondary)] block">Company</span>
                                    <span className="font-mono font-bold text-[var(--text-primary)]">{lead.company_name}</span>
                                </div>
                                <div>
                                    <span className="font-sans italic text-[var(--text-secondary)] block">Contact</span>
                                    <span className="font-mono font-bold text-[var(--text-primary)]">{lead.contact_name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block font-mono text-xs font-bold uppercase mb-1">Opportunity Title <span className="text-[var(--accent-red)]">*</span></label>
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b-2 border-[var(--border-pencil)] px-2 py-1 font-sans text-lg focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-mono text-xs font-bold uppercase mb-1">Value ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono focus:border-[var(--accent-blue)] focus:outline-none"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block font-mono text-xs font-bold uppercase mb-1">Probability (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono focus:border-[var(--accent-blue)] focus:outline-none"
                                        value={formData.probability}
                                        onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-xs font-bold uppercase mb-1">Notes</label>
                                <textarea
                                    className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-sans text-sm focus:border-[var(--accent-blue)] focus:outline-none min-h-[80px] resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex gap-4 justify-end pt-4 border-t-2 border-[var(--border-pencil)] border-double">
                            <button
                                type="button"
                                onClick={onClose}
                                className="font-mono text-xs uppercase underline decoration-2 decoration-transparent hover:decoration-[var(--text-primary)] underline-offset-4"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Converting...' : 'Confirm Conversion'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
