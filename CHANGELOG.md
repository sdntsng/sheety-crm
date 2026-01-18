# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.51.0] - 2026-01-18

### Changed
- **Styling**: Major visual overhaul to "Paper" aesthetic across Dashboard and Landing Page.
- **Landing Page**: New "Sheety in Action" demo section with web-optimized videos and transparent, themed background.
- **Branding**: Rebranded from "SheetyCRM" to "Sheety".
- **Navigation**: Redesigned Sheet Indicator in header as a dropdown with "Open in Sheets" and "Change Sheet" options.
- **Architecture**: Separated `api/` (API server) from `src/` (CLI logic) for clearer separation of concerns.

### Added
- **Compliance**: Added GDPR-compliant `Privacy Policy` and `Terms of Service` pages.
- **Documentation**: Added `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and updated `SETUP_GUIDE.md` with production OAuth instructions.
- **Assets**: Added web-optimized demo videos (`_web.mp4`) to reduce load times.
- **Search**: Added "Search Everything" demo to landing page showcase.
- **CORS**: Added production domains (`sheety.site`, `sheety-crm.pages.dev`) to API CORS whitelist.

### Fixed
- **Responsiveness**: Improved mobile layout for feature demos.
- **Linting**: Fixed syntax errors in `Header.tsx`.

## [0.50.0] - 2026-01-17

### Added
- **Theme**: Implemented "Digital Paper" visual theme with `Outfit` typography and textured backgrounds.
- **Google Picker**: Integrated Google Picker API for easier sheet selection.
- **Auth**: Migrated to NextAuth v5 for Cloudflare Edge compatibility.
- **Deployment**: Added `Edge Runtime` support for Cloudflare Pages.

### Changed
- **Performance**: Optimized backend sheet operations with caching.
- **UX**: Switching typography to Outfit and Sans system.

## [0.40.0] - 2026-01-16

### Added
- **Features**: Global search across leads and opportunities.
- **Workflow**: Lead-to-Opportunity conversion flow.
- **Templates**: CSV template download and auto-schema initialization.

### Fixed
- **Reliability**: Added exponential backoff retry for Google Sheets API rate limits.
- **Auth**: Improved 401 interceptor and token refresh handling.

## [0.30.0] - 2026-01-16

### Security
- **Multi-tenancy**: Enforced strict Bearer token authentication (removed local fallback in production).
- **Scopes**: Switched to `drive.file` scope for better privacy (user selected files only).

## [0.20.0] - 2026-01-16

### Added
- **Setup**: Created `Setup` page for sheet selection.
- **API**: Added `api/sheets` endpoint.
- **UX**: Redesigned Sidebar with active sheet context.

## [0.1.0] - 2026-01-16

### Initial Release
- Basic CRM functionality with Google Sheets backend.
- Leads, Opportunities, and Activity tracking.
- Kanban pipeline view.
