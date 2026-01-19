'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonHero from '@/components/comparison/ComparisonHero';
import Image from 'next/image';

export default function FolkComparisonPage() {
    return (
        <ArticleLayout
            title="The Other Side of Simple"
            subtitle="Folk is simple. But simple shouldn't cost $20/month per person."
            readingTime="4 min read"
        >
            <ComparisonHero competitorName="Folk" competitorLogo="/assets/competitors/folk.png" tagline="Simple, but not free" />

            <p className="lead">
                Folk gets it. The bloated CRM era is over. People want something lightweight that just tracks contacts and relationships. We agree completely. But we disagree on the price tag.
            </p>

            <figure className="my-16">
                <Image
                    src="/assets/editorial/cost.png"
                    alt="Abstract illustration of cost"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg border border-[var(--border-pencil)] shadow-sm"
                />
            </figure>

            <h2>Simple, But Not Free</h2>
            <p>
                Folk's Standard plan is $20/user/month (billed yearly). The Premium plan—which unlocks email sequences and deal management—is $40/user/month.
            </p>
            <p>
                For a team of 5 on Premium, that's <strong>$2,400/year</strong> for what is, essentially, a pretty contact list with pipelines.
            </p>
            <p>
                Sheety does the same thing for $0. Your contact list is already in Sheets. We just make it look good.
            </p>

            <ComparisonTable
                competitorName="Folk (Standard)"
                rows={[
                    { feature: "Price", us: "$0", them: "$20/user/mo" },
                    { feature: "Pipeline View", us: true, them: true },
                    { feature: "Email Sequences", us: false, them: "Premium Only" },
                    { feature: "Mobile App", us: "PWA", them: "iOS Only (Limited)" },
                    { feature: "Data Ownership", us: true, them: false },
                ]}
            />

            <h2>The Missing Mobile</h2>
            <p>
                One of Folk's most common complaints? <strong>No proper mobile app.</strong> For a tool designed for relationship management, that's a significant gap.
            </p>
            <p>
                Sheety runs in any browser. Your Google Sheet is available on your phone via the Sheets app. Mobile-ready by default.
            </p>

            <h2>Chrome Extension Dependency</h2>
            <p>
                Folk's "folkX" Chrome extension is how you capture contacts from LinkedIn and the web. It's clever—until you need to work on Safari, Firefox, or a managed corporate browser.
            </p>
            <p>
                Sheety has no browser dependency. Copy. Paste. Done.
            </p>

            <h2>When Folk Makes Sense</h2>
            <p>
                Folk is great for:
            </p>
            <ul>
                <li>Freelancers who network heavily on LinkedIn</li>
                <li>VCs and investors tracking relationships</li>
                <li>Teams that want a lightweight, collaborative contact manager</li>
            </ul>
            <p>
                But if you're a solopreneur who just needs a pipeline and doesn't want another subscription? Sheety is Folk without the price tag.
            </p>
        </ArticleLayout>
    );
}
