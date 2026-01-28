"use client";

import ArticleLayout from "@/components/comparison/ArticleLayout";

export default function ManifestoPage() {
  return (
    <ArticleLayout
      title="The Data Ownership Manifesto"
      subtitle="Why we built a CRM that refuses to hold your data hostage."
      readingTime="4 min read"
    >
      <p className="lead">
        We believe that the tools you use to run your business should not own
        the data that runs your business.
      </p>

      <h2>The SaaS Rental Economy</h2>
      <p>
        In the last decade, we accepted a strange bargain. We gained beautiful
        interfaces and "cloud convenience," but we lost something fundamental:{" "}
        <strong>Custody</strong>.
      </p>
      <p>
        When you use a traditional SaaS CRM, your customer list—the most
        valuable asset you own—lives on someone else's server. To see it, you
        must pay rent. To move it, you must ask permission (and usually fight
        with a CSV export tool).
      </p>

      <h2>Stateless Software</h2>
      <p>Sheety is an experiment in "Stateless Software."</p>
      <p>
        We built the interface (the buttons, the Kanban boards, the forms), but
        we deliberately refused to build the database. Instead, we use something
        you already own: <strong>Google Sheets</strong>.
      </p>
      <p>This means:</p>
      <ul>
        <li>
          If Sheety goes offline tomorrow, your business continues running in
          Sheets.
        </li>
        <li>
          If you want to build a custom report, you don't need our API. You just
          use a pivot table.
        </li>
        <li>
          If you want to leave, you don't need to export. You're already out.
        </li>
      </ul>

      <h2>Complexity is a Constraint</h2>
      <p>
        Most software grows until it becomes unusable. Features are added to
        justify higher pricing tiers.
      </p>
      <p>
        By constraining ourselves to a spreadsheet backend, we are forced to
        stay simple. We can't build complex, bloated features because the
        database won't support them. This is a feature, not a bug. It keeps
        Sheety fast, light, and focused on the one thing that matters:{" "}
        <strong>Moving the deal forward.</strong>
      </p>

      <div className="my-12 p-8 border border-[var(--border-ink)] bg-[var(--bg-paper)] text-center">
        <p className="font-serif italic text-xl mb-4">
          "Software should be a bicycle for the mind, not a bus you have to pay
          a fare to ride."
        </p>
      </div>

      <p>
        We hope you enjoy using Sheety. And if you don't, we did our job right:
        you can walk away with your data instantly, no hard feelings.
      </p>
    </ArticleLayout>
  );
}
