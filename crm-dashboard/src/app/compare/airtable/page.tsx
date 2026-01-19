'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonHero from '@/components/comparison/ComparisonHero';
import Image from 'next/image';

export default function AirtableComparisonPage() {
    return (
        <ArticleLayout
            title="Database Anxiety"
            subtitle="Why paying for a spreadsheet that locks you in is a bad idea."
            readingTime="5 min read"
        >
            <ComparisonHero competitorName="Airtable" competitorLogo="/assets/competitors/airtable.png" tagline="Friendly databases, unfriendly limits" />

            <p className="lead">
                Airtable is beautiful. It made databases friendly. But if you have ever hit the 1,200 record limit on the free plan, you know the panic. "Which clients do I delete to make room for new ones?"
            </p>

            <figure className="my-16">
                <Image
                    src="/assets/editorial/limits.png"
                    alt="Abstract illustration of hitting a limit"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
                />
            </figure>

            <h2>The Record Limit Trap</h2>
            <p>
                Airtable's business model relies on you hitting a ceiling. 1,000 records sounds like a lot until you import your email list. Or until you start logging sales calls.
            </p>
            <p>
                Once you hit that limit, you are paying per user, per month. And if you have a team of 5, that bill scales instantly.
            </p>
            <p>
                Google Sheets—and by extension, Sheety—has a limit of <strong>10 million cells</strong>. You could run a mid-sized logistics company on a single Google Sheet and never pay a dime.
            </p>

            <ComparisonTable
                competitorName="Airtable Free"
                rows={[
                    { feature: "Record Limit", us: "10,000,000 Cells", them: "1,000 Records" },
                    { feature: "Attachment Space", us: "15GB (Google Drive)", them: "1GB" },
                    { feature: "Revision History", us: "Unlimited (Sheet History)", them: "2 Weeks" },
                    { feature: "Interface Designer", us: "Included", them: "Limited" },
                    { feature: "Data Portability", us: "Universal (XLSX/CSV)", them: "Proprietary" },
                ]}
            />

            <h2>Why sync when you can stay?</h2>
            <p>
                Most modern workflows look like this:
            </p>
            <ol>
                <li>Data comes in via Typeform/Google Search.</li>
                <li>Zapier zaps it to Airtable.</li>
                <li>You export CSV from Airtable to do analysis in Excel/Sheets.</li>
            </ol>
            <p>
                Why the round trip? Most of the world's business data lives in spreadsheets. Financial models? Sheets. Lead lists? Sheets.
            </p>
            <p>
                Sheety sits <em>on top</em> of your Google Sheet. There is no sync. There is no import. You update a cell in Sheets, it updates in Sheety instantly. You drag a card in Sheety, the cell updates in Sheets.
            </p>

            <h2>Proprietary vs. Universal</h2>
            <p>
                Airtable is a "proprietary database." They want you to build your entire business logic inside their walled garden. If you want to connect a different tool, you need their API (which has rate limits).
            </p>
            <p>
                Google Sheets is the <strong>universal connector</strong> of the internet. Every tool integrates with Sheets. By building your CRM on Sheets, you are future-proofing your stack.
            </p>
        </ArticleLayout>
    );
}
