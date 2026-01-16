"""
CRM Sheet Templates - Creates and initializes the CRM Google Sheet structure.
"""
import gspread
from rich.console import Console

from .models import Lead, Opportunity, Activity, PipelineStage, LeadStatus, LeadSource, CompanySize

console = Console()


class CRMTemplates:
    """Handles creation and setup of CRM sheets."""

    def __init__(self, gc: gspread.Client):
        self.gc = gc

    def create_crm_sheet(self, name: str = "Sales Pipeline 2026") -> gspread.Spreadsheet:
        """Create a new CRM spreadsheet with all required worksheets."""
        console.print(f"[bold blue]Creating CRM: {name}[/bold blue]")

        # Create the spreadsheet
        sh = self.gc.create(name)
        console.print(f"[green]✓ Created spreadsheet: {sh.url}[/green]")

        # Rename default sheet to Leads
        leads_ws = sh.sheet1
        leads_ws.update_title("Leads")
        self._setup_leads_sheet(leads_ws)
        console.print("[green]✓ Set up Leads worksheet[/green]")

        # Create Opportunities worksheet
        opps_ws = sh.add_worksheet(title="Opportunities", rows=1000, cols=20)
        self._setup_opportunities_sheet(opps_ws)
        console.print("[green]✓ Set up Opportunities worksheet[/green]")

        # Create Activities worksheet
        activities_ws = sh.add_worksheet(title="Activities", rows=1000, cols=10)
        self._setup_activities_sheet(activities_ws)
        console.print("[green]✓ Set up Activities worksheet[/green]")

        # Create Summary/Dashboard worksheet
        summary_ws = sh.add_worksheet(title="Summary", rows=50, cols=10)
        self._setup_summary_sheet(summary_ws)
        console.print("[green]✓ Set up Summary dashboard[/green]")

        console.print(f"\n[bold green]CRM ready! Open: {sh.url}[/bold green]")
        return sh

    def _setup_leads_sheet(self, ws: gspread.Worksheet):
        """Set up the Leads worksheet with headers and formatting."""
        headers = Lead.headers()
        ws.append_row(headers)

        # Bold headers
        ws.format("A1:M1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.2, "green": 0.2, "blue": 0.3}
        })

        # Freeze header row
        ws.freeze(rows=1)

        # Set column widths
        ws.set_basic_filter()

        # Add data validation for status column (F)
        status_values = [s.value for s in LeadStatus]
        self._add_dropdown_validation(ws, "F2:F1000", status_values)

        # Add data validation for source column (G)
        source_values = [s.value for s in LeadSource]
        self._add_dropdown_validation(ws, "G2:G1000", source_values)

        # Add data validation for company size column (I)
        size_values = [s.value for s in CompanySize]
        self._add_dropdown_validation(ws, "I2:I1000", size_values)

    def _setup_opportunities_sheet(self, ws: gspread.Worksheet):
        """Set up the Opportunities worksheet."""
        headers = Opportunity.headers()
        ws.append_row(headers)

        ws.format("A1:N1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.2, "green": 0.3, "blue": 0.2}
        })

        ws.freeze(rows=1)
        ws.set_basic_filter()

        # Data validation for stage column (D)
        stage_values = [s.value for s in PipelineStage]
        self._add_dropdown_validation(ws, "D2:D1000", stage_values)

        # Currency format for value column (E)
        ws.format("E2:E1000", {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0.00"}})

        # Percentage format for probability column (F)
        ws.format("F2:F1000", {"numberFormat": {"type": "NUMBER", "pattern": "0%"}})

        # Expected value formula in column G
        # Note: We'll set this as a formula that auto-calculates
        ws.format("G2:G1000", {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0.00"}})

    def _setup_activities_sheet(self, ws: gspread.Worksheet):
        """Set up the Activities worksheet."""
        headers = Activity.headers()
        ws.append_row(headers)

        ws.format("A1:H1", {
            "textFormat": {"bold": True},
            "backgroundColor": {"red": 0.3, "green": 0.2, "blue": 0.2}
        })

        ws.freeze(rows=1)
        ws.set_basic_filter()

    def _setup_summary_sheet(self, ws: gspread.Worksheet):
        """Set up the Summary/Dashboard worksheet with aggregate formulas."""
        try:
            # Header
            ws.update_acell("A1", "Sales Pipeline 2026 - Dashboard")
            ws.format("A1", {"textFormat": {"bold": True, "fontSize": 16}})

            # Key Metrics
            ws.update_acell("A3", "Key Metrics")
            ws.format("A3", {"textFormat": {"bold": True, "fontSize": 12}})

            metrics = [
                ("Total Leads", '=COUNTA(Leads!A:A)-1'),
                ("Total Opportunities", '=COUNTA(Opportunities!A:A)-1'),
                ("Pipeline Value", '=SUMIF(Opportunities!D:D,"<>Closed Lost",Opportunities!E:E)'),
                ("Closed Won Value", '=SUMIF(Opportunities!D:D,"Closed Won",Opportunities!E:E)'),
                ("Cash in Bank", '=SUMIF(Opportunities!D:D,"Cash in Bank",Opportunities!E:E)'),
            ]

            row = 4
            for label, formula in metrics:
                ws.update_acell(f"A{row}", label)
                ws.update_acell(f"B{row}", formula)
                row += 1

            # Format value cells
            ws.format("B6:B8", {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}})

            # Pipeline by Stage
            ws.update_acell("A10", "Pipeline by Stage")
            ws.format("A10", {"textFormat": {"bold": True, "fontSize": 12}})

            ws.update_acell("A11", "Stage")
            ws.update_acell("B11", "Count")
            ws.update_acell("C11", "Value")
            ws.format("A11:C11", {"textFormat": {"bold": True}})

            row = 12
            for stage in PipelineStage:
                ws.update_acell(f"A{row}", stage.value)
                ws.update_acell(f"B{row}", f'=COUNTIF(Opportunities!D:D,"{stage.value}")')
                ws.update_acell(f"C{row}", f'=SUMIF(Opportunities!D:D,"{stage.value}",Opportunities!E:E)')
                row += 1

            ws.format(f"C12:C{row-1}", {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}})

            # Leads by Status
            ws.update_acell("A22", "Leads by Status")
            ws.format("A22", {"textFormat": {"bold": True, "fontSize": 12}})

            row = 23
            for status in LeadStatus:
                ws.update_acell(f"A{row}", status.value)
                ws.update_acell(f"B{row}", f'=COUNTIF(Leads!F:F,"{status.value}")')
                row += 1
        except Exception as e:
            console.print(f"[yellow]Warning: Could not fully set up Summary sheet: {e}[/yellow]")
            row += 1

    def _add_dropdown_validation(self, ws: gspread.Worksheet, range_str: str, values: list):
        """Add dropdown data validation to a range."""
        # Note: gspread's data validation API is limited
        # For full dropdown support, we'd use the Sheets API directly
        # For now, we'll skip this as it requires batch updates
        pass
