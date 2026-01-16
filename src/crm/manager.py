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
    LeadStatus, PipelineStage, ActivityType, LeadSource
)

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
        
        # Caching
        self._cache: Dict[str, List[Any]] = {}
        self._last_fetch: Dict[str, datetime] = {}
        self.CACHE_TTL = 30  # seconds

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
        self.sm.append_row(self.sheet_name, lead.to_row(), LEADS_WS)
        self._invalidate_cache(LEADS_WS)
        return lead

    def get_leads(self) -> List[Lead]:
        """Retrieve all leads."""
        data = self._get_cached_data(LEADS_WS)
        if data is None:
            data = self.sm.read_data(self.sheet_name, LEADS_WS)
            if data:
                self._set_cached_data(LEADS_WS, data)
        
        if not data or len(data) < 2:
            return []
        # Skip header row
        return [Lead.from_row(row) for row in data[1:] if row[0]]

    def get_lead(self, lead_id: str) -> Optional[Lead]:
        """Get a specific lead by ID."""
        leads = self.get_leads()
        return next((l for l in leads if l.lead_id == lead_id), None)

    def update_lead(self, lead: Lead) -> bool:
        """Update an existing lead."""
        leads = self.get_leads()
        for i, existing in enumerate(leads):
            if existing.lead_id == lead.lead_id:
                lead.updated_at = datetime.now()
                # Row index is i + 2 (1-indexed + header row)
                # Row index is i + 2 (1-indexed + header row)
                row_index = i + 2
                # Use batch update_row instead of cell-by-cell
                self.sm.update_row(self.sheet_name, row_index, lead.to_row(), LEADS_WS)
                self._invalidate_cache(LEADS_WS)
                return True
        return False

    def delete_lead(self, lead_id: str) -> bool:
        """Delete a lead by ID."""
        leads = self.get_leads()
        for i, lead in enumerate(leads):
            if lead.lead_id == lead_id:
                row_index = i + 2  # 1-indexed + header
                self.sm.delete_row(self.sheet_name, row_index, LEADS_WS)
                self._invalidate_cache(LEADS_WS)
                return True
        return False

    # -------------------------------------------------------------------------
    # Opportunity Operations
    # -------------------------------------------------------------------------

    def add_opportunity(self, opp: Opportunity) -> Opportunity:
        """Add a new opportunity."""
        opp.created_at = datetime.now()
        opp.updated_at = datetime.now()
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
        opps = self.get_opportunities()
        for i, existing in enumerate(opps):
            if existing.opp_id == opp.opp_id:
                opp.updated_at = datetime.now()
                row_index = i + 2
                # Use batch update_row
                self.sm.update_row(self.sheet_name, row_index, opp.to_row(), OPPS_WS)
                self._invalidate_cache(OPPS_WS)
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
        opps = self.get_opportunities()
        for i, opp in enumerate(opps):
            if opp.opp_id == opp_id:
                row_index = i + 2
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
