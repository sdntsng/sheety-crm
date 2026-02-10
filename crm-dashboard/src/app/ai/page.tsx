"use client";

import { useEffect, useState } from "react";
import {
  applyParsedNotes,
  askCoach,
  getCoachDealReview,
  getCoachPerformance,
  getCoachTips,
  getForecast,
  getForecastCoverage,
  getForecastScenarios,
  getForecastTrends,
  parseMeetingNotes,
  runForecastScenario,
} from "@/lib/api";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AILabPage() {
  return (
    <ErrorBoundary>
      <AILabContent />
    </ErrorBoundary>
  );
}

function AILabContent() {
  const [notesInput, setNotesInput] = useState("");
  const [leadId, setLeadId] = useState("");
  const [oppId, setOppId] = useState("");
  const [parsedNotes, setParsedNotes] = useState<Record<string, unknown> | null>(null);
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachResponse, setCoachResponse] = useState<string>("");
  const [tips, setTips] = useState<{ title: string; tip: string }[]>([]);
  const [coachPerformance, setCoachPerformance] = useState<{
    total_opportunities: number;
    won: number;
    lost: number;
    win_rate: number;
    insights: string[];
  } | null>(null);
  const [dealReview, setDealReview] = useState<{
    opp_id: string;
    stage: string;
    value: number;
    activity_count: number;
    recommendation: string;
  } | null>(null);
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);
  const [forecastScenarios, setForecastScenarios] = useState<
    { name: string; remove_opp_ids: string[] }[]
  >([]);
  const [forecastScenarioResult, setForecastScenarioResult] = useState<{
    baseline: Record<string, unknown>;
    scenario: Record<string, unknown>;
  } | null>(null);
  const [forecastCoverageTarget, setForecastCoverageTarget] = useState("50000");
  const [forecastCoverage, setForecastCoverage] = useState<{
    target: number;
    pipeline_value: number;
    coverage_ratio: number;
    gap: number;
  } | null>(null);
  const [forecastTrends, setForecastTrends] = useState<
    { period_index: number; forecast: number }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          tipsData,
          performanceData,
          forecastData,
          scenariosData,
          trendsData,
          coverageData,
        ] = await Promise.all([
          getCoachTips(),
          getCoachPerformance(),
          getForecast({ period: "this_month" }),
          getForecastScenarios(),
          getForecastTrends(6),
          getForecastCoverage(50000),
        ]);
        setTips(tipsData.tips);
        setCoachPerformance(performanceData);
        setForecast(forecastData);
        setForecastScenarios(scenariosData.scenarios);
        setForecastTrends(trendsData.trends);
        setForecastCoverage(coverageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AI panel.");
      }
    };
    load();
  }, []);

  const runParse = async () => {
    if (!notesInput.trim()) return;
    setBusy(true);
    try {
      const parsed = await parseMeetingNotes({
        content: notesInput,
        lead_id: leadId || undefined,
        opp_id: oppId || undefined,
      });
      setParsedNotes(parsed as Record<string, unknown>);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse notes.");
    } finally {
      setBusy(false);
    }
  };

  const applyParse = async () => {
    if (!parsedNotes) return;
    setBusy(true);
    try {
      await applyParsedNotes({
        lead_id: leadId || undefined,
        opp_id: oppId || undefined,
        tasks: (parsedNotes.tasks as Record<string, unknown>[] | undefined) || [],
        deal_updates: (parsedNotes.deal_updates as Record<string, unknown> | undefined) || {},
        key_points: (parsedNotes.key_points as string[] | undefined) || [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply parsed notes.");
    } finally {
      setBusy(false);
    }
  };

  const runCoach = async () => {
    if (!coachQuestion.trim()) return;
    setBusy(true);
    try {
      const result = await askCoach({
        question: coachQuestion,
        lead_id: leadId || undefined,
        opp_id: oppId || undefined,
      });
      setCoachResponse(result.advice);
      if (oppId.trim()) {
        const review = await getCoachDealReview(oppId.trim());
        setDealReview(review);
      } else {
        setDealReview(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach request failed.");
    } finally {
      setBusy(false);
    }
  };

  const checkCoverage = async () => {
    const target = Number(forecastCoverageTarget);
    if (!Number.isFinite(target) || target <= 0) {
      setError("Coverage target must be a positive number.");
      return;
    }
    setBusy(true);
    try {
      const coverage = await getForecastCoverage(target);
      setForecastCoverage(coverage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coverage calculation failed.");
    } finally {
      setBusy(false);
    }
  };

  const runScenario = async (scenario: { name: string; remove_opp_ids: string[] }) => {
    setBusy(true);
    try {
      const result = await runForecastScenario({
        remove_opp_ids: scenario.remove_opp_ids,
      });
      setForecastScenarioResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scenario calculation failed.");
    } finally {
      setBusy(false);
    }
  };

  const refreshForecast = async () => {
    setBusy(true);
    try {
      const [forecastData, scenariosData, trendsData] = await Promise.all([
        getForecast({ period: "this_month" }),
        getForecastScenarios(),
        getForecastTrends(6),
      ]);
      setForecast(forecastData);
      setForecastScenarios(scenariosData.scenarios);
      setForecastTrends(trendsData.trends);
      setForecastScenarioResult(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh forecast data.");
    } finally {
      setBusy(false);
    }
  };

  const formatCurrency = (value: unknown) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b-4 border-[var(--text-primary)] pb-4">
        <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)]">
          AI Lab
        </h1>
        <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-widest mt-2">
          Command parsing, notes extraction, coaching, and forecasting.
        </p>
      </div>

      {error && (
        <div className="paper-card p-3 border-red-500 bg-red-50 text-red-700 font-mono text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="paper-card p-4 bg-white space-y-3">
          <h2 className="font-sans font-bold text-xl">Notes Parser</h2>
          <input
            className="w-full px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            placeholder="Lead ID (optional)"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
            placeholder="Opportunity ID (optional)"
            value={oppId}
            onChange={(e) => setOppId(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
            rows={8}
            placeholder="Paste meeting notes or transcript..."
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={runParse} disabled={busy}>
              Parse Notes
            </button>
            <button className="btn-secondary" onClick={applyParse} disabled={busy || !parsedNotes}>
              Apply Parsed Actions
            </button>
          </div>
          {parsedNotes && (
            <pre className="text-[11px] font-mono bg-[var(--bg-paper)] border border-[var(--border-pencil)] p-2 overflow-auto max-h-64">
              {JSON.stringify(parsedNotes, null, 2)}
            </pre>
          )}
        </div>

        <div className="space-y-6">
          <div className="paper-card p-4 bg-white space-y-3">
            <h2 className="font-sans font-bold text-xl">Sales Coach</h2>
            <textarea
              className="w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
              rows={4}
              placeholder="Ask for coaching advice..."
              value={coachQuestion}
              onChange={(e) => setCoachQuestion(e.target.value)}
            />
            <button className="btn-primary" onClick={runCoach} disabled={busy}>
              Ask Coach
            </button>
            {coachResponse && (
              <div className="border border-[var(--border-pencil)] bg-[var(--bg-paper)] p-3">
                <p className="font-sans text-sm">{coachResponse}</p>
              </div>
            )}
            {coachPerformance && (
              <div className="border border-[var(--border-pencil)] bg-white p-3 space-y-2">
                <p className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                  Team Snapshot
                </p>
                <p className="font-sans text-sm">
                  {coachPerformance.total_opportunities} deals • win rate{" "}
                  {coachPerformance.win_rate.toFixed(1)}%
                </p>
                <p className="font-sans text-sm">
                  Won {coachPerformance.won} • Lost {coachPerformance.lost}
                </p>
                <ul className="font-mono text-[10px] text-[var(--text-secondary)] space-y-1">
                  {coachPerformance.insights.slice(0, 2).map((insight, index) => (
                    <li key={`${index}-${insight}`}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {dealReview && (
              <div className="border border-[var(--border-pencil)] bg-white p-3">
                <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-1">
                  Deal Review
                </p>
                <p className="font-sans text-sm">
                  {dealReview.stage} • {formatCurrency(dealReview.value)} •{" "}
                  {dealReview.activity_count} activities
                </p>
                <p className="font-mono text-[10px] text-[var(--text-secondary)] mt-1">
                  {dealReview.recommendation}
                </p>
              </div>
            )}
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={`${tip.title}-${index}`} className="border border-[var(--border-pencil)] bg-white px-3 py-2">
                  <p className="font-sans font-semibold text-sm">{tip.title}</p>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card p-4 bg-white space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-sans font-bold text-xl">Forecast Suite</h2>
              <button className="btn-secondary text-xs" onClick={refreshForecast} disabled={busy}>
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="px-3 py-2 border border-[var(--border-pencil)] font-mono text-xs"
                value={forecastCoverageTarget}
                onChange={(e) => setForecastCoverageTarget(e.target.value)}
                placeholder="Coverage target"
              />
              <button className="btn-primary text-xs" onClick={checkCoverage} disabled={busy}>
                Check Coverage
              </button>
            </div>
            {forecastCoverage && (
              <div className="border border-[var(--border-pencil)] bg-white p-3">
                <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-1">
                  Coverage
                </p>
                <p className="font-sans text-sm">
                  Target {formatCurrency(forecastCoverage.target)} • Pipeline{" "}
                  {formatCurrency(forecastCoverage.pipeline_value)}
                </p>
                <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                  Ratio {forecastCoverage.coverage_ratio.toFixed(2)} • Gap{" "}
                  {formatCurrency(forecastCoverage.gap)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                Scenarios
              </p>
              {forecastScenarios.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  No scenarios available.
                </p>
              )}
              {forecastScenarios.map((scenario) => (
                <button
                  key={scenario.name}
                  className="w-full text-left border border-[var(--border-pencil)] bg-[var(--bg-paper)] px-3 py-2 hover:bg-white transition-colors"
                  onClick={() => runScenario(scenario)}
                  disabled={busy}
                >
                  <p className="font-sans text-sm font-semibold">{scenario.name}</p>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                    remove {scenario.remove_opp_ids.length} opportunities
                  </p>
                </button>
              ))}
            </div>
            {forecastScenarioResult && (
              <div className="border border-[var(--border-pencil)] bg-white p-3">
                <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-1">
                  Scenario Result
                </p>
                <p className="font-sans text-sm">
                  Baseline{" "}
                  {formatCurrency(
                    (forecastScenarioResult.baseline as Record<string, unknown>)
                      .ai_adjusted_forecast,
                  )}{" "}
                  → Scenario{" "}
                  {formatCurrency(
                    (forecastScenarioResult.scenario as Record<string, unknown>)
                      .ai_adjusted_forecast,
                  )}
                </p>
              </div>
            )}
            <div className="border border-[var(--border-pencil)] bg-white p-3">
              <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-1">
                Trend
              </p>
              <div className="space-y-1">
                {forecastTrends.map((trend) => (
                  <p key={trend.period_index} className="font-mono text-[10px]">
                    P{trend.period_index}: {formatCurrency(trend.forecast)}
                  </p>
                ))}
              </div>
            </div>
            <pre className="text-[11px] font-mono bg-[var(--bg-paper)] border border-[var(--border-pencil)] p-2 overflow-auto max-h-64">
              {JSON.stringify(forecast, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
