"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextType {
  hiddenStages: string[];
  hiddenStatuses: string[];
  toggleStage: (stage: string) => void;
  toggleStatus: (status: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const readStored = (key: string) => {
    if (typeof window === "undefined") return [] as string[];
    const stored = localStorage.getItem(key);
    if (!stored) return [] as string[];
    try {
      return JSON.parse(stored) as string[];
    } catch (e) {
      console.error(`Failed to parse ${key}`, e);
      return [] as string[];
    }
  };

  const [hiddenStages, setHiddenStages] = useState<string[]>(() =>
    readStored("crm_settings_hidden_stages"),
  );
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>(() =>
    readStored("crm_settings_hidden_statuses"),
  );

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      "crm_settings_hidden_stages",
      JSON.stringify(hiddenStages),
    );
  }, [hiddenStages]);

  useEffect(() => {
    localStorage.setItem(
      "crm_settings_hidden_statuses",
      JSON.stringify(hiddenStatuses),
    );
  }, [hiddenStatuses]);

  const toggleStage = (stage: string) => {
    setHiddenStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };

  const toggleStatus = (status: string) => {
    setHiddenStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  return (
    <SettingsContext.Provider
      value={{ hiddenStages, hiddenStatuses, toggleStage, toggleStatus }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
