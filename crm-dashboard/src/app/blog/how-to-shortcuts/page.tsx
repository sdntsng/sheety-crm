'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';
import Image from 'next/image';

export default function ShortcutsGuidePage() {
    return (
        <ArticleLayout
            title="Mastering Sheety with One Hand"
            subtitle="A comprehensive guide to keyboard shortcuts and the Command Palette."
            readingTime="5 min read"
        >
            <div className="relative w-full h-64 md:h-80 mb-12 border-2 border-[var(--border-ink)] overflow-hidden bg-[#F2F0E9] p-8 flex items-center justify-center">
                <Image
                    src="/images/blog/shortcuts-header.png"
                    alt="The Command Key"
                    fill
                    className="object-contain p-8 mix-blend-multiply opacity-90"
                />
            </div>

            <p className="lead">
                Speed isn't just about saving time. It's about maintaining flow. When you have to reach for the mouse, you break the connection between your thought and the screen.
            </p>

            <h2>The Philosophy of "No Mouse"</h2>
            <p>
                Professional tools create professional habits. A pianist doesn't look at their hands; a writer doesn't look at the keyboard. CRM operators shouldn't have to hunt for small buttons.
            </p>
            <p>
                We've built Sheety to be navigable almost entirely from your keyboard. This allows you to process leads, update deals, and navigate the app at the speed of thought.
            </p>

            <h2>The Command Palette (Cmd+K)</h2>
            <p>
                The heart of our keyboard-first navigation is the Command Palette. Think of it as the "Brain" of the application.
            </p>
            <div className="my-8 p-6 bg-[var(--bg-card)] border border-[var(--border-pencil)] shadow-sm">
                <p className="font-mono text-sm text-[var(--accent)] mb-2">TRY IT NOW</p>
                <div className="flex items-center gap-4">
                    <kbd className="px-3 py-1.5 bg-white border border-[var(--border-ink)] rounded font-mono text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">⌘</kbd>
                    <span className="text-[var(--text-secondary)]">+</span>
                    <kbd className="px-3 py-1.5 bg-white border border-[var(--border-ink)] rounded font-mono text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">K</kbd>
                </div>
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    On Windows/Linux, use <kbd className="font-mono">Ctrl + K</kbd>.
                </p>
            </div>
            <p>
                From the Command Palette, you can:
            </p>
            <ul>
                <li><strong>Search Everything:</strong> Type "Acme" to find a Lead, or "Big Deal" to find an Opportunity.</li>
                <li><strong>Navigate:</strong> Jump instantly to the Dashboard, Pipeline, or Settings.</li>
                <li><strong>Take Action:</strong> Create a new Lead, switch sheets, or even toggle "Dark Mode" (if your eyes need a break).</li>
            </ul>

            <h2>Essential Shortcuts</h2>
            <p>
                Beyond the Command Palette, we've engaged specific keys for high-frequency actions. Memorize these three, and you'll be 50% faster.
            </p>

            <table className="w-full text-left border-collapse my-8 font-mono text-sm">
                <thead>
                    <tr className="border-b-2 border-[var(--border-ink)]">
                        <th className="py-3 pr-4 font-bold uppercase tracking-wider">Key</th>
                        <th className="py-3 font-bold uppercase tracking-wider">Action</th>
                        <th className="py-3 font-bold uppercase tracking-wider hidden md:block">Context</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-pencil)] divide-dashed">
                    <tr>
                        <td className="py-3 pr-4"><kbd className="bg-white border border-[var(--border-pencil)] px-2 py-0.5 rounded">?</kbd></td>
                        <td className="py-3">Show Help</td>
                        <td className="py-3 text-[var(--text-secondary)] hidden md:block">Global</td>
                    </tr>
                    <tr>
                        <td className="py-3 pr-4"><kbd className="bg-white border border-[var(--border-pencil)] px-2 py-0.5 rounded">/</kbd></td>
                        <td className="py-3">Focus Search</td>
                        <td className="py-3 text-[var(--text-secondary)] hidden md:block">Global</td>
                    </tr>
                    <tr>
                        <td className="py-3 pr-4"><kbd className="bg-white border border-[var(--border-pencil)] px-2 py-0.5 rounded">N</kbd></td>
                        <td className="py-3">New Item</td>
                        <td className="py-3 text-[var(--text-secondary)] hidden md:block">Leads / Pipeline</td>
                    </tr>
                    <tr>
                        <td className="py-3 pr-4"><kbd className="bg-white border border-[var(--border-pencil)] px-2 py-0.5 rounded">Esc</kbd></td>
                        <td className="py-3">Close / Cancel</td>
                        <td className="py-3 text-[var(--text-secondary)] hidden md:block">Modals / Search</td>
                    </tr>
                    <tr>
                        <td className="py-3 pr-4"><kbd className="bg-white border border-[var(--border-pencil)] px-2 py-0.5 rounded">S</kbd></td>
                        <td className="py-3">Save Form</td>
                        <td className="py-3 text-[var(--text-secondary)] hidden md:block">Inside Modals</td>
                    </tr>
                </tbody>
            </table>

            <h2>Pro Tip: Power Creation</h2>
            <p>
                The fastest way to log a new lead after a call:
            </p>
            <ol>
                <li>Press <kbd className="font-mono bg-[var(--bg-surface)] px-1 rounded">cmd + k</kbd> to open the palette.</li>
                <li>Type "new" and hit Enter on "New Lead".</li>
                <li>Type the details, tab through fields.</li>
                <li>Press <kbd className="font-mono bg-[var(--bg-surface)] px-1 rounded">S</kbd> to save.</li>
            </ol>
            <p>
                You never touched the mouse. You never broke eye contact with the customer. That is the power of Sheety.
            </p>
        </ArticleLayout>
    );
}
