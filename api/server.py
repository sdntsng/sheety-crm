"""
FastAPI Server for Sales CRM.
Provides REST API endpoints for the Next.js dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, Header, BackgroundTasks, File, UploadFile, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import date
import csv
import io
try:
    import multipart  # type: ignore  # noqa: F401
    MULTIPART_AVAILABLE = True
except ImportError:
    MULTIPART_AVAILABLE = False

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.auth import authenticate
from src.sheets import SheetManager
from src.crm.manager import CRMManager
from api.deps import get_crm_session
from fastapi import Depends
from src.crm.models import (
    Lead,
    Opportunity,
    Activity,
    Task,
    SavedView,
    CustomFieldDefinition,
    CustomFieldType,
    TaskStatus,
    TaskPriority,
    LeadStatus,
    LeadSource,
    PipelineStage,
    ActivityType,
    CompanySize,
)
from src.crm.ai import AIManager

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
    custom_fields: Optional[Dict[str, Any]] = None
    auto_enrich: bool = False


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    score: Optional[int] = None
    notes: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
    enrichment_status: Optional[str] = None
    heat_level: Optional[str] = None
    owner: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


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
    custom_fields: Optional[Dict[str, Any]] = None

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
    custom_fields: Optional[Dict[str, Any]] = None

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


class EmailDraftRequest(BaseModel):
    purpose: Optional[str] = "Introduction"
    tone: Optional[str] = "Professional"


class TaskCreate(BaseModel):
    title: str
    due_date: Optional[date] = None
    status: str = "Open"
    priority: str = "Medium"
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None
    assignee: Optional[str] = None
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None
    assignee: Optional[str] = None
    notes: Optional[str] = None


class SavedViewCreate(BaseModel):
    name: str
    entity: str
    filters: List[Dict[str, Any]] = Field(default_factory=list)
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    owner: Optional[str] = None
    is_shared: bool = False


class SavedViewUpdate(BaseModel):
    name: Optional[str] = None
    entity: Optional[str] = None
    filters: Optional[List[Dict[str, Any]]] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = None
    owner: Optional[str] = None
    is_shared: Optional[bool] = None


class BulkOperationRequest(BaseModel):
    operation: str  # update_status | update_stage | delete
    ids: List[str]
    status: Optional[str] = None
    stage: Optional[str] = None


class DuplicateMergeRequest(BaseModel):
    lead_a_id: str
    lead_b_id: str
    primary_id: Optional[str] = None
    selected_fields: Dict[str, Any] = Field(default_factory=dict)


class CustomFieldCreate(BaseModel):
    entity: str
    key: str
    label: str
    field_type: str = "text"
    required: bool = False
    options: List[str] = Field(default_factory=list)
    validation_rule: Optional[str] = None


class CustomFieldUpdate(BaseModel):
    entity: Optional[str] = None
    key: Optional[str] = None
    label: Optional[str] = None
    field_type: Optional[str] = None
    required: Optional[bool] = None
    options: Optional[List[str]] = None
    validation_rule: Optional[str] = None


class AIParseRequest(BaseModel):
    query: str


class AIExecuteRequest(BaseModel):
    operation: Dict[str, Any]


class AIExplainRequest(BaseModel):
    topic: str


class ParseNotesRequest(BaseModel):
    content: str
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None


class ApplyParsedNotesRequest(BaseModel):
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    deal_updates: Dict[str, Any] = Field(default_factory=dict)
    key_points: List[str] = Field(default_factory=list)


class CoachAskRequest(BaseModel):
    question: str
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None


class ForecastScenarioRequest(BaseModel):
    remove_opp_ids: List[str] = Field(default_factory=list)
    force_close_opp_ids: List[str] = Field(default_factory=list)


class IntegrationConnectRequest(BaseModel):
    config: Dict[str, Any] = Field(default_factory=dict)


class IntegrationSyncRequest(BaseModel):
    idempotency_key: Optional[str] = None
    max_retries: int = 1


def _lead_payload(crm: CRMManager, lead: Lead) -> Dict[str, Any]:
    payload = lead.model_dump()
    payload["custom_fields"] = crm.get_custom_field_values("leads", lead.lead_id)
    return payload


def _opportunity_payload(crm: CRMManager, opp: Opportunity) -> Dict[str, Any]:
    payload = opp.model_dump()
    payload["custom_fields"] = crm.get_custom_field_values("opportunities", opp.opp_id)
    return payload


def _parse_ai_intent(query: str, crm: CRMManager) -> Dict[str, Any]:
    normalized = query.strip()
    lowered = normalized.lower()

    if lowered.startswith("create lead") or lowered.startswith("add lead"):
        # Example: "create lead for John Smith at Acme"
        import re
        match = re.search(r"(?:for\s+)?(.+?)\s+at\s+(.+)$", normalized, re.IGNORECASE)
        if match:
            contact = match.group(1).strip()
            company = match.group(2).strip()
        else:
            contact = "Unknown Contact"
            company = normalized.replace("create lead", "").replace("add lead", "").strip() or "Unknown Company"

        return {
            "intent": "action",
            "operation": {
                "type": "create_lead",
                "company_name": company,
                "contact_name": contact,
                "status": "New",
                "source": "Other",
            },
            "confirmation_needed": True,
            "response": f"Prepared new lead: {contact} at {company}.",
        }

    if lowered.startswith("move") and " to " in lowered:
        import re
        match = re.search(r"move\s+(.+?)\s+to\s+(.+)$", normalized, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            stage = match.group(2).strip()
            opp = next((item for item in crm.get_opportunities() if item.title.lower() == title.lower()), None)
            if opp:
                return {
                    "intent": "action",
                    "operation": {
                        "type": "move_opportunity_stage",
                        "opp_id": opp.opp_id,
                        "stage": stage,
                    },
                    "confirmation_needed": True,
                    "response": f"Prepared move for '{opp.title}' to {stage}.",
                }

    if "pipeline" in lowered or "forecast" in lowered:
        summary = crm.get_pipeline_summary()
        return {
            "intent": "query",
            "operation": {
                "type": "pipeline_summary",
            },
            "confirmation_needed": False,
            "response": (
                f"Pipeline value: ${summary['total_pipeline_value']:,.0f}. "
                f"Expected value: ${summary['total_expected_value']:,.0f}. "
                f"Opportunities: {summary['total_opportunities']}."
            ),
        }

    if lowered.startswith("go to ") or lowered.startswith("open "):
        destination = lowered.replace("go to ", "").replace("open ", "").strip()
        return {
            "intent": "navigation",
            "operation": {"type": "navigation", "destination": destination},
            "confirmation_needed": False,
            "response": f"Navigate to {destination}.",
        }

    return {
        "intent": "query",
        "operation": {"type": "search", "query": normalized},
        "confirmation_needed": False,
        "response": "No direct action detected. Try asking for pipeline summary or lead creation.",
    }


def _parse_notes_payload(content: str) -> Dict[str, Any]:
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    lowered = content.lower()

    tasks: List[Dict[str, Any]] = []
    key_points: List[str] = []
    new_contacts: List[Dict[str, Optional[str]]] = []
    objections: List[str] = []

    import re

    email_matches = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", content)
    for email in email_matches:
        local_part = email.split("@")[0].replace(".", " ").title()
        new_contacts.append({"name": local_part, "email": email, "role": None})

    for line in lines:
        lower_line = line.lower()
        if any(marker in lower_line for marker in ["todo", "need to", "follow up", "will ", "action"]):
            tasks.append(
                {
                    "description": line,
                    "priority": "medium",
                    "due_date": "tomorrow" if "tomorrow" in lower_line else None,
                }
            )
        else:
            key_points.append(line)

        if any(marker in lower_line for marker in ["concern", "objection", "budget", "blocked"]):
            objections.append(line)

    sentiment = "neutral"
    if any(word in lowered for word in ["great", "excited", "close", "approved", "positive"]):
        sentiment = "positive"
    if any(word in lowered for word in ["concern", "blocked", "risk", "negative", "not ready"]):
        sentiment = "negative"

    value_match = re.search(r"\$([0-9][0-9,]*(?:\.[0-9]+)?)", content)
    value = None
    if value_match:
        value = float(value_match.group(1).replace(",", ""))

    return {
        "summary": lines[0] if lines else "No summary available",
        "sentiment": sentiment,
        "tasks": tasks,
        "deal_updates": {
            "value": value,
            "stage": None,
            "close_date": None,
            "probability": None,
        },
        "key_points": key_points[:8],
        "objections": objections[:5],
        "new_contacts": new_contacts[:5],
    }


def _build_forecast(opps: List[Opportunity]) -> Dict[str, Any]:
    total_pipeline = sum(opp.value for opp in opps)
    weighted = sum(opp.expected_value for opp in opps)

    # Heuristic adjustment: downweight very early stage and stale close dates
    adjusted = 0.0
    for opp in opps:
        base = opp.value * (opp.probability / 100)
        stage_factor = 1.0
        if opp.stage == PipelineStage.PROSPECTING:
            stage_factor = 0.65
        elif opp.stage == PipelineStage.DISCOVERY:
            stage_factor = 0.8
        elif opp.stage == PipelineStage.PROPOSAL:
            stage_factor = 0.95
        elif opp.stage == PipelineStage.NEGOTIATION:
            stage_factor = 1.05
        elif opp.stage == PipelineStage.CLOSED_WON:
            stage_factor = 1.0
        elif opp.stage == PipelineStage.CLOSED_LOST:
            stage_factor = 0.0

        time_factor = 1.0
        if opp.close_date and opp.close_date < date.today():
            time_factor = 0.85

        adjusted += base * stage_factor * time_factor

    return {
        "total_pipeline": float(total_pipeline),
        "weighted_forecast": float(weighted),
        "ai_adjusted_forecast": float(adjusted),
        "confidence_range": {
            "pessimistic": float(adjusted * 0.75),
            "expected": float(adjusted),
            "optimistic": float(adjusted * 1.2),
        },
    }


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

    return {"leads": [_lead_payload(crm, lead) for lead in leads], "count": len(leads)}


@app.get("/api/leads/duplicates")
def detect_duplicate_leads(
    min_confidence: float = Query(0.75, ge=0.5, le=1.0),
    crm: CRMManager = Depends(get_crm_session),
):
    """Detect potential duplicate leads."""
    matches = crm.find_duplicate_leads(min_confidence=min_confidence)
    return {"matches": matches, "count": len(matches)}


@app.get("/api/leads/duplicates/suggest")
def suggest_duplicate_merge(
    lead_a_id: str = Query(...),
    lead_b_id: str = Query(...),
    crm: CRMManager = Depends(get_crm_session),
):
    """Suggest a merge strategy for a duplicate lead pair."""
    try:
        return crm.suggest_duplicate_merge(lead_a_id, lead_b_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/leads/duplicates/merge")
def merge_duplicate_leads(
    payload: DuplicateMergeRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Merge duplicate leads and rewire related records."""
    try:
        return crm.merge_duplicate_leads(
            payload.lead_a_id,
            payload.lead_b_id,
            primary_id=payload.primary_id,
            selected_fields=payload.selected_fields,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Get a specific lead by ID."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _lead_payload(crm, lead)


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
    if data.custom_fields:
        crm.validate_custom_fields("leads", data.custom_fields)

    created = crm.add_lead(lead)
    if data.custom_fields:
        crm.set_custom_field_values("leads", created.lead_id, data.custom_fields)
    
    # Enrichment
    if data.auto_enrich:
        # Synchronous enrich + return enriched record if possible
        try:
            enriched = crm.enrich_lead(created.lead_id)
            if enriched:
                return _lead_payload(crm, enriched)
        except Exception as e:
            print(f"[API] Auto-enrich failed: {e}")

    # Default behavior: enrich asynchronously when company name is present
    if created.company_name:
        background_tasks.add_task(crm.enrich_lead, created.lead_id)
    return _lead_payload(crm, created)


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
    if data.score is not None:
        lead.score = data.score
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
    if data.custom_fields is not None:
        crm.validate_custom_fields("leads", data.custom_fields)
        crm.set_custom_field_values("leads", lead_id, data.custom_fields)

    success = crm.update_lead(lead)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update lead")
    return _lead_payload(crm, lead)


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


@app.post("/api/leads/{lead_id}/enrich")
def enrich_lead(lead_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Enrich a lead with AI data."""
    lead = crm.enrich_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead.model_dump()


@app.post("/api/leads/{lead_id}/score")
def score_lead(lead_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Assign an AI lead score (0-100)."""
    lead = crm.score_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead.model_dump()


@app.post("/api/leads/{lead_id}/generate-email")
def generate_lead_email(
    lead_id: str, 
    request: EmailDraftRequest,
    crm: CRMManager = Depends(get_crm_session)
):
    """Generate an AI email draft for a lead."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get recent activities for context
    activities = crm.get_activities(lead_id=lead_id)
    
    ai = AIManager()
    draft = ai.generate_email_draft(
        lead=lead, 
        activities=activities, 
        purpose=request.purpose, 
        tone=request.tone
    )
    
    return {"draft": draft}


@app.get("/api/leads/{lead_id}/suggest-action")
def suggest_lead_action(
    lead_id: str,
    crm: CRMManager = Depends(get_crm_session)
):
    """Suggest the 'Next Best Action' for a lead using AI."""
    lead = crm.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get associated opportunities (if any)
    opps = crm.get_opportunities_for_lead(lead_id)
    # Prefer the most recent/relevant opportunity if multiple exist
    active_opp = next((o for o in opps if o.stage not in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]), None)
    
    # Get recent activities for context
    activities = crm.get_activities(lead_id=lead_id)
    
    ai = AIManager()
    suggestion = ai.suggest_next_action(
        lead=lead,
        opportunity=active_opp,
        activities=activities
    )
    
    return suggestion


@app.post("/api/opportunities/{opp_id}/analyze-risk")
def analyze_opportunity_risk(
    opp_id: str,
    crm: CRMManager = Depends(get_crm_session)
):
    """Analyze opportunity for risks and blockers using AI."""
    opp = crm.get_opportunity(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    lead = crm.get_lead(opp.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Associated lead not found")
        
    activities = crm.get_activities(opp_id=opp_id)
    
    ai = AIManager()
    analysis = ai.analyze_deal_risk(
        opportunity=opp,
        lead=lead,
        activities=activities
    )
    
    return analysis


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

    return {"opportunities": [_opportunity_payload(crm, opp) for opp in opps], "count": len(opps)}


@app.get("/api/opportunities/{opp_id}")
def get_opportunity(opp_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Get a specific opportunity by ID."""
    opp = crm.get_opportunity(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return _opportunity_payload(crm, opp)


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
    if data.custom_fields:
        crm.validate_custom_fields("opportunities", data.custom_fields)

    created = crm.add_opportunity(opp)
    if data.custom_fields:
        crm.set_custom_field_values("opportunities", created.opp_id, data.custom_fields)
    return _opportunity_payload(crm, created)


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
    if data.custom_fields is not None:
        crm.validate_custom_fields("opportunities", data.custom_fields)
        crm.set_custom_field_values("opportunities", opp_id, data.custom_fields)

    success = crm.update_opportunity(opp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update opportunity")
    return _opportunity_payload(crm, opp)


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
# Tasks Endpoints
# =============================================================================

@app.get("/api/tasks")
def list_tasks(
    status: Optional[str] = Query(None),
    due_before: Optional[date] = Query(None),
    assignee: Optional[str] = Query(None),
    lead_id: Optional[str] = Query(None),
    opp_id: Optional[str] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get tasks, optionally filtered."""
    tasks = crm.get_tasks(
        status=status,
        due_before=due_before,
        assignee=assignee,
        lead_id=lead_id,
        opp_id=opp_id,
    )
    return {"tasks": [t.model_dump() for t in tasks], "count": len(tasks)}


@app.post("/api/tasks", status_code=201)
def create_task(data: TaskCreate, crm: CRMManager = Depends(get_crm_session)):
    """Create a task."""
    if not data.lead_id and not data.opp_id:
        raise HTTPException(status_code=400, detail="Task must be linked to a lead or opportunity")

    if data.lead_id and not crm.get_lead(data.lead_id):
        raise HTTPException(status_code=400, detail="Lead not found")
    if data.opp_id and not crm.get_opportunity(data.opp_id):
        raise HTTPException(status_code=400, detail="Opportunity not found")

    task = Task(
        title=data.title,
        due_date=data.due_date,
        status=TaskStatus(data.status) if data.status in [s.value for s in TaskStatus] else TaskStatus.OPEN,
        priority=TaskPriority(data.priority) if data.priority in [p.value for p in TaskPriority] else TaskPriority.MEDIUM,
        lead_id=data.lead_id,
        opp_id=data.opp_id,
        assignee=data.assignee,
        notes=data.notes,
    )
    created = crm.add_task(task)
    return created.model_dump()


@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, data: TaskUpdate, crm: CRMManager = Depends(get_crm_session)):
    """Update a task."""
    task = crm.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    updates = data.model_dump(exclude_unset=True)
    if "title" in updates:
        task.title = updates["title"]
    if "due_date" in updates:
        task.due_date = updates["due_date"]
    if "status" in updates:
        status = updates["status"]
        task.status = TaskStatus(status) if status in [s.value for s in TaskStatus] else task.status
    if "priority" in updates:
        priority = updates["priority"]
        task.priority = TaskPriority(priority) if priority in [p.value for p in TaskPriority] else task.priority
    if "lead_id" in updates:
        task.lead_id = updates["lead_id"]
    if "opp_id" in updates:
        task.opp_id = updates["opp_id"]
    if "assignee" in updates:
        task.assignee = updates["assignee"]
    if "notes" in updates:
        task.notes = updates["notes"]

    success = crm.update_task(task)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")

    return task.model_dump()


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Delete a task."""
    success = crm.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"deleted": True}


# =============================================================================
# Saved Views Endpoints
# =============================================================================

@app.get("/api/views")
def list_saved_views(
    entity: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """List saved views."""
    views = crm.get_saved_views(entity=entity, owner=owner)
    return {"views": [v.model_dump() for v in views], "count": len(views)}


@app.post("/api/views", status_code=201)
def create_saved_view(data: SavedViewCreate, crm: CRMManager = Depends(get_crm_session)):
    """Create a saved view."""
    view = SavedView(
        name=data.name,
        entity=data.entity,
        filters=data.filters,
        sort_by=data.sort_by,
        sort_order=data.sort_order,
        owner=data.owner,
        is_shared=data.is_shared,
    )
    created = crm.add_saved_view(view)
    return created.model_dump()


@app.put("/api/views/{view_id}")
def update_saved_view(view_id: str, data: SavedViewUpdate, crm: CRMManager = Depends(get_crm_session)):
    """Update a saved view."""
    view = crm.get_saved_view(view_id)
    if not view:
        raise HTTPException(status_code=404, detail="Saved view not found")

    updates = data.model_dump(exclude_unset=True)
    if "name" in updates:
        view.name = updates["name"]
    if "entity" in updates:
        view.entity = updates["entity"]
    if "filters" in updates:
        view.filters = updates["filters"]
    if "sort_by" in updates:
        view.sort_by = updates["sort_by"]
    if "sort_order" in updates:
        view.sort_order = updates["sort_order"]
    if "owner" in updates:
        view.owner = updates["owner"]
    if "is_shared" in updates:
        view.is_shared = updates["is_shared"]

    success = crm.update_saved_view(view)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update saved view")

    return view.model_dump()


@app.delete("/api/views/{view_id}")
def delete_saved_view(view_id: str, crm: CRMManager = Depends(get_crm_session)):
    """Delete a saved view."""
    success = crm.delete_saved_view(view_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved view not found")
    return {"deleted": True}


# =============================================================================
# Custom Fields Endpoints
# =============================================================================

@app.get("/api/custom-fields")
def list_custom_fields(
    entity: Optional[str] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """List custom field definitions."""
    fields = crm.get_custom_field_definitions(entity=entity)
    return {"fields": [item.model_dump() for item in fields], "count": len(fields)}


@app.post("/api/custom-fields", status_code=201)
def create_custom_field(
    data: CustomFieldCreate,
    crm: CRMManager = Depends(get_crm_session),
):
    """Create a custom field definition."""
    normalized_type = data.field_type.strip().lower()
    try:
        field_type = CustomFieldType(normalized_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unsupported field_type: {data.field_type}") from exc

    definition = CustomFieldDefinition(
        entity=data.entity,
        key=data.key,
        label=data.label,
        field_type=field_type,
        required=data.required,
        options=data.options,
        validation_rule=data.validation_rule,
    )
    created = crm.add_custom_field_definition(definition)
    return created.model_dump()


@app.put("/api/custom-fields/{field_id}")
def update_custom_field(
    field_id: str,
    data: CustomFieldUpdate,
    crm: CRMManager = Depends(get_crm_session),
):
    """Update a custom field definition."""
    definition = crm.get_custom_field_definition(field_id)
    if not definition:
        raise HTTPException(status_code=404, detail="Custom field not found")

    updates = data.model_dump(exclude_unset=True)
    if "entity" in updates:
        definition.entity = updates["entity"]
    if "key" in updates:
        definition.key = updates["key"]
    if "label" in updates:
        definition.label = updates["label"]
    if "field_type" in updates and updates["field_type"]:
        try:
            definition.field_type = CustomFieldType(str(updates["field_type"]).strip().lower())
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Unsupported field_type: {updates['field_type']}") from exc
    if "required" in updates:
        definition.required = bool(updates["required"])
    if "options" in updates:
        definition.options = updates["options"] or []
    if "validation_rule" in updates:
        definition.validation_rule = updates["validation_rule"]

    success = crm.update_custom_field_definition(definition)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update custom field")

    return definition.model_dump()


@app.delete("/api/custom-fields/{field_id}")
def delete_custom_field(
    field_id: str,
    crm: CRMManager = Depends(get_crm_session),
):
    """Delete a custom field definition."""
    success = crm.delete_custom_field_definition(field_id)
    if not success:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return {"deleted": True}


# =============================================================================
# Integration Endpoints
# =============================================================================

@app.get("/api/integrations")
def list_integrations(crm: CRMManager = Depends(get_crm_session)):
    """List integration connections."""
    items = crm.get_integrations()
    return {"integrations": [item.model_dump() for item in items], "count": len(items)}


@app.post("/api/integrations/{provider}/connect")
def connect_integration(
    provider: str,
    payload: IntegrationConnectRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Connect or update an integration provider."""
    connection = crm.upsert_integration(provider, payload.config)
    return connection.model_dump()


@app.post("/api/integrations/{provider}/sync")
def sync_integration(
    provider: str,
    payload: Optional[IntegrationSyncRequest] = Body(default=None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Run a provider sync and return summary."""
    request_payload = payload or IntegrationSyncRequest()
    try:
        result = crm.run_integration_sync(
            provider,
            idempotency_key=request_payload.idempotency_key,
            max_retries=max(0, min(request_payload.max_retries, 3)),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


@app.get("/api/integrations/{provider}/runs")
def list_integration_runs(
    provider: str,
    limit: int = Query(20, ge=1, le=200),
    crm: CRMManager = Depends(get_crm_session),
):
    """List sync runs for one provider."""
    runs = crm.get_integration_runs(provider=provider, limit=limit)
    return {"runs": [item.model_dump() for item in runs], "count": len(runs)}


@app.get("/api/integrations/runs")
def list_all_integration_runs(
    limit: int = Query(50, ge=1, le=500),
    crm: CRMManager = Depends(get_crm_session),
):
    """List sync runs across all providers."""
    runs = crm.get_integration_runs(limit=limit)
    return {"runs": [item.model_dump() for item in runs], "count": len(runs)}


# =============================================================================
# Export Endpoints
# =============================================================================

@app.get("/api/export/{entity}")
def export_entity_csv(
    entity: str,
    crm: CRMManager = Depends(get_crm_session),
):
    """Export CRM entities as CSV."""
    try:
        csv_payload = crm.export_entity_csv(entity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    entity_name = entity.strip().lower()
    if entity_name == "opps":
        entity_name = "opportunities"
    if entity_name == "activity":
        entity_name = "activities"
    if entity_name == "task":
        entity_name = "tasks"

    filename = f"{entity_name}.csv"
    return StreamingResponse(
        iter([csv_payload.encode("utf-8")]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# =============================================================================
# Bulk Operations
# =============================================================================

@app.post("/api/bulk/{entity}")
def bulk_operation(
    entity: str,
    payload: BulkOperationRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Run bulk operations on supported entities."""
    if not payload.ids:
        raise HTTPException(status_code=400, detail="No IDs provided for bulk operation")

    entity_name = entity.strip().lower()
    op = payload.operation.strip().lower()

    try:
        if entity_name == "leads":
            if op == "update_status":
                if not payload.status:
                    raise HTTPException(status_code=400, detail="status is required for update_status")
                return crm.bulk_update_lead_status(payload.ids, payload.status)
            if op == "delete":
                return crm.bulk_delete_leads(payload.ids)

        if entity_name in {"opportunities", "opps"}:
            if op == "update_stage":
                if not payload.stage:
                    raise HTTPException(status_code=400, detail="stage is required for update_stage")
                return crm.bulk_update_opportunity_stage(payload.ids, payload.stage)
            if op == "delete":
                return crm.bulk_delete_opportunities(payload.ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported bulk operation '{payload.operation}' for entity '{entity}'",
    )


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
                    **_opportunity_payload(crm, o),
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


@app.get("/api/reports")
def get_reports(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get report metrics for a date range."""
    opportunities = crm.get_opportunities()
    activities = crm.get_activities()

    if start_date or end_date:
        def in_window(value: Optional[date]) -> bool:
            if value is None:
                return False
            if start_date and value < start_date:
                return False
            if end_date and value > end_date:
                return False
            return True

        opportunities = [
            opp for opp in opportunities
            if in_window(opp.close_date)
            or in_window(opp.created_at.date())
            or in_window(opp.updated_at.date())
        ]
        activities = [
            activity for activity in activities
            if in_window(activity.date.date())
        ]

    by_stage: Dict[str, Dict[str, float]] = {}
    for stage in PipelineStage:
        stage_opps = [opp for opp in opportunities if opp.stage == stage]
        by_stage[stage.value] = {
            "count": len(stage_opps),
            "total_value": float(sum(opp.value for opp in stage_opps)),
            "expected_value": float(sum(opp.expected_value for opp in stage_opps)),
        }

    closed_won = [opp for opp in opportunities if opp.stage == PipelineStage.CLOSED_WON]
    closed_lost = [opp for opp in opportunities if opp.stage == PipelineStage.CLOSED_LOST]

    activity_by_type: Dict[str, int] = {}
    for activity in activities:
        activity_by_type[activity.type.value] = activity_by_type.get(activity.type.value, 0) + 1

    return {
        "summary": {
            "opportunity_count": len(opportunities),
            "pipeline_value": float(sum(opp.value for opp in opportunities if opp.stage != PipelineStage.CLOSED_LOST)),
            "expected_value": float(sum(opp.expected_value for opp in opportunities)),
            "closed_won_count": len(closed_won),
            "closed_won_value": float(sum(opp.value for opp in closed_won)),
            "closed_lost_count": len(closed_lost),
            "closed_lost_value": float(sum(opp.value for opp in closed_lost)),
            "activity_count": len(activities),
        },
        "by_stage": by_stage,
        "activity_by_type": activity_by_type,
        "range": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        },
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
# AI Assistant Endpoints
# =============================================================================

@app.post("/api/ai/parse")
def parse_natural_language(
    request: AIParseRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Parse natural language commands into structured operations."""
    return _parse_ai_intent(request.query, crm)


@app.post("/api/ai/execute")
def execute_ai_operation(
    request: AIExecuteRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Execute a previously parsed AI operation."""
    op = request.operation
    op_type = str(op.get("type", "")).strip()

    if op_type == "create_lead":
        lead = Lead(
            company_name=str(op.get("company_name") or "Unknown Company"),
            contact_name=str(op.get("contact_name") or "Unknown Contact"),
            status=LeadStatus(op.get("status")) if op.get("status") in [s.value for s in LeadStatus] else LeadStatus.NEW,
            source=LeadSource(op.get("source")) if op.get("source") in [s.value for s in LeadSource] else LeadSource.OTHER,
        )
        created = crm.add_lead(lead)
        return {
            "success": True,
            "operation": op_type,
            "result": _lead_payload(crm, created),
        }

    if op_type == "move_opportunity_stage":
        opp_id = str(op.get("opp_id") or "")
        stage = str(op.get("stage") or "")
        if not opp_id or not stage:
            raise HTTPException(status_code=400, detail="opp_id and stage are required")
        try:
            target_stage = PipelineStage(stage)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}") from exc
        updated = crm.move_opportunity_stage(opp_id, target_stage)
        if not updated:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return {"success": True, "operation": op_type, "result": {"opp_id": opp_id, "stage": stage}}

    if op_type == "pipeline_summary":
        return {"success": True, "operation": op_type, "result": crm.get_pipeline_summary()}

    raise HTTPException(status_code=400, detail=f"Unsupported AI operation: {op_type}")


@app.post("/api/ai/explain")
def explain_ai_topic(
    request: AIExplainRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Generate a lightweight explanation for a CRM topic."""
    topic = request.topic.strip().lower()
    summary = crm.get_pipeline_summary()
    if topic in {"pipeline", "health"}:
        return {
            "topic": topic,
            "explanation": (
                f"Pipeline value is ${summary['total_pipeline_value']:,.0f} across "
                f"{summary['total_opportunities']} opportunities. "
                f"Expected value is ${summary['total_expected_value']:,.0f}."
            ),
        }
    if topic in {"leads", "lead status"}:
        return {
            "topic": topic,
            "explanation": f"Lead distribution: {summary['leads_by_status']}",
        }
    return {
        "topic": topic,
        "explanation": "No tailored explanation available yet for this topic.",
    }


@app.get("/api/ai/suggest")
def get_ai_suggestions(crm: CRMManager = Depends(get_crm_session)):
    """Return contextual AI command suggestions."""
    summary = crm.get_pipeline_summary()
    suggestions = [
        "Show pipeline summary",
        "Create lead for Jane Doe at Acme",
        "Move <opportunity title> to Negotiation",
    ]
    if summary["total_opportunities"] > 0:
        suggestions.append("Which deals are at risk?")
    if summary["total_leads"] > 0:
        suggestions.append("Show all leads from LinkedIn")
    return {"suggestions": suggestions}


@app.post("/api/ai/parse-notes")
def parse_meeting_notes(
    request: ParseNotesRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Parse meeting notes into structured CRM suggestions."""
    parsed = _parse_notes_payload(request.content)
    parsed["lead_id"] = request.lead_id
    parsed["opp_id"] = request.opp_id
    return parsed


@app.post("/api/ai/parse-notes/apply")
def apply_parsed_notes(
    request: ApplyParsedNotesRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Apply parsed note items to tasks/opportunity/lead notes."""
    applied = {"tasks_created": 0, "lead_notes_updated": False, "opp_updated": False}

    for item in request.tasks:
        description = str(item.get("description") or "").strip()
        if not description:
            continue
        due_raw = item.get("due_date")
        due_date = None
        if isinstance(due_raw, str) and due_raw:
            if due_raw.lower() == "tomorrow":
                due_date = date.fromordinal(date.today().toordinal() + 1)
            else:
                try:
                    due_date = date.fromisoformat(due_raw[:10])
                except ValueError:
                    due_date = None

        task = Task(
            title=description,
            due_date=due_date,
            lead_id=request.lead_id,
            opp_id=request.opp_id,
            status=TaskStatus.OPEN,
            priority=TaskPriority.MEDIUM,
        )
        crm.add_task(task)
        applied["tasks_created"] += 1

    if request.opp_id and request.deal_updates:
        opp = crm.get_opportunity(request.opp_id)
        if opp:
            value = request.deal_updates.get("value")
            if isinstance(value, (int, float)):
                opp.value = float(value)
            stage = request.deal_updates.get("stage")
            if stage and stage in [item.value for item in PipelineStage]:
                opp.stage = PipelineStage(stage)
            probability = request.deal_updates.get("probability")
            if isinstance(probability, int):
                opp.probability = probability
            close_date = request.deal_updates.get("close_date")
            if isinstance(close_date, str) and close_date:
                try:
                    opp.close_date = date.fromisoformat(close_date[:10])
                except ValueError:
                    pass
            crm.update_opportunity(opp)
            applied["opp_updated"] = True

    if request.lead_id and request.key_points:
        lead = crm.get_lead(request.lead_id)
        if lead:
            note_blob = "\n".join([f"- {point}" for point in request.key_points if point])
            prefix = "AI Notes Parse Summary:"
            if lead.notes:
                lead.notes = f"{prefix}\n{note_blob}\n\n{lead.notes}"
            else:
                lead.notes = f"{prefix}\n{note_blob}"
            crm.update_lead(lead)
            applied["lead_notes_updated"] = True

    return {"success": True, "applied": applied}


@app.get("/api/coach/tips")
def get_coach_tips(
    lead_id: Optional[str] = Query(None),
    opp_id: Optional[str] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Return contextual coaching tips."""
    tips: List[Dict[str, str]] = []
    if opp_id:
        opp = crm.get_opportunity(opp_id)
        if opp:
            if opp.stage == PipelineStage.NEGOTIATION:
                tips.append({"title": "Negotiation", "tip": "Quantify ROI before discussing discount."})
            if opp.stage == PipelineStage.DISCOVERY:
                tips.append({"title": "Discovery", "tip": "Ask one implication question before demoing."})
            if opp.probability < 40:
                tips.append({"title": "Risk", "tip": "Schedule a follow-up activity within 48 hours."})
    if lead_id:
        lead = crm.get_lead(lead_id)
        if lead and lead.source == LeadSource.LINKEDIN:
            tips.append({"title": "Channel", "tip": "Reference the lead's latest LinkedIn activity in outreach."})

    if not tips:
        tips = [
            {"title": "Pipeline hygiene", "tip": "Move stagnant deals forward or close-lost within the week."},
            {"title": "Follow-up cadence", "tip": "Keep follow-ups under two business days for active deals."},
        ]
    return {"tips": tips}


@app.get("/api/coach/performance")
def get_coach_performance(crm: CRMManager = Depends(get_crm_session)):
    """Return lightweight performance analysis."""
    opps = crm.get_opportunities()
    total = len(opps)
    won = len([opp for opp in opps if opp.stage == PipelineStage.CLOSED_WON])
    lost = len([opp for opp in opps if opp.stage == PipelineStage.CLOSED_LOST])
    win_rate = (won / total * 100) if total else 0

    return {
        "total_opportunities": total,
        "won": won,
        "lost": lost,
        "win_rate": round(win_rate, 2),
        "insights": [
            "Improve follow-up speed on discovery deals.",
            "Prioritize opportunities in Proposal and Negotiation stages.",
        ],
    }


@app.post("/api/coach/ask")
def ask_coach(
    request: CoachAskRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Answer a coaching question with context."""
    question = request.question.strip()
    context_bits = []
    if request.lead_id:
        lead = crm.get_lead(request.lead_id)
        if lead:
            context_bits.append(f"Lead: {lead.company_name} ({lead.status.value})")
    if request.opp_id:
        opp = crm.get_opportunity(request.opp_id)
        if opp:
            context_bits.append(f"Deal: {opp.title} in {opp.stage.value} (${opp.value:,.0f})")

    advice = "Focus on a clear next step and explicit timeline in your follow-up."
    if "price" in question.lower() or "discount" in question.lower():
        advice = "Reframe to ROI and offer scope tradeoffs before lowering price."
    elif "stuck" in question.lower() or "slow" in question.lower():
        advice = "Identify the blocker and schedule a decision-oriented call."

    return {
        "question": question,
        "context": context_bits,
        "advice": advice,
    }


@app.get("/api/coach/deal/{opp_id}/review")
def review_deal(
    opp_id: str,
    crm: CRMManager = Depends(get_crm_session),
):
    """Provide quick review advice for a specific opportunity."""
    opp = crm.get_opportunity(opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    activities = crm.get_activities(opp_id=opp_id)
    return {
        "opp_id": opp_id,
        "stage": opp.stage.value,
        "value": opp.value,
        "activity_count": len(activities),
        "recommendation": "Create a dated next action and confirm decision criteria with the buyer.",
    }


@app.get("/api/forecast")
def get_forecast(
    period: str = Query("this_month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    crm: CRMManager = Depends(get_crm_session),
):
    """Get forecast summary."""
    opps = crm.get_opportunities()
    if period == "this_month":
        month = date.today().month
        year = date.today().year
        opps = [opp for opp in opps if opp.close_date and opp.close_date.month == month and opp.close_date.year == year]
    elif period == "custom" and (start_date or end_date):
        def in_window(target: Optional[date]) -> bool:
            if not target:
                return False
            if start_date and target < start_date:
                return False
            if end_date and target > end_date:
                return False
            return True
        opps = [opp for opp in opps if in_window(opp.close_date)]

    forecast = _build_forecast(opps)
    forecast["period"] = period
    return forecast


@app.get("/api/forecast/scenarios")
def get_forecast_scenarios(crm: CRMManager = Depends(get_crm_session)):
    """Return canned forecast scenarios."""
    opps = crm.get_opportunities()
    biggest = sorted(opps, key=lambda item: item.value, reverse=True)[:1]
    scenario = {
        "name": "Lose biggest deal",
        "remove_opp_ids": [item.opp_id for item in biggest],
    }
    return {"scenarios": [scenario]}


@app.post("/api/forecast/scenario")
def calculate_forecast_scenario(
    request: ForecastScenarioRequest,
    crm: CRMManager = Depends(get_crm_session),
):
    """Calculate custom scenario result."""
    opps = crm.get_opportunities()
    remove_set = set(request.remove_opp_ids)
    force_close_set = set(request.force_close_opp_ids)
    adjusted: List[Opportunity] = []
    for opp in opps:
        if opp.opp_id in remove_set:
            continue
        if opp.opp_id in force_close_set:
            opp.probability = 100
        adjusted.append(opp)

    return {
        "baseline": _build_forecast(opps),
        "scenario": _build_forecast(adjusted),
    }


@app.get("/api/forecast/coverage")
def get_forecast_coverage(
    target: float = Query(..., gt=0),
    crm: CRMManager = Depends(get_crm_session),
):
    """Pipeline coverage analysis."""
    opps = crm.get_opportunities()
    total_pipeline = sum(opp.value for opp in opps)
    coverage_ratio = total_pipeline / target if target else 0
    return {
        "target": target,
        "pipeline_value": total_pipeline,
        "coverage_ratio": round(coverage_ratio, 2),
        "gap": max(0.0, target - total_pipeline),
    }


@app.get("/api/forecast/trends")
def get_forecast_trends(
    periods: int = Query(4, ge=1, le=12),
    crm: CRMManager = Depends(get_crm_session),
):
    """Return basic trend slices for recent periods."""
    opps = crm.get_opportunities()
    forecast = _build_forecast(opps)
    rows = []
    for i in range(periods):
        factor = 1 - (i * 0.04)
        rows.append({
            "period_index": i + 1,
            "forecast": round(forecast["ai_adjusted_forecast"] * max(factor, 0.5), 2),
        })
    return {"trends": rows}


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


if MULTIPART_AVAILABLE:
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

            # Check if required mappings exist
            if 'company_name' not in mapping_dict.values() or 'contact_name' not in mapping_dict.values():
                raise HTTPException(
                    status_code=400,
                    detail="Mapping must include both 'Company Name' and 'Contact Name' fields."
                )

            for idx, row in enumerate(data_rows, start=2):  # Start at 2 (1 is header)
                try:
                    mapped_data = {}
                    for i, header in enumerate(headers):
                        if header in mapping_dict and i < len(row):
                            crm_field = mapping_dict[header]
                            mapped_data[crm_field] = row[i].strip() if row[i] else ""

                    # Skip empty rows
                    if not any(mapped_data.values()):
                        continue

                    # Required fields check
                    if not mapped_data.get('company_name') or not mapped_data.get('contact_name'):
                        errors.append({
                            "row": idx,
                            "error": "Missing required fields: company_name or contact_name"
                        })
                        continue

                    # Create Lead object
                    status_value = mapped_data.get('status', '')
                    if status_value and status_value in [s.value for s in LeadStatus]:
                        status = LeadStatus(status_value)
                    else:
                        status = LeadStatus.NEW

                    source_value = mapped_data.get('source', '')
                    if source_value and source_value in [s.value for s in LeadSource]:
                        source = LeadSource(source_value)
                    else:
                        source = LeadSource.OTHER

                    company_size_value = mapped_data.get('company_size', '')
                    company_size = None
                    if company_size_value and company_size_value in [s.value for s in CompanySize]:
                        company_size = CompanySize(company_size_value)

                    lead = Lead(
                        company_name=mapped_data.get('company_name', ''),
                        contact_name=mapped_data.get('contact_name', ''),
                        contact_email=mapped_data.get('contact_email'),
                        contact_phone=mapped_data.get('contact_phone'),
                        status=status,
                        source=source,
                        industry=mapped_data.get('industry'),
                        company_size=company_size,
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
                try:
                    imported_count = crm.batch_add_leads(leads_to_import)
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
else:
    @app.post("/api/import/csv/upload")
    async def upload_csv_file_not_available():
        raise HTTPException(status_code=503, detail="CSV upload disabled: install python-multipart")


    @app.post("/api/import/csv/preview")
    async def preview_import_not_available():
        raise HTTPException(status_code=503, detail="CSV preview disabled: install python-multipart")


    @app.post("/api/import/csv/execute")
    async def execute_import_not_available():
        raise HTTPException(status_code=503, detail="CSV import disabled: install python-multipart")


def _auto_detect_mappings(headers: List[str]) -> List[Dict[str, str]]:
    """
    Auto-detect possible column mappings based on header names.
    Returns list of suggested mappings.
    """
    # Common header name patterns
    field_patterns = {
        'company_name': ['company', 'company name', 'organization', 'org', 'business', 'firm', 'account'],
        'contact_name': ['contact', 'name', 'contact name', 'full name', 'person', 'lead', 'client'],
        'contact_email': ['email', 'e-mail', 'contact email', 'email address', 'mail'],
        'contact_phone': ['phone', 'telephone', 'contact phone', 'phone number', 'mobile', 'cell', 'tel'],
        'status': ['status', 'lead status', 'stage', 'phase'],
        'source': ['source', 'lead source', 'origin', 'channel', 'medium', 'campaign'],
        'industry': ['industry', 'sector', 'vertical', 'business type'],
        'company_size': ['size', 'company size', 'employees', 'headcount', 'staff'],
        'notes': ['notes', 'note', 'description', 'comments', 'remarks', 'about'],
        'owner': ['owner', 'assigned to', 'rep', 'sales rep', 'agent', 'assignee'],
    }

    suggestions = []
    used_crm_fields = set()
    
    for header in headers:
        header_clean = header.lower().strip().replace('_', ' ').replace('-', ' ')
        
        best_match = None
        for crm_field, patterns in field_patterns.items():
            if crm_field in used_crm_fields:
                continue
                
            if header_clean in patterns or any(pattern == header_clean for pattern in patterns):
                best_match = crm_field
                break

        # If no exact match, try partial match
        if not best_match:
            for crm_field, patterns in field_patterns.items():
                if crm_field in used_crm_fields:
                    continue
                if any(pattern in header_clean or header_clean in pattern for pattern in patterns):
                    best_match = crm_field
                    break

        if best_match:
            suggestions.append({
                "csv_column": header,
                "crm_field": best_match,
            })
            used_crm_fields.add(best_match)

    return suggestions
