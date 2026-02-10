"use client";

import { useEffect, useMemo, useState } from "react";
import { getReports, ReportsData } from "@/lib/api";
import ErrorBoundary from "@/components/ErrorBoundary";

function ReportsPageContent() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const data = await getReports(start || undefined, end || undefined);
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const stageRows = useMemo(() => {
    if (!reports) return [];
    return Object.entries(reports.by_stage).filter(([, value]) => value.count > 0);
  }, [reports]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-10 w-44 bg-[var(--bg-surface)] rounded animate-pulse mb-4"></div>
        <div className="h-48 bg-[var(--bg-surface)] rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b-4 border-[var(--text-primary)] pb-4">
        <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)]">
          Reports
        </h1>
        <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
          Pipeline & activity analytics
        </p>
      </div>

      <div className="paper-card p-4 bg-white flex flex-wrap items-end gap-3">
        <label className="font-mono text-xs uppercase">
          Start date
          <input
            type="date"
            className="block mt-1 px-3 py-2 border border-[var(--border-pencil)]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="font-mono text-xs uppercase">
          End date
          <input
            type="date"
            className="block mt-1 px-3 py-2 border border-[var(--border-pencil)]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button className="btn-primary" onClick={() => fetchReports(startDate, endDate)}>
          Apply
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            fetchReports();
          }}
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="paper-card p-3 bg-red-50 border-red-500 text-red-700 font-mono text-xs">
          {error}
        </div>
      )}

      {reports && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Opportunities" value={String(reports.summary.opportunity_count)} />
            <MetricCard label="Pipeline Value" value={formatCurrency(reports.summary.pipeline_value)} />
            <MetricCard label="Expected Value" value={formatCurrency(reports.summary.expected_value)} />
            <MetricCard label="Activities" value={String(reports.summary.activity_count)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="paper-card p-4 bg-white">
              <h2 className="font-sans font-bold text-xl mb-3">By Stage</h2>
              <div className="space-y-2">
                {stageRows.length === 0 && (
                  <p className="font-mono text-xs text-[var(--text-secondary)]">
                    No opportunities in selected range.
                  </p>
                )}
                {stageRows.map(([stage, values]) => (
                  <div
                    key={stage}
                    className="border border-[var(--border-pencil)] bg-[var(--bg-paper)] px-3 py-2"
                  >
                    <p className="font-sans font-bold text-sm">{stage}</p>
                    <p className="font-mono text-xs text-[var(--text-secondary)]">
                      {values.count} deals • {formatCurrency(values.total_value)} • expected{" "}
                      {formatCurrency(values.expected_value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="paper-card p-4 bg-white">
              <h2 className="font-sans font-bold text-xl mb-3">Activity Mix</h2>
              <div className="space-y-2">
                {Object.keys(reports.activity_by_type).length === 0 && (
                  <p className="font-mono text-xs text-[var(--text-secondary)]">
                    No activities in selected range.
                  </p>
                )}
                {Object.entries(reports.activity_by_type).map(([type, count]) => (
                  <div
                    key={type}
                    className="border border-[var(--border-pencil)] bg-[var(--bg-paper)] px-3 py-2 flex justify-between"
                  >
                    <span className="font-sans font-semibold">{type}</span>
                    <span className="font-mono text-xs">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper-card p-4 bg-white">
      <p className="font-mono text-[10px] uppercase text-[var(--text-secondary)] mb-1">
        {label}
      </p>
      <p className="font-sans font-bold text-2xl text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsPageContent />
    </ErrorBoundary>
  );
}
