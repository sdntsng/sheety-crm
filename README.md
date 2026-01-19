# Sheety

**The CRM that lives in your Google Sheet.**

![Sheety Banner](crm-dashboard/public/assets/DatabaseHomeStatic.png)

A stateless, open-source CRM for solopreneurs and tiny teams who love the flexibility of Google Sheets but need a better UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.51.0-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)]()

---

## Why Sheety?

Most CRMs trap your data in their database. **Sheety is different.** 
It treats your Google Sheet as the single source of truth. The app is just a beautiful, specialized interface layer on top of your data.

- **You own the data**: It's just a spreadsheet in your Google Drive.
- **No vendor lock-in**: Stop using Sheety? Your data is still just a spreadsheet.
- **Infinite flexibility**: Use Google Sheets formulas, charts, and automations alongside the CRM.

## Features

- 🏢 **Pipeline Management**: Kanban board for visual deal tracking.
- 👥 **Lead Management**: Clean interface for contacts and companies.
- 📥 **Data Import**: CSV import wizard for migrating from HubSpot, Salesforce, or Excel.
- ⚡ **Global Search**: Find anything instantly with `Cmd+K` (or `/`).
- 📝 **Activity Feed**: Log calls, emails, and meetings.
- 🎨 **Paper Theme**: A distraction-free, tactile "digital paper" aesthetic.
- 🔒 **Privacy First**: We don't store your data. We verify ownership via Google OAuth.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.10+) |
| Auth | NextAuth.js + Google OAuth 2.0 |
| Deploy | Vercel/Cloudflare + Render/Railway |

## 🚀 Quick Start

```bash
# Clone & install
git clone https://github.com/sdntsng/sheety-crm.git
cd sheety-crm
make install

# Configure environment (see docs/SETUP_GUIDE.md)
cp crm-dashboard/.env.example crm-dashboard/.env.local

# Run locally
make crm-dev
```

Visit [http://localhost:3026](http://localhost:3026) to sign in.

> 📖 **Full setup instructions**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## 📂 Project Structure

```
sheety-crm/
├── crm-dashboard/      # Next.js frontend
├── src/                # FastAPI backend
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please read our guidelines first:

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

```bash
# Fork, clone, branch
git checkout -b feature/your-feature

# Make changes, commit
git commit -m "feat: add your feature"

# Push & open PR
git push origin feature/your-feature
```

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) — Local & production setup
- [Architecture](docs/ARCHITECTURE.md) — How Sheety works

## 📄 License

MIT © [Siddhant Singh](https://github.com/sdntsng)

---

<p align="center">
  <sub>Built with ☕ by a solopreneur, for solopreneurs.</sub>
</p>
