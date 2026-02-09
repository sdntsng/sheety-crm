"""
CRM Manager - Business logic layer for CRM operations.
"""
import csv
import difflib
import io
import json
import re
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from rich.console import Console
from rich.table import Table

from ..sheets import SheetManager
from .models import (
    Lead,
    Opportunity,
    Activity,
    Task,
    SavedView,
    CustomFieldDefinition,
    CustomFieldType,
    CustomFieldValue,
    IntegrationConnection,
    TaskPriority,
    TaskStatus,
    LeadStatus,
    PipelineStage,
    ActivityType,
    LeadSource,
    CompanySize,
)
from .ai import AIManager
from .templates import CRMTemplates
from .enrichment import enrichment_service
from .analyzer import deal_analyzer
from .scoring import scoring_service
import gspread

console = Console()

# Sheet/worksheet names
SHEET_NAME = "Sales Pipeline 2026"
LEADS_WS = "Leads"
OPPS_WS = "Opportunities"
ACTIVITIES_WS = "Activities"
TASKS_WS = "Tasks"
VIEWS_WS = "_System_Views"
CUSTOM_FIELDS_WS = "_CustomFields"
CUSTOM_VALUES_WS = "_CustomFieldValues"
INTEGRATIONS_WS = "_Integrations"
SUMMARY_WS = "Summary"


class CRMManager:
    """Manages CRM operations against Google Sheets."""

    def __init__(self, sheet_manager: SheetManager, sheet_name: str = SHEET_NAME):
        self.sm = sheet_manager
        self.sheet_name = sheet_name
        self.templates = CRMTemplates(self.sm.gc)
        
        # Caching
        self._cache: Dict[str, List[Any]] = {}
        self._last_fetch: Dict[str, datetime] = {}
        self.CACHE_TTL = 30  # seconds

    def _ensure_worksheet_exists(self, worksheet_name: str):
        """Ensure worksheet exists using templates."""
        sh = self.sm.get_sheet(self.sheet_name)
        if sh:
            self.templates.ensure_worksheet(sh, worksheet_name)

    def _get_cached_data(self, worksheet: str) -> Optional[List[List[str]]]:
        """Get cached data if valid."""
        now = datetime.now()
        if worksheet in self._last_fetch:
            age = (now - self._last_fetch[worksheet]).total_seconds()
            if age < self.CACHE_TTL:
                return self._cache.get(worksheet)
        return None

    def _set_cached_data(self, worksheet: str, data: List[List[str]]):
        """Update cache."""
        self._cache[worksheet] = data
        self._last_fetch[worksheet] = datetime.now()

    def _invalidate_cache(self, worksheet: str):
        """Invalidate cache for a worksheet."""
        if worksheet in self._last_fetch:
            del self._last_fetch[worksheet]

    def _ensure_headers(self, worksheet: str, headers: List[str]):
        """Ensure a worksheet has the expected header row."""
        try:
            data = self.sm.read_data(self.sheet_name, worksheet)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(worksheet)
            data = self.sm.read_data(self.sheet_name, worksheet)

        if not data:
            self.sm.append_row(self.sheet_name, headers, worksheet)
            self._invalidate_cache(worksheet)
            return

        current_header = data[0] if data else []
        if current_header != headers:
            self.sm.update_row(self.sheet_name, 1, headers, worksheet)
            self._invalidate_cache(worksheet)

    # -------------------------------------------------------------------------
    # Lead Operations
    # -------------------------------------------------------------------------

    def add_lead(self, lead: Lead) -> Lead:
        """Add a new lead to the CRM."""
        lead.created_at = datetime.now()
        lead.updated_at = datetime.now()
        try:
            self.sm.append_row(self.sheet_name, lead.to_row(), LEADS_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(LEADS_WS)
            self.sm.append_row(self.sheet_name, lead.to_row(), LEADS_WS)
            
        self._invalidate_cache(LEADS_WS)
        return lead

    def batch_add_leads(self, leads: List[Lead]) -> int:
        """Batch add leads to the CRM."""
        if not leads:
            return 0
            
        now = datetime.now()
        rows_to_append = []
        for lead in leads:
            lead.created_at = now
            lead.updated_at = now
            rows_to_append.append(lead.to_row())
            
        try:
            self.sm.append_rows(self.sheet_name, rows_to_append, LEADS_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(LEADS_WS)
            self.sm.append_rows(self.sheet_name, rows_to_append, LEADS_WS)
            
        self._invalidate_cache(LEADS_WS)
        return len(leads)

    def get_leads(self) -> List[Lead]:
        """Retrieve all leads."""
        data = self._get_cached_data(LEADS_WS)
        if data is None:
            try:
                data = self.sm.read_data(self.sheet_name, LEADS_WS)
                
                # Migrate schema if needed
                if data and len(data) > 0:
                    headers = data[0]
                    expected_headers = Lead.headers()
                    if len(headers) < len(expected_headers):
                        print(f"[CRMManager] Migrating Leads sheet schema for {self.sheet_name}")
                        # Update headers
                        self.sm.update_row(self.sheet_name, 1, expected_headers, LEADS_WS)
                        # Re-read data after update (optional, but safer)
                        data[0] = expected_headers
                        self._set_cached_data(LEADS_WS, data)

            except gspread.exceptions.WorksheetNotFound:
                return []
                
            if data:
                self._set_cached_data(LEADS_WS, data)
        
        if not data or len(data) < 2:
            return []
        
        # Check if we need to adjust row length for migration
        processed_leads = []
        headers = data[0]
        for row in data[1:]:
            if not row or not row[0]: continue
            
            # If row is shorter than expected, it's likely an old format
            # Old format had created_at at index 10.
            # New format has website at index 10.
            if len(row) < 17 and len(row) >= 11:
                # Basic migration: shift columns from index 10 onwards
                # created_at (10) -> 14
                # updated_at (11) -> 15
                # owner (12) -> 16
                new_row = row[:10] + ["", "", "", ""] + row[10:]
                processed_leads.append(Lead.from_row(new_row))
            else:
                processed_leads.append(Lead.from_row(row))
                
        return processed_leads

    def get_lead(self, lead_id: str) -> Optional[Lead]:
        """Get a specific lead by ID."""
        leads = self.get_leads()
        return next((l for l in leads if l.lead_id == lead_id), None)

    def update_lead(self, lead: Lead) -> bool:
        """Update an existing lead."""
        data = self._get_cached_data(LEADS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, LEADS_WS)
            if data: self._set_cached_data(LEADS_WS, data)
            
        if not data: return False

        # Iterate raw data to find ID (col 0)
        # Skip header (index 0)
        for i, row in enumerate(data):
            if i == 0: continue
            if row and row[0] == lead.lead_id:
                lead.updated_at = datetime.now()
                row_index = i + 1  # 1-indexed sheet
                new_row = lead.to_row()
                self.sm.update_row(self.sheet_name, row_index, new_row, LEADS_WS)
                # Optimistic cache update
                data[i] = new_row
                self._set_cached_data(LEADS_WS, data)
                return True
        return False

    def enrich_lead(self, lead_id: str) -> Optional[Lead]:
        """Enrich a lead with AI data and update it in the sheet."""
        lead = self.get_lead(lead_id)
        if not lead:
            return None

        ai = AIManager()
        enrichment = ai.enrich_lead_data(lead)
        
        if not enrichment:
            return lead

        # Update lead fields
        if enrichment.get("industry"):
            lead.industry = enrichment["industry"]
        
        if enrichment.get("company_size"):
            try:
                lead.company_size = CompanySize(enrichment["company_size"])
            except ValueError:
                pass
        
        if enrichment.get("description"):
            # Append description to notes or prepend it
            desc = f"AI Description: {enrichment['description']}"
            if lead.notes:
                lead.notes = f"{desc}\n\n{lead.notes}"
            else:
                lead.notes = desc

        self.update_lead(lead)
        return lead

    def score_lead(self, lead_id: str) -> Optional[Lead]:
        """Assign an AI lead score and update it in the sheet."""
        lead = self.get_lead(lead_id)
        if not lead:
            return None

        activities = self.get_activities(lead_id=lead_id)
        ai = AIManager()
        scoring = ai.score_lead(lead, activities)
        
        if "score" in scoring:
            lead.score = scoring["score"]
            # Prepend reasoning to notes
            reason = f"AI Score: {scoring['score']}/100 - {scoring.get('reasoning', '')}"
            if lead.notes:
                lead.notes = f"{reason}\n\n{lead.notes}"
            else:
                lead.notes = reason

        self.update_lead(lead)
        return lead

    def delete_lead(self, lead_id: str) -> bool:
        """Delete a lead by ID."""
        data = self._get_cached_data(LEADS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, LEADS_WS)
        
        if not data: return False

        for i, row in enumerate(data):
            if i == 0: continue
            if row and row[0] == lead_id:
                row_index = i + 1
                self.sm.delete_row(self.sheet_name, row_index, LEADS_WS)
                self._invalidate_cache(LEADS_WS)
                return True
        return False

    def enrich_lead(self, lead_id: str):
        """Perform AI enrichment for a lead."""
        lead = self.get_lead(lead_id)
        if not lead:
            return

        # 1. Mark as enriching
        lead.enrichment_status = "Enriching"
        self.update_lead(lead)

        try:
            # 2. Call enrichment service
            enriched_data = enrichment_service.enrich_lead_data(lead)
            
            if enriched_data:
                # 3. Update lead with new data
                if enriched_data.get("website") and not lead.website:
                    lead.website = enriched_data["website"]
                if enriched_data.get("linkedin_url") and not lead.linkedin_url:
                    lead.linkedin_url = enriched_data["linkedin_url"]
                if enriched_data.get("logo_url") and not lead.logo_url:
                    lead.logo_url = enriched_data["logo_url"]
                if enriched_data.get("industry") and not lead.industry:
                    lead.industry = enriched_data["industry"]
                if enriched_data.get("company_size") and not lead.company_size:
                    try:
                        lead.company_size = CompanySize(enriched_data["company_size"])
                    except ValueError:
                        pass
                
                lead.enrichment_status = "Completed"
            else:
                lead.enrichment_status = "Failed"
            
            # 4. Save updates
            self.update_lead(lead)

            # 5. Automatically score after enrichment
            self.score_lead(lead_id)
            
        except Exception as e:
            print(f"[CRMManager] Enrichment failed for {lead_id}: {e}")
            lead.enrichment_status = "Failed"
            self.update_lead(lead)

    def score_lead(self, lead_id: str):
        """Perform AI scoring for a lead."""
        lead = self.get_lead(lead_id)
        if not lead:
            return

        activities = self.get_activities(lead_id=lead_id)
        
        try:
            scoring_result = scoring_service.score_lead(lead, activities)
            
            lead.score = scoring_result.get("score")
            lead.heat_level = scoring_result.get("heat_level")
            
            # Save updates
            self.update_lead(lead)
            print(f"[CRMManager] Scored lead {lead_id}: {lead.score} ({lead.heat_level})")
            
        except Exception as e:
            print(f"[CRMManager] Scoring failed for {lead_id}: {e}")

    def analyze_deal(self, opp_id: str) -> Dict[str, Any]:
        """Perform AI analysis for a deal."""
        opp = self.get_opportunity(opp_id)
        if not opp:
            return {}
        activities = self.get_activities(opp_id=opp_id)
        return deal_analyzer.analyze_opportunity(opp, activities)

    # -------------------------------------------------------------------------
    # Opportunity Operations
    # -------------------------------------------------------------------------

    def add_opportunity(self, opp: Opportunity) -> Opportunity:
        """Add a new opportunity."""
        opp.created_at = datetime.now()
        opp.updated_at = datetime.now()
        try:
            self.sm.append_row(self.sheet_name, opp.to_row(), OPPS_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(OPPS_WS)
            self.sm.append_row(self.sheet_name, opp.to_row(), OPPS_WS)
            
        self._invalidate_cache(OPPS_WS)
        return opp

    def get_opportunities(self) -> List[Opportunity]:
        """Retrieve all opportunities."""
        data = self._get_cached_data(OPPS_WS)
        if data is None:
            data = self.sm.read_data(self.sheet_name, OPPS_WS)
            if data:
                self._set_cached_data(OPPS_WS, data)
        
        if not data or len(data) < 2:
            return []
        return [Opportunity.from_row(row) for row in data[1:] if row[0]]

    def get_opportunity(self, opp_id: str) -> Optional[Opportunity]:
        """Get a specific opportunity by ID."""
        opps = self.get_opportunities()
        return next((o for o in opps if o.opp_id == opp_id), None)

    def get_opportunities_for_lead(self, lead_id: str) -> List[Opportunity]:
        """Get all opportunities for a specific lead."""
        return [o for o in self.get_opportunities() if o.lead_id == lead_id]

    def update_opportunity(self, opp: Opportunity) -> bool:
        """Update an existing opportunity."""
        data = self._get_cached_data(OPPS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, OPPS_WS)
            if data: self._set_cached_data(OPPS_WS, data)
            
        if not data: return False
        
        # Iterate raw data to find ID (col 0)
        for i, row in enumerate(data):
            if i == 0: continue
            if row and row[0] == opp.opp_id:
                opp.updated_at = datetime.now()
                row_index = i + 1
                
                new_row = opp.to_row()
                self.sm.update_row(self.sheet_name, row_index, new_row, OPPS_WS)
                
                # Optimistic cache update
                data[i] = new_row
                self._set_cached_data(OPPS_WS, data)
                return True
        return False

    def move_opportunity_stage(self, opp_id: str, new_stage: PipelineStage) -> bool:
        """Move an opportunity to a new pipeline stage."""
        opp = self.get_opportunity(opp_id)
        if not opp:
            return False
        opp.stage = new_stage
        opp.updated_at = datetime.now()
        if new_stage in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST, PipelineStage.CASH_IN_BANK]:
            opp.closed_at = datetime.now()
        return self.update_opportunity(opp)

    def delete_opportunity(self, opp_id: str) -> bool:
        """Delete an opportunity by ID."""
        data = self._get_cached_data(OPPS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, OPPS_WS)
            
        if not data: return False

        for i, row in enumerate(data):
            if i == 0: continue
            if row and row[0] == opp_id:
                row_index = i + 1
                self.sm.delete_row(self.sheet_name, row_index, OPPS_WS)
                self._invalidate_cache(OPPS_WS)
                return True
        return False

    # -------------------------------------------------------------------------
    # Activity Operations
    # -------------------------------------------------------------------------

    def log_activity(self, activity: Activity) -> Activity:
        """Log a new activity."""
        activity.date = datetime.now()
        try:
            self.sm.append_row(self.sheet_name, activity.to_row(), ACTIVITIES_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(ACTIVITIES_WS)
            self.sm.append_row(self.sheet_name, activity.to_row(), ACTIVITIES_WS)
            
        self._invalidate_cache(ACTIVITIES_WS)
        return activity

    def get_activities(self, lead_id: Optional[str] = None, opp_id: Optional[str] = None) -> List[Activity]:
        """Get activities, optionally filtered by lead or opportunity."""
        data = self._get_cached_data(ACTIVITIES_WS)
        if data is None:
            data = self.sm.read_data(self.sheet_name, ACTIVITIES_WS)
            if data:
                self._set_cached_data(ACTIVITIES_WS, data)
        if not data or len(data) < 2:
            return []
        activities = [Activity.from_row(row) for row in data[1:] if row[0]]
        if lead_id:
            activities = [a for a in activities if a.lead_id == lead_id]
        if opp_id:
            activities = [a for a in activities if a.opp_id == opp_id]
        return activities

    # -------------------------------------------------------------------------
    # Task Operations
    # -------------------------------------------------------------------------

    def add_task(self, task: Task) -> Task:
        """Add a new task."""
        self._ensure_headers(TASKS_WS, Task.headers())
        task.created_at = datetime.now()
        task.updated_at = datetime.now()
        if task.status == TaskStatus.COMPLETED and not task.completed_at:
            task.completed_at = datetime.now()

        try:
            self.sm.append_row(self.sheet_name, task.to_row(), TASKS_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(TASKS_WS)
            self.sm.append_row(self.sheet_name, task.to_row(), TASKS_WS)

        self._invalidate_cache(TASKS_WS)
        return task

    def get_tasks(
        self,
        status: Optional[str] = None,
        due_before: Optional[date] = None,
        assignee: Optional[str] = None,
        lead_id: Optional[str] = None,
        opp_id: Optional[str] = None,
    ) -> List[Task]:
        """Retrieve tasks with optional filters."""
        data = self._get_cached_data(TASKS_WS)
        if data is None:
            self._ensure_headers(TASKS_WS, Task.headers())
            try:
                data = self.sm.read_data(self.sheet_name, TASKS_WS)
            except gspread.exceptions.WorksheetNotFound:
                return []

            if data:
                self._set_cached_data(TASKS_WS, data)

        if not data or len(data) < 2:
            return []

        tasks = [Task.from_row(row) for row in data[1:] if row and row[0]]

        if status:
            tasks = [t for t in tasks if t.status.value == status]
        if due_before:
            tasks = [t for t in tasks if t.due_date and t.due_date <= due_before]
        if assignee:
            assignee_lower = assignee.lower()
            tasks = [
                t for t in tasks
                if t.assignee and t.assignee.lower() == assignee_lower
            ]
        if lead_id:
            tasks = [t for t in tasks if t.lead_id == lead_id]
        if opp_id:
            tasks = [t for t in tasks if t.opp_id == opp_id]

        return tasks

    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a specific task by ID."""
        tasks = self.get_tasks()
        return next((t for t in tasks if t.task_id == task_id), None)

    def update_task(self, task: Task) -> bool:
        """Update an existing task."""
        data = self._get_cached_data(TASKS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, TASKS_WS)
            if data:
                self._set_cached_data(TASKS_WS, data)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == task.task_id:
                task.updated_at = datetime.now()
                if task.status == TaskStatus.COMPLETED and not task.completed_at:
                    task.completed_at = datetime.now()
                if task.status != TaskStatus.COMPLETED:
                    task.completed_at = None

                row_index = i + 1
                new_row = task.to_row()
                self.sm.update_row(self.sheet_name, row_index, new_row, TASKS_WS)
                data[i] = new_row
                self._set_cached_data(TASKS_WS, data)
                return True

        return False

    def delete_task(self, task_id: str) -> bool:
        """Delete a task by ID."""
        data = self._get_cached_data(TASKS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, TASKS_WS)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == task_id:
                row_index = i + 1
                self.sm.delete_row(self.sheet_name, row_index, TASKS_WS)
                self._invalidate_cache(TASKS_WS)
                return True
        return False

    # -------------------------------------------------------------------------
    # Saved Views Operations
    # -------------------------------------------------------------------------

    def add_saved_view(self, view: SavedView) -> SavedView:
        """Add a new saved view."""
        self._ensure_headers(VIEWS_WS, SavedView.headers())
        view.created_at = datetime.now()
        view.updated_at = datetime.now()
        try:
            self.sm.append_row(self.sheet_name, view.to_row(), VIEWS_WS)
        except gspread.exceptions.WorksheetNotFound:
            self._ensure_worksheet_exists(VIEWS_WS)
            self.sm.append_row(self.sheet_name, view.to_row(), VIEWS_WS)

        self._invalidate_cache(VIEWS_WS)
        return view

    def get_saved_views(
        self,
        entity: Optional[str] = None,
        owner: Optional[str] = None,
    ) -> List[SavedView]:
        """Retrieve saved views with optional filters."""
        data = self._get_cached_data(VIEWS_WS)
        if data is None:
            self._ensure_headers(VIEWS_WS, SavedView.headers())
            try:
                data = self.sm.read_data(self.sheet_name, VIEWS_WS)
            except gspread.exceptions.WorksheetNotFound:
                return []

            if data:
                self._set_cached_data(VIEWS_WS, data)

        if not data or len(data) < 2:
            return []

        views = [SavedView.from_row(row) for row in data[1:] if row and row[0]]

        if entity:
            views = [v for v in views if v.entity == entity]
        if owner:
            owner_lower = owner.lower()
            views = [v for v in views if v.owner and v.owner.lower() == owner_lower]

        return views

    def get_saved_view(self, view_id: str) -> Optional[SavedView]:
        """Get a saved view by ID."""
        views = self.get_saved_views()
        return next((v for v in views if v.view_id == view_id), None)

    def update_saved_view(self, view: SavedView) -> bool:
        """Update an existing saved view."""
        data = self._get_cached_data(VIEWS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, VIEWS_WS)
            if data:
                self._set_cached_data(VIEWS_WS, data)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == view.view_id:
                view.updated_at = datetime.now()
                row_index = i + 1
                new_row = view.to_row()
                self.sm.update_row(self.sheet_name, row_index, new_row, VIEWS_WS)
                data[i] = new_row
                self._set_cached_data(VIEWS_WS, data)
                return True

        return False

    def delete_saved_view(self, view_id: str) -> bool:
        """Delete a saved view by ID."""
        data = self._get_cached_data(VIEWS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, VIEWS_WS)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == view_id:
                row_index = i + 1
                self.sm.delete_row(self.sheet_name, row_index, VIEWS_WS)
                self._invalidate_cache(VIEWS_WS)
                return True

        return False

    # -------------------------------------------------------------------------
    # Custom Fields Operations
    # -------------------------------------------------------------------------

    def add_custom_field_definition(self, definition: CustomFieldDefinition) -> CustomFieldDefinition:
        """Create a custom field definition."""
        self._ensure_headers(CUSTOM_FIELDS_WS, CustomFieldDefinition.headers())
        definition.created_at = datetime.now()
        definition.updated_at = datetime.now()
        self.sm.append_row(self.sheet_name, definition.to_row(), CUSTOM_FIELDS_WS)
        self._invalidate_cache(CUSTOM_FIELDS_WS)
        return definition

    def get_custom_field_definitions(self, entity: Optional[str] = None) -> List[CustomFieldDefinition]:
        """List custom field definitions, optionally filtered by entity."""
        data = self._get_cached_data(CUSTOM_FIELDS_WS)
        if data is None:
            self._ensure_headers(CUSTOM_FIELDS_WS, CustomFieldDefinition.headers())
            data = self.sm.read_data(self.sheet_name, CUSTOM_FIELDS_WS)
            if data:
                self._set_cached_data(CUSTOM_FIELDS_WS, data)

        if not data or len(data) < 2:
            return []

        definitions = [
            CustomFieldDefinition.from_row(row)
            for row in data[1:]
            if row and row[0]
        ]

        if entity:
            definitions = [item for item in definitions if item.entity == entity]
        return definitions

    def get_custom_field_definition(self, field_id: str) -> Optional[CustomFieldDefinition]:
        """Get a custom field definition by ID."""
        definitions = self.get_custom_field_definitions()
        return next((item for item in definitions if item.field_id == field_id), None)

    def update_custom_field_definition(self, definition: CustomFieldDefinition) -> bool:
        """Update a custom field definition."""
        data = self._get_cached_data(CUSTOM_FIELDS_WS)
        if not data:
            self._ensure_headers(CUSTOM_FIELDS_WS, CustomFieldDefinition.headers())
            data = self.sm.read_data(self.sheet_name, CUSTOM_FIELDS_WS)
            if data:
                self._set_cached_data(CUSTOM_FIELDS_WS, data)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == definition.field_id:
                definition.updated_at = datetime.now()
                row_index = i + 1
                new_row = definition.to_row()
                self.sm.update_row(self.sheet_name, row_index, new_row, CUSTOM_FIELDS_WS)
                data[i] = new_row
                self._set_cached_data(CUSTOM_FIELDS_WS, data)
                return True

        return False

    def delete_custom_field_definition(self, field_id: str) -> bool:
        """Delete a custom field definition."""
        data = self._get_cached_data(CUSTOM_FIELDS_WS)
        if not data:
            data = self.sm.read_data(self.sheet_name, CUSTOM_FIELDS_WS)

        if not data:
            return False

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and row[0] == field_id:
                row_index = i + 1
                self.sm.delete_row(self.sheet_name, row_index, CUSTOM_FIELDS_WS)
                self._invalidate_cache(CUSTOM_FIELDS_WS)
                return True
        return False

    def get_custom_field_values(self, entity: str, record_id: str) -> Dict[str, Any]:
        """Get custom field values for a record."""
        data = self._get_cached_data(CUSTOM_VALUES_WS)
        if data is None:
            self._ensure_headers(CUSTOM_VALUES_WS, CustomFieldValue.headers())
            data = self.sm.read_data(self.sheet_name, CUSTOM_VALUES_WS)
            if data:
                self._set_cached_data(CUSTOM_VALUES_WS, data)

        if not data or len(data) < 2:
            return {}

        values: Dict[str, tuple[str, datetime]] = {}
        for row in data[1:]:
            if not row or len(row) < 6:
                continue
            parsed = CustomFieldValue.from_row(row)
            if parsed.entity != entity or parsed.record_id != record_id:
                continue
            current = values.get(parsed.field_key)
            if not current or parsed.updated_at >= current[1]:
                values[parsed.field_key] = (parsed.field_value, parsed.updated_at)

        result: Dict[str, Any] = {}
        for field_key, (raw_value, _) in values.items():
            try:
                result[field_key] = json.loads(raw_value)
            except json.JSONDecodeError:
                result[field_key] = raw_value
        return result

    def set_custom_field_values(self, entity: str, record_id: str, values: Dict[str, Any]):
        """Persist custom field values for a record by appending value snapshots."""
        if not values:
            return

        normalized_values = self.validate_custom_fields(entity, values)
        self._ensure_headers(CUSTOM_VALUES_WS, CustomFieldValue.headers())

        rows = []
        now = datetime.now()
        for field_key, value in normalized_values.items():
            encoded = json.dumps(value)
            model = CustomFieldValue(
                entity=entity,
                record_id=record_id,
                field_key=field_key,
                field_value=encoded,
                updated_at=now,
            )
            rows.append(model.to_row())

        self.sm.append_rows(self.sheet_name, rows, CUSTOM_VALUES_WS)
        self._invalidate_cache(CUSTOM_VALUES_WS)

    def validate_custom_fields(self, entity: str, values: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize custom field values for an entity."""
        definitions = self.get_custom_field_definitions(entity=entity)
        if not definitions:
            return values or {}

        values = values or {}
        by_key = {item.key: item for item in definitions}
        normalized: Dict[str, Any] = {}
        errors: List[str] = []

        for key, definition in by_key.items():
            raw_value = values.get(key)
            if definition.required and (raw_value is None or raw_value == ""):
                errors.append(f"Missing required custom field '{key}'")
                continue
            if raw_value is None:
                continue

            try:
                normalized[key] = self._normalize_custom_field_value(definition, raw_value)
            except ValueError as exc:
                errors.append(str(exc))

        extra_keys = [key for key in values.keys() if key not in by_key]
        if extra_keys:
            errors.append(f"Unknown custom field keys: {', '.join(extra_keys)}")

        if errors:
            raise ValueError("; ".join(errors))

        return normalized

    def _normalize_custom_field_value(self, definition: CustomFieldDefinition, value: Any) -> Any:
        """Normalize and validate one custom field value."""
        field_key = definition.key
        field_type = definition.field_type
        validation_rule = definition.validation_rule

        if field_type == CustomFieldType.TEXT:
            parsed = str(value)
            if validation_rule and not re.fullmatch(validation_rule, parsed):
                raise ValueError(f"Custom field '{field_key}' does not match validation rule")
            return parsed

        if field_type == CustomFieldType.NUMBER:
            try:
                parsed = float(value)
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Custom field '{field_key}' must be a number") from exc

            if validation_rule:
                min_match = re.search(r"min[:=](-?\d+(\.\d+)?)", validation_rule)
                max_match = re.search(r"max[:=](-?\d+(\.\d+)?)", validation_rule)
                if min_match and parsed < float(min_match.group(1)):
                    raise ValueError(f"Custom field '{field_key}' must be >= {min_match.group(1)}")
                if max_match and parsed > float(max_match.group(1)):
                    raise ValueError(f"Custom field '{field_key}' must be <= {max_match.group(1)}")
            return parsed

        if field_type == CustomFieldType.DATE:
            try:
                return date.fromisoformat(str(value)[:10]).isoformat()
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Custom field '{field_key}' must be an ISO date") from exc

        if field_type == CustomFieldType.SELECT:
            parsed = str(value)
            if definition.options and parsed not in definition.options:
                raise ValueError(f"Custom field '{field_key}' must be one of: {', '.join(definition.options)}")
            return parsed

        if field_type == CustomFieldType.MULTI_SELECT:
            if isinstance(value, list):
                parsed_list = [str(item) for item in value]
            else:
                parsed_list = [item.strip() for item in str(value).split(",") if item.strip()]

            if definition.options:
                invalid = [item for item in parsed_list if item not in definition.options]
                if invalid:
                    raise ValueError(
                        f"Custom field '{field_key}' has invalid values: {', '.join(invalid)}"
                    )
            return parsed_list

        raise ValueError(f"Unsupported custom field type for '{field_key}'")

    # -------------------------------------------------------------------------
    # Integration Connections
    # -------------------------------------------------------------------------

    def get_integrations(self) -> List[IntegrationConnection]:
        """List configured integration connections."""
        data = self._get_cached_data(INTEGRATIONS_WS)
        if data is None:
            self._ensure_headers(INTEGRATIONS_WS, IntegrationConnection.headers())
            data = self.sm.read_data(self.sheet_name, INTEGRATIONS_WS)
            if data:
                self._set_cached_data(INTEGRATIONS_WS, data)

        if not data or len(data) < 2:
            return []

        return [
            IntegrationConnection.from_row(row)
            for row in data[1:]
            if row and row[0]
        ]

    def upsert_integration(
        self,
        provider: str,
        config: Dict[str, Any],
        status: str = "connected",
        last_sync_at: Optional[datetime] = None,
    ) -> IntegrationConnection:
        """Create or update a provider connection."""
        data = self._get_cached_data(INTEGRATIONS_WS)
        if not data:
            self._ensure_headers(INTEGRATIONS_WS, IntegrationConnection.headers())
            data = self.sm.read_data(self.sheet_name, INTEGRATIONS_WS)
            if data:
                self._set_cached_data(INTEGRATIONS_WS, data)

        provider = provider.strip().lower()
        if not data:
            data = [IntegrationConnection.headers()]

        for i, row in enumerate(data):
            if i == 0:
                continue
            if row and len(row) > 1 and str(row[1]).strip().lower() == provider:
                existing = IntegrationConnection.from_row(row)
                existing.config = config
                existing.status = status
                if last_sync_at:
                    existing.last_sync_at = last_sync_at
                existing.updated_at = datetime.now()
                new_row = existing.to_row()
                self.sm.update_row(self.sheet_name, i + 1, new_row, INTEGRATIONS_WS)
                data[i] = new_row
                self._set_cached_data(INTEGRATIONS_WS, data)
                return existing

        created = IntegrationConnection(
            provider=provider,
            config=config,
            status=status,
            last_sync_at=last_sync_at,
        )
        self.sm.append_row(self.sheet_name, created.to_row(), INTEGRATIONS_WS)
        self._invalidate_cache(INTEGRATIONS_WS)
        return created

    def run_integration_sync(self, provider: str) -> Dict[str, Any]:
        """Run a lightweight sync action for a provider."""
        provider_key = provider.strip().lower()
        integrations = self.get_integrations()
        integration = next((item for item in integrations if item.provider == provider_key), None)
        if not integration:
            raise ValueError(f"Integration '{provider}' is not connected")

        synced_records = 0
        if provider_key == "google_calendar":
            synced_records = len([task for task in self.get_tasks() if task.status != TaskStatus.COMPLETED])
        elif provider_key == "gmail":
            synced_records = len(self.get_leads())
        elif provider_key == "slack":
            synced_records = len(self.get_opportunities())
        else:
            synced_records = len(self.get_activities())

        integration.last_sync_at = datetime.now()
        integration.status = "synced"
        integration.updated_at = datetime.now()
        self.upsert_integration(
            provider_key,
            integration.config,
            status=integration.status,
            last_sync_at=integration.last_sync_at,
        )

        return {
            "provider": provider_key,
            "synced_records": synced_records,
            "last_sync_at": integration.last_sync_at.isoformat(),
        }

    # -------------------------------------------------------------------------
    # Export Operations
    # -------------------------------------------------------------------------

    def export_entity_csv(self, entity: str) -> str:
        """Export an entity dataset as CSV content."""
        entity_normalized = entity.strip().lower()
        output = io.StringIO()
        writer = csv.writer(output)

        if entity_normalized == "leads":
            rows = [lead.to_row() for lead in self.get_leads()]
            writer.writerow(Lead.headers())
        elif entity_normalized in {"opportunities", "opps"}:
            rows = [opp.to_row() for opp in self.get_opportunities()]
            writer.writerow(Opportunity.headers())
        elif entity_normalized in {"activities", "activity"}:
            rows = [activity.to_row() for activity in self.get_activities()]
            writer.writerow(Activity.headers())
        elif entity_normalized in {"tasks", "task"}:
            rows = [task.to_row() for task in self.get_tasks()]
            writer.writerow(Task.headers())
        else:
            raise ValueError(f"Unsupported export entity: {entity}")

        writer.writerows(rows)
        return output.getvalue()

    # -------------------------------------------------------------------------
    # Bulk Operations
    # -------------------------------------------------------------------------

    def bulk_update_lead_status(self, lead_ids: List[str], status: str) -> Dict[str, Any]:
        """Bulk update lead status."""
        valid_statuses = {item.value for item in LeadStatus}
        if status not in valid_statuses:
            raise ValueError(f"Invalid lead status: {status}")

        updated = 0
        failed_ids: List[str] = []
        for lead_id in lead_ids:
            lead = self.get_lead(lead_id)
            if not lead:
                failed_ids.append(lead_id)
                continue
            lead.status = LeadStatus(status)
            if self.update_lead(lead):
                updated += 1
            else:
                failed_ids.append(lead_id)

        return {
            "requested": len(lead_ids),
            "updated": updated,
            "failed_ids": failed_ids,
        }

    def bulk_delete_leads(self, lead_ids: List[str]) -> Dict[str, Any]:
        """Bulk delete leads by IDs."""
        deleted = 0
        failed_ids: List[str] = []
        for lead_id in lead_ids:
            if self.delete_lead(lead_id):
                deleted += 1
            else:
                failed_ids.append(lead_id)
        return {
            "requested": len(lead_ids),
            "deleted": deleted,
            "failed_ids": failed_ids,
        }

    def bulk_update_opportunity_stage(self, opp_ids: List[str], stage: str) -> Dict[str, Any]:
        """Bulk update opportunity stages."""
        valid_stages = {item.value for item in PipelineStage}
        if stage not in valid_stages:
            raise ValueError(f"Invalid pipeline stage: {stage}")

        updated = 0
        failed_ids: List[str] = []
        for opp_id in opp_ids:
            if self.move_opportunity_stage(opp_id, PipelineStage(stage)):
                updated += 1
            else:
                failed_ids.append(opp_id)

        return {
            "requested": len(opp_ids),
            "updated": updated,
            "failed_ids": failed_ids,
        }

    def bulk_delete_opportunities(self, opp_ids: List[str]) -> Dict[str, Any]:
        """Bulk delete opportunities by IDs."""
        deleted = 0
        failed_ids: List[str] = []
        for opp_id in opp_ids:
            if self.delete_opportunity(opp_id):
                deleted += 1
            else:
                failed_ids.append(opp_id)
        return {
            "requested": len(opp_ids),
            "deleted": deleted,
            "failed_ids": failed_ids,
        }

    # -------------------------------------------------------------------------
    # Duplicate Detection
    # -------------------------------------------------------------------------

    def find_duplicate_leads(self, min_confidence: float = 0.75) -> List[Dict[str, Any]]:
        """Find potential duplicate leads using deterministic heuristics."""
        leads = self.get_leads()
        candidates: List[Dict[str, Any]] = []

        for i in range(len(leads)):
            for j in range(i + 1, len(leads)):
                first = leads[i]
                second = leads[j]
                confidence = 0.0
                reasons: List[str] = []

                first_email = (first.contact_email or "").strip().lower()
                second_email = (second.contact_email or "").strip().lower()
                if first_email and second_email and first_email == second_email:
                    confidence = max(confidence, 0.98)
                    reasons.append("matching email")

                first_company = re.sub(r"[^a-z0-9]+", "", first.company_name.lower())
                second_company = re.sub(r"[^a-z0-9]+", "", second.company_name.lower())
                if first_company and second_company:
                    ratio = difflib.SequenceMatcher(None, first_company, second_company).ratio()
                    if ratio >= min_confidence:
                        confidence = max(confidence, ratio)
                        reasons.append("similar company name")

                first_contact = re.sub(r"[^a-z0-9]+", "", first.contact_name.lower())
                second_contact = re.sub(r"[^a-z0-9]+", "", second.contact_name.lower())
                if first_contact and second_contact:
                    ratio = difflib.SequenceMatcher(None, first_contact, second_contact).ratio()
                    if ratio >= min_confidence:
                        confidence = max(confidence, ratio)
                        reasons.append("similar contact name")

                if confidence >= min_confidence:
                    candidates.append(
                        {
                            "confidence": round(confidence, 3),
                            "reasons": reasons,
                            "lead_a": first.model_dump(),
                            "lead_b": second.model_dump(),
                        }
                    )

        candidates.sort(key=lambda item: item["confidence"], reverse=True)
        return candidates

    # -------------------------------------------------------------------------
    # Pipeline & Dashboard
    # -------------------------------------------------------------------------

    def get_pipeline_summary(self) -> Dict[str, Any]:
        """Get pipeline summary data for dashboard."""
        opps = self.get_opportunities()
        leads = self.get_leads()

        # Group opportunities by stage
        by_stage = {}
        for stage in PipelineStage:
            stage_opps = [o for o in opps if o.stage == stage]
            by_stage[stage.value] = {
                "count": len(stage_opps),
                "total_value": sum(o.value for o in stage_opps),
                "expected_value": sum(o.expected_value for o in stage_opps),
            }

        # Lead stats
        leads_by_status = {}
        for status in LeadStatus:
            leads_by_status[status.value] = len([l for l in leads if l.status == status])

        # Top leads by score
        top_leads = sorted(
            [l for l in leads if (l.score or 0) > 0],
            key=lambda l: l.score or 0,
            reverse=True
        )[:5]

        return {
            "total_leads": len(leads),
            "total_opportunities": len(opps),
            "total_pipeline_value": sum(o.value for o in opps if o.stage not in [PipelineStage.CLOSED_LOST]),
            "total_expected_value": sum(o.expected_value for o in opps),
            "closed_won_value": sum(o.value for o in opps if o.stage == PipelineStage.CLOSED_WON),
            "cash_in_bank": sum(o.value for o in opps if o.stage == PipelineStage.CASH_IN_BANK),
            "pipeline_by_stage": by_stage,
            "leads_by_status": leads_by_status,
            "top_leads": [l.model_dump() for l in top_leads],
        }

    def print_pipeline(self):
        """Print a rich table summary of the pipeline."""
        summary = self.get_pipeline_summary()

        # Pipeline stages table
        table = Table(title="Sales Pipeline 2026")
        table.add_column("Stage", style="bold")
        table.add_column("Count", justify="right")
        table.add_column("Value ($)", justify="right", style="green")
        table.add_column("Expected ($)", justify="right", style="cyan")

        for stage, data in summary["pipeline_by_stage"].items():
            table.add_row(
                stage,
                str(data["count"]),
                f"${data['total_value']:,.0f}",
                f"${data['expected_value']:,.0f}",
            )

        console.print(table)
        console.print(f"\n[bold]Total Pipeline Value:[/bold] ${summary['total_pipeline_value']:,.0f}")
        console.print(f"[bold]Cash in Bank:[/bold] [green]${summary['cash_in_bank']:,.0f}[/green]")
