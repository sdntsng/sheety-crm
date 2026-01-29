"use client";

import { motion } from "framer-motion";
import SheetyIcon from "./icons/SheetyIcon";

export default function Loader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-8 min-h-[60vh] w-full bg-[var(--bg-paper)]">
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Pulse Glow */}
        <div className="absolute inset-0 bg-[var(--accent)] blur-2xl opacity-30 rounded-full animate-pulse scale-150"></div>

        {/* Main Icon Box */}
        <div className="w-24 h-24 bg-white rounded-3xl border-2 border-[var(--border-pencil)] shadow-[8px_8px_0px_rgba(0,0,0,0.1)] flex items-center justify-center relative z-10">
          <SheetyIcon className="w-12 h-12 text-[var(--accent)]" />
        </div>

        {/* Orbital dots - Tacky/Playful */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-20px] z-0"
        >
          <div className="w-4 h-4 bg-[var(--accent-blue)] rounded-full border border-white absolute top-0 left-1/2 -translate-x-1/2 shadow-sm"></div>
          <div className="w-3 h-3 bg-[var(--accent-yellow)] rounded-full border border-white absolute bottom-0 left-1/2 -translate-x-1/2 shadow-sm"></div>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="font-mono text-sm font-bold text-[var(--color-ink)] tracking-widest uppercase bg-white px-4 py-1 rounded-full border border-[var(--border-pencil)] shadow-sm"
      >
        {text}
      </motion.p>
    </div>
  );
}
