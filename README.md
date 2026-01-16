# Sheety CRM 📊

**A "Stateless" CRM for Solopreneurs & Tiny Teams.**

> **Problem**: Traditional CRMs are database silos. You lose control of your data, they are expensive, and over-engineered.
> **Solution**: A Multi-Tenant SaaS that turns **Your Google Sheets** into a powerful, collaborative CRM. You own the data. We provide the interface.

![Sheety CRM Screenshot](https://placehold.co/1200x800?text=Dashboard+Preview)

## ✨ Features

-   **Zero Database Lock-in**: All data lives in your Google Sheet (`Leads`, `Opportunities`, `Activities`).
-   **Stateless Backend**: The engine is purely logical. It reads/writes to your sheet on demand using your OAuth token.
-   **Notion-Style UI**: A clean, distraction-free interface built for focus.
-   **Multi-Tenant by Design**: One deployment serves infinite users, isolated by their Google Login.
-   **Google Picker Integration**: Select any spreadsheet from your Drive to "bless" it as a CRM.

## 🛠️ Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Backend**: FastAPI (Python 3.10+)
-   **Auth**: NextAuth.js (Google OAuth 2.0)
-   **Styling**: React, Tailwind CSS v4
-   **Deployment**: Cloudflare Pages (Frontend) + Render (Backend)

## 🚀 Quick Start

### 1. Prerequisites
-   Python 3.10+
-   Node.js 18+
-   Google Cloud Project with Sheets/Drive APIs enabled.

### 2. Setup
Clone the repo and install dependencies:

```bash
git clone https://github.com/yourusername/sheety-crm.git
cd sheety-crm
make install
```

### 3. Environment
Create `crm-dashboard/.env.local` (see [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for details):

```env
NEXT_PUBLIC_API_URL=http://localhost:8026
NEXTAUTH_URL=http://localhost:3026
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 4. Run
Start the development server:

```bash
make crm-dev
```

Visit `http://localhost:3026` to sign in.

## 📚 Documentation

-   [**Setup Guide**](docs/SETUP_GUIDE.md): Detailed local development setup.
-   [**Architecture**](docs/ARCHITECTURE.md): How the "Stateless CRM" works.
-   [**Contributing**](docs/CONTRIBUTING.md): How to help build Sheety CRM.

## 📄 License
MIT
