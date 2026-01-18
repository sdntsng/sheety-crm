export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="font-serif text-4xl font-bold mb-8 text-[var(--color-ink)]">Terms of Service</h1>
            <div className="prose prose-stone font-serif text-[var(--color-ink-muted)]">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h3>1. Terms</h3>
                <p>
                    By accessing the website at Sheety, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                </p>

                <h3>2. Use License</h3>
                <p>
                    Permission is granted to temporarily download one copy of the materials (information or software) on Sheety's website for personal, non-commercial transitory viewing only.
                </p>
                <p>
                    Since this is an Open Source project, you are free to fork, modify, and distribute the code under the terms of the included license (MIT).
                </p>

                <h3>3. Disclaimer</h3>
                <p>
                    The materials on Sheety's website are provided on an 'as is' basis. Sheety makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>

                <h3>4. Limitations</h3>
                <p>
                    In no event shall Sheety or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Sheety's website.
                </p>
            </div>
        </div>
    );
}
