# Data Import Guide

The Data Import Wizard allows you to quickly migrate leads from other CRM systems or Excel spreadsheets into Sheety.

## Features

- **CSV Upload**: Import leads from any CSV file
- **Auto-detection**: Automatically matches CSV columns to CRM fields
- **Column Mapping**: Manually map columns if auto-detection doesn't match perfectly
- **Preview**: Review first 5 rows before importing to catch issues early
- **Batch Import**: Efficiently imports all leads in one operation to Google Sheets
- **Error Reporting**: Shows which rows had errors and why

## How to Use

### 1. Access the Import Wizard

Navigate to the **Leads** page and click the **Import CSV** button in the top right.

### 2. Upload Your CSV File

- Click to select a CSV file or drag and drop
- Your file should include headers in the first row
- Example format:
  ```
  Company,Contact,Email,Phone,Status,Source
  Acme Corp,John Smith,john@acme.com,555-0100,New,Website
  ```

### 3. Map Columns

The wizard will auto-detect column mappings based on header names. Common patterns recognized:

| CSV Header Examples | Maps To |
|---------------------|---------|
| Company, Organization, Business | Company Name |
| Contact, Name, Person | Contact Name |
| Email, E-mail | Email |
| Phone, Telephone, Mobile | Phone |
| Status, Lead Status | Status |
| Source, Lead Source, Channel | Source |
| Industry, Sector | Industry |
| Size, Company Size, Employees | Company Size |
| Notes, Description, Comments | Notes |
| Owner, Assigned To, Rep | Owner |

You can manually adjust mappings if needed. Select **"-- Skip this column --"** for columns you don't want to import.

**Required Fields:**
- Company Name (required)
- Contact Name (required)

### 4. Preview Data

Review how the first 5 rows will be imported. This helps catch:
- Incorrect column mappings
- Missing required data
- Formatting issues

Click **"← Back to Mapping"** to adjust if needed.

### 5. Execute Import

Click **"Import X Leads"** to batch import all rows to your Google Sheet.

The wizard will:
- Validate each row
- Skip rows with missing required fields
- Report any errors
- Show final import statistics

### 6. Review Results

After import:
- See how many leads were successfully imported
- Review any errors (if applicable)
- Click **"View Leads"** to see your imported data
- Or **"Import Another File"** to import more data

## Tips for Best Results

1. **Clean your data first**: Remove duplicate rows, fix formatting issues
2. **Use consistent headers**: The auto-detection works best with standard column names
3. **Test with a small file**: Import 5-10 rows first to verify mappings
4. **Check required fields**: Ensure Company Name and Contact Name are populated
5. **Match status values**: Use status values that exist in Sheety (New, Contacted, Qualified, etc.)

## Supported CSV Format

- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Headers**: Required in first row
- **Max file size**: No hard limit, but very large files (>10,000 rows) may take longer

## Troubleshooting

**Upload failed?**
- Check file is valid CSV format
- Ensure UTF-8 encoding (not Excel's default encoding)
- Try exporting from Excel as "CSV UTF-8"

**Rows skipped during import?**
- Check error report for specific issues
- Ensure Company Name and Contact Name are present
- Verify status/source values match allowed values

**Import is slow?**
- Large imports (1000+ rows) may take a minute
- Google Sheets API has rate limits
- Consider breaking very large files into smaller batches

## Migrating from Other CRMs

### From HubSpot
1. Export contacts as CSV from HubSpot
2. Common mappings:
   - "Company name" → Company Name
   - "First name" + "Last name" → Contact Name (combine first)
   - "Lifecycle stage" → Status

### From Salesforce
1. Export Leads or Contacts as CSV
2. Common mappings:
   - "Company" → Company Name
   - "Name" → Contact Name
   - "Lead Status" → Status
   - "Lead Source" → Source

### From Excel
1. Save as CSV (UTF-8)
2. Ensure first row has headers
3. One lead per row
