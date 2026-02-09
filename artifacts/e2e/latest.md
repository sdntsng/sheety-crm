# Master E2E Validation

- Timestamp (UTC): `2026-02-09T16:53:37.456177+00:00`
- Passed: `57`
- Failed: `0`

| Scenario | Status | Details |
|---|---|---|
| health | PASS | HTTP 200 |
| list_leads | PASS | HTTP 200 |
| list_opportunities | PASS | HTTP 200 |
| list_leads_by_owner | PASS | HTTP 200 |
| list_opportunities_by_owner | PASS | HTTP 200 |
| dashboard | PASS | HTTP 200 |
| pipeline | PASS | HTTP 200 |
| create_task | PASS | HTTP 201 |
| list_tasks | PASS | HTTP 200 |
| update_task | PASS | HTTP 200 |
| delete_task | PASS | HTTP 200 |
| create_saved_view | PASS | HTTP 201 |
| list_saved_views | PASS | HTTP 200 |
| update_saved_view | PASS | HTTP 200 |
| delete_saved_view | PASS | HTTP 200 |
| create_custom_field | PASS | HTTP 201 |
| create_lead_with_custom_fields | PASS | HTTP 201 |
| get_lead_with_custom_fields | PASS | HTTP 200 |
| bulk_update_leads_status | PASS | HTTP 200 |
| bulk_delete_leads | PASS | HTTP 200 |
| delete_custom_field | PASS | HTTP 200 |
| detect_duplicate_leads | PASS | HTTP 200 |
| create_duplicate_lead_a | PASS | HTTP 201 |
| create_duplicate_lead_b | PASS | HTTP 201 |
| suggest_duplicate_merge | PASS | HTTP 200 |
| merge_duplicate_leads | PASS | HTTP 200 |
| reports | PASS | HTTP 200 |
| export_leads_csv | PASS | HTTP 200 |
| export_leads_csv_content_type | PASS | text/csv; charset=utf-8 |
| ai_parse | PASS | HTTP 200 |
| ai_execute | PASS | HTTP 200 |
| ai_explain | PASS | HTTP 200 |
| ai_suggest | PASS | HTTP 200 |
| ai_parse_notes | PASS | HTTP 200 |
| ai_apply_parsed_notes | PASS | HTTP 200 |
| coach_tips | PASS | HTTP 200 |
| coach_performance | PASS | HTTP 200 |
| coach_ask | PASS | HTTP 200 |
| coach_deal_review | PASS | HTTP 200 |
| forecast | PASS | HTTP 200 |
| forecast_scenarios | PASS | HTTP 200 |
| forecast_custom_scenario | PASS | HTTP 200 |
| forecast_coverage | PASS | HTTP 200 |
| forecast_trends | PASS | HTTP 200 |
| list_integrations_initial | PASS | HTTP 200 |
| connect_integration_google_calendar | PASS | HTTP 200 |
| sync_integration_google_calendar | PASS | HTTP 200 |
| sync_integration_google_calendar_dedup | PASS | HTTP 200 |
| integration_sync_deduplicated | PASS | True |
| list_integrations_after_connect | PASS | HTTP 200 |
| list_integration_runs_provider | PASS | HTTP 200 |
| list_integration_runs_all | PASS | HTTP 200 |
| list_audit_events | PASS | HTTP 200 |
| audit_events_populated | PASS | count=11 |
| csv_import_endpoint_check | PASS | HTTP 503 |
| csv_import_graceful_degradation | PASS | disabled without python-multipart |
| cli_commands_registered | PASS | return_code=0 |
