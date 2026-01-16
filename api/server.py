"""
FastAPI Server for Sales CRM.
Provides REST API endpoints for the Next.js dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    
    # Try token-based auth first if provided
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        if token:
            try:
                creds = Credentials(token=token)
                gc = gspread.authorize(creds)
                # Test the connection
                gc.list_spreadsheet_files()
                return SheetManager(gc)
            except Exception as e:
                print(f"Token auth failed: {e}, falling back to local auth")
                # Fall through to local auth
    
    # Local fallback (uses token.json or env credentials)
    try:
        gc, _ = authenticate()
        return SheetManager(gc)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

app = FastAPI(
    title="Sales CRM API",
    description="REST API for Sales Pipeline CRM backed by Google Sheets",
    version="1.0.0"
)

# CORS for Next.js frontend (allow all localhost ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3026",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3026",
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
    # Filter or just return all? Returning all for now.
    # We might want to filter by mimeType if list_files doesn't already?
    # gspread list_spreadsheet_files does filtering.
    return {"sheets": files}


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
    success = crm.move_opportunity_stage(opp_id, PipelineStage(data.stage))
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
