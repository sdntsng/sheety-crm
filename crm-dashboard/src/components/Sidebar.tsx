'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/pipeline', label: 'Pipeline', icon: '🎯' },
    { href: '/leads', label: 'Leads', icon: '👥' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

    useEffect(() => {
        // Check localStorage for selected sheet
        const saved = localStorage.getItem('selected_sheet_name');
        setSelectedSheet(saved);
    }, [pathname]); // Re-check when pathname changes (after setup)

    return (
        <aside className="w-64 min-h-screen sidebar flex flex-col transition-colors duration-300">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h1 className="text-xl font-serif font-bold text-[var(--accent)] tracking-tight">
                    Vinci CRM
                </h1>
                <ThemeToggle />
            </div>

            {/* Connected Sheet Indicator */}
            <Link
                href="/setup"
                className="mx-4 mt-4 p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 hover:border-[var(--accent)]/40 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">📋</span>
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                                Connected Sheet
                            </p>
                            <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                                {selectedSheet || 'Not selected'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[var(--color-ink-muted)] group-hover:text-[var(--accent)] transition-colors text-xs">
                        Change
                    </span>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] px-4 mb-2">
                    Menu
                </p>
                <ul className="space-y-1">
                    {navItems.map(item => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all sidebar-link ${pathname === item.href
                                    ? 'active font-medium shadow-sm'
                                    : ''
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer - User Info */}
            <div className="p-4 border-t border-[var(--border)]">
                {session?.user ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt="User"
                                    className="w-9 h-9 rounded-full border-2 border-[var(--border)]"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold">
                                    {session.user.name?.[0]}
                                </div>
                            )}
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                                    {session.user.name}
                                </p>
                                <p className="text-xs text-[var(--color-ink-muted)] truncate">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="w-full px-3 py-2 rounded-lg text-xs text-[var(--color-ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Sign In with Google
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
