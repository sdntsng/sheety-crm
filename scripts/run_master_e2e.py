#!/usr/bin/env python3
"""
Run end-to-end smoke validation for implemented master-plan features.

This script runs against FastAPI via TestClient in MOCK_DATA_MODE and emits:
- artifacts/e2e/latest.json
- artifacts/e2e/latest.md
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
MOCK_FILE = ROOT / "data" / "mock_crm.json"
ARTIFACT_DIR = ROOT / "artifacts" / "e2e"
ARTIFACT_JSON = ARTIFACT_DIR / "latest.json"
ARTIFACT_MD = ARTIFACT_DIR / "latest.md"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_markdown(results: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    lines = [
        "# Master E2E Validation",
        "",
        f"- Timestamp (UTC): `{summary['timestamp_utc']}`",
        f"- Passed: `{summary['passed']}`",
        f"- Failed: `{summary['failed']}`",
        "",
        "| Scenario | Status | Details |",
        "|---|---|---|",
    ]
    for item in results:
        status = "PASS" if item["ok"] else "FAIL"
        detail = str(item["detail"]).replace("\n", " ").replace("|", "\\|")
        lines.append(f"| {item['name']} | {status} | {detail} |")
    return "\n".join(lines) + "\n"


def run() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = MOCK_FILE.with_suffix(".json.bak.e2e")
    shutil.copy2(MOCK_FILE, backup_path)

    os.environ["MOCK_DATA_MODE"] = "true"

    results: list[dict[str, Any]] = []
    created_ids: dict[str, str] = {}

    def record(name: str, ok: bool, detail: str, status: int | None = None):
        results.append(
            {
                "name": name,
                "ok": ok,
                "status": status,
                "detail": detail,
            }
        )

    def call(
        name: str,
        method: str,
        path: str,
        expected: tuple[int, ...] = (200,),
        headers: dict[str, str] | None = None,
        **kwargs: Any,
    ):
        request_headers = headers or {
            "Authorization": "Bearer mock_token",
            "X-Sheet-Id": "Sales Pipeline 2026",
        }
        response = client.request(method, path, headers=request_headers, **kwargs)
        ok = response.status_code in expected
        try:
            body = response.json()
        except Exception:
            body = response.text[:300]

        detail = f"HTTP {response.status_code}"
        if not ok:
            detail += f" body={body}"
        record(name, ok, detail, response.status_code)
        return response

    try:
        from api.server import app

        client = TestClient(app)

        # Basic health and baseline reads
        call("health", "GET", "/health")
        leads_resp = call("list_leads", "GET", "/api/leads")
        opps_resp = call("list_opportunities", "GET", "/api/opportunities")
        call("dashboard", "GET", "/api/dashboard")
        call("pipeline", "GET", "/api/pipeline")

        lead_rows = leads_resp.json().get("leads", []) if leads_resp.status_code == 200 else []
        opp_rows = opps_resp.json().get("opportunities", []) if opps_resp.status_code == 200 else []
        base_lead_id = lead_rows[0]["lead_id"] if lead_rows else "lead-001"
        base_opp_id = opp_rows[0]["opp_id"] if opp_rows else "opp-001"

        # Tasks lifecycle
        task_create = call(
            "create_task",
            "POST",
            "/api/tasks",
            expected=(201,),
            json={
                "title": "E2E follow up",
                "lead_id": base_lead_id,
                "priority": "High",
                "status": "Open",
            },
        )
        if task_create.status_code == 201:
            task_id = task_create.json()["task_id"]
            created_ids["task_id"] = task_id
            call("list_tasks", "GET", "/api/tasks")
            call("update_task", "PUT", f"/api/tasks/{task_id}", json={"status": "Completed"})
            call("delete_task", "DELETE", f"/api/tasks/{task_id}")

        # Saved views lifecycle
        view_create = call(
            "create_saved_view",
            "POST",
            "/api/views",
            expected=(201,),
            json={
                "name": "E2E Leads View",
                "entity": "leads",
                "filters": [{"logic": "AND", "conditions": []}],
            },
        )
        if view_create.status_code == 201:
            view_id = view_create.json()["view_id"]
            created_ids["view_id"] = view_id
            call("list_saved_views", "GET", "/api/views?entity=leads")
            call("update_saved_view", "PUT", f"/api/views/{view_id}", json={"name": "E2E Leads View v2"})
            call("delete_saved_view", "DELETE", f"/api/views/{view_id}")

        # Custom fields + lead creation with custom field values
        field_create = call(
            "create_custom_field",
            "POST",
            "/api/custom-fields",
            expected=(201,),
            json={
                "entity": "leads",
                "key": "region_e2e",
                "label": "Region E2E",
                "field_type": "select",
                "options": ["West", "East"],
                "required": False,
            },
        )
        if field_create.status_code == 201:
            field_id = field_create.json()["field_id"]
            created_ids["field_id"] = field_id
            lead_create = call(
                "create_lead_with_custom_fields",
                "POST",
                "/api/leads",
                expected=(201,),
                json={
                    "company_name": "E2E Systems",
                    "contact_name": "Casey Flow",
                    "contact_email": "casey.e2e@example.com",
                    "status": "New",
                    "source": "Other",
                    "custom_fields": {"region_e2e": "West"},
                },
            )
            if lead_create.status_code == 201:
                lead_id = lead_create.json()["lead_id"]
                created_ids["lead_id"] = lead_id
                call("get_lead_with_custom_fields", "GET", f"/api/leads/{lead_id}")
                call(
                    "bulk_update_leads_status",
                    "POST",
                    "/api/bulk/leads",
                    json={
                        "operation": "update_status",
                        "ids": [lead_id],
                        "status": "Contacted",
                    },
                )
                call(
                    "bulk_delete_leads",
                    "POST",
                    "/api/bulk/leads",
                    json={"operation": "delete", "ids": [lead_id]},
                )
            call("delete_custom_field", "DELETE", f"/api/custom-fields/{field_id}")

        # Duplicates + reports + export
        call("detect_duplicate_leads", "GET", "/api/leads/duplicates?min_confidence=0.7")
        dup_lead_a = call(
            "create_duplicate_lead_a",
            "POST",
            "/api/leads",
            expected=(201,),
            json={
                "company_name": "DupCo Labs",
                "contact_name": "Alex Merge",
                "contact_email": "alex.merge@dupco.com",
                "status": "New",
                "source": "Other",
            },
        )
        dup_lead_b = call(
            "create_duplicate_lead_b",
            "POST",
            "/api/leads",
            expected=(201,),
            json={
                "company_name": "DupCo Labz",
                "contact_name": "Alex Merge",
                "contact_email": "alex.merge@dupco.com",
                "status": "Contacted",
                "source": "Website",
            },
        )
        if dup_lead_a.status_code == 201 and dup_lead_b.status_code == 201:
            dup_a_id = dup_lead_a.json()["lead_id"]
            dup_b_id = dup_lead_b.json()["lead_id"]
            merge_suggest = call(
                "suggest_duplicate_merge",
                "GET",
                f"/api/leads/duplicates/suggest?lead_a_id={dup_a_id}&lead_b_id={dup_b_id}",
            )
            if merge_suggest.status_code == 200:
                suggestion = merge_suggest.json()
                call(
                    "merge_duplicate_leads",
                    "POST",
                    "/api/leads/duplicates/merge",
                    json={
                        "lead_a_id": dup_a_id,
                        "lead_b_id": dup_b_id,
                        "primary_id": suggestion.get("primary_lead_id"),
                        "selected_fields": suggestion.get("merged_preview", {}),
                    },
                )
        call("reports", "GET", "/api/reports")
        export_resp = call("export_leads_csv", "GET", "/api/export/leads")
        if export_resp.status_code == 200:
            csv_ok = "text/csv" in export_resp.headers.get("content-type", "")
            record("export_leads_csv_content_type", csv_ok, export_resp.headers.get("content-type", "n/a"))

        # AI parse + execute
        ai_parse = call(
            "ai_parse",
            "POST",
            "/api/ai/parse",
            json={"query": "create lead for Taylor Swift at Bright Labs"},
        )
        if ai_parse.status_code == 200:
            parsed = ai_parse.json()
            operation = parsed.get("operation", {})
            if isinstance(operation, dict) and operation.get("type"):
                call("ai_execute", "POST", "/api/ai/execute", json={"operation": operation})
        call("ai_explain", "POST", "/api/ai/explain", json={"topic": "pipeline"})
        call("ai_suggest", "GET", "/api/ai/suggest")

        # Notes parser flow
        notes_parse = call(
            "ai_parse_notes",
            "POST",
            "/api/ai/parse-notes",
            json={
                "content": "Discussed next steps. TODO send proposal tomorrow. Budget is $12000.",
                "lead_id": base_lead_id,
                "opp_id": base_opp_id,
            },
        )
        if notes_parse.status_code == 200:
            parsed_notes = notes_parse.json()
            call(
                "ai_apply_parsed_notes",
                "POST",
                "/api/ai/parse-notes/apply",
                json={
                    "lead_id": base_lead_id,
                    "opp_id": base_opp_id,
                    "tasks": parsed_notes.get("tasks", []),
                    "deal_updates": parsed_notes.get("deal_updates", {}),
                    "key_points": parsed_notes.get("key_points", []),
                },
            )

        # Coach and forecast
        call("coach_tips", "GET", f"/api/coach/tips?opp_id={base_opp_id}")
        call("coach_performance", "GET", "/api/coach/performance")
        call(
            "coach_ask",
            "POST",
            "/api/coach/ask",
            json={"question": "How should I handle discount pressure?", "opp_id": base_opp_id},
        )
        call("coach_deal_review", "GET", f"/api/coach/deal/{base_opp_id}/review")
        call("forecast", "GET", "/api/forecast?period=this_month")
        call("forecast_scenarios", "GET", "/api/forecast/scenarios")
        call(
            "forecast_custom_scenario",
            "POST",
            "/api/forecast/scenario",
            json={"remove_opp_ids": [], "force_close_opp_ids": [base_opp_id]},
        )
        call("forecast_coverage", "GET", "/api/forecast/coverage?target=10000")
        call("forecast_trends", "GET", "/api/forecast/trends?periods=4")

        # Integrations
        call("list_integrations_initial", "GET", "/api/integrations")
        call(
            "connect_integration_google_calendar",
            "POST",
            "/api/integrations/google_calendar/connect",
            json={"config": {"calendar_id": "primary"}},
        )
        call("sync_integration_google_calendar", "POST", "/api/integrations/google_calendar/sync")
        call("list_integrations_after_connect", "GET", "/api/integrations")

        # CSV import availability check (depends on multipart install)
        import_status = call("csv_import_endpoint_check", "POST", "/api/import/csv/upload", expected=(422, 503))
        if import_status.status_code == 503:
            record("csv_import_graceful_degradation", True, "disabled without python-multipart")
        elif import_status.status_code == 422:
            record("csv_import_available", True, "multipart installed; file required")

        # CLI surface check
        cli_help = subprocess.run(
            [sys.executable, "-m", "src.main", "--help"],
            cwd=str(ROOT),
            check=False,
            capture_output=True,
            text=True,
        )
        cli_ok = (
            cli_help.returncode == 0
            and "crm-sync" in cli_help.stdout
            and "crm-report-daily" in cli_help.stdout
        )
        record("cli_commands_registered", cli_ok, f"return_code={cli_help.returncode}")

        passed = len([item for item in results if item["ok"]])
        failed = len(results) - passed
        payload = {
            "timestamp_utc": now_iso(),
            "passed": passed,
            "failed": failed,
            "results": results,
        }
        ARTIFACT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        ARTIFACT_MD.write_text(make_markdown(results, payload), encoding="utf-8")

        print(f"Wrote {ARTIFACT_JSON.relative_to(ROOT)}")
        print(f"Wrote {ARTIFACT_MD.relative_to(ROOT)}")
        print(f"Passed={passed} Failed={failed}")
        return 0 if failed == 0 else 1
    finally:
        shutil.move(backup_path, MOCK_FILE)


if __name__ == "__main__":
    raise SystemExit(run())
