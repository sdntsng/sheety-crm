export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="font-serif text-4xl font-bold mb-8 text-[var(--color-ink)]">Privacy Policy</h1>
            <div className="prose prose-stone font-serif text-[var(--color-ink-muted)]">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    Your privacy is important to us. It is Sheety's policy to respect your privacy regarding any information we may collect from you across our website.
                </p>
                <h3>1. Information We Collect</h3>
                <p>
                    We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                    Specifically, we use Google OAuth to authenticate you and access your Google Sheets. We store:
                </p>
                <ul>
                    <li>Your name and email address (for identification).</li>
                    <li>Access tokens (to interact with your spreadsheets).</li>
                </ul>
                <p>We do NOT store your spreadsheet data on our servers. Your data lives in your Google Sheet and is fetched directly to your browser.</p>

                <h3>2. How We Use Information</h3>
                <p>
                    We use the collected information to:
                </p>
                <ul>
                    <li>Authenticate you.</li>
                    <li>Read and write to the Google Sheet you select as your CRM database.</li>
                </ul>

                <h3>3. Data Retention</h3>
                <p>
                    We only retain collected information for as long as necessary to provide you with your requested service.
                </p>
            </div>
        </div>
    );
}
