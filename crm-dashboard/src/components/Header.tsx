'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import SearchBar from './SearchBar';

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/pipeline', label: 'Pipeline', icon: '🎯' },
    { href: '/leads', label: 'Leads', icon: '👥' },
];

export default function Header() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('selected_sheet_name');
        setSelectedSheet(saved);

        // Check theme
        const theme = document.documentElement.getAttribute('data-theme');
        setIsDark(theme !== 'light');
    }, [pathname]);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme === 'dark' ? '' : 'light');
        localStorage.setItem('theme', newTheme);
        setIsDark(!isDark);
    };

    // Don't show header on login/setup pages
    if (pathname === '/login' || pathname === '/setup') {
        return null;
    }

    return (
        <header className="header px-6">
            <div className="w-full max-w-7xl mx-auto flex items-center gap-6">
                {/* Logo & Brand - Ink Stamp Style */}
                <Link href="/" className="header-logo group">
                    <span className="font-serif italic text-2xl group-hover:text-[var(--accent-blue)] transition-colors">
                        Sheety<span className="font-light text-[var(--text-secondary)]">CRM</span>
                    </span>
                </Link>

                {/* Navigation Tabs - Typewriter Style */}
                <nav className="header-nav flex items-center gap-1">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`header-nav-item ${pathname === item.href ? 'active border-b-2 border-[var(--accent-blue)] text-[var(--accent-blue)]' : 'border-transparent'}`}
                        >
                            <span className="font-mono tracking-tighter">{item.label.toUpperCase()}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right Side */}
                <div className="header-actions ml-auto flex items-center gap-4">
                    {/* Search */}
                    <div className="w-64">
                        <SearchBar />
                    </div>

                    <div className="h-6 w-px bg-[var(--border-pencil)] mx-2" />

                    {/* Sheet Indicator - Sticky Note Style */}
                    {selectedSheet && (
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${localStorage.getItem('selected_sheet_id')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-[var(--accent-blue)] hover:underline mr-2"
                        >
                            ↗ OPEN
                        </a>
                    )}
                    <Link href="/setup" className="header-sheet-badge font-mono text-xs bg-[var(--accent-yellow)] text-[var(--text-primary)] border border-black/10 px-3 py-1 -rotate-1 hover:-rotate-2 transition-transform shadow-sm" title="Change connected sheet">
                        <span className="font-bold mr-2">SHEET:</span>
                        <span className="border-b border-black/20 dashed">{selectedSheet || 'Select...'}</span>
                    </Link>

                    {/* User Avatar - Ink Circle */}
                    {session?.user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-9 h-9 rounded-full border-2 border-[var(--text-primary)] p-0.5 hover:scale-105 transition-transform bg-white"
                            >
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all"
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center font-serif font-bold bg-[var(--text-primary)] text-white rounded-full">
                                        {session.user.name?.[0] || 'U'}
                                    </span>
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-3 w-56 paper-card z-50 p-2 bg-[var(--bg-card)]">
                                    <div className="px-3 py-2 border-b border-[var(--border-pencil)] mb-2">
                                        <p className="font-serif font-bold text-sm">{session.user.name}</p>
                                        <p className="font-mono text-xs text-[var(--text-secondary)]">{session.user.email}</p>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] font-mono text-xs uppercase"
                                    >
                                        → Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="font-mono text-sm underline decoration-[var(--accent-blue)] decoration-2 underline-offset-4 hover:text-[var(--accent-blue)]">
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
