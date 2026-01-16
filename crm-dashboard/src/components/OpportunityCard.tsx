'use client';

import { useState } from 'react';
import { Opportunity } from '@/lib/api';
import OpportunityDetailModal from './modals/OpportunityDetailModal';

interface OpportunityCardProps {
    opportunity: Opportunity;
    onDragStart: (e: React.DragEvent, opp: Opportunity) => void;
    onClick?: (opp: Opportunity) => void;
    onUpdate?: () => void;
}

export default function OpportunityCard({ opportunity, onDragStart, onUpdate }: OpportunityCardProps) {
    const [showModal, setShowModal] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const stageClass = opportunity.stage.toLowerCase().replace(/\s+/g, '-');

    return (
        <>
            <div
                className={`opp-card border-l-4 stage-${stageClass} animate-fade-in group`}
                draggable
                onDragStart={(e) => onDragStart(e, opportunity)}
                onClick={() => setShowModal(true)}
            >
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors">
                        {opportunity.title}
                    </h4>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300 font-bold border border-indigo-500/30">
                        {opportunity.lead?.company_name?.substring(0, 1) || 'C'}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-medium truncate">
                        {opportunity.lead?.company_name || 'Unknown Company'}
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-[var(--border-color)] pt-3 mt-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Value</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                            {formatCurrency(opportunity.value)}
                        </span>
                    </div>
                    <div className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)]">
                        {opportunity.probability}%
                    </div>
                </div>
            </div>

            {showModal && (
                <OpportunityDetailModal
                    opportunity={opportunity}
                    onClose={() => setShowModal(false)}
                    onUpdate={() => {
                        onUpdate?.();
                        // Keep modal open, just refresh data if needed
                        // Actually, we might want to close if the stage changed, but for notes we keep it open
                    }}
                />
            )}
        </>
    );
}
