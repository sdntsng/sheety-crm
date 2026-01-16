# Sheety CRM 🚀

**Sheety CRM** is a Multi-Tenant SaaS that turns **Google Sheets** into a powerful, collaborative CRM.

Built with:
- **Frontend**: Next.js 16 (Cloudflare Pages)
- **Backend**: FastAPI (Render / Serverless)
- **Database**: Google Sheets (User's Own)

## 🌍 SaaS Architecture

Unlike traditional CRMs, Sheety CRM is **stateless**. It connects directly to your users' Google Sheets using OAuth 2.0.

1.  User signs in with Google.
2.  App receives `access_token`.
3.  Backend uses this token to read/write to *their* "Sales Pipeline 2026" sheet.

## 🛠️ Local Development

```bash
# 1. Install Dependencies
pip install -r requirements.txt
cd crm-dashboard && npm install

# 2. Run Dev Environment
make crm-dev
```

- **Frontend**: http://localhost:3026
- **Backend**: http://localhost:8026

## 📦 Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for full deployment instructions.
