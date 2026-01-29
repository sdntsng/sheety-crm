import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Built for Sales Floors | Sheety vs Close",
  description:
    "Close is a weapon for inside sales teams. But you're not running a call center. Comparing Sheety CRM vs Close.",
};

import ArticleLayout from "@/components/comparison/ArticleLayout";
import ComparisonTable from "@/components/comparison/ComparisonTable";
import ComparisonHero from "@/components/comparison/ComparisonHero";
import Image from "next/image";

export default function CloseComparisonPage() {
  return (
    <ArticleLayout
      title="Built for Sales Floors"
      subtitle="Close is a weapon for inside sales teams. But you're not running a call center."
      readingTime="5 min read"
    >
      <ComparisonHero
        competitorName="Close"
        competitorLogo="/assets/competitors/close.png"
        tagline="Power tools for power users"
      />

      <p className="lead">
        Close CRM is legendary in the startup world. YC companies swear by it.
        The built-in dialer is genuinely best-in-class. But here's the thing:
        it's designed for teams that make 100+ calls a day.
      </p>

      <figure className="my-16">
        <Image
          src="/assets/editorial/noise.png"
          alt="Abstract illustration of sales noise"
          width={800}
          height={600}
          className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
        />
      </figure>

      <h2>The Power Dialer Problem</h2>
      <p>
        Close's killer feature is the <strong>Power Dialer</strong>. It queues
        up your leads and connects you automatically, one after another. For a
        10-person SDR team, this is transformative.
      </p>
      <p>
        But for a solopreneur? The Power Dialer is locked behind the $99/month
        Growth plan. You're paying for an F1 engine when you need a bicycle.
      </p>

      <ComparisonTable
        competitorName="Close (Growth)"
        rows={[
          { feature: "Price", us: "$0", them: "$99/user/mo" },
          {
            feature: "Built-in Dialer",
            us: false,
            them: true,
            note: "Sheety doesn't do calls—use your phone",
          },
          { feature: "Email Sequences", us: false, them: true },
          { feature: "Data Ownership", us: true, them: false },
          { feature: "Setup Time", us: "< 5 min", them: "Hours" },
        ]}
      />

      <h2>Complexity as a Feature</h2>
      <p>
        Close is built for sales <em>operations</em>. It has:
      </p>
      <ul>
        <li>Lead visibility rules</li>
        <li>Role-based permissions</li>
        <li>Predictive dialing</li>
        <li>Call recording and sentiment analysis</li>
      </ul>
      <p>
        These are real features for real sales orgs. But they come with real
        complexity. Close requires configuration, training, and ongoing
        management.
      </p>
      <p>Sheety requires... a Google account.</p>

      <h2>The $99 Question</h2>
      <p>
        At $99/user/month (or $139 for Scale), Close is a significant
        investment. A 5-person team is looking at $6,000-$8,300/year just for
        CRM software.
      </p>
      <p>
        What does Sheety cost? <strong>Zero.</strong> Your only "expense" is the
        Google Workspace you likely already pay for.
      </p>

      <h2>When Close Makes Sense</h2>
      <p>Close is perfect for:</p>
      <ul>
        <li>Inside sales teams doing high-volume outbound</li>
        <li>Startups with dedicated SDR/BDR roles</li>
        <li>Companies that live on the phone</li>
      </ul>
      <p>
        But if your "sales process" is "reply to inbound emails and occasionally
        hop on a Zoom"? Close is overkill.
      </p>
    </ArticleLayout>
  );
}
