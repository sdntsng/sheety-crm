import typer
from rich.console import Console

from .auth import authenticate
from .sheets import SheetManager
from .drive import DriveManager
from .docs import DocsManager
from .workflows import WorkflowManager

app = typer.Typer()
console = Console()

@app.command()
def setup():
    """Helps set up the Google Workspace credentials."""
    console.print("[bold yellow]Setup Instructions:[/bold yellow]")
    console.print("1. Go to [link=https://console.cloud.google.com/]Google Cloud Console[/link].")
    console.print("2. Create a new project or select an existing one.")
    console.print("3. Enable [bold]Google Sheets API[/bold] and [bold]Google Drive API[/bold].")
    console.print("4. Configure OAuth Consent Screen (External, Add your email as tester).")
    console.print("5. Create Credentials > OAuth Client ID > Desktop App.")
    console.print("6. Download JSON and save as [bold]credentials.json[/bold] in this directory.")
    console.print("7. Run [bold]python src/main.py login[/bold].")

@app.command()
def login(profile: str = typer.Option("default", help="Profile name (e.g., personal, work)")):
    """Authenticates with Google."""
    try:
        authenticate(profile)
        console.print(f"[green]Successfully authenticated profile: {profile}![/green]")
    except Exception as e:
        console.print(f"[red]Authentication failed: {e}[/red]")

@app.command()
def whoami(profile: str = typer.Option("default", help="Profile name")):
    """Shows the currently logged in email for the profile."""
    try:
        _, creds = authenticate(profile)
        if creds and hasattr(creds, 'id_token') and creds.id_token:
            # Note: creds.id_token might be JWT, simplistic check here or use service endpoint
            pass
        
        # Simpler method: use the drive service to get 'about' info
        manager = DriveManager(creds)
        about = manager.service.about().get(fields="user").execute()
        email = about['user']['emailAddress']
        console.print(f"Profile '[bold]{profile}[/bold]' is logged in as: [green]{email}[/green]")

    except Exception as e:
        console.print(f"[red]Not logged in or error: {e}[/red]")

@app.command()
def list_sheets(profile: str = typer.Option("default", help="Profile name")):
    """Lists all Google Sheets."""
    try:
        gc, _ = authenticate(profile)
        manager = SheetManager(gc)
        manager.list_files()
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def read_data(sheet: str, profile: str = typer.Option("default", help="Profile name")):
    """Reads all data from a sheet."""
    try:
        gc, _ = authenticate(profile)
        manager = SheetManager(gc)
        data = manager.read_data(sheet)
        if data:
            console.print(data)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def read_doc(doc_id: str, profile: str = typer.Option("default", help="Profile name")):
    """Reads a Google Doc and prints content."""
    try:
        _, creds = authenticate(profile)
        manager = DocsManager(creds)
        content = manager.read_doc(doc_id)
        if content:
            console.print(content)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def list_files(query: str = typer.Option(None, help="Search query"), profile: str = typer.Option("default", help="Profile name")):
    """Lists files in Google Drive."""
    try:
        _, creds = authenticate(profile)
        manager = DriveManager(creds)
        manager.list_files(query=query)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def create_project(name: str, profile: str = typer.Option("default", help="Profile name")):
    """Workflow: Creates a new project workspace (Sheet + Folder)."""
    try:
        gc, creds = authenticate(profile)
        workflow = WorkflowManager(gc, creds)
        workflow.create_project_workspace(name)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def update_cell(sheet: str, cell: str, value: str, profile: str = typer.Option("default", help="Profile name")):
    """Updates a single cell."""
    try:
        gc, _ = authenticate(profile)
        manager = SheetManager(gc)
        manager.update_cell(sheet, cell, value)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

@app.command()
def append_row(sheet: str, values: str = typer.Argument(..., help="Comma separated values"), profile: str = typer.Option("default", help="Profile name")):
    """Appends a row. Usage: append_row 'SheetName' 'Value1,Value2'"""
    try:
        gc, _ = authenticate(profile)
        manager = SheetManager(gc)
        data = [v.strip() for v in values.split(",")]
        manager.append_row(sheet, data)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


# =============================================================================
# CRM Commands
# =============================================================================

@app.command()
def crm_init(name: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"), profile: str = typer.Option("default", help="Profile name")):
    """Initialize a new CRM spreadsheet with all required worksheets."""
    from .crm.templates import CRMTemplates
    try:
        gc, _ = authenticate(profile)
        templates = CRMTemplates(gc)
        templates.create_crm_sheet(name)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_add_lead(
    company: str = typer.Option(..., help="Company name"),
    contact: str = typer.Option(..., help="Contact name"),
    email: str = typer.Option(None, help="Contact email"),
    phone: str = typer.Option(None, help="Contact phone"),
    source: str = typer.Option("Other", help="Lead source"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Add a new lead to the CRM."""
    from .crm.models import Lead, LeadSource
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        lead = Lead(
            company_name=company,
            contact_name=contact,
            contact_email=email,
            contact_phone=phone,
            source=LeadSource(source) if source in [s.value for s in LeadSource] else LeadSource.OTHER,
        )
        crm.add_lead(lead)
        console.print(f"[green]✓ Added lead: {lead.company_name} ({lead.lead_id})[/green]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_add_opp(
    lead_id: str = typer.Option(..., help="Lead ID"),
    title: str = typer.Option(..., help="Opportunity title"),
    value: float = typer.Option(0.0, help="Deal value in USD"),
    probability: int = typer.Option(50, help="Win probability (0-100)"),
    stage: str = typer.Option("Prospecting", help="Pipeline stage"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Add a new opportunity to the CRM."""
    from .crm.models import Opportunity, PipelineStage
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        opp = Opportunity(
            lead_id=lead_id,
            title=title,
            value=value,
            probability=probability,
            stage=PipelineStage(stage) if stage in [s.value for s in PipelineStage] else PipelineStage.PROSPECTING,
        )
        crm.add_opportunity(opp)
        console.print(f"[green]✓ Added opportunity: {opp.title} (${opp.value:,.0f})[/green]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_list(
    what: str = typer.Argument("leads", help="What to list: leads, opps, activities"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """List CRM data (leads, opps, or activities)."""
    from .crm.manager import CRMManager
    from rich.table import Table
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)

        if what == "leads":
            leads = crm.get_leads()
            table = Table(title="Leads")
            table.add_column("ID", style="dim")
            table.add_column("Company", style="bold")
            table.add_column("Contact")
            table.add_column("Status")
            table.add_column("Source")
            for lead in leads:
                table.add_row(lead.lead_id, lead.company_name, lead.contact_name, lead.status.value, lead.source.value)
            console.print(table)

        elif what == "opps":
            opps = crm.get_opportunities()
            table = Table(title="Opportunities")
            table.add_column("ID", style="dim")
            table.add_column("Title", style="bold")
            table.add_column("Stage")
            table.add_column("Value", justify="right", style="green")
            table.add_column("Probability", justify="right")
            for opp in opps:
                table.add_row(opp.opp_id, opp.title, opp.stage.value, f"${opp.value:,.0f}", f"{opp.probability}%")
            console.print(table)

        elif what == "activities":
            activities = crm.get_activities()
            table = Table(title="Activities")
            table.add_column("ID", style="dim")
            table.add_column("Type")
            table.add_column("Subject", style="bold")
            table.add_column("Date")
            for act in activities:
                table.add_row(act.activity_id, act.type.value, act.subject, act.date.strftime("%Y-%m-%d"))
            console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_pipeline(
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Show pipeline summary."""
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        crm.print_pipeline()
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


if __name__ == "__main__":
    app()

