"use client";

import { useEffect, useState } from "react";
import {
  applyParsedNotes,
  askCoach,
  getCoachTips,
  getForecast,
  parseMeetingNotes,
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
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [tipsData, forecastData] = await Promise.all([
          getCoachTips(),
          getForecast({ period: "this_month" }),
        ]);
        setTips(tipsData.tips);
        setForecast(forecastData);
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach request failed.");
    } finally {
      setBusy(false);
    }
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
            <h2 className="font-sans font-bold text-xl">Forecast Snapshot</h2>
            <pre className="text-[11px] font-mono bg-[var(--bg-paper)] border border-[var(--border-pencil)] p-2 overflow-auto max-h-64">
              {JSON.stringify(forecast, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
