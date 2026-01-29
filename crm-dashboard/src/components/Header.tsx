"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import SearchBar from "./SearchBar";
import SheetyIcon from "./icons/SheetyIcon";

// Flat SVG Icons
const DashboardIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PipelineIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path d="M4 6h16M4 12h12M4 18h8" strokeLinecap="round" />
  </svg>
);

const LeadsIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <circle cx="17" cy="11" r="3" />
    <path d="M21 21v-1a3 3 0 0 0-2-2.83" />
  </svg>
);

const GuideIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CompareIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/pipeline", label: "Pipeline", icon: PipelineIcon },
  { href: "/leads", label: "Leads", icon: LeadsIcon },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSheetMenu, setShowSheetMenu] = useState(false);
  const [showCompareMenu, setShowCompareMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sheetMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (isAuthenticated) {
      const saved = localStorage.getItem("selected_sheet_name");
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
      if (
        sheetMenuRef.current &&
        !sheetMenuRef.current.contains(e.target as Node)
      ) {
        setShowSheetMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Don't show header on login page
  if (pathname === "/login") {
    return null;
  }

  // For unauthenticated users, show the public header everywhere
  if (!isAuthenticated) {
    return (
      <header className="header px-6 py-4">
        <div className="w-full max-w-7xl mx-auto flex items-center">
          <Link href="/" className="header-logo group flex items-center gap-2">
            <SheetyIcon className="w-6 h-6 text-[var(--text-primary)]" />
            <span className="font-sans italic text-2xl group-hover:text-[var(--accent-blue)] transition-colors">
              Sheety
            </span>
          </Link>

          {/* Public Nav */}
          <nav className="hidden md:flex items-center gap-8 relative ml-auto mr-8">
            <Link
              href="/blog?category=Guide"
              className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <GuideIcon />
              <span>How-To</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowCompareMenu(!showCompareMenu)}
                className="font-mono text-sm uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
              >
                <CompareIcon />
                Compare
                <svg
                  className={`w-3 h-3 transition-transform ${showCompareMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showCompareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCompareMenu(false)}
                  />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-pencil)] shadow-floating rounded-xl py-2 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { name: "HubSpot", slug: "hubspot" },
                      { name: "Airtable", slug: "airtable" },
                      { name: "Streak", slug: "streak" },
                      { name: "Pipedrive", slug: "pipedrive" },
                      { name: "Close", slug: "close" },
                      { name: "Attio", slug: "attio" },
                      { name: "Folk", slug: "folk" },
                    ].map((brand) => (
                      <Link
                        key={brand.slug}
                        href={`/compare/${brand.slug}`}
                        className="px-4 py-2 text-sm font-sans text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--bg-hover)] transition-colors text-center whitespace-nowrap"
                        onClick={() => setShowCompareMenu(false)}
                      >
                        vs {brand.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

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

        {/* Navigation Tabs - Desktop */}
        {isAuthenticated && (
          <nav className="header-nav hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`header-nav-item flex items-center gap-2 ${pathname === item.href ? "active border-b-2 border-[var(--accent-blue)] text-[var(--accent-blue)]" : "border-transparent"}`}
                >
                  <Icon />
                  <span className="font-mono tracking-tighter">
                    {item.label.toUpperCase()}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Side - Actions */}
        <div className="header-actions ml-auto flex items-center gap-2 md:gap-4">
          {/* Search - only when authenticated, hide on mobile to save space */}
          {isAuthenticated && (
            <>
              <div className="hidden md:block w-64">
                <SearchBar />
              </div>
              <div className="h-6 w-px bg-[var(--border-pencil)] mx-2" />

              {/* Settings Link */}
              <Link
                href="/settings"
                className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
                title="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </>
          )}

          {/* Sheet Indicator - Click to toggle menu */}
          {isAuthenticated && selectedSheet && (
            <div className="relative" ref={sheetMenuRef}>
              <button
                onClick={() => setShowSheetMenu(!showSheetMenu)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[var(--accent-yellow)]/20 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                title={selectedSheet}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <svg
                  className={`w-3 h-3 transition-transform ${showSheetMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Sheet Menu - Modal */}
              {showSheetMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/40 z-[999]"
                    onClick={() => setShowSheetMenu(false)}
                  />

                  <div
                    className="bg-[var(--bg-card)] border border-[var(--border-pencil)] rounded-xl shadow-xl py-3 z-[1000]"
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, 0)",
                      width: "calc(100% - 2rem)",
                      maxWidth: "280px",
                    }}
                  >
                    {/* Sheet Name Header */}
                    <div className="px-4 py-2 border-b border-[var(--border-pencil)]/30 mb-1">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
                        Active Sheet
                      </p>
                      <p
                        className="font-mono text-sm font-bold truncate text-[var(--color-ink)]"
                        title={selectedSheet}
                      >
                        {selectedSheet}
                      </p>
                    </div>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${localStorage.getItem("selected_sheet_id")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowSheetMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-paper)] transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--accent-blue)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="15 3 21 3 21 9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="10"
                          y1="14"
                          x2="21"
                          y2="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Open in Sheets</span>
                    </a>
                    <Link
                      href="/setup"
                      onClick={() => setShowSheetMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--bg-paper)] transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--color-ink-muted)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Change Sheet</span>
                    </Link>
                  </div>
                </>
              )}
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
                    alt={session.user.name || "User"}
                    className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-sans font-bold bg-[var(--text-primary)] text-white rounded-full">
                    {session.user.name?.[0] || "U"}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/40 z-[999]"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Modal - using inline style for guaranteed centering */}
                  <div
                    className="bg-[var(--bg-card)] border border-[var(--border-pencil)] rounded-xl shadow-xl p-4 z-[1000]"
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, 0)",
                      width: "calc(100% - 2rem)",
                      maxWidth: "280px",
                    }}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-pencil)] mb-2">
                      <p className="font-sans font-bold text-sm">
                        {session.user.name}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-secondary)]">
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] font-mono text-xs uppercase flex items-center gap-2 rounded"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="16 17 21 12 16 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="21"
                          y1="12"
                          x2="9"
                          y2="12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </>
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

        {/* Mobile Menu Button */}
        {/* Mobile Menu Button Removed for Bottom Nav */}

        {/* Mobile Menu Overlay */}
      </div>
    </header>
  );
}
