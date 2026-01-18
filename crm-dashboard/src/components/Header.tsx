'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import SearchBar from './SearchBar';

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
    { href: '/', label: 'Dashboard', icon: DashboardIcon },
    { href: '/pipeline', label: 'Pipeline', icon: PipelineIcon },
    { href: '/leads', label: 'Leads', icon: LeadsIcon },
];

// Sheety Logo Icon
export const SheetyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        {/* Spreadsheet Grid */}
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

export default function Header() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [imgError, setImgError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isAuthenticated = status === 'authenticated';

    useEffect(() => {
        if (isAuthenticated) {
            const saved = localStorage.getItem('selected_sheet_name');
            setSelectedSheet(saved);
        } else {
            setSelectedSheet(null);
        }
    }, [pathname, isAuthenticated]);

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

                    {/* Sheet Indicator - Only when authenticated and sheet selected */}
                    {isAuthenticated && selectedSheet && (
                        <>
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${localStorage.getItem('selected_sheet_id')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-[var(--accent-blue)] hover:underline mr-2 flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                OPEN
                            </a>
                            <Link href="/setup" className="header-sheet-badge font-mono text-xs bg-[var(--accent-yellow)] text-[var(--text-primary)] border border-black/10 px-3 py-1 -rotate-1 hover:-rotate-2 transition-transform shadow-sm" title="Change connected sheet">
                                <span className="font-bold mr-2">SHEET:</span>
                                <span className="border-b border-black/20 dashed">{selectedSheet}</span>
                            </Link>
                        </>
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
