'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/pipeline', label: 'Pipeline', icon: '🎯' },
    { href: '/leads', label: 'Leads', icon: '👥' },
    { href: '/setup', label: 'Select Sheet', icon: '📋' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 min-h-screen sidebar flex flex-col transition-colors duration-300">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h1 className="text-xl font-serif font-bold text-[var(--accent)] tracking-tight">
                    Vinci CRM
                </h1>
                <ThemeToggle />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
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

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)]">
                {session?.user ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt="User"
                                    className="w-8 h-8 rounded-full border border-[var(--border)]"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">
                                    {session.user.name?.[0]}
                                </div>
                            )}
                            <div className="overflow-hidden">
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
                            className="w-full text-xs text-[var(--color-ink-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>


                        <Link
                            href="/setup"
                            className="w-full text-xs text-[var(--color-ink-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" />
                            </svg>
                            Change Database
                        </Link>
                    </div>
                ) : (
                    <p className="text-xs text-zinc-600 text-center">
                        Powered by Google Sheets
                    </p>
                )}
            </div>
        </aside >
    );
}
