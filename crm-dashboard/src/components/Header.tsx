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
        <header className="header">
            <div className="header-content">
                {/* Logo & Brand */}
                <Link href="/" className="header-logo">
                    <span className="header-logo-icon">📋</span>
                    <span className="header-logo-text">SheetyCRM</span>
                </Link>

                {/* Navigation Tabs */}
                <nav className="header-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`header-nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            <span className="header-nav-icon">{item.icon}</span>
                            <span className="header-nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right Side */}
                <div className="header-actions">
                    {/* Search */}
                    <SearchBar />

                    {/* Sheet Indicator */}
                    <Link href="/setup" className="header-sheet-badge" title="Change connected sheet">
                        <span className="header-sheet-icon">📄</span>
                        <span className="header-sheet-name">{selectedSheet || 'Select Sheet'}</span>
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="header-icon-btn"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>

                    {/* User Menu */}
                    {session?.user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="header-avatar"
                            >
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="header-avatar-img"
                                    />
                                ) : (
                                    <span className="header-avatar-fallback">
                                        {session.user.name?.[0] || 'U'}
                                    </span>
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="header-dropdown">
                                    <div className="header-dropdown-header">
                                        <p className="header-dropdown-name">{session.user.name}</p>
                                        <p className="header-dropdown-email">{session.user.email}</p>
                                    </div>
                                    <div className="header-dropdown-divider" />
                                    <button
                                        onClick={() => signOut()}
                                        className="header-dropdown-item"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="header-signin-btn">
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
