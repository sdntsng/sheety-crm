export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="font-serif text-4xl font-bold mb-4 text-[var(--color-ink)]">Privacy Policy</h1>
            <p className="text-sm text-[var(--color-ink-muted)] mb-8">Last updated: January 18, 2026</p>

            <div className="prose prose-stone max-w-none space-y-6 text-[var(--color-ink-muted)]">
                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Overview</h2>
                    <p>
                        Sheety (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data.
                        This privacy policy explains how we collect, use, and safeguard your information when you use our service.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Data Controller</h2>
                    <p>
                        Sheety is an open-source project. For GDPR purposes, when you self-host Sheety, you become the data controller
                        for any personal data processed through your instance.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">What Data We Collect</h2>
                    <p>We collect minimal data necessary to provide our service:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><strong>Account Information:</strong> Name and email address from your Google account (used for authentication)</li>
                        <li><strong>OAuth Tokens:</strong> Encrypted access tokens to interact with your Google Sheets (stored in your browser session)</li>
                        <li><strong>Usage Data:</strong> Basic analytics (page views, feature usage) if analytics are enabled</li>
                    </ul>
                    <div className="bg-[var(--accent-yellow)]/20 border border-[var(--accent-yellow)] rounded-lg p-4 mt-4">
                        <p className="font-medium text-[var(--color-ink)]">🔒 Important: We do NOT store your spreadsheet data on our servers.</p>
                        <p className="text-sm mt-1">Your CRM data lives entirely in your Google Sheet and is fetched directly to your browser.</p>
                    </div>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Legal Basis for Processing (GDPR)</h2>
                    <p>We process your personal data based on:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><strong>Consent:</strong> You explicitly grant access when signing in with Google OAuth</li>
                        <li><strong>Contract:</strong> Processing necessary to provide you with the Sheety service</li>
                        <li><strong>Legitimate Interest:</strong> Improving our service and ensuring security</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">How We Use Your Data</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Authenticate you and maintain your session</li>
                        <li>Read and write to your selected Google Sheet</li>
                        <li>Improve the service based on usage patterns</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Data Sharing</h2>
                    <p>We do not sell, trade, or transfer your personal data to third parties. Your data may be shared with:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><strong>Google:</strong> For authentication and accessing your Google Sheets (governed by Google&apos;s Privacy Policy)</li>
                        <li><strong>Hosting Providers:</strong> Infrastructure providers who process data on our behalf (with appropriate data processing agreements)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Your Rights (GDPR)</h2>
                    <p>Under GDPR, you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><strong>Access:</strong> Request a copy of your personal data</li>
                        <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
                        <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                        <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                        <li><strong>Withdraw Consent:</strong> Revoke Google OAuth access at any time via your Google Account settings</li>
                    </ul>
                    <p className="mt-3">To exercise these rights, revoke access via <a href="https://myaccount.google.com/permissions" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">Google Account Permissions</a> or contact us.</p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Data Retention</h2>
                    <p>
                        We retain your session data only while you are actively using the service.
                        When you sign out or revoke access, your authentication tokens are deleted.
                        Your CRM data remains in your Google Sheet under your control.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Cookies</h2>
                    <p>We use essential cookies for:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li><strong>Session Management:</strong> Keeping you logged in</li>
                        <li><strong>Security:</strong> CSRF protection</li>
                    </ul>
                    <p className="mt-3">We do not use tracking or advertising cookies.</p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Security</h2>
                    <p>
                        We implement appropriate technical and organizational measures to protect your data, including:
                        HTTPS encryption, secure OAuth flows, and minimal data collection.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Changes to This Policy</h2>
                    <p>
                        We may update this policy from time to time. We will notify you of significant changes by posting the new policy on this page.
                    </p>
                </section>

                <section>
                    <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)] mb-3">Contact</h2>
                    <p>
                        For privacy-related inquiries, please open an issue on our <a href="https://github.com/sdntsng/sheety-crm" className="text-[var(--accent-blue)] underline" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
