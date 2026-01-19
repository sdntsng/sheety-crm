'use client';

import { useState, useEffect, useRef } from 'react';
import { Opportunity, Activity, getActivities } from '@/lib/api';
import ActivityTimeline from '@/components/ActivityTimeline';

interface OpportunityDetailModalProps {
    opportunity: Opportunity;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent data
}

export default function OpportunityDetailModal({ opportunity, onClose, onUpdate }: OpportunityDetailModalProps) {
    const [activities, setActivities] = useState<Activity[]>([]);

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
                className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[12px_12px_0px_rgba(0,0,0,0.15)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Folder Tab Style */}
                <div className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-ink)] p-6 relative">
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
                    <div className="flex gap-4 mt-6">
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
                    <div className="p-8">
                        <ActivityTimeline 
                            activities={activities}
                            leadId={opportunity.lead_id}
                            oppId={opportunity.opp_id}
                            onActivityAdded={() => {
                                loadActivities();
                                onUpdate();
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
