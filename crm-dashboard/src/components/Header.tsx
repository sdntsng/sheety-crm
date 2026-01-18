'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import SearchBar from './SearchBar';
import SheetyIcon from './icons/SheetyIcon';

// Flat SVG Icons
const DashboardIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const PipelineIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h12M4 18h8" strokeLinecap="round" />
    </svg>
);

const LeadsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="17" cy="11" r="3" />
        <path d="M21 21v-1a3 3 0 0 0-2-2.83" />
    </svg>
);

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/pipeline', label: 'Pipeline', icon: PipelineIcon },
    { href: '/leads', label: 'Leads', icon: LeadsIcon },
];



export default function Header() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSheetMenu, setShowSheetMenu] = useState(false);
    const [imgError, setImgError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const sheetMenuRef = useRef<HTMLDivElement>(null);

    const isAuthenticated = status === 'authenticated';

    useEffect(() => {
        if (isAuthenticated) {
            const saved = localStorage.getItem('selected_sheet_name');
            setSelectedSheet(saved);
        } else {
            setSelectedSheet(null);
        }
    }, [pathname, isAuthenticated]);

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
            if (sheetMenuRef.current && !sheetMenuRef.current.contains(e.target as Node)) {
                setShowSheetMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Don't show header on login page or landing (when unauthenticated at root)
    if (pathname === '/login') {
        return null;
    }

    // For unauthenticated users on the landing page, show a simpler header
    if (!isAuthenticated && pathname === '/') {
        return (
            <header className="header px-6 py-4">
                <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="header-logo group flex items-center gap-2">
                        <SheetyIcon className="w-6 h-6 text-[var(--text-primary)]" />
                        <span className="font-sans italic text-2xl group-hover:text-[var(--accent-blue)] transition-colors">
                            Sheety
                        </span>
                    </Link>
                    <Link
                        href="/login"
                        className="px-5 py-2 bg-[var(--text-primary)] text-white font-mono text-sm rounded-full hover:bg-[var(--accent-blue)] transition-colors shadow-sm"
                    >
                        Sign In
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className="header px-6">
            <div className="w-full max-w-7xl mx-auto flex items-center gap-6">
                {/* Logo & Brand */}
                <Link href="/" className="header-logo group flex items-center gap-2">
                    <SheetyIcon className="w-5 h-5 text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors" />
                    <span className="font-sans italic text-2xl group-hover:text-[var(--accent-blue)] transition-colors">
                        Sheety
                    </span>
                </Link>

                {/* Navigation Tabs */}
                {isAuthenticated && (
                    <nav className="header-nav flex items-center gap-1">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`header-nav-item flex items-center gap-2 ${pathname === item.href ? 'active border-b-2 border-[var(--accent-blue)] text-[var(--accent-blue)]' : 'border-transparent'}`}
                                >
                                    <Icon />
                                    <span className="font-mono tracking-tighter">{item.label.toUpperCase()}</span>
                                </Link>
                            );
                        })}
                    </nav>
                )}

                {/* Right Side */}
                <div className="header-actions ml-auto flex items-center gap-4">
                    {/* Search - only when authenticated */}
                    {isAuthenticated && (
                        <>
                            <div className="w-64">
                                <SearchBar />
                            </div>
                            <div className="h-6 w-px bg-[var(--border-pencil)] mx-2" />
                        </>
                    )}

                    {/* Sheet Indicator - Dropdown with Open/Change */}
                    {isAuthenticated && selectedSheet && (
                        <div className="relative group" ref={sheetMenuRef}>
                            <div
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[var(--accent-yellow)]/20 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                                title={selectedSheet}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <svg className="w-3 h-3 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {/* Sheet Dropdown - Show on Group Hover */}
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[var(--border-pencil)] rounded-xl shadow-lg py-2 z-50 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                                {/* Sheet Name Header */}
                                <div className="px-4 py-2 border-b border-[var(--border-pencil)]/30 mb-1">
                                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">Active Sheet</p>
                                    <p className="font-mono text-sm font-bold truncate text-[var(--color-ink)]" title={selectedSheet}>
                                        {selectedSheet}
                                    </p>
                                </div>
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${localStorage.getItem('selected_sheet_id')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShowSheetMenu(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-paper)] transition-colors"
                                >
                                    <svg className="w-4 h-4 text-[var(--accent-blue)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Open in Sheets</span>
                                </a>
                                <Link
                                    href="/setup"
                                    onClick={() => setShowSheetMenu(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-paper)] transition-colors"
                                >
                                    <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Change Sheet</span>
                                </Link>
                            </div>

                        </div>
                    )}

                    {/* User Avatar */}
                    {session?.user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-9 h-9 rounded-full border-2 border-[var(--text-primary)] p-0.5 hover:scale-105 transition-transform bg-white overflow-hidden"
                            >
                                {session.user.image && !imgError ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center font-sans font-bold bg-[var(--text-primary)] text-white rounded-full">
                                        {session.user.name?.[0] || 'U'}
                                    </span>
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-3 w-56 paper-card z-50 p-2 bg-[var(--bg-card)]">
                                    <div className="px-3 py-2 border-b border-[var(--border-pencil)] mb-2">
                                        <p className="font-sans font-bold text-sm">{session.user.name}</p>
                                        <p className="font-mono text-xs text-[var(--text-secondary)]">{session.user.email}</p>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] font-mono text-xs uppercase flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                                            <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-5 py-2 bg-[var(--text-primary)] text-white font-mono text-sm rounded-full hover:bg-[var(--accent-blue)] transition-colors shadow-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
