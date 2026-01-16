'use client';

import { useState, useEffect, useRef } from 'react';
import { Opportunity, Activity, getActivities, createActivity, PipelineStage } from '@/lib/api';

interface OpportunityDetailModalProps {
    opportunity: Opportunity;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent data
}

export default function OpportunityDetailModal({ opportunity, onClose, onUpdate }: OpportunityDetailModalProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [newNote, setNewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadActivities();
    }, [opportunity.opp_id]);

    const loadActivities = async () => {
        try {
            const data = await getActivities(undefined, opportunity.opp_id);
            // Sort by date desc
            setActivities(data.activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            console.error('Failed to load activities', err);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSubmitting(true);
        try {
            await createActivity({
                lead_id: opportunity.lead_id,
                opp_id: opportunity.opp_id,
                type: 'Note',
                subject: 'Quick Update',
                description: newNote,
                created_by: 'User' // TODO: Get actual user
            });
            setNewNote('');
            loadActivities();
            onUpdate(); // Optional: if we want to refresh parent stats
        } catch (err) {
            console.error('Failed to add note', err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className={`p-6 border-b border-[var(--border-color)] stage-${opportunity.stage.toLowerCase().replace(/\s+/g, '-')} border-l-4`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">{opportunity.title}</h2>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">
                                {opportunity.lead?.company_name} • {opportunity.lead?.contact_name}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            ✕
                        </button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <div className="bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Value</span>
                            <p className="text-lg font-semibold text-green-500">{formatCurrency(opportunity.value)}</p>
                        </div>
                        <div className="bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Probability</span>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{opportunity.probability}%</p>
                        </div>
                        <div className="bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Stage</span>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{opportunity.stage}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                        Updates & Notes
                    </h3>

                    {/* Timeline */}
                    <div className="space-y-6 relative ml-3 border-l border-[var(--border-color)] pl-6 pb-4">
                        {activities.length === 0 && (
                            <p className="text-[var(--text-secondary)] text-sm italic">No updates yet.</p>
                        )}

                        {activities.map((activity) => (
                            <div key={activity.activity_id} className="relative">
                                {/* Dot */}
                                <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-[var(--text-secondary)] border-2 border-[var(--bg-paper)]"></div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[var(--text-primary)] font-medium text-sm">{activity.description || activity.subject}</span>
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {new Date(activity.date).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded w-fit">
                                        {activity.type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / Input */}
                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <form onSubmit={handleAddNote} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Add a quick update..."
                            className="input flex-1"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newNote.trim()}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {submitting ? 'Adding...' : 'Post Update'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
