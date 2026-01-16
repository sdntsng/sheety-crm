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
                className={`paper-card p-3 mb-3 cursor-grab active:cursor-grabbing border-l-4 stage-${stageClass} group relative overflow-hidden`}
                draggable
                onDragStart={(e) => onDragStart(e, opportunity)}
                onClick={() => setShowModal(true)}
            >
                {/* Paper texture overlay for card */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-sans font-bold text-lg text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-blue)] transition-colors">
                            {opportunity.title}
                        </h4>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 flex items-center justify-center border border-[var(--text-primary)] rounded-full bg-white font-sans font-bold text-xs text-[var(--text-primary)] shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
                            {opportunity.lead?.company_name?.substring(0, 1) || 'C'}
                        </div>
                        <div className="font-mono text-xs text-[var(--text-secondary)] tracking-tight truncate border-b border-[var(--border-pencil)] border-dashed">
                            {opportunity.lead?.company_name || 'Unknown Company'}
                        </div>
                    </div>

                    <div className="flex justify-between items-end pt-2 border-t-2 border-[var(--border-pencil)] border-double">
                        <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Value</span>
                            <span className="font-sans font-bold text-[var(--text-primary)] text-lg">
                                {formatCurrency(opportunity.value)}
                            </span>
                        </div>
                        <div className="paper-badge text-[var(--text-primary)] bg-[var(--accent-yellow)] border-[var(--text-primary)] font-bold transform -rotate-2">
                            {opportunity.probability}%
                        </div>
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
