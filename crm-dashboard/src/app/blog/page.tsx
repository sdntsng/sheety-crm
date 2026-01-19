'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type Category = 'All' | 'Comparison' | 'Thoughts' | 'Guide';

const articles = [
    {
        title: "The One-Time Setup",
        subtitle: "Connect your Google Sheet and own your data forever.",
        date: "Jan 21, 2025",
        slug: "/blog/how-to-setup",
        tag: "Guide",
        category: 'Guide'
    },
    {
        title: "Flow State Sales",
        subtitle: "How to visualize, manage, and accelerate your deal flow sheety-style.",
        date: "Jan 18, 2025",
        slug: "/blog/how-to-pipeline",
        tag: "Guide",
        category: 'Guide'
    },
    {
        title: "Mastering Sheety with One Hand",
        subtitle: "A comprehensive guide to keyboard shortcuts and the Command Palette.",
        date: "Jan 14, 2025",
        slug: "/blog/how-to-shortcuts",
        tag: "Guide",
        category: 'Guide'
    },
    {
        title: "The Data Ownership Manifesto",
        subtitle: "Why we built a CRM that lives in a spreadsheet.",
        date: "Jan 10, 2025",
        slug: "/blog/manifesto",
        tag: "Philosophy",
        category: 'Thoughts'
    },
    {
        title: "The Free CRM Trap",
        subtitle: "Why HubSpot costs more than you think.",
        date: "Jan 05, 2025",
        slug: "/compare/hubspot",
        tag: "Analysis",
        category: 'Comparison'
    },
    {
        title: "Database Anxiety",
        subtitle: "One day you hit 1,200 records. Then what?",
        date: "Dec 30, 2024",
        slug: "/compare/airtable",
        tag: "Comparison",
        category: 'Comparison'
    },
    {
        title: "Who is Reading Your Email?",
        subtitle: "The privacy cost of 'Inbox CRMs' like Streak.",
        date: "Dec 15, 2024",
        slug: "/compare/streak",
        tag: "Privacy",
        category: 'Comparison'
    },
    {
        title: "The Add-On Trap",
        subtitle: "Pipedrive's $14 base price is just the beginning.",
        date: "Dec 08, 2024",
        slug: "/compare/pipedrive",
        tag: "Pricing",
        category: 'Comparison'
    },
    {
        title: "Built for Sales Floors",
        subtitle: "Close is amazing for call centers. You're not one.",
        date: "Nov 25, 2024",
        slug: "/compare/close",
        tag: "Analysis",
        category: 'Comparison'
    },
    {
        title: "The Beautiful Prison",
        subtitle: "Attio's flexibility comes with invisible chains.",
        date: "Nov 14, 2024",
        slug: "/compare/attio",
        tag: "Lock-in",
        category: 'Comparison'
    },
    {
        title: "The Other Side of Simple",
        subtitle: "Folk is simple. So is Sheety. One is free.",
        date: "Nov 02, 2024",
        slug: "/compare/folk",
        tag: "Comparison",
        category: 'Comparison'
    }
];

export default function BlogIndex() {
    const [filter, setFilter] = useState<Category>('All');

    const filteredArticles = articles.filter(article =>
        filter === 'All' ? true : article.category === filter
    );

    const categories: Category[] = ['All', 'Comparison', 'Thoughts', 'Guide'];

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

                <header className="mb-12">
                    <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        The Sheety Journal
                    </h1>
                    <p className="font-sans text-xl text-[var(--color-ink-muted)] max-w-xl font-light">
                        Thoughts on data ownership, open source software, and building tools that respect your intelligence.
                    </p>
                </header>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-16 border-b border-[var(--border-pencil)] pb-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest rounded-full transition-all border ${filter === cat
                                ? 'bg-[var(--color-ink)] text-[var(--bg-paper)] border-[var(--color-ink)] shadow-md transform -translate-y-0.5'
                                : 'bg-transparent text-[var(--color-ink-muted)] border-transparent hover:border-[var(--border-pencil)] hover:text-[var(--color-ink)]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid gap-12 md:gap-16 min-h-[50vh]">
                    {filteredArticles.length === 0 && (
                        <div className="py-20 text-center font-mono text-[var(--color-ink-muted)]">
                            No articles found in this section yet.
                        </div>
                    )}

                    {filteredArticles.map((article, index) => (
                        <motion.article
                            key={article.slug}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative pt-8 md:pt-12"
                        >
                            <div className="absolute top-0 left-0 w-full h-px bg-[var(--border-pencil)]" />
                            <Link href={article.slug} className="block">
                                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-widest">
                                        <span>{article.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-ink-muted)] opacity-50" />
                                        <span className={`
                                            ${article.category === 'Guide' ? 'text-[var(--accent)] font-bold' : ''}
                                            ${article.category === 'Thoughts' ? 'text-purple-600' : ''}
                                            ${article.category === 'Comparison' ? 'text-blue-600' : ''}
                                        `}>
                                            {article.tag}
                                        </span>
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
