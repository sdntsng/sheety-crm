import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Add-On Trap | Sheety vs Pipedrive',
    description: 'Pipedrive\'s base price is a teaser. The real cost is in the fine print. Comparing Sheety CRM vs Pipedrive.',
};

import ArticleLayout from '@/components/comparison/ArticleLayout';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonHero from '@/components/comparison/ComparisonHero';
import Image from 'next/image';

export default function PipedriveComparisonPage() {
    return (
        <ArticleLayout
            title="The Add-On Trap"
            subtitle="Pipedrive's base price is a teaser. The real cost is in the fine print."
            readingTime="5 min read"
        >
            <ComparisonHero competitorName="Pipedrive" competitorLogo="/assets/competitors/pipedrive.png" tagline="Add-ons add up fast" />

            <p className="lead">
                Pipedrive advertises $14/month. That sounds reasonable. But the moment you need lead capture, document tracking, or visitor identification, you're stacking add-ons like a cable bill from 2005.
            </p>

            <figure className="my-16">
                <Image
                    src="/assets/editorial/complexity.png"
                    alt="Abstract illustration of complexity"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
                />
            </figure>

            <h2>The $14 Illusion</h2>
            <p>
                Pipedrive's Essential plan is genuinely affordable. You get a visual pipeline, deal tracking, and basic integrations. For a solo founder testing the waters, it works.
            </p>
            <p>
                But the second you need to scale, the add-on economy kicks in:
            </p>
            <ul>
                <li><strong>LeadBooster</strong> (chatbots, forms): $32.50/month</li>
                <li><strong>Web Visitors</strong> (identify anonymous traffic): $41/month</li>
                <li><strong>Smart Docs</strong> (trackable proposals): $32.50/month</li>
                <li><strong>Campaigns</strong> (email marketing): $13.33/month</li>
            </ul>
            <p>
                A "fully equipped" Pipedrive instance can easily hit <strong>$130+/month per user</strong>. That's HubSpot territory.
            </p>

            <ComparisonTable
                competitorName="Pipedrive (Essential)"
                rows={[
                    { feature: "Base Price", us: "$0", them: "$14/mo" },
                    { feature: "Lead Capture Forms", us: "Google Forms + Sheet", them: "+$32.50/mo" },
                    { feature: "Document Tracking", us: "Native Sheets", them: "+$32.50/mo" },
                    { feature: "Email Marketing", us: "Your Tool", them: "+$13.33/mo" },
                    { feature: "Data Ownership", us: true, them: false },
                ]}
            />

            <h2>Sales-Focused, Not Simple</h2>
            <p>
                Pipedrive is a "sales-focused" CRM. That's marketing speak for "we built features salespeople asked for." The result? Lots of toggles, settings, and dashboards.
            </p>
            <p>
                If you're a solopreneur, you don't need a "Rotting" deals indicator or a "Revenue Forecast by Expected Close Date" chart. You need to know: <em>Who should I call next?</em>
            </p>
            <p>
                Sheety is deliberately minimal. Your pipeline is a Kanban. Your data is a row. That's it.
            </p>

            <h2>When Pipedrive Makes Sense</h2>
            <p>
                Pipedrive is great for:
            </p>
            <ul>
                <li>Sales teams of 5-20 who live in the pipeline view</li>
                <li>Companies that need activity-based selling metrics</li>
                <li>Teams that want a mid-market CRM without enterprise complexity</li>
            </ul>
            <p>
                But if you're a team of one? You're paying for a sales floor you'll never fill.
            </p>
        </ArticleLayout>
    );
}
