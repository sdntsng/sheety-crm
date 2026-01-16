# Architecture & System Design

Sheety CRM is designed as a **Stateless, Multi-Tenant SaaS** where the user's data remains entirely within their own Google Cloud environment (specifically, Google Sheets).

## 🏗️ High-Level Overview

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[Next.js Frontend]
    Frontend -->|NextAuth (OAuth)| Google[Google Identity]
    Frontend -->|API Calls| Backend[FastAPI Backend]
    
    subgraph "Google Cloud (User Owned)"
        Sheets[Google Sheets]
        Drive[Google Drive]
    end
    
    Backend -->|gspread / Drive API| Sheets
    Backend -->|Drive API| Drive
```

## 🧩 Core Components

### 1. Frontend (Next.js)
-   **Framework**: Next.js 16 (App Router)
-   **Hosting**: Cloudflare Pages (Static/Edge)
-   **Styling**: Tailwind CSS v4, Notion/Gmail-inspired aesthetic.
-   **Key Libraries**:
    -   `next-auth`: Authentication & Session Management.
    -   `react-google-drive-picker`: For selecting the CRM spreadsheet.
    -   `swr` or `react-query`: Data fetching (if applicable).

### 2. Backend (FastAPI)
-   **Framework**: FastAPI (Python)
-   **Hosting**: Render (or any Docker-compatible PaaS).
-   **Role**: Acts as a proxy and logic layer between the Frontend and Google APIs.
-   **State**: **Stateless**. It does not persist user data in a SQL database. It relies on the JWT session to interact with Google APIs on behalf of the user.

### 3. Data Layer (Google Sheets)
-   **Storage**: A specific Google Sheet (e.g., "Sales Pipeline 2026").
-   **Schema**:
    -   `Leads`: Contact info, status, source.
    -   `Opportunities`: Deal value, stage, probability.
    -   `Activities`: Notes, calls, meetings linked to Leads/Opps.
    -   `Settings`: Configurable CRM options (pipelines, stages).

## 🔐 Authentication & Security

### OAuth 2.0 Flow
1.  **Initiation**: User clicks "Sign in with Google" on the frontend.
2.  **Consent**: User grants permissions (`drive.file`, `spreadsheets`).
3.  **Token Exchange**: NextAuth handles the code-for-token exchange.
4.  **Session**: The `access_token` and `refresh_token` are encrypted and stored in the HTTP-only Session Cookie.
5.  **API Requests**: The Frontend sends the Session Cookie to the Backend. The Backend extracts the `access_token` to make calls to Google APIs.

### Token Management
-   **Refresh**: `src/auth.ts` (NextAuth) handles automatic token refreshing using the `refresh_token` when the `access_token` expires.

## 💾 Caching Strategy
To avoid hitting Google API rate limits, the backend implements an in-memory or Redis-based cache (currently in-memory dictionary `_cache` in `CRMManager`).
-   **Read**: Checks cache first. If stale/missing, fetches from Sheet.
-   **Write**: Writes to Sheet first, then invalidates/updates the cache.

## 🚀 Deployment Architecture

-   **Frontend**: Deployed to Cloudflare Pages (or Vercel) as a static/edge site.
-   **Backend**: Deployed to Render as a Web Service.
-   **Environment**: Production environment uses `NEXT_PUBLIC_API_URL` to point to the Render backend, while local points to `localhost`.
