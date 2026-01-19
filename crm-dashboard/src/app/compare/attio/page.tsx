import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'The Beautiful Prison | Sheety vs Attio',
    description: 'Attio is the prettiest CRM you\'ll ever be locked into. Comparing Sheety CRM vs Attio.',
};

import ArticleLayout from '@/components/comparison/ArticleLayout';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonHero from '@/components/comparison/ComparisonHero';
import Image from 'next/image';

export default function AttioComparisonPage() {
    return (
        <ArticleLayout
            title="The Beautiful Prison"
            subtitle="Attio is the prettiest CRM you'll ever be locked into."
            readingTime="5 min read"
        >
            <ComparisonHero competitorName="Attio" competitorLogo="/assets/competitors/attio.png" tagline="Notion-style flexibility, SaaS-style lock-in" />

            <p className="lead">
                Attio is genuinely impressive. It feels like Notion and Airtable had a baby and raised it to be a CRM. Custom objects, real-time sync, AI-powered enrichment. It's the "modern CRM" everyone says they want.
            </p>

            <figure className="my-16">
                <Image
                    src="/assets/editorial/lockin.png"
                    alt="Abstract illustration of lock-in"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
                />
            </figure>

            <h2>Flexibility That Binds</h2>
            <p>
                Attio's pitch is "build your CRM exactly how you want." Custom objects. Custom attributes. Custom workflows. It's like Lego for your sales process.
            </p>
            <p>
                But here's the catch: <strong>you're building inside Attio's database.</strong>
            </p>
            <p>
                Every custom object, every workflow, every automation—it all lives on their servers, in their format. The more you customize, the harder it is to leave. This is the "flexibility trap."
            </p>

            <ComparisonTable
                competitorName="Attio (Plus)"
                rows={[
                    { feature: "Price", us: "$0", them: "$29/user/mo" },
                    { feature: "Custom Objects", us: "Add a Column", them: "Build in UI" },
                    { feature: "Data Export", us: "Download XLSX", them: "API/CSV" },
                    { feature: "Setup Complexity", us: "None", them: "High" },
                    { feature: "Data Location", us: "Your Google Drive", them: "Their Servers" },
                ]}
            />

            <h2>The Startup Tax</h2>
            <p>
                Attio offers an 80% discount for startups. Sounds great! But that discount expires. And by then, you've built your entire sales operation on their platform.
            </p>
            <p>
                Sheety has no "startup program" because there's nothing to discount. It's free. Forever.
            </p>

            <h2>AI-Native vs. Data-Native</h2>
            <p>
                Attio markets itself as "AI-native." They use AI for data enrichment, call summarization, and record analysis. Cool features.
            </p>
            <p>
                But Sheety is "data-native." Your CRM <em>is</em> a Google Sheet. You can plug it into any AI tool you want—Gemini, GPT, Claude. You're not locked into Attio's AI roadmap.
            </p>

            <h2>When Attio Makes Sense</h2>
            <p>
                Attio is ideal for:
            </p>
            <ul>
                <li>VC-backed startups with complex deal tracking</li>
                <li>Teams that want Notion-like flexibility in a CRM</li>
                <li>Companies with dedicated RevOps resources</li>
            </ul>
            <p>
                But if you value data sovereignty above all else? Attio's beauty comes with invisible chains.
            </p>
        </ArticleLayout>
    );
}
