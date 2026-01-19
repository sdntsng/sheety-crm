# Gmail Integration

Sheety CRM can automatically sync your email communications with leads and log them as activities in your CRM.

## Features

- **Automatic Email Discovery**: Search for emails by contact email address
- **Activity Logging**: Automatically log emails as activities in your CRM
- **Background Sync**: Sync emails for all leads in the background
- **Privacy First**: Read-only access, requires explicit user consent
- **Batch Processing**: Efficiently sync multiple contacts at once

## Setup

### 1. Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your Sheety CRM project
3. Enable the **Gmail API** (if not already enabled)

### 2. Update OAuth Consent Screen

Add the Gmail scope to your OAuth consent screen:
- Scope: `https://www.googleapis.com/auth/gmail.readonly`

This scope allows Sheety to read your emails (read-only, no sending or deleting).

### 3. Re-authenticate

Since we've added a new scope, users need to sign out and sign in again to grant the new permission:

1. Sign out of Sheety CRM
2. Sign in again
3. When prompted, grant access to Gmail (read-only)

## Usage

### Via API

#### Sync Emails for a Specific Lead

```bash
POST /api/leads/{lead_id}/sync-emails
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "days_back": 7,
  "auto_log": true
}
```

Response:
```json
{
  "success": true,
  "lead_id": "abc123",
  "emails_synced": 5,
  "activities": [...]
}
```

#### Sync Emails for All Leads (Background)

```bash
POST /api/sync-emails/all
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "days_back": 7,
  "auto_log": true
}
```

Response:
```json
{
  "success": true,
  "message": "Email sync started in background",
  "days_back": 7
}
```

#### Get Email Activity Summary

```bash
GET /api/leads/{lead_id}/email-summary
Authorization: Bearer {your_token}
```

Response:
```json
{
  "total_emails": 12,
  "last_email_date": "2026-01-18T10:30:00",
  "first_email_date": "2026-01-01T08:15:00",
  "recent_emails": [...]
}
```

### Via CLI

Sync emails for a specific lead:
```bash
python -m src.main crm-sync-emails --lead-id abc123 --days 30
```

Sync emails for all leads:
```bash
python -m src.main crm-sync-emails --days 7
```

## Privacy & Security

### What We Access
- **Read-only access** to your Gmail messages
- Only emails to/from contacts in your CRM
- Email metadata (subject, sender, recipient, date)
- Email content (for activity notes/snippets)

### What We DON'T Do
- ❌ Send emails on your behalf
- ❌ Delete or modify emails
- ❌ Access emails not related to your CRM contacts
- ❌ Store email content permanently (only activity logs in your Google Sheet)

### User Consent
- Users must explicitly grant Gmail access during OAuth flow
- The app clearly indicates what data it accesses
- Users can revoke access at any time via Google Account settings

## Technical Implementation

### Architecture

```
Frontend (Next.js)
    ↓ OAuth with gmail.readonly scope
Google OAuth
    ↓ Access Token
Backend (FastAPI)
    ↓ Gmail API calls
Gmail Service (src/gmail.py)
    ↓ Email data
CRM Manager (src/crm/manager.py)
    ↓ Activity creation
Google Sheets (Activities worksheet)
```

### Key Components

1. **GmailManager** (`src/gmail.py`): Handles all Gmail API interactions
   - Search emails by contact
   - Fetch email details
   - Parse email content
   - Batch processing

2. **CRMManager Extensions** (`src/crm/manager.py`): Email sync logic
   - `sync_emails_for_lead()`: Sync emails for one lead
   - `sync_emails_for_all_leads()`: Batch sync for all leads
   - `get_email_activity_summary()`: Get email statistics

3. **API Endpoints** (`api/server.py`): REST API for email sync
   - Individual lead sync
   - Batch background sync
   - Email summaries

4. **CLI Commands** (`src/main.py`): Command-line interface
   - `crm-sync-emails`: Sync emails from terminal

### Background Jobs

The email sync can run in the background using FastAPI's `BackgroundTasks`:

```python
@app.post("/api/sync-emails/all", status_code=202)
def sync_all_emails_background(
    background_tasks: BackgroundTasks,
    request: EmailSyncRequest,
    crm: CRMManager = Depends(get_crm_session)
):
    background_tasks.add_task(
        _background_email_sync,
        crm,
        request.days_back,
        request.auto_log
    )
    return {"success": True, "message": "Email sync started in background"}
```

For production deployments with multiple workers, consider using:
- **Celery** for distributed task queue
- **RQ** (Redis Queue) for simpler async jobs
- **Scheduled cron jobs** for periodic syncing

## Troubleshooting

### "Gmail access not configured"
- Ensure you've granted Gmail permissions during OAuth
- Try signing out and signing in again
- Check that the Gmail API is enabled in Google Cloud Console

### "No emails found"
- Verify the contact has a valid email address
- Check the `days_back` parameter (increase if needed)
- Ensure emails exist in Gmail for that contact

### "Rate limit exceeded"
- Gmail API has usage limits (see [Gmail API quotas](https://developers.google.com/gmail/api/reference/quota))
- Reduce the number of contacts synced at once
- Increase delay between batch operations

## Future Enhancements

Potential improvements for the Gmail integration:

- [ ] **Scheduled Sync**: Automatic background sync on a schedule (hourly/daily)
- [ ] **Smart Filtering**: Only sync emails matching certain criteria (e.g., exclude automated messages)
- [ ] **Thread Analysis**: Group emails by conversation thread
- [ ] **Sentiment Analysis**: Analyze email tone and sentiment
- [ ] **Email Templates**: Quick reply templates based on email context
- [ ] **Attachment Detection**: Flag emails with attachments
- [ ] **Contact Discovery**: Auto-create leads from new email contacts
- [ ] **Two-way Sync**: Update email labels based on CRM activity

## Related Documentation

- [Google Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Setup Guide](../SETUP_GUIDE.md)
- [Architecture](../ARCHITECTURE.md)
