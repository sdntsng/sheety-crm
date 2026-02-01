
.PHONY: setup login run lint crm-init crm-api crm-dashboard crm-dev kill-ports lint-check format

PYTHON = ./venv/bin/python
MODULE = src.main

# Unique ports for CRM (using 2026 suffix to avoid conflicts)
API_PORT = 8026
DASHBOARD_PORT = 3026

# =============================================================================
# Setup & Auth
# =============================================================================

install:
	pip install -r requirements.txt
	cd crm-dashboard && npm install

setup:
	$(PYTHON) -m $(MODULE) setup

login:
	$(PYTHON) -m $(MODULE) login

whoami:
	$(PYTHON) -m $(MODULE) whoami

# =============================================================================
# Google Workspace Operations
# =============================================================================

list-sheets:
	$(PYTHON) -m $(MODULE) list-sheets

list-files:
	$(PYTHON) -m $(MODULE) list-files

update-cell:
	$(PYTHON) -m $(MODULE) update-cell

append-row:
	$(PYTHON) -m $(MODULE) append-row

read-doc:
	$(PYTHON) -m $(MODULE) read-doc

# =============================================================================
# CRM Commands
# =============================================================================

crm-init:
	$(PYTHON) -m $(MODULE) crm-init --name "Sales Pipeline 2026"

crm-add-lead:
	@echo "Usage: make crm-add-lead COMPANY='Acme' CONTACT='John' EMAIL='john@acme.com'"
	$(PYTHON) -m $(MODULE) crm-add-lead --company "$(COMPANY)" --contact "$(CONTACT)" --email "$(EMAIL)"

crm-list:
	$(PYTHON) -m $(MODULE) crm-list leads

crm-pipeline:
	$(PYTHON) -m $(MODULE) crm-pipeline

# =============================================================================
# CRM Servers (run these in separate terminals)
# =============================================================================

kill-ports:
	@echo "Killing processes on ports $(API_PORT) and $(DASHBOARD_PORT)..."
	@lsof -ti:$(API_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(DASHBOARD_PORT) | xargs kill -9 2>/dev/null || true
	@echo "Ports released."

crm-api: kill-ports
	@echo "Starting CRM API server on http://localhost:$(API_PORT)..."
	./venv/bin/uvicorn api.server:app --reload --port $(API_PORT)

crm-dashboard:
	@echo "Starting CRM Dashboard on http://localhost:$(DASHBOARD_PORT)..."
	cd crm-dashboard && PORT=$(DASHBOARD_PORT) npm run dev

# Start both servers (API in background, dashboard in foreground)
crm-dev: kill-ports
	@echo "=== CRM Development Mode ==="
	@echo "API:       http://localhost:$(API_PORT)"
	@echo "Dashboard: http://localhost:$(DASHBOARD_PORT)"
	@echo ""
	@./venv/bin/uvicorn api.server:app --reload --port $(API_PORT) & echo $$! > .api.pid
	@sleep 2
	@cd crm-dashboard && PORT=$(DASHBOARD_PORT) npm run dev
	@# Cleanup on exit
	@kill $$(cat .api.pid) 2>/dev/null; rm -f .api.pid

mock-dev: kill-ports
	@echo "=== CRM Mock Development Mode ==="
	@echo "API:       http://localhost:$(API_PORT) (Mock Data)"
	@echo "Dashboard: http://localhost:$(DASHBOARD_PORT) (Mock Auth)"
	@echo ""
	@MOCK_DATA_MODE=true ./venv/bin/uvicorn api.server:app --reload --port $(API_PORT) & echo $$! > .api.pid
	@sleep 2
	@cd crm-dashboard && MOCK_DATA_MODE=true NEXT_PUBLIC_MOCK_AUTH=true PORT=$(DASHBOARD_PORT) npm run dev
	@# Cleanup on exit
	@kill $$(cat .api.pid) 2>/dev/null; rm -f .api.pid

crm-stop:
	@kill $$(cat .api.pid) 2>/dev/null; rm -f .api.pid || true
	@echo "Stopped CRM servers"


# =============================================================================
# Lint / Format
# =============================================================================

lint-check:
	@echo "Checking Frontend formatting (Prettier)..."
	cd crm-dashboard && npm run format:check
	@echo "Checking Backend lint (ruff)..."
	./venv/bin/ruff check src api --select F

lint: lint-check

format:
	@echo "Formatting Frontend (Prettier)..."
	cd crm-dashboard && npm run format
