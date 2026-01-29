"use client";
import { useEffect, useState, useCallback } from "react";
import {
  getPipeline,
  updateOpportunityStage,
  PipelineData,
  Opportunity,
} from "@/lib/api";
import PipelineColumn from "@/components/PipelineColumn";
import AddOpportunityModal from "@/components/modals/AddOpportunityModal";
import { useSettings } from "@/providers/SettingsProvider";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useSearchParams, useRouter } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  SkeletonBox,
  SkeletonPipelineColumn,
} from "@/components/SkeletonLoader";

function PipelinePageContent() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { hiddenStages } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowAddModal(true);
      router.replace("/pipeline");
    }
  }, [searchParams, router]);

  const fetchPipeline = useCallback(async () => {
    try {
      const pipeline = await getPipeline();
      setData(pipeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  useKeyboardShortcut({
    key: "n",
    description: "New Deal",
    section: "Actions",
    onKeyPressed: () => setShowAddModal(true),
  });

  const handleDrop = async (opp: Opportunity, newStage: string) => {
    // Optimistic update
    if (data) {
      const updatedPipeline = { ...data.pipeline };

      // Remove from old stage
      const oldStage = opp.stage;
      if (updatedPipeline[oldStage]) {
        updatedPipeline[oldStage] = {
          ...updatedPipeline[oldStage],
          opportunities: updatedPipeline[oldStage].opportunities.filter(
            (o: Opportunity) => o.opp_id !== opp.opp_id,
          ),
          count: updatedPipeline[oldStage].count - 1,
          total_value: updatedPipeline[oldStage].total_value - opp.value,
        };
      }

      // Add to new stage
      if (updatedPipeline[newStage]) {
        const updatedOpp = { ...opp, stage: newStage };
        updatedPipeline[newStage] = {
          ...updatedPipeline[newStage],
          opportunities: [
            ...updatedPipeline[newStage].opportunities,
            updatedOpp,
          ],
          count: updatedPipeline[newStage].count + 1,
          total_value: updatedPipeline[newStage].total_value + opp.value,
        };
      }

      setData({ ...data, pipeline: updatedPipeline });
    }

    // Actual update
    try {
      await updateOpportunityStage(opp.opp_id, newStage);
      console.log("Update success, refetching...");
    } catch (err) {
      console.error("Failed to update stage:", err);
    } finally {
      fetchPipeline();
    }
  };
  if (loading) {
    return (
      <div className="p-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <div className="mb-6 flex justify-between items-center bg-[var(--bg-paper)] py-2 border-b-4 border-[var(--text-primary)]">
          <div>
            <SkeletonBox className="h-8 w-40 mb-2" />
            <SkeletonBox className="h-4 w-56" />
          </div>
          <SkeletonBox className="h-10 w-28" />
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden pb-4">
          <div className="flex flex-col md:flex-row gap-4 h-full md:w-max min-w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPipelineColumn key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error)
    return <div className="p-8 text-red-500 font-mono">Error: {error}</div>;

  if (!data) return null;

  return (
    <div className="p-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center bg-[var(--bg-paper)] py-2 border-b-4 border-[var(--text-primary)]">
        <div>
          <h1 className="text-3xl font-sans font-bold text-[var(--text-primary)]">
            Pipeline
          </h1>
          <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-1">
            Drag cards to update status
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Board - Corkboard/Desk Surface */}
      <div className="flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden pb-4">
        <div className="flex flex-col md:flex-row gap-4 h-full md:w-max min-w-full">
          {data.stages
            .filter((stage) => !hiddenStages.includes(stage))
            .map((stageName: string) => {
              const stage = data.pipeline[stageName];
              if (!stage) return null;

              return (
                <div
                  key={stageName}
                  className="w-full md:w-80 shrink-0 h-auto md:h-full"
                >
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

export default function PipelinePage() {
  return (
    <ErrorBoundary>
      <PipelinePageContent />
    </ErrorBoundary>
  );
}
