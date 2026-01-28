"use client";

import ArticleLayout from "@/components/comparison/ArticleLayout";

export default function PipelineGuidePage() {
  return (
    <ArticleLayout
      title="Flow State Sales"
      subtitle="How to visualize, manage, and accelerate your deal flow sheety-style."
      readingTime="8 min read"
    >
      <p className="lead">
        Sales isn't about data entry. It's about momentum. Sheety's Kanban
        pipeline is designed to keep you in flow, letting you manage deals with
        muscle memory rather than mouse clicks.
      </p>

      <h2>Visualizing Your Flow</h2>
      <p>
        The Kanban board is your command center. Unlike spreadsheet rows which
        hide the status of your deals, the board gives you an instant visual
        heatmap of where money is stuck.
      </p>

      <div className="my-12 rounded-2xl overflow-hidden border border-[var(--border-pencil)] shadow-lg bg-[var(--bg-paper)]">
        <video autoPlay loop muted playsInline className="w-full">
          <source
            src="/assets/DragDropBetweenStages_web.mp4"
            type="video/mp4"
          />
        </video>
        <div className="p-4 bg-[var(--bg-hover)] border-t border-[var(--border-pencil)] text-center text-sm font-mono text-[var(--color-ink-muted)]">
          Drag and drop to update stages instantly.
        </div>
      </div>

      <h2>Moving Deeds, Not Just Data</h2>
      <p>
        Updating a deal status shouldn't require opening a form, finding a
        dropdown, and clicking save. In Sheety, you just{" "}
        <strong>grab and throw</strong>.
      </p>
      <p>
        When you drag a card from "Negotiation" to "Closed Won", Sheety
        automatically updates:
      </p>
      <ul>
        <li>The Stage column in your Google Sheet</li>
        <li>The "Last Updated" timestamp</li>
        <li>The deal probability (if configured)</li>
      </ul>

      <h2>One-Click Qualification</h2>
      <p>
        The gap between a Lead and an Opportunity is the most critical chasm in
        sales. We made crossing it instantaneous.
      </p>

      <div className="my-12 rounded-2xl overflow-hidden border border-[var(--border-pencil)] shadow-lg bg-[var(--bg-paper)]">
        <video autoPlay loop muted playsInline className="w-full">
          <source
            src="/assets/TurnLeadIntoOpportunity_web.mp4"
            type="video/mp4"
          />
        </video>
        <div className="p-4 bg-[var(--bg-hover)] border-t border-[var(--border-pencil)] text-center text-sm font-mono text-[var(--color-ink-muted)]">
          Convert Leads to Opportunities in one click.
        </div>
      </div>

      <p>
        When you identify a qualified prospect in your Leads list, just click{" "}
        <strong>Convert</strong>. Sheety creates a new card in your Pipeline,
        links the original contact, and archives the lead so your lists stay
        clean.
      </p>

      <h2>Activity Logging</h2>
      <p>
        Notes are crucial, but they often get lost. In Sheety, every interaction
        is logged directly to the <code>Activities</code> tab in your sheet,
        linked by ID. This means you can build reports in Google Sheets later to
        see exactly how many calls it took to close that big Q4 deal.
      </p>

      <div className="my-12 rounded-2xl overflow-hidden border border-[var(--border-pencil)] shadow-lg bg-[var(--bg-paper)]">
        <video autoPlay loop muted playsInline className="w-full">
          <source src="/assets/UpdateActivity_web.mp4" type="video/mp4" />
        </video>
      </div>

      <h2>Stay in the Zone</h2>
      <p>
        We built this view because we hated waiting for CRMs to load. By keeping
        the interface local and optimistic, Sheety feels instant. You're never
        waiting for the server; the server is keeping up with you.
      </p>
    </ArticleLayout>
  );
}
