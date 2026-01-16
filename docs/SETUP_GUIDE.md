# Sheety CRM Setup Guide

This guide will help you set up Sheety CRM locally for development.

## Prerequisites

- **Python 3.10+** (Managed via `venv` or `pyenv`)
- **Node.js 18+** & `npm`
- **Google Cloud Platform Account**

## 1. Google Cloud Configuration

Since Sheety CRM interacts with Google Sheets and Drive, you need to set up a Google Cloud Project with the necessary APIs and OAuth credentials.

### A. Create Project & Enable APIs
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., `sheety-crm-dev`).
3.  Enable the following APIs:
    -   **Google Sheets API**
    -   **Google Drive API**

### B. Configure OAuth Consent Screen
1.  Go to **APIs & Services > OAuth consent screen**.
2.  Select **External** (unless you have a Google Workspace organization).
3.  Fill in the required fields (App Name, User Support Email).
4.  Add the following **Scopes**:
    -   `.../auth/spreadsheets`
    -   `.../auth/drive.file` (or `drive.readonly` / `drive` depending on needs)
    -   `email`, `profile`
5.  Add **Test Users** (your personal email) so you can log in during development.

### C. Create Credentials
1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials > OAuth client ID**.
3.  Select **Web application**.
4.  Add **Authorized JavaScript origins**:
    -   `http://localhost:3026`
5.  Add **Authorized redirect URIs**:
    -   `http://localhost:3026/api/auth/callback/google`
6.  Download the JSON file and rename it to `client_secret.json` (just for reference, mainly you need the ID and Secret for `.env.local`).

## 2. Environment Variables

### Backend (`.env`)
No strict `.env` usage for the backend in local dev if using `token.json` flow, but environment variables can be set for production.

### Frontend (`crm-dashboard/.env.local`)
Create `crm-dashboard/.env.local` based on the example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8026
NEXTAUTH_URL=http://localhost:3026
AUTH_SECRET=your_generated_secret_here  # Generate with: openssl rand -base64 32
Auth_TRUST_HOST=true

# Google OAuth (From Step 1.C)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

## 3. Installation

We use a `Makefile` to simplify commands.

```bash
# Install Python and Node dependencies
make install
```

This will:
1.  Create a Python `venv`.
2.  Install `requirements.txt`.
3.  Install `crm-dashboard` npm packages.

## 4. Running Locally

Start both the backend (FastAPI) and frontend (Next.js) concurrently:

```bash
make crm-dev
```

- **Frontend**: [http://localhost:3026](http://localhost:3026)
- **Backend API Docs**: [http://localhost:8026/docs](http://localhost:8026/docs)

## 5. First Time Login (Authentication)

1.  Open [http://localhost:3026](http://localhost:3026).
2.  Click **Sign in with Google**.
3.  Grant the requested permissions (Sheets/Drive access).
4.  You will be redirected to the **Setup** page to select a spreadsheet.

## 6. Development Tips

- **Database**: There is no SQL database. All data lives in the user's selected Google Sheet.
- **Port Conflicts**: If port `8000` is taken, the backend defaults to `8026`.
- **FastAPI Reload**: The backend auto-reloads on file changes.
