'use client';

import { useState, useEffect } from 'react';
import { createOpportunity, getLeads, Lead, PipelineStageEnum } from '@/lib/api';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface AddOpportunityModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddOpportunityModal({ onClose, onSuccess }: AddOpportunityModalProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        setError(null);
        if (formData.value < 0) {
            setError('Opportunity value must be 0 or greater.');
            return;
        }
        setSubmitting(true);
        try {
            await createOpportunity(formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to create opportunity', err);
            setError(err instanceof Error ? err.message : 'Failed to create opportunity');
        } finally {
            setSubmitting(false);
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
        description: 'Save Deal',
        section: 'Actions',
        onKeyPressed: (e) => {
            e.preventDefault();
            // Manually trigger submit if not already submitting
            if (!submitting) {
                // We can't easily call handleSubmit(e) because e is KeyboardEvent, not FormEvent
                // So we extract the logic or cheat slightly. 
                // Better to extract logic, but for now let's call the button click or extract logic.
                // Let's refactor handleSubmit to not depend strictly on the event being present or preventDefault manual call.
                const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                handleSubmit(fakeEvent);
            }
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[8px_8px_0px_rgba(0,0,0,0.15)] w-[95%] md:w-full md:max-w-lg relative">
                {/* Close Button - X Mark */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--accent-red)] font-sans font-bold text-xl leading-none z-10"
                >
                    ×
                </button>

                <div className="p-4 md:p-8">
                    <h2 className="font-sans font-bold text-2xl md:text-3xl text-[var(--text-primary)] mb-6 border-b-4 border-[var(--accent-yellow)] inline-block">
                        New Deal
                    </h2>
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border-l-4 border-[var(--accent-red)] text-[var(--accent-red)] font-mono text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block font-mono text-xs font-bold uppercase mb-1">Lead / Company</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-sans appearance-none focus:border-[var(--accent-blue)] focus:outline-none"
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
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] text-xs">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-mono text-xs font-bold uppercase mb-1">Deal Title</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-transparent border-b-2 border-[var(--border-pencil)] px-2 py-1 font-sans text-lg focus:border-[var(--accent-blue)] focus:outline-none placeholder:italic placeholder:text-[var(--text-muted)]"
                                placeholder="e.g. Q1 Enterprise Contract"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block font-mono text-xs font-bold uppercase mb-1">Value ($)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono focus:border-[var(--accent-blue)] focus:outline-none"
                                    value={formData.value || ''}
                                    onChange={(e) => {
                                        const nextValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        setFormData({ ...formData, value: Number.isNaN(nextValue) ? 0 : nextValue });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-xs font-bold uppercase mb-1">Probability (%)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-mono focus:border-[var(--accent-blue)] focus:outline-none"
                                    value={formData.probability}
                                    onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="font-mono text-xs uppercase hover:underline underline-offset-4"
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
        </div>
    );
}
