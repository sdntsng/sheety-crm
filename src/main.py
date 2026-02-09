import typer
import json
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
            table.add_column("Score", justify="center")
            table.add_column("Status")
            table.add_column("Source")
            for lead in leads:
                score_value = lead.score or 0
                score_str = str(score_value)
                if score_value >= 80:
                    score_str = f"[bold green]{score_value}[/bold green]"
                elif score_value >= 50:
                    score_str = f"[yellow]{score_value}[/yellow]"
                
                table.add_row(lead.lead_id, lead.company_name, lead.contact_name, score_str, lead.status.value, lead.source.value)
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


@app.command()
def crm_analyze_risk(
    opp_id: str = typer.Argument(..., help="Opportunity ID to analyze"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
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
            "Error": "dim red"
        }.get(analysis.get("risk_level", "Error"), "white")
        
        panel_content = Text()
        panel_content.append(f"\nDeal: {opp.title}\n", style="bold")
        panel_content.append(f"Client: {lead.company_name}\n\n")
        panel_content.append(f"Risk Level: {analysis.get('risk_level', 'Unknown')}\n", style=f"bold {risk_color}")
        panel_content.append(f"Insight: {analysis.get('insight', 'No summary available.')}\n\n")
        
        panel_content.append("Identified Risks:\n", style="bold yellow")
        for risk in analysis.get("risks", []):
            panel_content.append(f"• {risk}\n")
            
        panel_content.append("\nRecommended Actions:\n", style="bold green")
        for action in analysis.get("recommended_actions", []):
            panel_content.append(f"• {action}\n")
            
        console.print(Panel(panel_content, title="[bold]AI Deal Risk Analysis[/bold]", border_style=risk_color))
        
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_suggest_action(
    lead_id: str = typer.Argument(..., help="Lead ID to get suggestion for"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
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
        active_opp = next((o for o in opps if o.stage not in ["Closed Won", "Closed Lost", "Cash in Bank"]), None)
        activities = crm.get_activities(lead_id=lead_id)
        
        # Suggest
        suggestion = ai.suggest_next_action(lead, active_opp, activities)
        
        # Display
        priority_color = {
            "High": "red",
            "Medium": "yellow",
            "Low": "green"
        }.get(suggestion.get("priority", "Medium"), "white")
        
        panel_content = Text()
        panel_content.append(f"\nAction: {suggestion.get('action', 'Unknown')}\n", style="bold")
        panel_content.append(f"Priority: {suggestion.get('priority', 'Medium')}\n", style=f"bold {priority_color}")
        panel_content.append(f"Task Type: {suggestion.get('task_type', 'Task')}\n\n")
        
        panel_content.append("Description:\n", style="bold")
        panel_content.append(f"{suggestion.get('description', 'No description provided.')}\n\n")
        
        panel_content.append("AI Reasoning:\n", style="bold dim")
        panel_content.append(f"{suggestion.get('reasoning', 'No reasoning provided.')}\n")
        
        console.print(Panel(panel_content, title="[bold]🎯 Smart Activity Suggestion[/bold]", border_style=priority_color))
        
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_score_lead(
    lead_id: str = typer.Argument(..., help="Lead ID to score"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
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
        panel_content.append(f"{scoring.get('reasoning', 'No reasoning provided.')}\n\n")
        
        panel_content.append("Strengths:\n", style="bold green")
        for strength in scoring.get("strengths", []):
            panel_content.append(f"• {strength}\n")
            
        panel_content.append("\nWeaknesses:\n", style="bold red")
        for weakness in scoring.get("weaknesses", []):
            panel_content.append(f"• {weakness}\n")
            
        console.print(Panel(panel_content, title="[bold]🧠 AI Lead Scoring Engine[/bold]", border_style=score_color))
        
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def crm_sync(
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Headless sync/health check for agent workflows."""
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)

        # Trigger reads to refresh caches and ensure worksheets exist lazily
        leads = crm.get_leads()
        opps = crm.get_opportunities()
        activities = crm.get_activities()
        tasks = crm.get_tasks()
        views = crm.get_saved_views()
        custom_fields = crm.get_custom_field_definitions()

        result = {
            "sheet": sheet,
            "leads": len(leads),
            "opportunities": len(opps),
            "activities": len(activities),
            "tasks": len(tasks),
            "saved_views": len(views),
            "custom_fields": len(custom_fields),
            "status": "ok",
        }
        console.print_json(json.dumps(result))
    except Exception as e:
        console.print_json(json.dumps({"status": "error", "error": str(e)}))
        raise typer.Exit(code=1)


@app.command()
def crm_report_daily(
    format: str = typer.Option("md", help="Output format: md or json"),
    output: str = typer.Option(None, help="Optional output file path"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Generate a daily CRM report for CLI/agent usage."""
    from datetime import date
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)

        summary = crm.get_pipeline_summary()
        overdue_tasks = [
            task for task in crm.get_tasks(status="Open")
            if task.due_date and task.due_date < date.today()
        ]
        duplicates = crm.find_duplicate_leads()

        payload = {
            "date": date.today().isoformat(),
            "sheet": sheet,
            "summary": summary,
            "overdue_tasks": [task.model_dump() for task in overdue_tasks[:20]],
            "duplicate_candidates": duplicates[:20],
        }

        if format == "json":
            result = json.dumps(payload, indent=2, default=str)
        else:
            result = "\n".join([
                f"# Daily CRM Report ({payload['date']})",
                "",
                f"- Sheet: `{sheet}`",
                f"- Total Leads: {summary['total_leads']}",
                f"- Total Opportunities: {summary['total_opportunities']}",
                f"- Pipeline Value: ${summary['total_pipeline_value']:,.0f}",
                f"- Expected Value: ${summary['total_expected_value']:,.0f}",
                f"- Closed Won Value: ${summary['closed_won_value']:,.0f}",
                f"- Cash in Bank: ${summary['cash_in_bank']:,.0f}",
                f"- Overdue Tasks: {len(overdue_tasks)}",
                f"- Duplicate Lead Candidates: {len(duplicates)}",
            ])

        if output:
            with open(output, "w", encoding="utf-8") as f:
                f.write(result)
            console.print(f"[green]Report saved to {output}[/green]")
        else:
            console.print(result)

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


@app.command()
def crm_export(
    entity: str = typer.Argument(..., help="Entity to export: leads|opportunities|activities|tasks"),
    output: str = typer.Option(..., help="Output CSV file path"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Export CRM data to CSV."""
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        payload = crm.export_entity_csv(entity)
        with open(output, "w", encoding="utf-8") as f:
            f.write(payload)
        console.print(f"[green]Exported {entity} to {output}[/green]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


@app.command()
def crm_ai_ask(
    question: str = typer.Argument(..., help="Question for CRM coach"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Provide AI-style coaching advice from CRM context."""
    from .crm.manager import CRMManager
    from rich.panel import Panel
    from rich.text import Text
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        summary = crm.get_pipeline_summary()

        answer = "Focus on clear next steps and a dated follow-up."
        lower_q = question.lower()
        if "discount" in lower_q or "price" in lower_q:
            answer = "Reframe to ROI outcomes and trade scope before discounting."
        elif "stuck" in lower_q or "slow" in lower_q:
            answer = "Identify the blocker and schedule a decision-oriented call."
        elif "forecast" in lower_q:
            answer = (
                f"Current expected value is ${summary['total_expected_value']:,.0f} "
                f"across {summary['total_opportunities']} opportunities."
            )

        text = Text()
        text.append("Question:\n", style="bold")
        text.append(f"{question}\n\n")
        text.append("Answer:\n", style="bold green")
        text.append(answer)
        console.print(Panel(text, title="[bold]CRM AI Ask[/bold]"))
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


@app.command()
def crm_connector_connect(
    provider: str = typer.Argument(..., help="Provider key: google_calendar|gmail|slack"),
    config: str = typer.Option("{}", help="JSON config payload"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Connect or update a connector configuration."""
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        config_payload = json.loads(config)
        if not isinstance(config_payload, dict):
            raise ValueError("config must be a JSON object")
        connection = crm.upsert_integration(provider, config_payload)
        console.print_json(json.dumps(connection.model_dump(), default=str))
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


@app.command()
def crm_connector_sync(
    provider: str = typer.Argument(..., help="Provider key: google_calendar|gmail|slack"),
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """Run a connector sync and print summary."""
    from .crm.manager import CRMManager
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        result = crm.run_integration_sync(provider)
        console.print_json(json.dumps(result, default=str))
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


@app.command()
def crm_connector_status(
    sheet: str = typer.Option("Sales Pipeline 2026", help="CRM sheet name"),
    profile: str = typer.Option("default", help="Profile name")
):
    """List connector status rows."""
    from .crm.manager import CRMManager
    from rich.table import Table
    try:
        gc, _ = authenticate(profile)
        crm = CRMManager(SheetManager(gc), sheet)
        rows = crm.get_integrations()
        table = Table(title="CRM Connectors")
        table.add_column("Provider", style="bold")
        table.add_column("Status")
        table.add_column("Last Sync")
        for row in rows:
            table.add_row(row.provider, row.status, row.last_sync_at.isoformat() if row.last_sync_at else "-")
        console.print(table)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
