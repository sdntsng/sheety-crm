"""
FastAPI Server for Sales CRM.
Provides REST API endpoints for the Next.js dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date

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
    
    # MOCK MODE check
    if os.getenv("MOCK_DATA_MODE") == "true":
        print(f"[Auth] Mock Mode enabled. Using MockSheetManager.")
        from src.services.local_json import MockSheetManager
        return MockSheetManager()

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
    version="0.52.0"
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
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
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
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
    enrichment_status: Optional[str] = None
    score: Optional[int] = None
    heat_level: Optional[str] = None
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

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Opportunity value must be 0 or greater.")
        return value


class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[str] = None
    value: Optional[float] = None
    probability: Optional[int] = None
    close_date: Optional[date] = None
    product: Optional[str] = None
    notes: Optional[str] = None
    owner: Optional[str] = None

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: Optional[float]) -> Optional[float]:
        if value is None:
            return value
        if value < 0:
            raise ValueError("Opportunity value must be 0 or greater.")
        return value


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
def create_lead(
    data: LeadCreate, 
    background_tasks: BackgroundTasks,
    crm: CRMManager = Depends(get_crm_session)
):
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
        website=data.website,
        linkedin_url=data.linkedin_url,
        logo_url=data.logo_url,
        owner=data.owner,
    )
    created = crm.add_lead(lead)
    
    # Trigger enrichment if company name is present
    if created.company_name:
        background_tasks.add_task(crm.enrich_lead, created.lead_id)
        
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
    if data.website is not None:
        lead.website = data.website
    if data.linkedin_url is not None:
        lead.linkedin_url = data.linkedin_url
    if data.logo_url is not None:
        lead.logo_url = data.logo_url
    if data.enrichment_status is not None:
        lead.enrichment_status = data.enrichment_status
    if data.owner is not None:
        lead.owner = data.owner

    success = crm.update_lead(lead)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update lead")
    return lead.model_dump()


@app.post("/api/leads/{lead_id}/enrich")
def enrich_lead(
    lead_id: str, 
    background_tasks: BackgroundTasks,
    crm: CRMManager = Depends(get_crm_session)
):
    """Manually trigger enrichment for a lead."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    background_tasks.add_task(crm.enrich_lead, lead_id)
    return {"message": "Enrichment started", "lead_id": lead_id}


@app.post("/api/leads/{lead_id}/score")
def score_lead(
    lead_id: str, 
    background_tasks: BackgroundTasks,
    crm: CRMManager = Depends(get_crm_session)
):
    """Manually trigger AI scoring for a lead."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    background_tasks.add_task(crm.score_lead, lead_id)
    return {"message": "Scoring started", "lead_id": lead_id}


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


@app.get("/api/opportunities/{opp_id}/analysis")
def analyze_opportunity(opp_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Get AI analysis for an opportunity."""
    analysis = crm.analyze_deal(opp_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return analysis


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
