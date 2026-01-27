import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-[var(--bg-hover)] p-6 border-2 border-[var(--border-pencil)]">
            <FileQuestion className="h-10 w-10 text-[var(--text-secondary)]" />
          </div>
        </div>

        <h1 className="font-sans text-3xl text-[var(--text-primary)] mb-3">
          Looks like this sheet is missing
        </h1>

        <p className="text-[var(--text-secondary)] mb-6 font-mono">
          The page you’re looking for doesn’t exist or was moved.
        </p>

        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
