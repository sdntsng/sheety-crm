# 🚀 Deployment Guide: Universal Access (SaaS Mode)

The CRM is now a Multi-Tenant SaaS application.
- **Frontend**: Handles Google OAuth login.
- **Backend**: Stateless API that uses the user's session token.

---

## 🏗️ Part 1: Backend Deployment (Render.com)

1.  **Create Service**: New "Web Service" on Render.
2.  **Repo**: Connect your repo.
3.  **Command**: `uvicorn api.server:app --host 0.0.0.0 --port $PORT`
4.  **Environment Variables**:
    *   **NONE REQUIRED!** 🎉
    *   (The backend now relies purely on the token passed from the frontend).

---

## 🎨 Part 2: Frontend Deployment (Cloudflare Pages)

1.  **Google Cloud Console**:
    *   Go to **APIs & Services > Credentials**.
    *   Create **OAuth 2.0 Client ID**.
    *   **Authorized Javascript Origins**: `https://<your-project>.pages.dev` (and `http://localhost:3000` for dev).
    *   **Authorized Redirect URIs**: `https://<your-project>.pages.dev/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google`).
    *   Copy `Client ID` and `Client Secret`.

2.  **Cloudflare Pages**:
    *   Connect Repo.
    *   **Framework**: Next.js.
    *   **Build Command**: `npx @cloudflare/next-on-pages@1`
    *   **Output Directory**: `.vercel/output/static`

3.  **Environment Variables (Cloudflare)**:
    *   `NEXT_PUBLIC_API_URL`: `https://<your-render-backend>.onrender.com`
    *   `NEXTAUTH_URL`: `https://<your-project>.pages.dev`
    *   `NEXTAUTH_SECRET`: Generate value (run `openssl rand -base64 32`).
    *   `GOOGLE_CLIENT_ID`: (From Google Console)
    *   `GOOGLE_CLIENT_SECRET`: (From Google Console)

---

## 🛠️ Usage

1.  Open the App URL.
2.  Click **"Sign in with Google"**.
3.  Grant access to Google Sheets.
4.  The CRM accepts the token and connects to **YOUR** Google Drive.
    *   *Note: You must have a sheet named "Sales Pipeline 2026" in your Drive for now.*
