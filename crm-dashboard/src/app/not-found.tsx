import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-[#F3EFE7] p-6">
            <FileQuestion className="h-10 w-10 text-gray-600" />
          </div>
        </div>

        <h1 className="font-serif text-3xl text-gray-900 mb-3">
          Looks like this sheet is missing
        </h1>

        <p className="text-gray-600 mb-6">
          The page you’re looking for doesn’t exist or was moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
