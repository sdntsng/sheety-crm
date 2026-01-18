# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Gmail Integration**: Auto-log email activity from Gmail
  - OAuth scope for Gmail read-only access (`gmail.readonly`)
  - `GmailManager` service for fetching emails via Gmail API
  - Email sync functionality in `CRMManager` to auto-log emails as activities
  - API endpoints: `/api/leads/{lead_id}/sync-emails`, `/api/sync-emails/all`, `/api/leads/{lead_id}/email-summary`
  - CLI command: `crm-sync-emails` for syncing emails from command line
  - Background job support for syncing all leads' emails
  - Privacy-conscious implementation with user consent required

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
