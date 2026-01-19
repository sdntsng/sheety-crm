'use client';

import { useState, useEffect, useRef } from 'react';
import { Opportunity, Activity, getActivities, createActivity } from '@/lib/api';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface OpportunityDetailModalProps {
    opportunity: Opportunity;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent data
}

export default function OpportunityDetailModal({ opportunity, onClose, onUpdate }: OpportunityDetailModalProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [newNote, setNewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
                created_by: 'User'
            });
            setNewNote('');
            loadActivities();
            onUpdate();
        } catch (err) {
            console.error('Failed to add note', err);
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
            <div
                className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[12px_12px_0px_rgba(0,0,0,0.15)] w-[95%] md:w-full md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Folder Tab Style */}
                <div className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-ink)] p-4 md:p-6 relative">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-[var(--border-pencil)] hover:bg-[var(--bg-hover)] rounded-full transition-colors font-sans font-bold mb-4">
                        ✕
                    </button>

                    <div className="flex justify-between items-start pr-10">
                        <div>
                            <div className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Opportunity File
                            </div>
                            <h2 className="font-sans font-bold text-3xl text-[var(--text-primary)] leading-none">{opportunity.title}</h2>
                            <p className="font-mono text-sm text-[var(--text-secondary)] mt-2">
                                <span className="text-[var(--text-primary)] font-bold">{opportunity.lead?.company_name}</span> • {opportunity.lead?.contact_name}
                            </p>
                        </div>
                    </div>

                    {/* Stats Row - Stamped Tags */}
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex flex-col border-r border-[var(--border-pencil)] pr-6">
                            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Pipeline Value</span>
                            <span className="font-sans font-bold text-xl text-[var(--text-primary)]">{formatCurrency(opportunity.value)}</span>
                        </div>
                        <div className="flex flex-col border-r border-[var(--border-pencil)] pr-6">
                            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Probability</span>
                            <span className="font-sans font-bold text-xl text-[var(--text-primary)]">{opportunity.probability}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Current Stage</span>
                            <span className="font-mono font-bold text-lg text-[var(--accent-blue)]">{opportunity.stage}</span>
                        </div>
                    </div>
                </div>

                {/* Body - Lined Paper Background */}
                <div className="flex-1 overflow-y-auto p-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIj48bGluZSB4MT0iMCIgeTE9IjI0IiB4Mj0iMTAwJSIgeTI9IjI0IiBzdHJva2U9IiNlNWU1ZTUiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]">
                    <div className="p-4 md:p-8">
                        <h3 className="font-sans font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <span>Activity Log</span>
                            <div className="h-px bg-[var(--border-pencil)] flex-1"></div>
                        </h3>

                        {/* Timeline */}
                        <div className="space-y-8 pl-4 border-l-2 border-[var(--border-pencil)] border-dotted ml-2">
                            {activities.length === 0 && (
                                <p className="font-sans italic text-[var(--text-muted)] pl-4">No notes or activities recorded yet.</p>
                            )}

                            {activities.map((activity) => (
                                <div key={activity.activity_id} className="relative pl-6">
                                    {/* Bullet Point */}
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--text-primary)]"></div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-sans text-[var(--text-primary)] text-lg leading-snug">{activity.description || activity.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 border border-[var(--border-pencil)] rounded bg-white text-[var(--text-secondary)]">
                                                {activity.type}
                                            </span>
                                            <span className="font-mono text-xs text-[var(--text-muted)]">
                                                {new Date(activity.date).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Input - Sticky Note Style */}
                <div className="p-4 md:p-6 bg-[var(--bg-paper)] border-t-2 border-[var(--border-ink)] z-10 shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]">
                    <form onSubmit={handleAddNote} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Type a new note here..."
                            className="flex-1 bg-white border border-[var(--border-pencil)] px-4 py-3 font-sans shadow-inner focus:border-[var(--accent-blue)] focus:outline-none"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newNote.trim()}
                            className="btn-primary whitespace-nowrap px-6"
                        >
                            {submitting ? 'Posting...' : 'Add Note'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
