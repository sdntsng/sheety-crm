
# Agentic Operations Protocol

## Objective
Enable the AI Agent to perform Google Workspace operations, manage the Sales CRM, and maintain the application codebase based on natural language requests.

## Core Principle
"You talk, I execute."

---

## 1. Vinci CRM System

### Architecture
```
Google Sheets (Data Layer) 
    ↑↓ (Batch Updates + Caching)
Python CRM Module (Business Logic)
    ↑↓
FastAPI Server (Port 8026)
    ↑↓
Next.js Dashboard (Port 3026)
```

### Quick Start
```bash
# Start Development Environment (API + Dashboard)
make crm-dev

# Individual Commands
make crm-api        # http://localhost:8026
make crm-dashboard  # http://localhost:3026
make crm-init       # Initialize Google Sheet
```

### Data & Caching (CRITICAL)
- **Sheet Name**: `Sales Pipeline 2026`
- **Quota Management**:
    - **Reads**: Cached in-memory for 30s (`src/crm/manager.py`).
    - **Writes**: MUST use `update_row` (batch) instead of `update_cell`.
    - **Connection**: Spreadsheet objects are cached in `SheetManager`.

---

## 2. Design System ("Digital Paper")
**Rule Reference**: [.agent/rules/design_system.md](./design_system.md)

All UI changes MUST adhere to the **Digital Paper** aesthetic:
- **Philosophy**: Content-first, minimal chrome, "Ghost" buttons.
- **Typography**: `Playfair Display` (Headings) + `Inter` (Body).
- **Theming**:
    - **Light (Editorial)**: `#FBFBFB` Canvas, `#1A1A1A` Ink.
    - **Dark (Midnight)**: `#030712` Canvas, `#F8FAFC` Text.
- **CSS**: Use `globals.css` variables (`--bg-paper`, `--text-primary`) instead of raw hex values.

---

## 3. Agentic CRM Operations (CLI)

The agent can perform CRM actions directly via the terminal using `src.main`.

### Lead Management
**User**: "Add Stripe as a lead"
**Command**:
```bash
./venv/bin/python -m src.main crm-add-lead --company "Stripe" --contact "Patrick Collison" --email "patrick@stripe.com"
```

### Opportunity Management
**User**: "Create a $50k deal for Stripe"
**Command**:
```bash
./venv/bin/python -m src.main crm-add-opp --lead-id "<lead_id>" --title "Stripe Enterprise Deal" --value 50000 --probability 60
```

### Pipeline Visibility
**User**: "Show me the pipeline summary"
**Command**:
```bash
./venv/bin/python -m src.main crm-pipeline
```

---

## 4. Google Workspace Utils

| Operation | Command |
|-----------|---------|
| List sheets | `./venv/bin/python -m src.main list-sheets` |
| Read data | `./venv/bin/python -m src.main read-data "Sheet Name" "Tab Name"` |
| Update cell | `./venv/bin/python -m src.main update-cell "Sheet" "A1" "value"` |
| Append row | `./venv/bin/python -m src.main append-row "Sheet" "val1,val2"` |

---

## 5. Development Rules
- **Backend**: Python 3.13 (`venv`). Run via `make crm-api`.
- **Frontend**: Next.js 16 (Turbopack). Run via `make crm-dashboard`.
- **Commits**: Incremental, descriptive scope (e.g., `feat(ui): ...`, `fix(api): ...`).
- **Dependencies**:
    - Backend: `requirements.txt`
    - Frontend: `package.json` (Tailwind v4)
