import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who is Reading Your Email? | Sheety vs Streak",
  description:
    'The hidden trade-off of "Inbox CRMs" that nobody talks about. Comparing Sheety CRM vs Streak.',
};

import ArticleLayout from "@/components/comparison/ArticleLayout";
import ComparisonTable from "@/components/comparison/ComparisonTable";
import ComparisonHero from "@/components/comparison/ComparisonHero";
import Image from "next/image";

export default function StreakComparisonPage() {
  return (
    <ArticleLayout
      title="Who is Reading Your Email?"
      subtitle="The hidden trade-off of 'Inbox CRMs' that nobody talks about."
      readingTime="4 min read"
    >
      <ComparisonHero
        competitorName="Streak"
        competitorLogo="/assets/competitors/streak.png"
        tagline="Inbox CRM, inbox access"
      />

      <p className="lead">
        Streak is convenient. It lives right inside Gmail. But that convenience
        comes at a significant privacy cost. To work, Streak injects code
        directly into your email interface.
      </p>

      <figure className="my-16">
        <Image
          src="/assets/editorial/privacy.png"
          alt="Abstract illustration of privacy concerns"
          width={800}
          height={600}
          className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
        />
      </figure>

      <h2>The "Read Access" Problem</h2>
      <p>
        When you install Streak, you grant it permission to{" "}
        <strong>
          Read, Compose, Send, and Permanently Delete all your email from Gmail.
        </strong>
      </p>
      <p>
        Even if you trust Streak the company, you are increasing your "attack
        surface." If their extension is compromised, your entire inbox is
        compromised.
      </p>
      <p>
        Sheety is different. We are a "Side-car" CRM. We don't live in your
        inbox. We live in your spreadsheet. We don't ask for permission to read
        your emails. You manually log what matters, or use our specialized
        lightweight add-on that only scopes to specific threads.
      </p>

      <ComparisonTable
        competitorName="Streak"
        rows={[
          {
            feature: "Email Read Access",
            us: "Sales Emails Only",
            them: "Entire Inbox",
          },
          {
            feature: "Browser Performance",
            us: "Lightweight",
            them: "Heavy Injection",
          },
          {
            feature: "Data Storage",
            us: "Your Google Sheet",
            them: "Proprietary Servers",
          },
          {
            feature: "Team Sharing",
            us: "Share the Sheet",
            them: "Paid Per User",
          },
          { feature: "Open Source", us: true, them: false },
        ]}
      />

      <h2>The Slow Down</h2>
      <p>
        Injecting a full CRM application into the Gmail DOM is heavy. Users
        frequently report Gmail slowing down, lagging, or crashing when using
        heavy inbox extensions.
      </p>
      <p>
        Sheety runs in its own tab, on its own engine (Next.js), powered by the
        V8 fast lane. It doesn't weigh down your communications tool.
      </p>

      <h2>Your Data, Your Rules</h2>
      <p>
        Streak stores your pipeline data on their servers. If you stop paying
        Streak, you lose the "pipeline view" of your data. You might get a CSV
        export, but the interface is gone.
      </p>
      <p>
        With Sheety, the interface is just a lens. The data is in your Google
        Sheet. If you stop using Sheety tomorrow, your data is still formatted
        perfectly in rows and columns, ready for whatever tool you use next.
      </p>
    </ArticleLayout>
  );
}
