'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
};

const item: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } },
};

// Feature demo data with videos - Google-style copy
const featureDemos = [
    {
        title: "Drag. Drop. Done.",
        description: "Move deals through your pipeline with a simple drag. Sheety syncs every change to your sheet instantly.",
        video: "/assets/DragDropBetweenStages_web.mp4",
    },
    {
        title: "Lead to Opportunity",
        description: "Qualify a lead with one click. Sheety creates the opportunity and keeps everything linked.",
        video: "/assets/TurnLeadIntoOpportunity_web.mp4",
    },
    {
        title: "Multiple Sheets. One App.",
        description: "Switch between different CRM sheets instantly. Sheety keeps your context across all your databases.",
        video: "/assets/EasilySwitchDatabaseSheets_web.mp4",
    },
    {
        title: "Track Every Interaction",
        description: "Calls, emails, meetings—log them all. Sheety organizes your activity history automatically.",
        video: "/assets/UpdateActivity_web.mp4",
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--color-ink)] overflow-hidden relative selection:bg-[var(--accent)] selection:text-white">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
            </div>

            {/* Hero Section */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center"
            >
                <motion.div variants={item} className="mb-6 inline-block">
                    <span className="px-4 py-1.5 rounded-full border border-[var(--color-ink)] font-mono text-xs uppercase tracking-widest bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        v1.0 Beta
                    </span>
                </motion.div>

                <motion.h1 variants={item} className="font-serif text-5xl md:text-7xl font-bold leading-[0.95] text-[var(--color-ink)] mb-6 tracking-tight">
                    Your Spreadsheet<br />
                    <span className="italic text-[var(--accent)]">Is Your CRM.</span>
                </motion.h1>

                <motion.p variants={item} className="font-sans text-lg md:text-xl text-[var(--color-ink-muted)] max-w-2xl mx-auto mb-8 font-light leading-relaxed">
                    Sheety turns your Google Sheet into a beautiful CRM.
                    No database lock-in. No learning curve. Your data, your rules.
                </motion.p>

                <motion.div variants={item}>
                    <Link
                        href="/login"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-ink)] text-white rounded-full text-lg font-medium shadow-[0px_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0px_6px_20px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1"
                    >
                        Go to App
                        <span className="opacity-70 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <p className="mt-4 font-mono text-xs text-[var(--color-ink-muted)] opacity-60">
                        Free forever. Open Source. No credit card.
                    </p>
                </motion.div>
            </motion.div>

            {/* Hero Video/Image Preview */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative z-10 max-w-5xl mx-auto px-6 mb-24"
            >
                <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--border-pencil)] shadow-[12px_12px_0px_rgba(0,0,0,0.08)] bg-white">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-auto"
                        poster="/assets/DatabaseHomeStatic.png"
                    >
                        <source src="/assets/DashboardOverview_web.mp4" type="video/mp4" />
                    </video>
                    {/* Decorative Elements */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                </div>
            </motion.div>

            {/* Value Props - Simple Cards */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="font-serif text-3xl md:text-4xl font-bold text-center mb-4"
                >
                    Why Sheety?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center text-[var(--color-ink-muted)] mb-12 max-w-xl mx-auto"
                >
                    A beautiful interface on top of the database you already know.
                </motion.p>

                <div className="grid md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
                            </svg>
                        </div>
                        <h3 className="font-serif text-2xl font-bold mb-3">Your Data. Your Sheet.</h3>
                        <p className="text-[var(--color-ink-muted)]">Sheety reads and writes directly to your Google Sheet. No proprietary database. Export anytime.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                        </div>
                        <h3 className="font-serif text-2xl font-bold mb-3">Instant Interface</h3>
                        <p className="text-[var(--color-ink-muted)]">Sheety gives you a Kanban pipeline, lead cards, and activity logs—no spreadsheet wrestling.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                        </div>
                        <h3 className="font-serif text-2xl font-bold mb-3">Team Ready</h3>
                        <p className="text-[var(--color-ink-muted)]">Share your sheet. Teammates sign in with Google and Sheety shows everyone the same live data.</p>
                    </motion.div>
                </div>
            </div>

            {/* Feature Demos Section - Warm paper tone */}
            <div className="relative z-10 bg-[#1A1918] text-[var(--bg-paper)] py-32">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-24"
                    >
                        <h2 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            Sheety in Action
                        </h2>
                        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto font-light">
                            See how simple CRM workflows become.
                        </p>
                    </motion.div>

                    {/* Alternating Feature Rows */}
                    <div className="space-y-24">
                        {featureDemos.map((demo, index) => (
                            <motion.div
                                key={demo.title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}
                            >
                                {/* Video */}
                                <div className="flex-1 w-full">
                                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                                        <video
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-auto"
                                        >
                                            <source src={demo.video} type="video/mp4" />
                                        </video>
                                    </div>
                                </div>

                                {/* Text */}
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}>
                                    <span className="font-mono text-8xl font-bold text-white/20 mb-2 block">
                                        0{index + 1}
                                    </span>
                                    <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                                        {demo.title}
                                    </h3>
                                    <p className="text-white/80 text-xl leading-relaxed">
                                        {demo.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="relative z-10 py-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto px-6"
                >
                    <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                        Ready to try it?
                    </h2>
                    <p className="text-[var(--color-ink-muted)] mb-8">
                        Connect your Google account and start managing your leads in seconds.
                    </p>
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-ink)] text-white rounded-full text-lg font-medium shadow-[0px_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0px_6px_20px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1"
                    >
                        Get Started Free
                        <span className="opacity-70 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
