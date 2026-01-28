"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

// Icons
const DashboardIcon = () => (
  <svg
    className="w-6 h-6"
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
    className="w-6 h-6"
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
    className="w-6 h-6"
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

const SettingsIcon = () => (
  <svg
    className="w-6 h-6"
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
);

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  // Hide if not authenticated or on login page
  if (status !== "authenticated" || pathname === "/login" || pathname === "/") {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { href: "/pipeline", label: "Pipeline", icon: PipelineIcon },
    { href: "/leads", label: "Leads", icon: LeadsIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] md:hidden pb-safe pointer-events-auto">
      <div className="bg-[var(--bg-paper)] border-t border-[var(--border-ink)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-6 pb-4 pt-2 flex justify-between items-end backdrop-blur-lg bg-opacity-95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-200 ${
                isActive
                  ? "text-[var(--accent-blue)] -translate-y-1"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${isActive ? "bg-[var(--accent-blue)]/10" : ""}`}
              >
                <Icon />
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider ${isActive ? "font-bold" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
