'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const articles = [
    {
        title: "Mastering Sheety with One Hand",
        subtitle: "A comprehensive guide to keyboard shortcuts and the Command Palette.",
        date: "Jan 21, 2025",
        slug: "/blog/how-to-shortcuts",
        tag: "Guide"
    },
    {
        title: "The Data Ownership Manifesto",
        subtitle: "Why we built a CRM that lives in a spreadsheet.",
        date: "Jan 20, 2025",
        slug: "/blog/manifesto",
        tag: "Philosophy"
    },
    {
        title: "The Free CRM Trap",
        subtitle: "Why HubSpot costs more than you think.",
        date: "Jan 20, 2025",
        slug: "/compare/hubspot",
        tag: "Analysis"
    },
    {
        title: "Database Anxiety",
        subtitle: "One day you hit 1,200 records. Then what?",
        date: "Jan 20, 2025",
        slug: "/compare/airtable",
        tag: "Comparison"
    },
    {
        title: "Who is Reading Your Email?",
        subtitle: "The privacy cost of 'Inbox CRMs' like Streak.",
        date: "Jan 20, 2025",
        slug: "/compare/streak",
        tag: "Privacy"
    },
    {
        title: "The Add-On Trap",
        subtitle: "Pipedrive's $14 base price is just the beginning.",
        date: "Jan 20, 2025",
        slug: "/compare/pipedrive",
        tag: "Pricing"
    },
    {
        title: "Built for Sales Floors",
        subtitle: "Close is amazing for call centers. You're not one.",
        date: "Jan 20, 2025",
        slug: "/compare/close",
        tag: "Analysis"
    },
    {
        title: "The Beautiful Prison",
        subtitle: "Attio's flexibility comes with invisible chains.",
        date: "Jan 20, 2025",
        slug: "/compare/attio",
        tag: "Lock-in"
    },
    {
        title: "The Other Side of Simple",
        subtitle: "Folk is simple. So is Sheety. One is free.",
        date: "Jan 20, 2025",
        slug: "/compare/folk",
        tag: "Comparison"
    }
];

export default function BlogIndex() {
    return (
        <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--color-ink)] selection:bg-[var(--accent)] selection:text-white pb-24">
            <main className="max-w-4xl mx-auto px-6 pt-12 md:pt-24">
                {/* Navigation Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--color-ink-muted)] hover:text-[var(--accent)] transition-colors mb-12 font-mono text-xs uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <header className="mb-24">
                    <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        The Sheety Journal
                    </h1>
                    <p className="font-sans text-xl text-[var(--color-ink-muted)] max-w-xl font-light">
                        Thoughts on data ownership, open source software, and building tools that respect your intelligence.
                    </p>
                </header>

                <div className="grid gap-12 md:gap-16">
                    {articles.map((article, index) => (
                        <motion.article
                            key={article.slug}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative border-t border-[var(--border-pencil)] pt-8 md:pt-12"
                        >
                            <Link href={article.slug} className="block">
                                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-widest">
                                        <span>{article.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-ink-muted)] opacity-50" />
                                        <span className="text-[var(--accent)]">{article.tag}</span>
                                    </div>
                                    <span className="hidden md:inline-block text-xs font-mono text-[var(--color-ink-muted)] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                        Read Article →
                                    </span>
                                </div>
                                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors">
                                    {article.title}
                                </h2>
                                <p className="font-sans text-lg text-[var(--color-ink-muted)] max-w-2xl font-light">
                                    {article.subtitle}
                                </p>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </main>
        </div>
    );
}
