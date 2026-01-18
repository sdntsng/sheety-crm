'use client';

import { motion } from 'framer-motion';
import SheetyIcon from './icons/SheetyIcon';

export default function Loader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[50vh]">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative"
            >
                <div className="absolute inset-0 bg-[var(--accent)] blur-xl opacity-20 rounded-full animate-pulse"></div>
                <div className="w-16 h-16 bg-white rounded-2xl border-2 border-[var(--border-pencil)] shadow-lg flex items-center justify-center relative z-10">
                    <SheetyIcon className="w-8 h-8 text-[var(--accent)]" />
                </div>

                {/* Orbital dots */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-10px] z-0"
                >
                    <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full absolute top-0 left-1/2 -translate-x-1/2"></div>
                </motion.div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-mono text-xs text-[var(--color-ink-muted)] tracking-widest uppercase animate-pulse"
            >
                {text}
            </motion.p>
        </div>
    );
}
