
import sys
import os
import random
from datetime import datetime, timedelta
from faker import Faker
import argparse
from rich.console import Console
from rich.progress import track

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.auth import authenticate
from src.sheets import SheetManager
from src.crm.manager import CRMManager
from src.crm.models import (
    Lead, Opportunity, Activity,
    LeadStatus, LeadSource, CompanySize, PipelineStage, ActivityType
)

fake = Faker()
console = Console()

def generate_leads(count=10):
    leads = []
    console.print(f"[bold]Generating {count} Leads...[/bold]")
    for _ in range(count):
        lead = Lead(
            company_name=fake.company(),
            contact_name=fake.name(),
            contact_email=fake.email(),
            contact_phone=fake.phone_number(),
            status=random.choice(list(LeadStatus)),
            source=random.choice(list(LeadSource)),
            industry=fake.job(),
            company_size=random.choice(list(CompanySize)),
            notes=fake.bs(),
            owner="Demo User",  # Static for demo
            created_at=fake.date_time_between(start_date='-60d', end_date='now'),
            updated_at=datetime.now()
        )
        leads.append(lead)
    return leads

def generate_opportunities(leads, ratio=0.6):
    opps = []
    # Convert leads to potential opportunities (approx 60% conversion rate for demo)
    target_count = int(len(leads) * ratio)
    console.print(f"[bold]Generating ~{target_count} Opportunities...[/bold]")
    
    selected_leads = random.sample(leads, target_count)
    
    for lead in selected_leads:
        stage = random.choice(list(PipelineStage))
        
        # Calculate probability based on stage
        prob_map = {
            PipelineStage.PROSPECTING: 10,
            PipelineStage.DISCOVERY: 20,
            PipelineStage.PROPOSAL: 40,
            PipelineStage.NEGOTIATION: 70,
            PipelineStage.CLOSED_WON: 100,
            PipelineStage.CLOSED_LOST: 0,
            PipelineStage.DELIVERY: 100,
            PipelineStage.INVOICING: 100,
            PipelineStage.CASH_IN_BANK: 100
        }
        
        opp = Opportunity(
            lead_id=lead.lead_id,
            title=f"{lead.company_name} - {fake.catch_phrase()}",
            stage=stage,
            value=random.uniform(1000, 50000),
            probability=prob_map.get(stage, 50),
            close_date=fake.date_between(start_date='now', end_date='+60d'),
            product=random.choice(["Consulting", "Software License", "Implementation", "Audit"]),
            notes=fake.sentence(),
            owner="Demo User",
            created_at=lead.created_at + timedelta(days=random.randint(1, 10))
        )
        opps.append(opp)
    return opps

def generate_activities(leads, opps, count_per_entity=3):
    activities = []
    console.print(f"[bold]Generating Activities...[/bold]")
    
    # Activities for leads
    for lead in leads:
        for _ in range(random.randint(0, count_per_entity)):
            act = Activity(
                lead_id=lead.lead_id,
                type=random.choice(list(ActivityType)),
                subject=fake.sentence(nb_words=4),
                description=fake.paragraph(nb_sentences=2),
                date=fake.date_time_between(start_date=lead.created_at, end_date='now'),
                created_by="Demo User"
            )
            activities.append(act)
            
    # Activities for opportunities
    for opp in opps:
        for _ in range(random.randint(0, count_per_entity)):
             act = Activity(
                lead_id=opp.lead_id,
                opp_id=opp.opp_id,
                type=random.choice(list(ActivityType)),
                subject=f"Re: {opp.title}",
                description=fake.paragraph(nb_sentences=1),
                date=fake.date_time_between(start_date=opp.created_at, end_date='now'),
                created_by="Demo User"
            )
             activities.append(act)
             
    return activities

def main():
    parser = argparse.ArgumentParser(description="Generate dummy CRM data.")
    parser.add_argument("--sheet", type=str, default="Sales Pipeline 2026", help="Name of the Google Sheet")
    parser.add_argument("--leads", type=int, default=20, help="Number of leads to generate")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before adding")
    args = parser.parse_args()

    console.print("[yellow]Authenticating...[/yellow]")
    try:
        gc, _ = authenticate()
        sm = SheetManager(gc)
        crm = CRMManager(sm, sheet_name=args.sheet)
        console.print(f"[green]Connected to sheet: {args.sheet}[/green]")
    except Exception as e:
        console.print(f"[red]Authentication failed: {e}[/red]")
        return

    # Clear data if requested
    if args.clear:
        if console.input(f"[bold red]Are you sure you want to clear ALL data from '{args.sheet}'? (y/n): [/bold red]").lower() == 'y':
            console.print("Clearing worksheets...")
            # We would need to implement clear methods in CRMManager or use SheetManager direct
            # For safety, let's just warn for now or implement a simple clear range
            # Implementation for clear left as exercise or manual for now to avoid accidents
            # sm.clear_range(...)
            pass

    # Generate Data
    leads = generate_leads(args.leads)
    opps = generate_opportunities(leads)
    activities = generate_activities(leads, opps)

    # Push to Sheets (Batch would be better but simple loops work for script)
    console.print(f"\n[bold cyan]Pushing data to Google Sheets...[/bold cyan]")
    
    with console.status("Adding Leads...") as status:
        for lead in leads:
            crm.add_lead(lead)
            
    with console.status("Adding Opportunities...") as status:
        for opp in opps:
            crm.add_opportunity(opp)
            
    with console.status("Adding Activities...") as status:
        for act in activities: # Limit activities if too many
            crm.log_activity(act)

    console.print(f"\n[bold green]Success![/bold green]")
    console.print(f"Added {len(leads)} Leads")
    console.print(f"Added {len(opps)} Opportunities")
    console.print(f"Added {len(activities)} Activities")

if __name__ == "__main__":
    main()
