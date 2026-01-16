'use client';

import { useState, useEffect } from 'react';
import { createOpportunity, getLeads, Lead, PipelineStageEnum } from '@/lib/api';

interface AddOpportunityModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddOpportunityModal({ onClose, onSuccess }: AddOpportunityModalProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        lead_id: '',
        title: '',
        value: 0,
        probability: 50,
        stage: PipelineStageEnum.PROSPECTING,
    });

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const data = await getLeads();
            setLeads(data.leads);
        } catch (err) {
            console.error('Failed to load leads', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createOpportunity(formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to create opportunity', err);
            alert('Failed to create opportunity');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-lg p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">New Opportunity</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                            Lead / Company
                        </label>
                        <select
                            required
                            className="input w-full"
                            value={formData.lead_id}
                            onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                        >
                            <option value="">Select a Lead...</option>
                            {leads.map((lead) => (
                                <option key={lead.lead_id} value={lead.lead_id}>
                                    {lead.company_name} ({lead.contact_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                            Deal Title
                        </label>
                        <input
                            required
                            type="text"
                            className="input w-full"
                            placeholder="e.g. Q1 Enterprise License"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                                Value ($)
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                className="input w-full"
                                value={formData.value || ''}
                                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                                Probability (%)
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                max="100"
                                className="input w-full"
                                value={formData.probability}
                                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                            Initial Stage
                        </label>
                        <select
                            className="input w-full"
                            value={formData.stage}
                            onChange={(e) => setFormData({ ...formData, stage: e.target.value as PipelineStageEnum })}
                        >
                            {Object.values(PipelineStageEnum).map((stage) => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                        >
                            {submitting ? 'Creating...' : 'Create Opportunity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
