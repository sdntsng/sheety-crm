"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "How does Sheety integrate with Google Sheets?",
    answer:
      "Sheety connects directly to your Google Sheet via OAuth, reading and writing data in real-time without importing or exporting. Simply share your sheet link during setup, and it transforms into a Kanban-style CRM. No coding required.",
  },
  {
    question: "What are the benefits of using Sheety for solopreneurs?",
    answer:
      "Solopreneurs get a lightweight, no-cost CRM that leverages familiar Google Sheets for lead tracking, without the bloat of enterprise tools. It saves time on data entry and keeps everything in one accessible place.",
  },
  {
    question: "Can I customize pipeline stages in Sheety?",
    answer:
      'Yes, you can define custom stages in your Google Sheet (e.g., columns for "Lead," "Qualified," "Closed"), and Sheety automatically reflects them in the Kanban view. Add or rename as needed.',
  },
  {
    question: "How do I get started with Sheety?",
    answer:
      "Sign in with Google, connect your sheet, and you're ready. No installation—it's web-based. Check our quick-start guide for tips on formatting your sheet.",
  },
  {
    question: "Does Sheety support mobile access?",
    answer:
      "Sheety is fully responsive and works on mobile browsers, allowing you to drag deals, log activities, and search leads on the go. No app download needed.",
  },
  {
    question: "How does Sheety compare to Airtable or Notion?",
    answer:
      "Unlike Airtable's proprietary database or Notion's all-in-one workspace, Sheety focuses solely on sales pipelines using your existing Google Sheet. It's simpler, free, and avoids vendor lock-in.",
  },
  {
    question: "What kind of customer support does Sheety offer?",
    answer:
      "As an open-source tool, support comes via our GitHub community, documentation, and email. For hosted versions (coming soon), we'll add priority chat support.",
  },
  {
    question: "Can Sheety be used for project management or non-sales tasks?",
    answer:
      "Absolutely—adapt your sheet for tasks like content pipelines or client onboarding. The Kanban interface works for any columnar workflow in Google Sheets.",
  },
  {
    question: "How does Sheety handle data syncing and backups?",
    answer:
      "Changes sync instantly to your Google Sheet, which handles versioning and backups automatically via Drive. No extra setup needed.",
  },
  {
    question: "Is Sheety suitable for teams larger than tiny ones?",
    answer:
      "While optimized for solopreneurs and small teams, it scales with Google Sheets' sharing features. For larger groups, consider our upcoming enterprise add-ons.",
  },
];

export default function FAQ() {
  // Schema Markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="max-w-4xl mx-auto px-6 mb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-center mb-16">
        <span className="font-mono text-xs text-[var(--color-ink-muted)] uppercase tracking-widest border-b border-[var(--border-pencil)] pb-2 mb-4 inline-block">
          Frequently Asked Questions
        </span>
        <h2 className="font-serif text-3xl md:text-5xl font-bold leading-tight">
          Common Questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`paper-card overflow-hidden transition-all duration-300 ${isOpen ? "bg-white border-[var(--color-ink)]" : "bg-[var(--bg-paper)] border-[var(--border-pencil)] hover:border-[var(--color-ink-muted)]"}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex gap-4">
          <span className="font-mono text-[var(--color-ink-muted)] opacity-50 text-sm pt-1">
            0{index + 1}
          </span>
          <h3
            className={`font-bold text-lg md:text-xl font-serif transition-colors ${isOpen ? "text-[var(--accent)]" : "text-[var(--color-ink)] group-hover:text-[var(--text-secondary)]"}`}
          >
            {question}
          </h3>
        </div>

        <div
          className={`relative w-8 h-8 rounded-full border border-[var(--border-pencil)] flex items-center justify-center transition-all bg-white ${isOpen ? "rotate-90 border-[var(--accent)] text-[var(--accent)]" : "text-[var(--color-ink-muted)]"}`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pl-[3.5rem] pr-8">
              <p className="text-[var(--color-ink-muted)] leading-relaxed border-l-2 border-[var(--border-pencil)] pl-4">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
