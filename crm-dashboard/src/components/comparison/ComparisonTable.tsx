'use client';

import { Check, X, Minus } from 'lucide-react';

interface ComparisonRow {
    feature: string;
    us: boolean | string;
    them: boolean | string;
    note?: string;
}

interface ComparisonTableProps {
    competitorName: string;
    rows: ComparisonRow[];
}

export default function ComparisonTable({ competitorName, rows }: ComparisonTableProps) {
    return (
        <div className="my-12 not-prose">
            <div className="overflow-hidden rounded-xl border border-[var(--border-pencil)] bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--bg-paper)] border-b border-[var(--border-pencil)]">
                            <th className="p-4 md:p-6 font-serif text-lg font-bold text-[var(--color-ink)] w-1/3">Feature</th>
                            <th className="p-4 md:p-6 font-mono text-sm uppercase tracking-wider font-bold text-[var(--accent)] w-1/3 text-center bg-[var(--accent)]/5">Sheety</th>
                            <th className="p-4 md:p-6 font-mono text-sm uppercase tracking-wider font-bold text-[var(--color-ink-muted)] w-1/3 text-center">{competitorName}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-pencil)]">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="group hover:bg-[var(--bg-paper)]/50 transition-colors">
                                <td className="p-4 md:p-6">
                                    <span className="font-medium text-[var(--color-ink)] block">{row.feature}</span>
                                    {row.note && (
                                        <span className="text-xs text-[var(--color-ink-muted)] mt-1 block font-normal">{row.note}</span>
                                    )}
                                </td>
                                <td className="p-4 md:p-6 text-center bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors">
                                    <div className="flex justify-center">
                                        {renderValue(row.us, true)}
                                    </div>
                                </td>
                                <td className="p-4 md:p-6 text-center">
                                    <div className="flex justify-center">
                                        {renderValue(row.them, false)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function renderValue(value: boolean | string, isUs: boolean) {
    if (typeof value === 'boolean') {
        if (value) {
            return <Check className={`w-6 h-6 ${isUs ? 'text-[var(--accent)]' : 'text-[var(--color-ink)]'}`} />;
        }
        return <X className="w-6 h-6 text-[var(--text-muted)] opacity-50" />;
    }
    // If it's a string, just render it (for things like "$0" vs "$800")
    return <span className={`font-mono font-bold ${isUs ? 'text-[var(--accent)]' : 'text-[var(--color-ink-muted)]'}`}>{value}</span>;
}
