'use client';

import ArticleLayout from '@/components/comparison/ArticleLayout';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function SetupGuidePage() {
    return (
        <ArticleLayout
            title="The One-Time Setup"
            subtitle="Connect your Google Sheet and own your data forever."
            readingTime="10 min read"
        >
            <div className="relative w-full h-64 md:h-80 mb-12 border-2 border-[var(--border-ink)] overflow-hidden bg-[#F2F0E9] p-8 flex items-center justify-center">
                <Image
                    src="/images/blog/setup-header.png"
                    alt="Setup Tools"
                    fill
                    className="object-contain p-8 mix-blend-multiply opacity-90"
                />
            </div>

            <p className="lead">
                Setting up Sheety takes about 30 seconds. Because it just sits on top of Google Sheets, there's no database to provision and no complex migration.
            </p>

            <h2>Step 1: Sign In</h2>
            <p>
                Sheety uses your Google account for authentication. We don't store passwords. Simply click <strong>Sign In</strong> and authorize the app to access your spreadsheets.
            </p>
            <div className="my-8 rounded-xl overflow-hidden border border-[var(--border-pencil)] shadow-lg">
                <Image
                    src="/images/blog/login-screen.png"
                    alt="Sheety Login Screen"
                    width={800}
                    height={600}
                    className="w-full h-auto bg-[#F9F9F9]"
                />
            </div>

            <h2>Step 2: Choose Your Database</h2>
            <p>
                Once logged in, you'll be directed to the Setup page. You have two primary options:
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-12 not-prose">
                {/* Visual: Create New CRM */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col p-6 rounded-2xl border border-[var(--border-color)] bg-white shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] text-[var(--color-ink)] border border-[var(--border-pencil)] flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="font-serif font-bold text-lg mb-2 text-[var(--color-ink)]">Option A: Create New</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                        We automatically create a new sheet with <code>Leads</code>, <code>Opportunities</code>, and <code>Activities</code> tabs.
                    </p>
                    <div className="mt-auto px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg text-center opacity-90">
                        Recommended
                    </div>
                </motion.div>

                {/* Visual: Select from Drive */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col p-6 rounded-2xl border border-[var(--border-color)] bg-white shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] text-[var(--color-ink)] border border-[var(--border-pencil)] flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <h3 className="font-serif font-bold text-lg mb-2 text-[var(--color-ink)]">Option B: From Drive</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                        Open the Google Picker to select an existing spreadsheet from your Drive.
                    </p>
                    <div className="mt-auto px-4 py-2 border border-[var(--border-color)] text-[var(--color-ink)] text-sm font-medium rounded-lg text-center">
                        Select Sheet
                    </div>
                </motion.div>
            </div>
            <blockquote>
                <p>
                    <strong>Tip:</strong> If you're bringing your own sheet, make sure it has the required columns. You can use the "Add Schema Sheet" tool in the setup footer to fix missing tabs.
                </p>
            </blockquote>

            <h2>Manual Setup (Advanced)</h2>
            <p>
                Prefer to set things up yourself? You can use our read-only <strong>Master Template</strong>.
            </p>
            <ol>
                <li>Open the <a href="https://docs.google.com/spreadsheets/d/1bpkIwtKbDy7E0rwFoOMGWwNtuvHv0Wb-codfvGwMNQ0/edit?usp=sharing" target="_blank" className="font-bold underline text-[var(--accent)]">Master Template</a>.</li>
                <li>Click <strong>File &gt; Make a copy</strong> to save it to your Drive.</li>
                <li>Return to Sheety and choose <strong>Select from Drive</strong>.</li>
            </ol>

            <h2>That's It</h2>
            <p>
                Your CRM is now live. Any change you make in Sheety is instantly reflected in your Google Sheet, and vice versa. You own the data, forever.
            </p>

        </ArticleLayout>
    );
}
