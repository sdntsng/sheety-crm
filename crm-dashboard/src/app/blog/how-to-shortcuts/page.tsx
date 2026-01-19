'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';

export default function ShortcutsGuidePage() {
    return (
        <ArticleLayout
            title="Mastering Sheety with One Hand"
            subtitle="A comprehensive guide to keyboard shortcuts and the Command Palette."
            readingTime="5 min read"
        >
            <p className="lead">
                The fastest way to use a computer is still the keyboard. Sheety is built for speed, with a Command Palette that lets you navigate, search, and act without touching your mouse.
            </p>

            <h2>The Command Palette (Cmd+K)</h2>
            <p>
                Press <code>Cmd+K</code> (or <code>Ctrl+K</code> on Windows) anywhere in the app to open the Command Palette. This is your universal remote for Sheety.
            </p>

            <div className="my-12 rounded-2xl overflow-hidden border border-[var(--border-pencil)] shadow-lg bg-[var(--bg-paper)]">
                <video autoPlay loop muted playsInline className="w-full">
                    <source src="/assets/QuicklySearchLeadsAndOpps_web.mp4" type="video/mp4" />
                </video>
                <div className="p-4 bg-[var(--bg-hover)] border-t border-[var(--border-pencil)] text-center text-sm font-mono text-[var(--color-ink-muted)]">
                    Search contacts, deals, and pages instantly.
                </div>
            </div>

            <p>
                From here, you can:
            </p>
            <ul>
                <li><strong>Search</strong>: Type "John" to find a lead instantly.</li>
                <li><strong>Navigate</strong>: Jump to "Pipeline", "Leads", or "Settings".</li>
                <li><strong>Act</strong>: Execute commands like "Create Opportunity" or "Switch Sheet".</li>
            </ul>

            <h2>Global Shortcuts</h2>
            <p>
                Once you master these, you'll fly through your workflow.
            </p>

            <div className="overflow-x-auto my-8 border border-[var(--border-pencil)] rounded-xl">
                <table className="w-full text-left font-sans">
                    <thead className="bg-[var(--bg-hover)] border-b border-[var(--border-pencil)]">
                        <tr>
                            <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider">Shortcut</th>
                            <th className="px-6 py-3 font-mono text-xs uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-pencil)]">
                        <tr>
                            <td className="px-6 py-3 font-mono text-[var(--accent)]">/</td>
                            <td className="px-6 py-3 text-[var(--color-ink-muted)]">Focus global search</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 font-mono text-[var(--accent)]">Cmd + K</td>
                            <td className="px-6 py-3 text-[var(--color-ink-muted)]">Open Command Palette</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 font-mono text-[var(--accent)]">G then P</td>
                            <td className="px-6 py-3 text-[var(--color-ink-muted)]">Go to <strong>P</strong>ipeline</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 font-mono text-[var(--accent)]">G then L</td>
                            <td className="px-6 py-3 text-[var(--color-ink-muted)]">Go to <strong>L</strong>eads</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 font-mono text-[var(--accent)]">Cmd + B</td>
                            <td className="px-6 py-3 text-[var(--color-ink-muted)]">Toggle Sidebar (if active)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>Context Switching</h2>
            <p>
                Managing multiple businesses? The Command Palette also lets you switch databases instantly. This is perfect for consultants or serial entrepreneurs managing multiple pipelines.
            </p>

            <div className="my-12 rounded-2xl overflow-hidden border border-[var(--border-pencil)] shadow-lg bg-[var(--bg-paper)]">
                <video autoPlay loop muted playsInline className="w-full">
                    <source src="/assets/EasilySwitchDatabaseSheets_web.mp4" type="video/mp4" />
                </video>
            </div>

            <p>
                Your brain works fast. Your CRM should too.
            </p>

        </ArticleLayout>
    );
}
