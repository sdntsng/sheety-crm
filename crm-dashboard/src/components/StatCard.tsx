'use client';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: 'default' | 'success' | 'warning';
    icon?: React.ReactNode;
}

export default function StatCard({ title, value, subtitle, variant = 'default', icon }: StatCardProps) {
    const variantClass = variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : '';

    return (
        <div className={`stat-card ${variantClass}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-zinc-400 text-sm mb-1">{title}</p>
                    <p className="text-3xl font-bold text-zinc-100">{value}</p>
                    {subtitle && (
                        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
                    )}
                </div>
                {icon && (
                    <div className="text-zinc-600">{icon}</div>
                )}
            </div>
        </div>
    );
}
