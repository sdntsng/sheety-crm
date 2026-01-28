"use client";

import { Shortcut } from "@/providers/KeyboardShortcutsContext";
import { useEffect } from "react";

interface ShortcutsHelpModalProps {
  onClose: () => void;
  shortcuts: Shortcut[];
}

export default function ShortcutsHelpModal({
  onClose,
  shortcuts,
}: ShortcutsHelpModalProps) {
  // Close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Group shortcuts by section
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const section = shortcut.section || "General";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[8px_8px_0px_rgba(0,0,0,0.15)] w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--accent-red)] font-sans font-bold text-xl leading-none z-10"
        >
          ×
        </button>

        <div className="p-8">
          <h2 className="font-sans font-bold text-2xl text-[var(--text-primary)] mb-6 border-b-4 border-[var(--nav-item-active)] inline-block">
            Keyboard Shortcuts
          </h2>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([section, items]) => (
              <div key={section}>
                <h3 className="font-mono text-xs font-bold uppercase text-[var(--text-muted)] mb-3 tracking-wider">
                  {section}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between group"
                    >
                      <span className="text-sm font-sans font-medium text-[var(--text-primary)]">
                        {shortcut.description}
                      </span>
                      <div className="flex gap-1">
                        <kbd className="min-w-[24px] h-6 px-1.5 flex items-center justify-center font-mono text-xs font-bold bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded shadow-[1px_1px_0px_rgba(0,0,0,0.1)] text-[var(--text-secondary)] group-hover:border-[var(--accent-blue)] group-hover:text-[var(--accent-blue)] transition-colors">
                          {shortcut.key === " "
                            ? "Space"
                            : shortcut.key.toUpperCase()}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--border-pencil)] text-center">
            <p className="font-mono text-xs text-[var(--text-muted)]">
              Press <span className="font-bold">?</span> to toggle this menu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
