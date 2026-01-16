'use client';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function StatCard({ title, value, subtitle, variant = 'default' }: StatCardProps) {
    const variants = {
        default: 'border-[var(--text-primary)] text-[var(--text-primary)]',
        success: 'border-[var(--accent-green)] text-[var(--accent-green)]',
        warning: 'border-[var(--accent-yellow)] text-[var(--text-primary)]',
        danger: 'border-[var(--accent-red)] text-[var(--accent-red)]',
    };

    const bgVariants = {
        default: 'bg-white',
        success: 'bg-[#F0FDF4]',
        warning: 'bg-[#FEFCE8]',
        danger: 'bg-[#FEF2F2]',
    };

    return (
        <div className={`paper-card p-4 flex flex-col justify-between h-32 relative ${bgVariants[variant]}`}>
            {/* Tape/Pin decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/10 blur-[1px]"></div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--text-secondary)] border border-[var(--bg-paper)] shadow-sm z-10"></div>

            <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    {title}
                </h3>
                <div className={`font-sans font-bold text-3xl tracking-tight ${variant === 'success' ? 'text-green-700' : 'text-[var(--text-primary)]'}`}>
                    {value}
                </div>
            </div>

            {subtitle && (
                <div className="font-mono text-[10px] text-[var(--text-secondary)] border-t border-[var(--border-pencil)] pt-2 mt-auto dashed">
                    {subtitle}
                </div>
            )}
        </div>
    );
}
