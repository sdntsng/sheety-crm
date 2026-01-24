# 🔑 Google Sheets API Setup

Sheety CRM relies on the Google Sheets API for its "backend" database. To run the application locally in its full mode, you need to bring your own Google Cloud Platform (GCP) credentials.

This is a **one-time setup** that takes about 5 minutes.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) and select **New Project**.
3. Name it `sheety-crm-dev` (or anything you like) and click **Create**.

## 2. Enable APIs
1. In the sidebar, go to **APIs & Services > Library**.
2. Search for **Google Sheets API** and click **Enable**.
3. Search for **Google Drive API** and click **Enable**.

## 3. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Workspace organization).
3. Fill in the required fields:
    - **App Name**: Sheety CRM Dev
    - **User Support Email**: Your email
    - **Developer Contact Info**: Your email
4. Click **Save and Continue**.
5. **Scopes**: Click "Add or Remove Scopes" and add:
    - `../auth/spreadsheets`
    - `../auth/drive`
    - `../auth/documents.readonly` (for future Docs features)
6. **Test Users**: Add your own Google email address as a test user. **This is critical** for the dev environment to work without app verification.

## 4. Create Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application**.
4. **Authorized JavaScript origins**:
    - `http://localhost:3000`
    - `http://localhost:3026`
5. **Authorized redirect URIs**:
    - `http://localhost:3026/api/auth/callback/google`  (Frontend Dev)
    - `http://localhost:3000/api/auth/callback/google` (If running on port 3000)
    - `http://127.0.0.1:3026/api/auth/callback/google`
6. Click **Create**.

## 5. Add to Environment
Copy the **Client ID** and **Client Secret** and add them to your `crm-dashboard/.env.local` file (see `.env.example`).

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

You are now ready to log in!
