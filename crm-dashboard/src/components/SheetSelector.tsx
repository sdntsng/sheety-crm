"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSheet } from "@/lib/api";
import useDrivePicker from "react-google-drive-picker";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import SheetyIcon from "./icons/SheetyIcon";

interface Sheet {
  id: string;
  name: string;
}

interface SheetSelectorProps {
  onSheetSelected?: (sheet: Sheet) => void;
}

export default function SheetSelector({ onSheetSelected }: SheetSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [openPicker] = useDrivePicker();

  // State
  const [creating, setCreating] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPicker = () => {
    const token = (session as { accessToken?: string } | null)?.accessToken;

    if (!token) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    openPicker({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      developerKey: "",
      viewId: "SPREADSHEETS",
      token: token,
      showUploadView: false,
      supportDrives: true,
      multiselect: false,
      callbackFunction: (data) => {
        if (data.action === "picked") {
          const doc = data.docs[0];
          handleSelect({ id: doc.id, name: doc.name });
        }
      },
    });
  };

  const handleSelect = (sheet: Sheet) => {
    localStorage.setItem("selected_sheet_id", sheet.id);
    localStorage.setItem("selected_sheet_name", sheet.name);

    if (onSheetSelected) {
      onSheetSelected(sheet);
    } else {
      // Default behavior if used as a page
      window.location.reload();
    }
  };

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createSheet(newSheetName.trim());
      if (result.success && result.sheet) {
        const sheet = {
          id: result.sheet.id,
          name: result.sheet.name,
        };
        handleSelect(sheet);
      }
    } catch (err) {
      setError("Failed to create sheet. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[var(--bg-paper)]">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12 text-center animate-fade-in-up">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.05)] border-2 border-[var(--border-pencil)] mb-6 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-paper)] to-transparent opacity-50"></div>
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <SheetyIcon className="w-14 h-14 text-[var(--accent)] relative z-10 drop-shadow-sm" />
          </motion.div>
        </motion.div>
        <h1 className="text-4xl font-sans font-bold text-[var(--color-ink)] mb-4 tracking-tight">
          Choose Your Database
        </h1>
        <p className="text-[var(--color-ink-muted)] text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Connect Sheety to a Google Sheet. Select an existing one from your
          Drive or let us create a optimized template for you.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        {/* 1. Pick from Drive */}
        <button
          onClick={handleOpenPicker}
          className="group relative flex flex-col p-8 rounded-2xl border border-[var(--border-color)] bg-white hover:border-[var(--accent)] hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="absolute top-6 right-6 text-[var(--border-strong)] group-hover:text-[var(--accent)] transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
            📂
          </div>

          <h3 className="font-bold text-[var(--color-ink)] text-xl mb-2 group-hover:text-blue-600 transition-colors">
            Select from Drive
          </h3>
          <p className="text-[var(--color-ink-muted)] leading-relaxed">
            Already have a sheet? Open the Google Picker to select any
            spreadsheet from your Google Drive.
          </p>
        </button>

        {/* 2. Create New */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="group relative flex flex-col p-8 rounded-2xl border border-[var(--border-color)] bg-white hover:border-[var(--accent)] hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="absolute top-6 right-6 text-[var(--border-strong)] group-hover:text-[var(--accent)] transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
              ✨
            </div>

            <h3 className="font-bold text-[var(--color-ink)] text-xl mb-2 group-hover:text-purple-600 transition-colors">
              Create New CRM
            </h3>
            <p className="text-[var(--color-ink-muted)] leading-relaxed">
              Start fresh. We'll create a new spreadsheet with the perfect
              schema for Leads, Opportunities, and Activities.
            </p>
          </button>
        ) : (
          <div className="relative flex flex-col p-8 rounded-2xl border-2 border-[var(--accent)] bg-[var(--bg-surface)] shadow-lg animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center text-3xl mb-6">
              ✏️
            </div>
            <h3 className="font-bold text-[var(--color-ink)] text-xl mb-4">
              Name your new sheet
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="e.g. Sales Pipeline 2026"
                autoFocus
                className="w-full px-5 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] focus:outline-none text-lg transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateSheet}
                  disabled={creating || !newSheetName.trim()}
                  className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {creating ? "Creating..." : "Create Sheet"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 rounded-xl border border-[var(--border-color)] hover:bg-gray-50 text-[var(--color-ink-muted)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Templates */}
      <div className="max-w-md mx-auto mt-12 text-center">
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          Need manual setup?
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <a
            href="/templates/leads.csv"
            className="text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Leads Template
          </a>
          <a
            href="/templates/opps.csv"
            className="text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Opps Template
          </a>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-red-white border border-red-200 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-in text-red-600 bg-white">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
