'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  website: string;
  message: string;
};

const initialState: ContactFormState = {
  name: '',
  email: '',
  company: '',
  phone: '',
  website: '',
  message: '',
};

export default function ContactFormPage() {
  const [formState, setFormState] = useState<ContactFormState>(initialState);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') {
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/leads/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company || undefined,
          phone: formState.phone || undefined,
          website: formState.website || undefined,
          message: formState.message || undefined,
        }),
      });

      if (!response.ok) {
        let message = 'Submission failed. Please try again.';
        if (response.status === 429) {
          message = 'Too many submissions. Please try again later.';
        } else {
          try {
            const payload = await response.json();
            if (payload && payload.detail) {
              message = String(payload.detail);
            }
          } catch {
            const text = await response.text();
            if (text) {
              message = text;
            }
          }
        }
        throw new Error(message);
      }

      setFormState(initialState);
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Submission failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="font-sans italic text-3xl text-[var(--text-primary)]">
            Sheety
          </Link>
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Lead Capture
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
          <div className="space-y-6">
            <div className="border-b-4 border-[var(--text-primary)] pb-4">
              <h1 className="text-4xl md:text-5xl font-sans font-bold">
                Capture qualified leads in one place
              </h1>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] mt-3">
                Powered by your Google Sheets CRM
              </p>
            </div>

            <p className="font-sans text-base leading-relaxed text-[var(--text-secondary)]">
              Submit the form and the lead lands directly in Sheety CRM with full context. Use this page for
              website inbound, campaign forms, and partner referrals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Instant CRM capture',
                'Custom field support',
                'Audit and activity history',
                'Works with existing sheets',
              ].map((item) => (
                <div
                  key={item}
                  className="paper-card p-4 bg-white border border-[var(--border-pencil)] shadow-[4px_4px_0_rgba(0,0,0,0.08)]"
                >
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="paper-card p-5 bg-white border-2 border-[var(--border-ink)] shadow-[6px_6px_0_rgba(0,0,0,0.1)]">
              <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-2">
                What happens next
              </p>
              <ol className="font-sans text-sm text-[var(--text-primary)] space-y-2">
                <li>1. Lead is added to the pipeline</li>
                <li>2. Owner and tasks can be assigned</li>
                <li>3. Automated workflows kick in</li>
              </ol>
            </div>
          </div>

          <div className="paper-card p-6 bg-white border-2 border-[var(--border-ink)] shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <h2 className="font-sans font-bold text-2xl mb-2">Contact Sales</h2>
            <p className="font-mono text-xs uppercase text-[var(--text-secondary)] mb-6">
              Send details and we will follow up fast.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Full name</span>
                <input
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  value={formState.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Work email</span>
                <input
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Company</span>
                <input
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  value={formState.company}
                  onChange={(event) => updateField('company', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Phone</span>
                <input
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  value={formState.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Website</span>
                <input
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  value={formState.website}
                  onChange={(event) => updateField('website', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">Message</span>
                <textarea
                  className="mt-2 w-full px-3 py-2 border border-[var(--border-pencil)] font-sans"
                  rows={4}
                  value={formState.message}
                  onChange={(event) => updateField('message', event.target.value)}
                />
              </label>

              {status === 'success' && (
                <div className="border border-green-500 bg-green-50 text-green-700 p-3 font-mono text-xs">
                  Lead captured successfully. Our team will respond soon.
                </div>
              )}

              {status === 'error' && error && (
                <div className="border border-red-500 bg-red-50 text-red-700 p-3 font-mono text-xs">
                  {error}
                </div>
              )}

              <button
                className="btn-primary w-full"
                type="submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit lead'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
