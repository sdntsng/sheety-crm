"use client";

import { PipelineStage, Opportunity, updateOpportunityStage } from "@/lib/api";
import OpportunityCard from "./OpportunityCard";
import { useState } from "react";

interface PipelineColumnProps {
  stage: PipelineStage;
  onDrop: (opp: Opportunity, newStage: string) => void;
  onOppClick?: (opp: Opportunity) => void;
  onUpdate?: () => void;
}

// Single accent style - no per-stage colors
const defaultColor = "from-zinc-500/10";

export default function PipelineColumn({
  stage,
  onDrop,
  onOppClick,
  onUpdate,
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedOpp, setDraggedOpp] = useState<Opportunity | null>(null);

  const handleDragStart = (e: React.DragEvent, opp: Opportunity) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(opp));
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

    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    try {
      const opp = JSON.parse(data) as Opportunity;
      if (opp.stage !== stage.stage) {
        onDrop(opp, stage.stage);
      }
    } catch (err) {
      console.error("Error parsing dropped data:", err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const colorClass = defaultColor;

  return (
    <div
      className={`pipeline-column flex flex-col h-full bg-[var(--bg-paper)]/50 ${isDragOver ? "ring-2 ring-[var(--accent-blue)] bg-[var(--accent-blue)]/5" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header - Tape/Label Style */}
      <div className="p-3 border-b-2 border-[var(--text-primary)] bg-[var(--bg-paper)] relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border-pencil)] opacity-20"></div>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-sans font-bold text-lg text-[var(--text-primary)] tracking-tight uppercase border-b-2 border-[var(--accent-yellow)] inline-block leading-none pb-1">
            {stage.stage}
          </h3>
          <span className="font-mono text-xs font-bold text-[var(--text-primary)] border border-[var(--text-primary)] px-2 py-0.5 rounded-full bg-white shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
            {stage.count}
          </span>
        </div>
        <div className="font-mono text-xs text-[var(--text-secondary)] text-right mt-2">
          Total:{" "}
          <span className="font-bold border-b border-[var(--text-secondary)] border-dashed">
            {formatCurrency(stage.total_value)}
          </span>
        </div>
      </div>

      {/* Opportunities */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
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
          <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)] opacity-50">
            <div className="w-12 h-12 border-2 border-dashed border-[var(--border-pencil)] rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">?</span>
            </div>
            <span className="font-sans italic text-sm">Empty Pile</span>
          </div>
        )}
      </div>
    </div>
  );
}
