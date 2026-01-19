'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import ShortcutsHelpModal from '@/components/modals/ShortcutsHelpModal';

export interface Shortcut {
    key: string;
    description: string;
    section?: string; // e.g., 'General', 'Navigation', 'Actions'
}

interface KeyboardShortcutsContextType {
    registerShortcut: (shortcut: Shortcut) => void;
    unregisterShortcut: (key: string) => void;
    toggleHelpModal: () => void;
    isHelpModalOpen: boolean;
    shortcuts: Shortcut[];
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const registerShortcut = useCallback((newShortcut: Shortcut) => {
        setShortcuts(prev => {
            // Avoid duplicates
            if (prev.some(s => s.key === newShortcut.key)) {
                return prev;
            }
            return [...prev, newShortcut];
        });
    }, []);

    const unregisterShortcut = useCallback((key: string) => {
        setShortcuts(prev => prev.filter(s => s.key !== key));
    }, []);

    const toggleHelpModal = useCallback(() => {
        setIsHelpModalOpen(prev => !prev);
    }, []);

    // Global listener for Help (?)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for '?' (Shift + /)
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                e.preventDefault();
                setIsHelpModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <KeyboardShortcutsContext.Provider
            value={{
                registerShortcut,
                unregisterShortcut,
                toggleHelpModal,
                isHelpModalOpen,
                shortcuts
            }}
        >
            {children}
            {isHelpModalOpen && <ShortcutsHelpModal onClose={() => setIsHelpModalOpen(false)} shortcuts={shortcuts} />}
        </KeyboardShortcutsContext.Provider>
    );
}

export function useKeyboardShortcutsContext() {
    const context = useContext(KeyboardShortcutsContext);
    if (context === undefined) {
        throw new Error('useKeyboardShortcutsContext must be used within a KeyboardShortcutsProvider');
    }
    return context;
}
