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
            <div className="my-8 max-w-md mx-auto rounded-xl overflow-hidden border border-[var(--border-pencil)] shadow-lg">
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

            <h3>Option A: Select from Drive</h3>
            <p>
                If you already have a spreadsheet you want to use, click <strong>Select from Drive</strong>. This will open the Google Picker, allowing you to choose any existing sheet.
            </p>

            <div className="my-8 p-8 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-pencil)] flex justify-center not-prose">
                <motion.div
                    className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[var(--border-color)] overflow-hidden"
                >
                    <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <div className="ml-auto text-xs text-gray-400 font-mono">Select a file</div>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05, borderColor: '#16A34A', backgroundColor: '#F0FDF4' }}
                                className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${i === 2 ? 'border-green-600 bg-green-50 ring-2 ring-green-500/20' : 'border-[var(--border-pencil)] bg-white'}`}
                            >
                                {/* Sheet Icon */}
                                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" /><path d="M8 15h2v2H8zm0-4h2v2H8zm0 8h2v2H8zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z" opacity=".3" /><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" /><path d="M8 15h2v2H8zm0-4h2v2H8zm0 8h2v2H8zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z" /></svg>
                                <div className="w-12 h-2 bg-gray-100 rounded" />
                            </motion.div>
                        ))}
                        {[4, 5, 6].map((i) => (
                            <div key={i} className="aspect-square rounded-lg border border-transparent flex flex-col items-center justify-center gap-2 opacity-30">
                                <div className="w-8 h-8 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <h3>Option B: Create New CRM (Recommended)</h3>
            <p>
                Click <strong>Create New CRM</strong>, give your sheet a name (e.g., "Pipeline 2026"), and we will automatically:
            </p>
            <ul>
                <li>Create a new spreadsheet in your Google Drive.</li>
                <li>Create the required tabs: <code>Leads</code>, <code>Opportunities</code>, and <code>Activities</code>.</li>
                <li>Set up the correct headers and data validation.</li>
            </ul>

            <div className="my-8 p-8 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-pencil)] flex justify-center not-prose">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-[var(--border-color)] p-6 overflow-hidden relative"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-4 w-32 bg-[var(--bg-surface)] rounded animate-pulse" />
                        <div className="h-4 w-4 bg-[var(--bg-surface)] rounded-full" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="h-3 w-20 bg-[var(--bg-surface)] rounded mb-2" />
                            <div className="h-10 w-full border border-green-500 ring-1 ring-green-500/20 rounded-lg flex items-center px-3 text-sm text-[var(--color-ink)] bg-white gap-2">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" /></svg>
                                Pipeline 2026<span className="animate-pulse">|</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 flex-1 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                                Create Sheet
                            </div>
                            <div className="h-10 w-20 border border-[var(--border-color)] rounded-lg" />
                        </div>
                    </div>
                    {/* Cursor Graphic */}
                    <div className="absolute bottom-6 right-1/4 pointer-events-none opacity-20">
                        <svg className="w-8 h-8 text-black rotate-12 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2l12 11.2-5.8.5 3.2 7.5-2 1.2-3.2-7.4-4.6 5.4z" /></svg>
                    </div>
                </motion.div>
            </div>
            <blockquote>
                <p>
                    <strong>Tip:</strong> If you're bringing your own sheet, make sure it has the required columns. You can use the "Add Schema Sheet" tool in the setup footer to add the required tabs (Leads, Opportunities, Activities) to your sheet, or download our CSV schemas directly:
                </p>
                <div className="flex gap-4 mt-2 font-mono text-sm">
                    <a href="/templates/leads.csv" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        leads.csv
                    </a>
                    <a href="/templates/opps.csv" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        opps.csv
                    </a>
                </div>
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
