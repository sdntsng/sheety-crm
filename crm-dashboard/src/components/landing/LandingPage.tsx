'use client';

import { motion, Variants } from 'framer-motion';
import { signIn } from 'next-auth/react';
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

const floating: Variants = {
    animate: {
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

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
                className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center"
            >
                <motion.div variants={item} className="mb-6 inline-block">
                    <span className="px-4 py-1.5 rounded-full border border-[var(--color-ink)] font-mono text-xs uppercase tracking-widest bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        v1.0 Beta
                    </span>
                </motion.div>

                <motion.h1 variants={item} className="font-serif text-6xl md:text-8xl font-bold leading-[0.9] text-[var(--color-ink)] mb-8 tracking-tight">
                    Your Spreadsheet,<br />
                    <span className="italic text-[var(--accent)]">Supercharged.</span>
                </motion.h1>

                <motion.p variants={item} className="font-sans text-xl md:text-2xl text-[var(--color-ink-muted)] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                    The "Stateless" CRM for solopreneurs. Zero database lock-in.
                    Everything lives in your Google Sheet. We just make it beautiful.
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

            {/* Levitating Visuals */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                {/* Abstract Sheet 1 */}
                <motion.div
                    variants={floating}
                    animate="animate"
                    className="absolute top-[15%] left-[5%] md:left-[15%] w-64 h-80 bg-white border border-[var(--border-pencil)] shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-xl opacity-40 rotate-[-6deg]"
                >
                    <div className="h-full w-full p-4 space-y-4">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-50 rounded w-full"></div>
                        <div className="h-2 bg-gray-50 rounded w-full"></div>
                        <div className="h-2 bg-gray-50 rounded w-5/6"></div>
                    </div>
                </motion.div>

                {/* Abstract Sheet 2 */}
                <motion.div
                    variants={floating}
                    animate="animate"
                    transition={{ delay: 1 }}
                    className="absolute bottom-[20%] right-[5%] md:right-[15%] w-72 h-64 bg-white border border-[var(--border-pencil)] shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-xl opacity-40 rotate-[3deg]"
                >
                    <div className="h-full w-full p-6 grid grid-cols-2 gap-4">
                        <div className="h-24 bg-blue-50/50 rounded-lg"></div>
                        <div className="h-24 bg-purple-50/50 rounded-lg"></div>
                    </div>
                </motion.div>
            </div>

            {/* Feature Grid */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
                <div className="grid md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">📂</div>
                        <h3 className="font-serif text-2xl font-bold mb-3">You Own The Data</h3>
                        <p className="text-[var(--color-ink-muted)]">Typical CRMs hold your data hostage. We check directly into your Google Sheet.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">⚡️</div>
                        <h3 className="font-serif text-2xl font-bold mb-3">Instant UI</h3>
                        <p className="text-[var(--color-ink-muted)]">No more wrestling with spreadsheet cells. Get a Kanban board, stats, and filters instantly.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="p-8 bg-white border border-[var(--border-color)] rounded-2xl hover:border-[var(--accent)] hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6">👥</div>
                        <h3 className="font-serif text-2xl font-bold mb-3">Multi-Player</h3>
                        <p className="text-[var(--color-ink-muted)]">Invite your team to the sheet. They log in with their Google account and see the same data.</p>
                    </motion.div>
                </div>
            </div>

        </div>
    );
}
