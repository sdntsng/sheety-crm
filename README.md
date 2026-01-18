# Sheety CRM 📊

**The CRM for solopreneurs and tiny teams.**

> **Problem**: Traditional CRMs are database silos. Expensive, over-engineered, and they hold your data hostage.
>
> **Solution**: Sheety turns your **Google Sheet** into a beautiful CRM. You own the data. We provide the interface.

![Sheety CRM Dashboard](crm-dashboard/public/assets/DatabaseHomeStatic.png)

## ✨ Features

- **Zero Database Lock-in**: All data lives in your Google Sheet (`Leads`, `Opportunities`, `Activities`).
- **Stateless Backend**: Reads/writes to your sheet on demand using your OAuth token.
- **Beautiful UI**: Paper-inspired interface with Kanban pipeline, lead cards, and activity tracking.
- **Multi-Tenant**: One deployment serves unlimited users, isolated by Google Login.
- **Google Picker**: Select any spreadsheet from your Drive to use as your CRM.

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
