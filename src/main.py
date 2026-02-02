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
    console.print(
        "1. Go to [link=https://console.cloud.google.com/]Google Cloud Console[/link]."
    )
    console.print("2. Create a new project or select an existing one.")
    console.print(
        "3. Enable [bold]Google Sheets API[/bold] and [bold]Google Drive API[/bold]."
    )
    console.print(
        "4. Configure OAuth Consent Screen (External, Add your email as tester)."
    )
    console.print("5. Create Credentials > OAuth Client ID > Desktop App.")
    console.print(
        "6. Download JSON and save as [bold]credentials.json[/bold] in this directory."
    )
    console.print("7. Run [bold]python src/main.py login[/bold].")


@app.command()
def login(
    profile: str = typer.Option("default", help="Profile name (e.g., personal, work)"),
):
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
        if creds and hasattr(creds, "id_token") and creds.id_token:
            # Note: creds.id_token might be JWT, simplistic check here or use service endpoint
            pass

        # Simpler method: use the drive service to get 'about' info
        manager = DriveManager(creds)
        about = manager.service.about().get(fields="user").execute()
        email = about["user"]["emailAddress"]
        console.print(
            f"Profile '[bold]{profile}[/bold]' is logged in as: [green]{email}[/green]"
        )

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
def list_files(
    query: str = typer.Option(None, help="Search query"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """Lists files in Google Drive."""
    try:
        _, creds = authenticate(profile)
        manager = DriveManager(creds)
        manager.list_files(query=query)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def create_project(
    name: str, profile: str = typer.Option("default", help="Profile name")
):
    """Workflow: Creates a new project workspace (Sheet + Folder)."""
    try:
        gc, creds = authenticate(profile)
        workflow = WorkflowManager(gc, creds)
        workflow.create_project_workspace(name)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def update_cell(
    sheet: str,
    cell: str,
    value: str,
    profile: str = typer.Option("default", help="Profile name"),
):
    """Updates a single cell."""
    try:
        gc, _ = authenticate(profile)
        manager = SheetManager(gc)
        manager.update_cell(sheet, cell, value)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def append_row(
    sheet: str,
    values: str = typer.Argument(..., help="Comma separated values"),
    profile: str = typer.Option("default", help="Profile name"),
):
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
def crm_init(
    name: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
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
    profile: str = typer.Option("default", help="Profile name"),
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
            source=LeadSource(source)
            if source in [s.value for s in LeadSource]
            else LeadSource.OTHER,
        )
        crm.add_lead(lead)
        console.print(
            f"[green]✓ Added lead: {lead.company_name} ({lead.lead_id})[/green]"
        )
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
    profile: str = typer.Option("default", help="Profile name"),
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
            stage=PipelineStage(stage)
            if stage in [s.value for s in PipelineStage]
            else PipelineStage.PROSPECTING,
        )
        crm.add_opportunity(opp)
        console.print(
            f"[green]✓ Added opportunity: {opp.title} (${opp.value:,.0f})[/green]"
        )
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_list(
    what: str = typer.Argument("leads", help="What to list: leads, opps, activities"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
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
            table.add_column("Score", justify="center")
            table.add_column("Status")
            table.add_column("Source")
            for lead in leads:
                score_str = str(lead.score)
                if lead.score >= 80:
                    score_str = f"[bold green]{lead.score}[/bold green]"
                elif lead.score >= 50:
                    score_str = f"[yellow]{lead.score}[/yellow]"

                table.add_row(
                    lead.lead_id,
                    lead.company_name,
                    lead.contact_name,
                    score_str,
                    lead.status.value,
                    lead.source.value,
                )
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
                table.add_row(
                    opp.opp_id,
                    opp.title,
                    opp.stage.value,
                    f"${opp.value:,.0f}",
                    f"{opp.probability}%",
                )
            console.print(table)

        elif what == "activities":
            activities = crm.get_activities()
            table = Table(title="Activities")
            table.add_column("ID", style="dim")
            table.add_column("Type")
            table.add_column("Subject", style="bold")
            table.add_column("Date")
            for act in activities:
                table.add_row(
                    act.activity_id,
                    act.type.value,
                    act.subject,
                    act.date.strftime("%Y-%m-%d"),
                )
            console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_pipeline(
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """Show pipeline summary."""
    from .crm.manager import CRMManager

    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        crm.print_pipeline()
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_analyze_risk(
    opp_id: str = typer.Argument(..., help="Opportunity ID to analyze"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """AI-powered deal risk analysis."""
    from .crm.manager import CRMManager
    from .crm.ai import AIManager
    from rich.panel import Panel
    from rich.text import Text

    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        ai = AIManager()

        console.print(f"[yellow]Analysing deal history for: {opp_id}...[/yellow]")

        # Get data
        opp = crm.get_opportunity(opp_id)
        if not opp:
            console.print(f"[red]Opportunity {opp_id} not found.[/red]")
            return

        lead = crm.get_lead(opp.lead_id)
        activities = crm.get_activities(opp_id=opp_id)

        # Analyze
        analysis = ai.analyze_deal_risk(opp, lead, activities)

        # Display
        risk_color = {
            "Low": "green",
            "Medium": "yellow",
            "High": "orange1",
            "Critical": "red",
            "Error": "dim red",
        }.get(analysis.get("risk_level", "Error"), "white")

        panel_content = Text()
        panel_content.append(f"\nDeal: {opp.title}\n", style="bold")
        panel_content.append(f"Client: {lead.company_name}\n\n")
        panel_content.append(
            f"Risk Level: {analysis.get('risk_level', 'Unknown')}\n",
            style=f"bold {risk_color}",
        )
        panel_content.append(
            f"Insight: {analysis.get('insight', 'No summary available.')}\n\n"
        )

        panel_content.append("Identified Risks:\n", style="bold yellow")
        for risk in analysis.get("risks", []):
            panel_content.append(f"• {risk}\n")

        panel_content.append("\nRecommended Actions:\n", style="bold green")
        for action in analysis.get("recommended_actions", []):
            panel_content.append(f"• {action}\n")

        console.print(
            Panel(
                panel_content,
                title="[bold]AI Deal Risk Analysis[/bold]",
                border_style=risk_color,
            )
        )

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_suggest_action(
    lead_id: str = typer.Argument(..., help="Lead ID to get suggestion for"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """AI-powered next best action suggestion for a lead."""
    from .crm.manager import CRMManager
    from .crm.ai import AIManager
    from rich.panel import Panel
    from rich.text import Text

    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        ai = AIManager()

        console.print(f"[yellow]Generating suggestion for lead: {lead_id}...[/yellow]")

        # Get data
        lead = crm.get_lead(lead_id)
        if not lead:
            console.print(f"[red]Lead {lead_id} not found.[/red]")
            return

        opps = crm.get_opportunities_for_lead(lead_id)
        active_opp = next(
            (
                o
                for o in opps
                if o.stage not in ["Closed Won", "Closed Lost", "Cash in Bank"]
            ),
            None,
        )
        activities = crm.get_activities(lead_id=lead_id)

        # Suggest
        suggestion = ai.suggest_next_action(lead, active_opp, activities)

        # Display
        priority_color = {"High": "red", "Medium": "yellow", "Low": "green"}.get(
            suggestion.get("priority", "Medium"), "white"
        )

        panel_content = Text()
        panel_content.append(
            f"\nAction: {suggestion.get('action', 'Unknown')}\n", style="bold"
        )
        panel_content.append(
            f"Priority: {suggestion.get('priority', 'Medium')}\n",
            style=f"bold {priority_color}",
        )
        panel_content.append(f"Task Type: {suggestion.get('task_type', 'Task')}\n\n")

        panel_content.append("Description:\n", style="bold")
        panel_content.append(
            f"{suggestion.get('description', 'No description provided.')}\n\n"
        )

        panel_content.append("AI Reasoning:\n", style="bold dim")
        panel_content.append(
            f"{suggestion.get('reasoning', 'No reasoning provided.')}\n"
        )

        console.print(
            Panel(
                panel_content,
                title="[bold]🎯 Smart Activity Suggestion[/bold]",
                border_style=priority_color,
            )
        )

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_score_lead(
    lead_id: str = typer.Argument(..., help="Lead ID to score"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """AI-powered lead scoring (0-100) based on profile and history."""
    from .crm.manager import CRMManager
    from .crm.ai import AIManager
    from rich.panel import Panel
    from rich.text import Text

    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        ai = AIManager()

        console.print(f"[yellow]Calculating lead score for: {lead_id}...[/yellow]")

        # Get data
        lead = crm.get_lead(lead_id)
        if not lead:
            console.print(f"[red]Lead {lead_id} not found.[/red]")
            return

        activities = crm.get_activities(lead_id=lead_id)

        # Score
        scoring = ai.score_lead(lead, activities)

        # Update lead
        score = scoring.get("score", 0)
        lead.score = score

        # Prepend reasoning to notes
        reason = f"AI Score: {score}/100 - {scoring.get('reasoning', '')}"
        if lead.notes:
            lead.notes = f"{reason}\n\n{lead.notes}"
        else:
            lead.notes = reason

        crm.update_lead(lead)

        # Display
        score_color = "green" if score >= 80 else "yellow" if score >= 50 else "red"

        panel_content = Text()
        panel_content.append(f"\nLead: {lead.company_name}\n", style="bold")
        panel_content.append(f"Score: ", style="bold")
        panel_content.append(f"{score}/100\n\n", style=f"bold {score_color}")

        panel_content.append("Reasoning:\n", style="bold")
        panel_content.append(
            f"{scoring.get('reasoning', 'No reasoning provided.')}\n\n"
        )

        panel_content.append("Strengths:\n", style="bold green")
        for strength in scoring.get("strengths", []):
            panel_content.append(f"• {strength}\n")

        panel_content.append("\nWeaknesses:\n", style="bold red")
        for weakness in scoring.get("weaknesses", []):
            panel_content.append(f"• {weakness}\n")

        console.print(
            Panel(
                panel_content,
                title="[bold]🧠 AI Lead Scoring Engine[/bold]",
                border_style=score_color,
            )
        )

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_sync_emails(
    lead_id: str = typer.Option(None, help="Sync emails for specific lead ID"),
    days: int = typer.Option(7, help="Days back to search"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name"),
):
    """Sync emails from Gmail and log as activities."""
    from .crm.manager import CRMManager

    try:
        gc, creds = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet, google_creds=creds)

        if lead_id:
            # Sync for specific lead
            lead = crm.get_lead(lead_id)
            if not lead:
                console.print(f"[red]Lead {lead_id} not found[/red]")
                return

            console.print(f"[yellow]Syncing emails for {lead.company_name}...[/yellow]")
            activities = crm.sync_emails_for_lead(lead, days_back=days)
            console.print(f"[green]✓ Synced {len(activities)} emails[/green]")
        else:
            # Sync for all leads
            console.print(
                f"[yellow]Syncing emails for all leads (last {days} days)...[/yellow]"
            )
            stats = crm.sync_emails_for_all_leads(days_back=days)
            console.print(f"[green]✓ Sync complete![/green]")
            console.print(f"  Total leads: {stats['total_leads']}")
            console.print(f"  Leads with email: {stats['leads_with_email']}")
            console.print(f"  Emails synced: {stats['emails_synced']}")
            if stats["errors"] > 0:
                console.print(f"  [red]Errors: {stats['errors']}[/red]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


if __name__ == "__main__":
    app()
