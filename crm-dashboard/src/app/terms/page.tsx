export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="font-serif text-4xl font-bold mb-4 text-[var(--color-ink)]">Terms of Service</h1>
            <p className="text-sm text-[var(--color-ink-muted)] mb-8">Last updated: January 18, 2026</p>

            <div className="prose prose-stone max-w-none space-y-6 text-[var(--color-ink-muted)]">
                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using Sheety (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                        If you disagree with any part of these terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">2. Description of Service</h2>
                    <p>
                        Sheety is an open-source application that provides a CRM interface for Google Sheets.
                        The Service allows you to view and manage data stored in your own Google Sheets through a user-friendly interface.
                    </p>
                    <div className="bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded-lg p-4 mt-4">
                        <p className="font-medium text-[var(--color-ink)]">Important:</p>
                        <p className="text-sm mt-1">Sheety does not store your CRM data. All data remains in your Google Sheet under your full control.</p>
                    </div>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">3. User Accounts</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You must authenticate using a valid Google account</li>
                        <li>You are responsible for maintaining the security of your Google account</li>
                        <li>You must not share your access or allow unauthorized use</li>
                        <li>You must be at least 13 years old (or the minimum age in your jurisdiction) to use the Service</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">4. Acceptable Use</h2>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>Use the Service for any unlawful purpose</li>
                        <li>Attempt to gain unauthorized access to any part of the Service</li>
                        <li>Interfere with or disrupt the Service or servers</li>
                        <li>Transmit viruses, malware, or other malicious code</li>
                        <li>Violate any applicable laws or regulations</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">5. Open Source License</h2>
                    <p>
                        Sheety is released under the MIT License. You are free to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>Use the software for any purpose</li>
                        <li>Modify and distribute the source code</li>
                        <li>Self-host your own instance</li>
                    </ul>
                    <p className="mt-3">
                        The full license is available in the <a href="https://github.com/sdntsng/sheety-crm" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">6. Third-Party Services</h2>
                    <p>
                        Sheety integrates with Google services (Sheets, Drive, OAuth). Your use of these services is governed by:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><a href="https://policies.google.com/terms" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">Google Terms of Service</a></li>
                        <li><a href="https://policies.google.com/privacy" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">7. Disclaimer of Warranties</h2>
                    <p>
                        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>Implied warranties of merchantability</li>
                        <li>Fitness for a particular purpose</li>
                        <li>Non-infringement</li>
                        <li>Availability, accuracy, or reliability</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">8. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHEETY AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>Any indirect, incidental, special, or consequential damages</li>
                        <li>Loss of profits, data, or business opportunities</li>
                        <li>Any damages arising from your use or inability to use the Service</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">9. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless Sheety and its contributors from any claims, damages,
                        or expenses arising from your use of the Service or violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">10. Termination</h2>
                    <p>
                        You may stop using the Service at any time by signing out and revoking Google OAuth access.
                        We reserve the right to terminate or suspend access to the Service for violations of these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">11. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                        Material changes will be communicated through the Service or repository.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">12. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with applicable laws,
                        without regard to conflict of law principles.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">13. Contact</h2>
                    <p>
                        For questions about these Terms, please open an issue on our <a href="https://github.com/sdntsng/sheety-crm" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
