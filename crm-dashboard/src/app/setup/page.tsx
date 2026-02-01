"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSheet, addSchemaToSheet } from "@/lib/api";
import { useSession } from "next-auth/react";
import useDrivePicker from "react-google-drive-picker";
import { motion } from "framer-motion";
import SheetyIcon from "@/components/icons/SheetyIcon";

interface Sheet {
  id: string;
  name: string;
}

export default function SetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Get status to check loading/unauth
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

  const handleOpenSchemaPicker = () => {
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
      callbackFunction: async (data) => {
        if (data.action === "picked") {
          const doc = data.docs[0];
          setCreating(true); // Re-use blocking state
          try {
            await addSchemaToSheet(doc.id);
            alert("Schema sheet added successfully!");
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Failed to add schema sheet";
            setError(message);
          } finally {
            setCreating(false);
          }
        }
      },
    });
  };

  const handleSelect = (sheet: Sheet) => {
    localStorage.setItem("selected_sheet_id", sheet.id);
    localStorage.setItem("selected_sheet_name", sheet.name);
    setTimeout(() => router.push("/"), 500);
  };

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createSheet(newSheetName.trim());
      if (result.success && result.sheet) {
        localStorage.setItem("selected_sheet_id", result.sheet.id);
        localStorage.setItem("selected_sheet_name", result.sheet.name);
        setNewSheetName("");
        router.push("/");
      }
    } catch (err) {
      setError("Failed to create sheet. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // Unauthenticated State
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--bg-paper)]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-6 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-sans font-bold text-[var(--color-ink)] mb-3">
            Authentication Required
          </h1>
          <p className="text-[var(--color-ink-muted)] mb-8">
            You need to sign in with Google to access your sheets.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-all shadow-sm hover:shadow-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-paper)] text-[var(--color-ink-muted)]">
        Loading...
      </div>
    );
  }

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

          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] text-[var(--color-ink)] border border-[var(--border-pencil)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent-blue)]/10 group-hover:border-[var(--accent-blue)] group-hover:text-[var(--accent-blue)] transition-all duration-300">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>

          <h3 className="font-bold text-[var(--color-ink)] text-xl mb-2 group-hover:text-[var(--accent-blue)] transition-colors">
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

            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] text-[var(--color-ink)] border border-[var(--border-pencil)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent)]/10 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-all duration-300">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h3 className="font-bold text-[var(--color-ink)] text-xl mb-2 group-hover:text-[var(--accent)] transition-colors">
              Create New CRM
            </h3>
            <p className="text-[var(--color-ink-muted)] leading-relaxed">
              Start fresh. We'll create a new spreadsheet with the perfect
              schema for Leads, Opportunities, and Activities.
            </p>
          </button>
        ) : (
          <div className="relative flex flex-col p-8 rounded-2xl border-2 border-[var(--accent)] bg-[var(--bg-surface)] shadow-lg animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)] flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
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

      {/* Footer / Templates / Manual Setup */}
      <div className="max-w-xl mx-auto mt-16 text-center border-t border-[var(--border-color)] pt-8">
        <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">
          Manual Setup Options
        </h3>

        <div className="bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded-xl p-6 text-left mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-yellow)]"></div>
          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            Use Master Template
          </h4>
          <p className="text-xs text-[var(--color-ink-muted)] mb-3 leading-relaxed">
            1. Open our read-only template sheet.
            <br />
            2. Click <strong>File &gt; Make a copy</strong> to save it to your
            Drive.
            <br />
            3. Come back here and "Select from Drive".
          </p>
          <a
            href="https://docs.google.com/spreadsheets/d/1bpkIwtKbDy7E0rwFoOMGWwNtuvHv0Wb-codfvGwMNQ0/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--border-color)] rounded-lg text-xs font-medium hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-sm"
          >
            <span>Open Template Sheet</span>
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <p className="text-xs text-[var(--color-ink-muted)] mb-3">
          Or download raw CSV schemas:
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <a
            href="/templates/leads.csv"
            className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-strong)] text-[var(--color-ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3 h-3"
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
            Leads.csv
          </a>
          <a
            href="/templates/opps.csv"
            className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-strong)] text-[var(--color-ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3 h-3"
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
            Opps.csv
          </a>
        </div>
      </div>

      {/* Tools */}
      <div className="max-w-xl mx-auto mt-8 text-center pt-8 border-t border-[var(--border-color)]">
        <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">
          Tools & Troubleshooting
        </h3>
        <button
          onClick={handleOpenSchemaPicker}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border-color)] rounded-lg text-sm font-medium hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-sm disabled:opacity-50"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Add Schema Sheet to Existing CRM
        </button>
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
