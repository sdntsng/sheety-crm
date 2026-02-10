'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string | null>(null);

    useEffect(() => {
        // Check local storage or system preference
        const stored = localStorage.getItem('theme');
        let initialTheme: string;
        if (stored) {
            initialTheme = stored;
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            initialTheme = prefersDark ? 'dark' : 'light';
        }
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        if (!theme) return; // Guard against null theme
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
    }, [theme]);

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input field
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable) {
                return;
            }
            
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleTheme();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleTheme]);

    if (!theme) return null;

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-transparent hover:bg-[var(--bg-hover)] transition-all duration-200 text-[var(--color-ink-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-pencil)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (⌘K)`}
        >
            {theme === 'dark' ? (
                // Sun Icon - Animated
                <svg 
                    className="w-5 h-5 transition-transform duration-300 hover:rotate-45" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon - Animated
                <svg 
                    className="w-5 h-5 transition-transform duration-300 hover:rotate-12" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
