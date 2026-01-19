'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ArticleLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    readingTime?: string;
    publishedDate?: string;
}

export default function ArticleLayout({
    children,
    title,
    subtitle,
    readingTime = "5 min read",
    publishedDate = "Jan 20, 2025"
}: ArticleLayoutProps) {
    return (
        <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--color-ink)] selection:bg-[var(--accent)] selection:text-white pb-24">
            {/* Progress Bar / Read Indicator could go here */}

            <main className="max-w-4xl mx-auto px-6 pt-12 md:pt-24">
                {/* Navigation Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--color-ink-muted)] hover:text-[var(--accent)] transition-colors mb-12 font-mono text-xs uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Article Header */}
                <header className="mb-16 md:mb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex justify-center gap-4 text-xs font-mono text-[var(--color-ink-muted)] mb-6 uppercase tracking-widest">
                            <span>{publishedDate}</span>
                            <span>•</span>
                            <span>{readingTime}</span>
                        </div>
                        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                            {title}
                        </h1>
                        <p className="font-sans text-xl md:text-2xl text-[var(--color-ink-muted)] max-w-2xl mx-auto font-light leading-relaxed">
                            {subtitle}
                        </p>
                    </motion.div>
                </header>

                {/* Article Content */}
                <article className="prose prose-lg prose-stone md:prose-xl mx-auto max-w-3xl
                    prose-headings:font-serif prose-headings:font-bold prose-headings:text-[var(--color-ink)] prose-headings:mt-32 prose-headings:mb-8
                    prose-p:font-sans prose-p:text-[var(--color-ink-muted)] prose-p:leading-loose prose-p:mb-10 prose-p:text-xl
                    prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[var(--color-ink)] prose-strong:font-semibold
                    prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:my-20 prose-blockquote:text-2xl prose-blockquote:leading-relaxed
                    prose-code:font-mono prose-code:bg-[var(--bg-hover)] prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-[var(--color-ink)]
                    prose-ul:my-12 prose-ul:space-y-6 prose-li:text-[var(--color-ink-muted)] prose-li:leading-relaxed prose-li:text-xl
                    prose-ol:my-12 prose-ol:space-y-6
                    [&_.lead]:text-2xl [&_.lead]:leading-relaxed [&_.lead]:text-[var(--color-ink)] [&_.lead]:font-light [&_.lead]:mb-20
                ">
                    {children}
                </article>

                {/* Author / Signoff */}
                <div className="mt-24 pt-12 border-t border-[var(--border-pencil)] max-w-2xl mx-auto text-center">
                    <p className="font-serif italic text-lg mb-8">
                        "Sheety is the CRM for people who hate CRMs."
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--color-ink)] rounded-full flex items-center justify-center text-white font-serif font-bold text-xl">
                            S
                        </div>
                        <div>
                            <p className="font-mono text-sm font-bold uppercase tracking-wider">The Sheety Team</p>
                            <p className="text-xs text-[var(--color-ink-muted)]">Building in public.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky CTA (Mobile/Desktop) - Optional, maybe just regular CTA at bottom for clean "Paper" feel */}
            <div className="max-w-4xl mx-auto px-6 mt-16 text-center">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-ink)] text-white rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                    Start Your Free Sheet
                    <span className="opacity-70">→</span>
                </Link>
            </div>
        </div>
    );
}
