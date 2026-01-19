'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonHero from '@/components/comparison/ComparisonHero';
import Image from 'next/image';

export default function HubSpotComparisonPage() {
    return (
        <ArticleLayout
            title="The Free CRM Trap"
            subtitle="Why sticking with HubSpot might cost you more than just money."
            readingTime="6 min read"
        >
            <ComparisonHero competitorName="HubSpot" competitorLogo="/assets/competitors/hubspot.png" tagline="Enterprise pricing for everyone" />

            <p className="lead">
                It starts innocently enough. You sign up for the free tier. It’s got everything: contacts, deals, tasks. It feels professional. But as your business grows—usually right when you hit that critical inflection point—the trap springs.
            </p>

            <h2>The Pricing Cliff</h2>
            <p>
                HubSpot is famous for its "freemium" model. What they don't tell you is how steep the climb is once you need <em>one</em> feature that isn't included.
            </p>
            <p>
                Want to remove branding? That’s $20/month. Need basic automation or reporting? Suddenly you’re looking at the Professional tier, which starts at <strong>$800/month</strong> (or more depending on contacts).
            </p>
            <p>
                There is no middle ground. You are either a hobbyist or an enterprise. Sheety takes a different approach: <strong>Free forever for the core.</strong> Because it's just a Google Sheet. You already pay for Workspace; why pay again for a database you effectively already own?
            </p>

            <figure className="my-16">
                <Image
                    src="/assets/editorial/trap.png"
                    alt="Abstract illustration of a trap"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
                />
                <figcaption className="text-center text-sm font-mono text-[var(--color-ink-muted)] mt-4">The Complexity Trap</figcaption>
            </figure>

            <ComparisonTable
                competitorName="HubSpot Free"
                rows={[
                    { feature: "Unlimited Contacts", us: true, them: "1M (But Marketing Contacts limited)" },
                    { feature: "Custom Fields", us: true, them: "Limited" },
                    { feature: "Workflow Automation", us: "Free (Apps Script)", them: "$800/mo+" },
                    { feature: "Remove Branding", us: true, them: "$20/mo" },
                    { feature: "Database Ownership", us: true, them: false, note: "Exporting is painful" },
                ]}
            />

            <h2>The "HubSpot Admin" Tax</h2>
            <p>
                The hidden cost of HubSpot isn't just the subscription fee—it's the complexity.
            </p>
            <p>
                HubSpot is designed for organizations with dedicated Sales Ops teams. There are certifications just to learn how to use it. If you are a solopreneur or a small team, every hour you spend configuring pipelines, properties, and permissions is an hour you aren't selling.
            </p>
            <p>
                Sheety has <strong>zero configuration</strong>. If you know how to use a mild spreadsheet, you know how to use Sheety.
            </p>

            <blockquote>
                "HubSpot felt like I was flying a 747 just to go to the grocery store. Sheety is like hopping on a bike."
            </blockquote>

            <h2>Data Hostage Situation</h2>
            <p>
                Have you ever tried to leave HubSpot? Exporting your data often results in a mess of CSVs with broken relationships. Notes are separated from contacts; activities are lost in the void.
            </p>
            <p>
                With Sheety, <strong>your database is a Google Sheet</strong>. You can open it right now. You can copy it. You can download it as Excel. You can connect it to Looker Studio. You own your data in the most literal sense possible.
            </p>

            <h2>When to use HubSpot</h2>
            <p>
                We aren't saying HubSpot is bad. It's an incredible tool for:
            </p>
            <ul>
                <li>Teams of 50+ salespeople</li>
                <li>Companies that need complex marketing attribution</li>
                <li>Organizations with a dedicated RevOps department</li>
            </ul>
            <p>
                But if you are a team of one to ten? You're paying for a Ferrari engine and putting it in a golf cart.
            </p>
        </ArticleLayout>
    );
}
