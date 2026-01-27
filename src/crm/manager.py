"""
CRM Manager - Business logic layer for CRM operations.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from rich.console import Console
from rich.table import Table

from ..sheets import SheetManager
from .models import (
    Lead, Opportunity, Activity,
    LeadStatus, PipelineStage, ActivityType, LeadSource, CompanySize
)
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
                # Optimistic cache update
                data.pop(i)
                self._set_cached_data(LEADS_WS, data)
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
                # Optimistic cache update
                data.pop(i)
                self._set_cached_data(OPPS_WS, data)
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

        return {
            "total_leads": len(leads),
            "total_opportunities": len(opps),
            "total_pipeline_value": sum(o.value for o in opps if o.stage not in [PipelineStage.CLOSED_LOST]),
            "total_expected_value": sum(o.expected_value for o in opps),
            "closed_won_value": sum(o.value for o in opps if o.stage == PipelineStage.CLOSED_WON),
            "cash_in_bank": sum(o.value for o in opps if o.stage == PipelineStage.CASH_IN_BANK),
            "pipeline_by_stage": by_stage,
            "leads_by_status": leads_by_status,
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
