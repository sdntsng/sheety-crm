"""
FastAPI Server for Sales CRM.
Provides REST API endpoints for the Next.js dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
import csv
import io

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.auth import authenticate
from src.sheets import SheetManager
from src.crm.manager import CRMManager
from api.deps import get_crm_session
from fastapi import Depends
from src.crm.models import (
    Lead, Opportunity, Activity,
    LeadStatus, LeadSource, PipelineStage, ActivityType, CompanySize
)

# New dependency for just authenticated SheetManager (without CRM session)
async def get_sheet_manager(authorization: Optional[str] = Header(None)):
    from src.auth import authenticate
    from google.oauth2.credentials import Credentials
    from src.sheets import SheetManager
    import gspread
    
    # Require Bearer token
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required. Please sign in.")
    
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    try:
        print(f"[Auth] Attempting token auth (first 20 chars): {token[:20]}...")
        creds = Credentials(token=token)
        gc = gspread.authorize(creds)
        # Test the connection
        gc.list_spreadsheet_files()
        print("[Auth] Token auth successful")
        return SheetManager(gc)
    except Exception as e:
        print(f"[Auth] Token auth failed: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Google authentication failed. Please sign out and sign in again to refresh your session."
        )

app = FastAPI(
    title="Sales CRM API",
    description="REST API for Sales Pipeline CRM backed by Google Sheets",
    version="0.51.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:3000",
        "http://localhost:3026",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3026",
        # Production
        "https://sheety.site",
        "https://www.sheety.site",
        "https://sheety-crm.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global CRM manager removed in favor of Dependency Injection (api.deps)



# =============================================================================
# Request/Response Models
# =============================================================================

class LeadCreate(BaseModel):
    company_name: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str = "New"
    source: str = "Other"
    industry: Optional[str] = None
    company_size: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None


class OpportunityCreate(BaseModel):
    lead_id: str
    title: str
    stage: str = "Prospecting"
    value: float = 0.0
    probability: int = 50
    close_date: Optional[date] = None
    product: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None


class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[str] = None
    value: Optional[float] = None
    probability: Optional[int] = None
    close_date: Optional[date] = None
    product: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None


class ActivityCreate(BaseModel):
    lead_id: str
    opp_id: Optional[str] = None
    type: str = "Note"
    subject: str
    description: Optional[str] = None
    created_by: Optional[str] = None


class StageUpdate(BaseModel):
    stage: str


# =============================================================================
# Root & Health
# =============================================================================

@app.get("/")
def root():
    return {"message": "Sales CRM API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/sheets")
def list_available_sheets(sm: SheetManager = Depends(get_sheet_manager)):
    """List all Google Sheets available to the user."""
    files = sm.list_files()
    return {"sheets": files}


class CreateSheetRequest(BaseModel):
    name: str = "Sales Pipeline 2026"


@app.post("/api/sheets/create")
def create_crm_sheet(request: CreateSheetRequest, sm: SheetManager = Depends(get_sheet_manager)):
    """Create a new CRM spreadsheet with all required worksheets."""
    from src.crm.templates import CRMTemplates
    import traceback
    
    try:
        print(f"[CreateSheet] Creating CRM sheet: {request.name}")
        templates = CRMTemplates(sm.gc)
        sh = templates.create_crm_sheet(request.name)
        print(f"[CreateSheet] Successfully created: {sh.url}")
        return {
            "success": True,
            "sheet": {
                "id": sh.id,
                "name": request.name,
                "url": sh.url
            }
        }
    except Exception as e:
        print(f"[CreateSheet] ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sheets/{sheet_id}/schema")
def ensure_schema_sheet(sheet_id: str, sm: SheetManager = Depends(get_sheet_manager)):
    """Add the Schema reference sheet to an existing CRM."""
    from src.crm.templates import CRMTemplates
    import traceback
    
    try:
        print(f"[SchemaSheet] Adding schema to sheet: {sheet_id}")
        sh = sm.gc.open_by_key(sheet_id)
        templates = CRMTemplates(sm.gc)
        # Force creation if missing
        templates.setup_schema_sheet(templates.ensure_worksheet(sh, "_Schema"))
        return {"success": True}
    except Exception as e:
        print(f"[SchemaSheet] ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Leads Endpoints
# =============================================================================

@app.get("/api/leads")
def list_leads(
    status: Optional[str] = Query(None, description="Filter by status"),
    source: Optional[str] = Query(None, description="Filter by source"),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get all leads, optionally filtered."""
    # crm = get_crm() -> Injected
    leads = crm.get_leads()

    if status:
        leads = [l for l in leads if l.status.value == status]
    if source:
        leads = [l for l in leads if l.source.value == source]

    return {"leads": [l.model_dump() for l in leads], "count": len(leads)}


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Get a specific lead by ID."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead.model_dump()


@app.post("/api/leads", status_code=201)
def create_lead(data: LeadCreate, crm: CRMManager = Depends(get_crm_session)):
    """Create a new lead."""
    lead = Lead(
        company_name=data.company_name,
        contact_name=data.contact_name,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        status=LeadStatus(data.status) if data.status in [s.value for s in LeadStatus] else LeadStatus.NEW,
        source=LeadSource(data.source) if data.source in [s.value for s in LeadSource] else LeadSource.OTHER,
        industry=data.industry,
        company_size=CompanySize(data.company_size) if data.company_size in [s.value for s in CompanySize] else None,
        notes=data.notes,
        owner=data.owner,
    )
    created = crm.add_lead(lead)
    return created.model_dump()


@app.put("/api/leads/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate, crm: CRMManager = Depends(get_crm_session)):
    """Update an existing lead."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update fields if provided
    if data.company_name:
        lead.company_name = data.company_name
    if data.contact_name:
        lead.contact_name = data.contact_name
    if data.contact_email is not None:
        lead.contact_email = data.contact_email
    if data.contact_phone is not None:
        lead.contact_phone = data.contact_phone
    if data.status:
        lead.status = LeadStatus(data.status)
    if data.source:
        lead.source = LeadSource(data.source)
    if data.industry is not None:
        lead.industry = data.industry
    if data.company_size:
        lead.company_size = CompanySize(data.company_size)
    if data.notes is not None:
        lead.notes = data.notes
    if data.owner is not None:
        lead.owner = data.owner

    success = crm.update_lead(lead)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update lead")
    return lead.model_dump()


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Delete a lead."""
    success = crm.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"deleted": True}


# =============================================================================
# Opportunities Endpoints
# =============================================================================

@app.get("/api/opportunities")
def list_opportunities(
    stage: Optional[str] = Query(None, description="Filter by pipeline stage"),
    lead_id: Optional[str] = Query(None, description="Filter by lead"),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get all opportunities, optionally filtered."""
    opps = crm.get_opportunities()

    if stage:
        opps = [o for o in opps if o.stage.value == stage]
    if lead_id:
        opps = [o for o in opps if o.lead_id == lead_id]

    return {"opportunities": [o.model_dump() for o in opps], "count": len(opps)}


@app.get("/api/opportunities/{opp_id}")
def get_opportunity(opp_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Get a specific opportunity by ID."""
    opp = crm.get_opportunity(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp.model_dump()


@app.post("/api/opportunities", status_code=201)
def create_opportunity(data: OpportunityCreate, crm: CRMManager = Depends(get_crm_session)):
    """Create a new opportunity."""

    # Verify lead exists
    lead = crm.get_lead(data.lead_id)
    if not lead:
        raise HTTPException(status_code=400, detail="Lead not found")

    opp = Opportunity(
        lead_id=data.lead_id,
        title=data.title,
        stage=PipelineStage(data.stage) if data.stage in [s.value for s in PipelineStage] else PipelineStage.PROSPECTING,
        value=data.value,
        probability=data.probability,
        close_date=data.close_date,
        product=data.product,
        notes=data.notes,
        owner=data.owner,
    )
    created = crm.add_opportunity(opp)
    return created.model_dump()


@app.put("/api/opportunities/{opp_id}")
def update_opportunity(opp_id: str, data: OpportunityUpdate, crm: CRMManager = Depends(get_crm_session)):
    """Update an existing opportunity."""
    opp = crm.get_opportunity(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if data.title:
        opp.title = data.title
    if data.stage:
        opp.stage = PipelineStage(data.stage)
    if data.value is not None:
        opp.value = data.value
    if data.probability is not None:
        opp.probability = data.probability
    if data.close_date is not None:
        opp.close_date = data.close_date
    if data.product is not None:
        opp.product = data.product
    if data.notes is not None:
        opp.notes = data.notes
    if data.owner is not None:
        opp.owner = data.owner

    success = crm.update_opportunity(opp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update opportunity")
    return opp.model_dump()


@app.patch("/api/opportunities/{opp_id}/stage")
def update_opportunity_stage(opp_id: str, data: StageUpdate, crm: CRMManager = Depends(get_crm_session)):
    """Update only the stage of an opportunity (for drag-and-drop)."""
    # Validate enum lookup
    try:
        target_stage = PipelineStage(data.stage)
    except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid stage: {data.stage}")

    success = crm.move_opportunity_stage(opp_id, target_stage)
    if not success:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    return {"updated": True, "new_stage": data.stage}


@app.delete("/api/opportunities/{opp_id}")
def delete_opportunity(opp_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Delete an opportunity."""
    success = crm.delete_opportunity(opp_id)
    if not success:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"deleted": True}


# =============================================================================
# Activities Endpoints
# =============================================================================

@app.get("/api/activities")
def list_activities(
    lead_id: Optional[str] = Query(None),
    opp_id: Optional[str] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get activities, optionally filtered by lead or opportunity."""
    activities = crm.get_activities(lead_id=lead_id, opp_id=opp_id)
    return {"activities": [a.model_dump() for a in activities], "count": len(activities)}


@app.post("/api/activities", status_code=201)
def create_activity(data: ActivityCreate, crm: CRMManager = Depends(get_crm_session)):
    """Log a new activity."""

    # Verify lead exists
    lead = crm.get_lead(data.lead_id)
    if not lead:
        raise HTTPException(status_code=400, detail="Lead not found")

    activity = Activity(
        lead_id=data.lead_id,
        opp_id=data.opp_id,
        type=ActivityType(data.type) if data.type in [t.value for t in ActivityType] else ActivityType.NOTE,
        subject=data.subject,
        description=data.description,
        created_by=data.created_by,
    )
    created = crm.log_activity(activity)
    return created.model_dump()


# =============================================================================
# Dashboard Endpoints
# =============================================================================

@app.get("/api/dashboard")
def get_dashboard(crm: CRMManager = Depends(get_crm_session)):
    """Get dashboard summary data."""
    return crm.get_pipeline_summary()


@app.get("/api/pipeline")
def get_pipeline(crm: CRMManager = Depends(get_crm_session)):
    """Get pipeline data formatted for Kanban view."""
    opps = crm.get_opportunities()
    leads = {l.lead_id: l for l in crm.get_leads()}

    # Group by stage
    pipeline = {}
    for stage in PipelineStage:
        stage_opps = [o for o in opps if o.stage == stage]
        pipeline[stage.value] = {
            "stage": stage.value,
            "opportunities": [
                {
                    **o.model_dump(),
                    "lead": leads.get(o.lead_id).model_dump() if o.lead_id in leads else None
                }
                for o in stage_opps
            ],
            "count": len(stage_opps),
            "total_value": sum(o.value for o in stage_opps),
        }

    return {
        "pipeline": pipeline,
        "stages": [s.value for s in PipelineStage],
    }


@app.get("/api/config")
def get_config():
    """Get CRM configuration (stages, statuses, etc.) for frontend dropdowns."""
    return {
        "pipeline_stages": [s.value for s in PipelineStage],
        "lead_statuses": [s.value for s in LeadStatus],
        "lead_sources": [s.value for s in LeadSource],
        "activity_types": [t.value for t in ActivityType],
        "company_sizes": [s.value for s in CompanySize],
    }


# =============================================================================
# Search Endpoint
# =============================================================================

@app.get("/api/search")
def search_all(
    q: str = Query(..., min_length=1, description="Search query"),
    crm: CRMManager = Depends(get_crm_session),
):
    """
    Global search across leads and opportunities.
    Returns results grouped by entity type.
    """
    query = q.lower().strip()
    
    # Search leads
    leads = crm.get_leads()
    matching_leads = [
        l for l in leads
        if query in l.company_name.lower()
        or query in l.contact_name.lower()
        or (l.contact_email and query in l.contact_email.lower())
        or (l.industry and query in l.industry.lower())
    ]
    
    # Search opportunities
    opps = crm.get_opportunities()
    leads_by_id = {l.lead_id: l for l in leads}
    matching_opps = [
        o for o in opps
        if query in o.title.lower()
        or (o.product and query in o.product.lower())
        or (o.notes and query in o.notes.lower())
        # Also match by company name of associated lead
        or (o.lead_id in leads_by_id and query in leads_by_id[o.lead_id].company_name.lower())
    ]
    
    return {
        "query": q,
        "results": {
            "leads": [
                {
                    **l.model_dump(),
                    "type": "lead",
                }
                for l in matching_leads[:10]  # Limit to 10 results
            ],
            "opportunities": [
                {
                    **o.model_dump(),
                    "type": "opportunity",
                    "lead": leads_by_id.get(o.lead_id).model_dump() if o.lead_id in leads_by_id else None,
                }
                for o in matching_opps[:10]
            ],
        },
        "total": len(matching_leads) + len(matching_opps),
    }


# =============================================================================
# Data Import Endpoints
# =============================================================================

class ColumnMapping(BaseModel):
    """Mapping of CSV column to CRM field."""
    csv_column: str
    crm_field: str


class ImportPreviewRequest(BaseModel):
    """Request for previewing CSV data with column mappings."""
    mappings: List[ColumnMapping]


class ImportRequest(BaseModel):
    """Request for importing CSV data."""
    mappings: List[ColumnMapping]


@app.post("/api/import/csv/upload")
async def upload_csv_file(
    file: UploadFile = File(...),
):
    """
    Upload and parse a CSV file.
    Returns the headers and first 5 rows for preview and mapping.
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read file content
        content = await file.read()
        decoded_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.reader(io.StringIO(decoded_content))
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        headers = rows[0]
        preview_rows = rows[1:6]  # First 5 data rows
        total_rows = len(rows) - 1  # Excluding header
        
        # Auto-detect possible mappings
        suggested_mappings = _auto_detect_mappings(headers)
        
        return {
            "success": True,
            "headers": headers,
            "preview_rows": preview_rows,
            "total_rows": total_rows,
            "suggested_mappings": suggested_mappings,
        }
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid CSV encoding. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing CSV: {str(e)}")


@app.post("/api/import/csv/preview")
async def preview_import(
    file: UploadFile = File(...),
    mappings: str = Query(..., description="JSON string of column mappings"),
):
    """
    Preview how CSV data will be imported with the given column mappings.
    Returns first 5 rows mapped to CRM fields.
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Parse mappings from JSON string
        import json
        mappings_list = json.loads(mappings)
        mapping_dict = {m['csv_column']: m['crm_field'] for m in mappings_list}
        
        # Read and parse CSV
        content = await file.read()
        decoded_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        headers = rows[0]
        data_rows = rows[1:6]  # First 5 data rows
        
        # Transform rows based on mappings
        preview_data = []
        for row in data_rows:
            mapped_row = {}
            for i, header in enumerate(headers):
                if header in mapping_dict and i < len(row):
                    crm_field = mapping_dict[header]
                    mapped_row[crm_field] = row[i]
            preview_data.append(mapped_row)
        
        return {
            "success": True,
            "preview": preview_data,
            "row_count": len(preview_data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing import: {str(e)}")


@app.post("/api/import/csv/execute")
async def execute_import(
    file: UploadFile = File(...),
    mappings: str = Query(..., description="JSON string of column mappings"),
    crm: CRMManager = Depends(get_crm_session),
):
    """
    Execute the CSV import with the given column mappings.
    Batch appends leads to the Google Sheet.
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Parse mappings from JSON string
        import json
        mappings_list = json.loads(mappings)
        mapping_dict = {m['csv_column']: m['crm_field'] for m in mappings_list}
        
        # Read and parse CSV
        content = await file.read()
        decoded_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        headers = rows[0]
        data_rows = rows[1:]  # All data rows
        
        # Transform and validate rows
        leads_to_import = []
        errors = []
        
        for idx, row in enumerate(data_rows, start=2):  # Start at 2 (1 is header)
            try:
                mapped_data = {}
                for i, header in enumerate(headers):
                    if header in mapping_dict and i < len(row):
                        crm_field = mapping_dict[header]
                        mapped_data[crm_field] = row[i].strip() if row[i] else ""
                
                # Required fields check
                if not mapped_data.get('company_name') or not mapped_data.get('contact_name'):
                    errors.append({
                        "row": idx,
                        "error": "Missing required fields: company_name or contact_name"
                    })
                    continue
                
                # Create Lead object
                lead = Lead(
                    company_name=mapped_data.get('company_name', ''),
                    contact_name=mapped_data.get('contact_name', ''),
                    contact_email=mapped_data.get('contact_email'),
                    contact_phone=mapped_data.get('contact_phone'),
                    status=LeadStatus(mapped_data.get('status', 'New')) if mapped_data.get('status') in [s.value for s in LeadStatus] else LeadStatus.NEW,
                    source=LeadSource(mapped_data.get('source', 'Other')) if mapped_data.get('source') in [s.value for s in LeadSource] else LeadSource.OTHER,
                    industry=mapped_data.get('industry'),
                    company_size=CompanySize(mapped_data.get('company_size')) if mapped_data.get('company_size') in [s.value for s in CompanySize] else None,
                    notes=mapped_data.get('notes'),
                    owner=mapped_data.get('owner'),
                )
                leads_to_import.append(lead)
                
            except Exception as e:
                errors.append({
                    "row": idx,
                    "error": str(e)
                })
        
        # Batch import leads
        imported_count = 0
        if leads_to_import:
            # Convert leads to rows
            rows_to_append = [lead.to_row() for lead in leads_to_import]
            
            # Use batch append
            try:
                crm.sm.append_rows(crm.sheet_name, rows_to_append, "Leads")
                imported_count = len(leads_to_import)
                crm._invalidate_cache("Leads")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to import to Google Sheets: {str(e)}")
        
        return {
            "success": True,
            "imported": imported_count,
            "total_rows": len(data_rows),
            "errors": errors,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing import: {str(e)}")


def _auto_detect_mappings(headers: List[str]) -> List[Dict[str, str]]:
    """
    Auto-detect possible column mappings based on header names.
    Returns list of suggested mappings.
    """
    # Common header name patterns
    field_patterns = {
        'company_name': ['company', 'company name', 'organization', 'org', 'business'],
        'contact_name': ['contact', 'name', 'contact name', 'full name', 'person'],
        'contact_email': ['email', 'e-mail', 'contact email', 'email address'],
        'contact_phone': ['phone', 'telephone', 'contact phone', 'phone number', 'mobile'],
        'status': ['status', 'lead status', 'stage'],
        'source': ['source', 'lead source', 'origin', 'channel'],
        'industry': ['industry', 'sector', 'vertical'],
        'company_size': ['size', 'company size', 'employees', 'headcount'],
        'notes': ['notes', 'note', 'description', 'comments', 'remarks'],
        'owner': ['owner', 'assigned to', 'rep', 'sales rep'],
    }
    
    suggestions = []
    for header in headers:
        header_lower = header.lower().strip()
        for crm_field, patterns in field_patterns.items():
            if header_lower in patterns or any(pattern in header_lower for pattern in patterns):
                suggestions.append({
                    "csv_column": header,
                    "crm_field": crm_field,
                })
                break
    
    return suggestions

