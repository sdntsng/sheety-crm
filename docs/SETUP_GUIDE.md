# Sheety CRM Setup Guide

Complete setup instructions for local development and production deployment.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** & npm
- **Google Cloud Platform Account**

---

## 1. Google Cloud Configuration

### A. Create Project & Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., `sheety-crm`)
3. Enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Google Picker API**

### B. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: `Sheety CRM`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users (your email) for development

### C. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Configure URIs:

**For Local Development:**
| Field | Value |
|-------|-------|
| Authorized JavaScript origins | `http://localhost:3026` |
| Authorized redirect URIs | `http://localhost:3026/api/auth/callback/google` |

**For Production (add these too):**
| Field | Value |
|-------|-------|
| Authorized JavaScript origins | `https://your-domain.com` |
| Authorized redirect URIs | `https://your-domain.com/api/auth/callback/google` |

5. Copy the **Client ID** and **Client Secret**

---

## 2. Environment Variables

### Frontend (`crm-dashboard/.env.local`)

```env
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:8026

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3026
AUTH_SECRET=your_secret_here  # Generate: openssl rand -base64 32
AUTH_TRUST_HOST=true

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Production Environment Variables

For production deployments (Vercel, Cloudflare, etc.):

```env
# Update URLs to production domain
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
AUTH_SECRET=your_production_secret
AUTH_TRUST_HOST=true

# Same Google credentials (ensure production URIs are added in GCP)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

> ⚠️ **Important**: Add your production domain to the OAuth consent screen's authorized domains in Google Cloud Console.

---

## 3. Installation

```bash
# Install all dependencies
make install
```

This creates a Python venv and installs both backend and frontend dependencies.

---

## 4. Running Locally

```bash
# Start both servers
make crm-dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3026 |
| Backend API | http://localhost:8026 |
| API Docs | http://localhost:8026/docs |

---

## 5. Production Deployment

### Frontend (Vercel/Cloudflare)

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables from section 2

### Backend (Render/Railway)

1. Create a new Web Service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
4. Configure environment variables as needed

### Google OAuth Production Checklist

- [ ] Add production domain to OAuth consent screen
- [ ] Add production redirect URIs to OAuth credentials
- [ ] Publish OAuth consent screen (move from Testing to Production)
- [ ] Request verification if using sensitive scopes

---

## 6. First Login

1. Open your app URL
2. Click **Sign in with Google**
3. Grant permissions (Sheets/Drive access)
4. Select or create a spreadsheet on the Setup page

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth redirect error | Verify redirect URIs match exactly in GCP |
| "Access blocked" | Add yourself as test user or publish consent screen |
| API connection failed | Check `NEXT_PUBLIC_API_URL` and backend status |
| Port already in use | Kill existing process or change port in Makefile |
