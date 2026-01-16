'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-paper)] p-4">
            <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[var(--accent)] mb-2">
                        Vinci CRM
                    </h1>
                    <p className="text-[var(--color-ink-muted)]">
                        Sign in to connect your Google Sheets
                    </p>
                </div>

                <div className="py-4">
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-all font-medium shadow-sm hover:shadow-md"
                    >
                        {/* Google Icon */}
                        <svg className="w-5 h-5 bg-white rounded-full p-0.5 text-[var(--accent)]" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-white">Continue with Google</span>
                    </button>
                </div>

                <div className="text-xs text-[var(--color-ink-muted)]">
                    <p>By continuing, you agree to grant access to your Google Sheets.</p>
                    <p className="mt-2">Uses OAuth 2.0 for secure access.</p>
                </div>
            </div>
        </div>
    );
}
