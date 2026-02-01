"use client";

import { useState, useEffect } from "react";
import {
  Opportunity,
  Activity,
  getActivities,
  getOpportunityAnalysis,
  OpportunityAnalysis,
} from "@/lib/api";
import ActivityTimeline from "@/components/ActivityTimeline";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { SkeletonActivityItem } from "@/components/SkeletonLoader";

interface OpportunityDetailModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onUpdate: () => void; // Refresh parent data
}

export default function OpportunityDetailModal({
  opportunity,
  onClose,
  onUpdate,
}: OpportunityDetailModalProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [analysis, setAnalysis] = useState<OpportunityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    loadActivities();
    loadAnalysis();
  }, [opportunity.opp_id]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await getActivities(undefined, opportunity.opp_id);
      // Sort by date desc
      setActivities(
        data.activities.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    } catch (err) {
      console.error("Failed to load activities", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const data = await getOpportunityAnalysis(opportunity.opp_id);
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to load analysis", err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useKeyboardShortcut({
    key: "Escape",
    description: "Close Modal",
    section: "Navigation",
    onKeyPressed: onClose,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[12px_12px_0px_rgba(0,0,0,0.15)] w-[95%] md:w-full md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Folder Tab Style */}
        <div className="bg-[var(--bg-paper)] border-b-2 border-[var(--border-ink)] p-4 md:p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-[var(--border-pencil)] hover:bg-[var(--bg-hover)] rounded-full transition-colors font-sans font-bold mb-4"
          >
            ✕
          </button>

          <div className="flex justify-between items-start pr-10">
            <div>
              <div className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Opportunity File
              </div>
              <h2 className="font-sans font-bold text-3xl text-[var(--text-primary)] leading-none">
                {opportunity.title}
              </h2>
              <p className="font-mono text-sm text-[var(--text-secondary)] mt-2">
                <span className="text-[var(--text-primary)] font-bold">
                  {opportunity.lead?.company_name}
                </span>{" "}
                • {opportunity.lead?.contact_name}
              </p>
            </div>
          </div>

          {/* Stats Row - Stamped Tags */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex flex-col border-r border-[var(--border-pencil)] pr-6">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                Pipeline Value
              </span>
              <span className="font-sans font-bold text-xl text-[var(--text-primary)]">
                {formatCurrency(opportunity.value)}
              </span>
            </div>
            <div className="flex flex-col border-r border-[var(--border-pencil)] pr-6">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                Probability
              </span>
              <span className="font-sans font-bold text-xl text-[var(--text-primary)]">
                {opportunity.probability}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                Current Stage
              </span>
              <span className="font-mono font-bold text-lg text-[var(--accent-blue)]">
                {opportunity.stage}
              </span>
            </div>
          </div>
        </div>

        {/* Body - Lined Paper Background */}
        <div className="flex-1 overflow-y-auto p-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIj48bGluZSB4MT0iMCIgeTE9IjI0IiB4Mj0iMTAwJSIgeTI9IjI0IiBzdHJva2U9IiNlNWU1ZTUiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]">
          <div className="p-4 md:p-8">
            {/* AI Insights Section */}
            <div className="mb-8 p-4 bg-white border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--accent-yellow)] border-l-2 border-b-2 border-[var(--border-ink)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                AI Deal Analyzer
              </div>

              {loadingAnalysis ? (
                <div className="animate-pulse flex space-x-4 py-2">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl ${analysis.risk_score > 60 ? "animate-bounce" : ""}`}
                    >
                      {analysis.risk_score > 60
                        ? "⚠️"
                        : analysis.risk_score > 30
                          ? "🟡"
                          : "✅"}
                    </div>
                    <div>
                      <div className="font-sans font-bold text-lg text-[var(--text-primary)]">
                        Risk Level:{" "}
                        <span
                          className={
                            analysis.risk_score > 60
                              ? "text-red-500"
                              : analysis.risk_score > 30
                                ? "text-orange-500"
                                : "text-green-500"
                          }
                        >
                          {analysis.risk_level} ({analysis.risk_score}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 border border-dashed border-[var(--border-pencil)]">
                      <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase mb-1">
                        Risk Reason
                      </div>
                      <p className="font-sans text-sm text-[var(--text-primary)] italic">
                        "{analysis.risk_reason}"
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 border border-dashed border-blue-200">
                      <div className="font-mono text-[10px] text-blue-500 uppercase mb-1 font-bold">
                        Next Best Action
                      </div>
                      <p className="font-sans text-sm text-blue-700 font-bold">
                        {analysis.next_best_action}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 font-mono text-[10px] text-[var(--text-muted)] border-t border-slate-100 pt-2">
                    <span>Age: {analysis.metrics.age_days} days</span>
                    <span>
                      Last Activity: {analysis.metrics.days_since_last_activity}{" "}
                      days ago
                    </span>
                    <span>
                      Total Activities: {analysis.metrics.activity_count}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="font-sans text-sm text-[var(--text-muted)]">
                  No analysis available for this deal.
                </p>
              )}
            </div>

            {loadingActivities ? (
              <div className="space-y-8 pl-4 border-l-2 border-[var(--border-pencil)] border-dotted ml-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <SkeletonActivityItem key={i} />
                ))}
              </div>
            ) : (
              <ActivityTimeline
                activities={activities}
                leadId={opportunity.lead_id}
                oppId={opportunity.opp_id}
                onActivityAdded={() => {
                  loadActivities();
                  onUpdate();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
