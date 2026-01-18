# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.51.0] - 2026-01-18

### Changed
- **Styling**: Major visual overhaul to "Paper" aesthetic:
    - Implemented `bg-paper` texture and `color-ink` theme system.
    - Updated `LandingPage.tsx` with transparent background demo section.
    - Switched typography to `Outfit` (sans) and `Playfair Display` (serif).
- **Navigation**: Redesigned Header:
    - Replaced sheet button with Dropdown (`Open` external / `Change` internal).
    - Added "Sheety" SVG Icon logo.
    - Added conditional rendering for authenticated/unauthenticated states.
- **Copy**: consistent "Sheety" branding (renamed from "Vinci CRM"/"SheetyCRM").
- **Architecture**: Separated `api/` (FastAPI server) from `src/` (CLI) directory structure.

### Added
- **Compliance**:
    - `Privacy Policy` page (GDPR compliant).
    - `Terms of Service` page.
    - `Footer` component with legal links.
- **Documentation**:
    - `CONTRIBUTING.md` with PR/Issue guidelines.
    - `CODE_OF_CONDUCT.md`.
    - `SETUP_GUIDE.md` updated with production OAuth domains.
    - `.github/ISSUE_TEMPLATE` (Bug, Feature) and `PULL_REQUEST_TEMPLATE`.
- **Assets**:
    - Web-optimized demo videos (`_web.mp4`) using H.264/CRF 23.
    - Added `QuicklySearchLeadsAndOpps.mp4` to landing page.
- **Features**:
    - "Search Everything" showcase on landing page (Shortcut `/`).
    - Added `sheety.site` and `sheety-crm.pages.dev` to CORS whitelist.

### Fixed
- **UI Bugs**:
    - Fixed `Header.tsx` syntax error (double closing brace).
    - Fixed broken video links in `README.md` (replaced with static `DatabaseHomeStatic.png`).
- **Profile**: Added fallback to initials when user avatar fails to load.

## [0.50.0] - 2026-01-17

### Added
- **Theme**: "Digital Paper" visual theme foundations:
    - Added `globals.css` variables for paper palette.
    - Integrated `Outfit` and `Playfair Display` fonts.
- **Google Picker**:
    - Integrated `react-google-drive-picker` for seamless sheet selection.
    - Removed `showViewList` config to fix Picker display issues.
- **Auth**:
    - Migrated to `next-auth` v5 (Beta 30).
    - Added `edge` runtime support for Cloudflare Pages deployment.

### Changed
- **Performance**:
    - Implemented caching for CRM session to reduce API calls.
    - Added `CRMManager` optimizations for batch data fetching.
- **Scripts**:
    - Enhanced `generate_dummy_data.py` to prompt for sheet creation.
    - Added automatic worksheet creation (`Leads`, `Opportunities`) if missing.
- **Refactor**: Removed legacy CSS variables in favor of semantic theme tokens.

## [0.40.0] - 2026-01-16

### Added
- **Search**:
    - Implemented global search API (`/api/search`).
    - Added frontend SearchBar component with debounce.
- **Workflow**:
    - Added "Turn Lead to Opportunity" button in Lead Card.
    - Implemented automatic linking of `lead_id` in new Opportunities.
- **Templates**:
    - Added `/api/sheets/template` endpoint for CSV download.
    - Implemented auto-schema initialization logic in `CRMTemplates`.

### Fixed
- **API Reliability**:
    - Added `gspread` retry decorator with exponential backoff for 429 errors.
    - Added `sheets_api_retry` wrapper in `SheetManager`.
- **Auth**:
    - Added 401 interceptor in `api.ts` to handle expired tokens.
    - Improved error messages during token refresh failure.

## [0.30.0] - 2026-01-16

### Security
- **Multi-tenancy**:
    - Removed `token.json` fallback in production environment.
    - Enforced `Bearer` token requirement for all `/api/*` endpoints.
- **Scopes**:
    - Downgraded `drive` scope to `drive.file` for privacy (access only selected files).
    - Added `drive.readonly` scope for `gspread` compatibility.

### Fixed
- **Auth Flow**: Fixed "No refresh token" error by forcing `access_type=offline` and `prompt=consent` in NextAuth config.

## [0.20.0] - 2026-01-16

### Added
- **Onboarding**:
    - Created `/setup` page for users without a connected sheet.
    - Added "Connect Sheet" flow using Google Picker.
- **API**:
    - Added `/api/sheets` endpoint to list user's spreadsheet files.
- **UI**:
    - Added `Sidebar` component with "Active Sheet" indicator.
    - Added persistent sheet selection in `localStorage`.

### UX
- **Setup**:
    - Removed CLI code snippets from Setup page in favor of UI-driven flow.
    - Added "Retry" button for failed sheet connections.

## [0.1.0] - 2026-01-16

### Initial Release
- **Core CRM**:
    - Leads management (CRUD).
    - Opportunities pipeline (Kanban view).
    - Activity logging (Feed view).
- **Backend**:
    - Python FastAPI server.
    - `gspread` integration for Google Sheets DB.
- **Frontend**:
    - Next.js 15 App Router.
    - Tailwind CSS styling.
