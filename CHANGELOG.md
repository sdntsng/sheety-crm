# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Data Import Wizard**: CSV import feature for migrating leads from other CRMs (HubSpot, Salesforce) or Excel.
  - File upload with CSV validation
  - Auto-detection of column mappings based on header names
  - Interactive column mapping interface
  - Preview of first 5 rows before importing
  - Batch import to Google Sheets with error reporting
  - Import guide documentation (`docs/IMPORT_GUIDE.md`)
- **API Endpoints**: Three new endpoints for CSV import workflow
  - `POST /api/import/csv/upload` - Upload and parse CSV
  - `POST /api/import/csv/preview` - Preview mapped data
  - `POST /api/import/csv/execute` - Execute batch import
- **Navigation**: Import CSV button added to Leads page
- **Gmail Integration**: Auto-log email activity from Gmail
  - OAuth scope for Gmail read-only access (`gmail.readonly`)
  - `GmailManager` service for fetching emails via Gmail API
  - Email sync functionality in `CRMManager` to auto-log emails as activities
  - API endpoints: `/api/leads/{lead_id}/sync-emails`, `/api/sync-emails/all`, `/api/leads/{lead_id}/email-summary`
  - CLI command: `crm-sync-emails` for syncing emails from command line
  - Background job support for syncing all leads' emails
  - Privacy-conscious implementation with user consent required

## [0.52.0] - 2026-01-18
**AI Enrichment & Data Scaling**

### Added
- **AI Lead Enrichment**: Automatically finds company website, LinkedIn, logo, and industry using Brave Search and OpenAI.
- **Enrichment State**: Real-time "Enriching..." status in the UI with automatic polling.
- **Enhanced Data**: Support for website, LinkedIn profile, and company logo in Leads.
- **Schema Migration**: Automatic migration of existing Google Sheets to the new 17-column lead format.

### Changed
- **Leads Table**: Updated UI to display company logos and quick links.
- **Backend**: Integrated `openai` and `BackgroundTasks` for asynchronous data processing.

## [0.51.0] - 2026-01-18
**The "Paper" Release** - Complete visual overhaul and open-source readiness.

### Changed
- **Styling**: Major visual overhaul to "Paper" aesthetic (`bg-paper`, `color-ink`).
- **Landing Page**: New "Sheety in Action" demo section with transparent background.
- **Branding**: Rebranded from "SheetyCRM" to "Sheety".
- **Navigation**: Redesigned Sheet Indicator dropdown.

### Added
- **Compliance**: GDPR-compliant `Privacy Policy` and `Terms of Service`.
- **Documentation**: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SETUP_GUIDE.md` update.
- **Search**: "Search Everything" demo video.

## [0.50.2] - 2026-01-18
**Fixes & Optimizations**

### Fixed
- **CORS**: Added `sheety.site` and `sheety-crm.pages.dev` to allow-list.
- **Syntax**: Fixed double closing brace in `Header.tsx`.
- **Assets**: Fixed broken video links in `README.md`.

## [0.50.1] - 2026-01-18
**Asset Optimization**

### Added
- **Videos**: Web-optimized demo videos (`_web.mp4`) using H.264/CRF 23.
- **Icons**: Flat SVG icons for "Retro-Futurist Office" theme.
- **Favicon**: Added `icon.svg` application icon.

## [0.50.0] - 2026-01-17
**Digital Paper Theme & Edge**

### Added
- **Theme**: Initial "Digital Paper" theme with `Outfit` typography.
- **Google Picker**: `react-google-drive-picker` integration.
- **Runtime**: `Edge Runtime` support for Cloudflare Pages.
- **Auth**: Migration to `next-auth` v5 (Beta 30).

### Changed
- **Performance**: Backend session caching.
- **Scripts**: Enhanced `generate_dummy_data.py`.

## [0.40.1] - 2026-01-16
**Reliability Patch**

### Fixed
- **Rate Limiting**: Exponential backoff for Google Sheets API/gspread (429 errors).
- **Auth**: 401 interceptor and token refresh handling improvements.

## [0.40.0] - 2026-01-16
**Search & Templates**

### Added
- **Search**: Global search API (`/api/search`) and frontend component.
- **Workflow**: Lead-to-Opportunity conversion flow.
- **Templates**: CSV download endpoint (`/api/sheets/template`).

## [0.30.0] - 2026-01-16
**Security Hardening**

### Security
- **Auth**: Enforced strict Bearer token authentication (no local fallback).
- **Scopes**: Restricted to `drive.file` and `spreadsheets`.

## [0.20.0] - 2026-01-16
**Multi-Sheet Support**

### Added
- **Onboarding**: `/setup` page for sheet selection.
- **Backend**: `/api/sheets` endpoint.
- **UI**: Persistent sheet context in Sidebar.

## [0.1.0] - 2026-01-16
**Initial Release**

- Basic CRM functionality (Leads, Opps, Activities).
- Kanban pipeline view.
- FastAPI backend + Next.js frontend.
