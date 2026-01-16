'use client';

import { PipelineStage, Opportunity, updateOpportunityStage } from '@/lib/api';
import OpportunityCard from './OpportunityCard';
import { useState } from 'react';

interface PipelineColumnProps {
    stage: PipelineStage;
    onDrop: (opp: Opportunity, newStage: string) => void;
    onOppClick?: (opp: Opportunity) => void;
    onUpdate?: () => void;
}

// Single accent style - no per-stage colors
const defaultColor = 'from-zinc-500/10';

export default function PipelineColumn({ stage, onDrop, onOppClick, onUpdate }: PipelineColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [draggedOpp, setDraggedOpp] = useState<Opportunity | null>(null);

    const handleDragStart = (e: React.DragEvent, opp: Opportunity) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(opp));
        setDraggedOpp(opp);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;

        try {
            const opp = JSON.parse(data) as Opportunity;
            if (opp.stage !== stage.stage) {
                onDrop(opp, stage.stage);
            }
        } catch (err) {
            console.error('Error parsing dropped data:', err);
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

    const colorClass = defaultColor;

    return (
        <div
            className={`pipeline-column flex flex-col transition-all duration-200 ${isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`p-4 border-b border-zinc-800 bg-gradient-to-r ${colorClass} to-transparent rounded-t-xl`}>
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-sm text-zinc-100">{stage.stage}</h3>
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {stage.count}
                    </span>
                </div>
                <div className="text-sm font-medium text-green-400">
                    {formatCurrency(stage.total_value)}
                </div>
            </div>

            {/* Opportunities */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {stage.opportunities.map((opp) => (
                    <OpportunityCard
                        key={opp.opp_id}
                        opportunity={opp}
                        onDragStart={handleDragStart}
                        onClick={onOppClick}
                        onUpdate={onUpdate}
                    />
                ))}

                {stage.opportunities.length === 0 && (
                    <div className="text-center text-zinc-600 py-8 text-sm">
                        No opportunities
                    </div>
                )}
            </div>
        </div>
    );
}
