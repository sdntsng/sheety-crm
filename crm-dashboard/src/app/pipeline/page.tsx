'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPipeline, updateOpportunityStage, PipelineData, Opportunity } from '@/lib/api';
import PipelineColumn from '@/components/PipelineColumn';
import AddOpportunityModal from '@/components/modals/AddOpportunityModal';

export default function PipelinePage() {
    const [data, setData] = useState<PipelineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchPipeline = useCallback(async () => {
        try {
            const pipeline = await getPipeline();
            setData(pipeline);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch pipeline');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPipeline();
    }, [fetchPipeline]);

    const handleDrop = async (opp: Opportunity, newStage: string) => {
        // Optimistic update
        if (data) {
            const updatedPipeline = { ...data.pipeline };

            // Remove from old stage
            const oldStage = opp.stage;
            if (updatedPipeline[oldStage]) {
                updatedPipeline[oldStage] = {
                    ...updatedPipeline[oldStage],
                    opportunities: updatedPipeline[oldStage].opportunities.filter((o: Opportunity) => o.opp_id !== opp.opp_id),
                    count: updatedPipeline[oldStage].count - 1,
                    total_value: updatedPipeline[oldStage].total_value - opp.value,
                };
            }

            // Add to new stage
            if (updatedPipeline[newStage]) {
                const updatedOpp = { ...opp, stage: newStage };
                updatedPipeline[newStage] = {
                    ...updatedPipeline[newStage],
                    opportunities: [...updatedPipeline[newStage].opportunities, updatedOpp],
                    count: updatedPipeline[newStage].count + 1,
                    total_value: updatedPipeline[newStage].total_value + opp.value,
                };
            }

            setData({ ...data, pipeline: updatedPipeline });
        }

        // Actual update
        try {
            await updateOpportunityStage(opp.opp_id, newStage);
        } catch (err) {
            console.error('Failed to update stage:', err);
            // Refetch on error
            fetchPipeline();
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-zinc-800 rounded w-1/4 mb-6"></div>
                    <div className="flex gap-4 overflow-x-auto">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-72 h-96 bg-zinc-800 rounded-xl shrink-0"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="glass-card p-6 text-center">
                    <p className="text-red-400 mb-4">⚠️ {error}</p>
                    <p className="text-zinc-500 text-sm">
                        Make sure the API server is running: <code className="bg-zinc-800 px-2 py-1 rounded">uvicorn api.server:app --reload</code>
                    </p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-8 h-screen flex flex-col">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Pipeline</h1>
                    <p className="text-zinc-500">Drag opportunities between stages</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddModal(true)}
                >
                    + Add Opportunity
                </button>
            </div>

            {/* Pipeline Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
                    {data.stages.map((stageName: string) => {
                        const stage = data.pipeline[stageName];
                        if (!stage) return null;

                        return (
                            <div key={stageName} className="w-72 shrink-0">
                                <PipelineColumn
                                    stage={stage}
                                    onDrop={handleDrop}
                                    onUpdate={fetchPipeline}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {showAddModal && (
                <AddOpportunityModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchPipeline();
                    }}
                />
            )}
        </div>
    );
}
