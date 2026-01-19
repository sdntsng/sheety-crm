'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    hiddenStages: string[];
    hiddenStatuses: string[];
    toggleStage: (stage: string) => void;
    toggleStatus: (status: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [hiddenStages, setHiddenStages] = useState<string[]>([]);
    const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedStages = localStorage.getItem('crm_settings_hidden_stages');
        const savedStatuses = localStorage.getItem('crm_settings_hidden_statuses');

        if (savedStages) {
            try { setHiddenStages(JSON.parse(savedStages)); } catch (e) { console.error('Failed to parse hidden stages', e); }
        }
        if (savedStatuses) {
            try { setHiddenStatuses(JSON.parse(savedStatuses)); } catch (e) { console.error('Failed to parse hidden statuses', e); }
        }
        setLoaded(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('crm_settings_hidden_stages', JSON.stringify(hiddenStages));
    }, [hiddenStages, loaded]);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('crm_settings_hidden_statuses', JSON.stringify(hiddenStatuses));
    }, [hiddenStatuses, loaded]);

    const toggleStage = (stage: string) => {
        setHiddenStages(prev =>
            prev.includes(stage)
                ? prev.filter(s => s !== stage)
                : [...prev, stage]
        );
    };

    const toggleStatus = (status: string) => {
        setHiddenStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    return (
        <SettingsContext.Provider value={{ hiddenStages, hiddenStatuses, toggleStage, toggleStatus }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
