"use client";

import Image from "next/image";
import SheetyIcon from "../icons/SheetyIcon";

interface ComparisonHeroProps {
  competitorName: string;
  competitorLogo?: string;
  tagline: string;
}

export default function ComparisonHero({
  competitorName,
  competitorLogo,
  tagline,
}: ComparisonHeroProps) {
  return (
    <div className="not-prose my-16 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-12 px-8 rounded-2xl bg-gradient-to-br from-white to-[var(--bg-paper)] border border-[var(--border-pencil)]">
      {/* Sheety Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-[var(--color-ink)] rounded-2xl flex items-center justify-center text-white shadow-lg">
          <SheetyIcon className="w-10 h-10" />
        </div>
        <span className="font-sans text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
          Sheety
        </span>
      </div>

      {/* VS Badge */}
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--border-pencil)] bg-white flex items-center justify-center font-mono text-sm font-bold text-[var(--color-ink-muted)]">
          VS
        </div>
      </div>

      {/* Competitor */}
      <div className="flex flex-col items-center gap-3">
        {competitorLogo ? (
          <Image
            src={competitorLogo}
            alt={competitorName}
            width={80}
            height={80}
            className="w-20 h-20 object-contain rounded-2xl"
          />
        ) : (
          <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center text-[var(--color-ink-muted)] font-serif font-bold text-2xl border border-[var(--border-pencil)]">
            {competitorName.charAt(0)}
          </div>
        )}
        <span className="font-sans text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
          {competitorName}
        </span>
      </div>
    </div>
  );
}
