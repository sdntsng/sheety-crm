# Contributing to Sheety CRM

We welcome contributions! Please follow these guidelines to ensure a smooth process.

## 🛠️ Development Setup

1.  **Fork** the repository.
2.  **Clone** your fork.
3.  Follow the [Setup Guide](SETUP_GUIDE.md) to get running locally.

## 🎋 Branching Strategy

-   `main`: The stable production branch.
-   `feature/your-feature-name`: For new features.
-   `fix/bug-description`: For bug fixes.

**Please create Pull Requests (PRs) against the `main` branch.**

## ✅ coding Standards

### Python (Backend)
-   Follow **PEP 8**.
-   Use **Type Hints** for all function signatures.
-   Use `pydantic` models for data validation.

### TypeScript (Frontend)
-   Use **Functional Components** with React Hooks.
-   Ensure **Type Safety** (no `any` unless absolutely necessary).
-   Use **Tailwind CSS** for styling (avoid inline styles).

## 🧪 Testing

Before submitting a PR:
1.  Run the backend locally and ensure it starts without errors.
2.  Verify the frontend builds: `cd crm-dashboard && npm run build`.
3.  Test your changes manually in the browser.

## 📝 Commit Messages

Use clear, descriptive commit messages.
-   `feat: Add new pipeline stage editor`
-   `fix: Resolve token refresh issue`
-   `docs: Update setup guide`

## ❓ Questions?

Open an Issue on GitHub if you run into problems or have feature ideas.
