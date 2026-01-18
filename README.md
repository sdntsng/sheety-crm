# Sheety CRM 📊

**A "Stateless" CRM for Solopreneurs & Tiny Teams.**

> **Problem**: Traditional CRMs are database silos. You lose control of your data, they are expensive, and over-engineered.
> **Solution**: A Multi-Tenant SaaS that turns **Your Google Sheets** into a powerful, collaborative CRM. You own the data. We provide the interface.

![Sheety CRM Dashboard](crm-dashboard/public/assets/DatabaseHomeStatic.png)

## ✨ Features

-   **Zero Database Lock-in**: All data lives in your Google Sheet (`Leads`, `Opportunities`, `Activities`).
-   **Stateless Backend**: The engine is purely logical. It reads/writes to your sheet on demand using your OAuth token.
-   **Beautiful UI**: A clean, paper-inspired interface built for focus. Kanban pipeline, lead management, and activity tracking.
-   **Multi-Tenant by Design**: One deployment serves infinite users, isolated by their Google Login.
-   **Google Picker Integration**: Select any spreadsheet from your Drive to "bless" it as a CRM.

## 🎬 Demo

| Drag & Drop Pipeline | Convert Leads |
|:--------------------:|:-------------:|
| ![Pipeline Demo](crm-dashboard/public/assets/DragDropBetweenStages.mp4) | ![Lead Conversion](crm-dashboard/public/assets/TurnLeadIntoOpportunity.mp4) |

## 🛠️ Tech Stack

-   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS v4
-   **Backend**: FastAPI (Python 3.10+)
-   **Auth**: NextAuth.js (Google OAuth 2.0)
-   **Deployment**: Vercel/Cloudflare (Frontend) + Render/Railway (Backend)

## 🚀 Quick Start

### Prerequisites
-   Python 3.10+
-   Node.js 18+
-   Google Cloud Project with Sheets/Drive APIs enabled.

### 1. Clone & Install

```bash
git clone https://github.com/sdntsng/sheety-crm.git
cd sheety-crm
make install
```

### 2. Configure Environment

Create `crm-dashboard/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8026
NEXTAUTH_URL=http://localhost:3026
AUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

> See [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed Google Cloud configuration.

### 3. Run

```bash
make crm-dev
```

Visit `http://localhost:3026` to sign in.

## 📂 Project Structure

```
sheety-crm/
├── crm-dashboard/          # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities & API client
│   └── public/assets/      # Demo videos & images
├── src/                    # Python backend
│   ├── main.py             # FastAPI entrypoint
│   ├── crm/                # CRM logic
│   └── auth.py             # Google OAuth handling
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## 📚 Documentation

-   [**Setup Guide**](docs/SETUP_GUIDE.md) - Local development setup
-   [**Architecture**](docs/ARCHITECTURE.md) - How the "Stateless CRM" works
-   [**Contributing**](CONTRIBUTING.md) - How to help build Sheety CRM

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Siddhant Singh](https://github.com/sdntsng)

---

<p align="center">
  <sub>Built with ☕ by a solopreneur, for solopreneurs.</sub>
</p>
