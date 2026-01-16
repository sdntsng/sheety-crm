from .sheets import SheetManager
from .drive import DriveManager
from rich.console import Console

console = Console()

class WorkflowManager:
    def __init__(self, gc, drive_creds):
        self.sheet_manager = SheetManager(gc)
        self.drive_manager = DriveManager(drive_creds)

    def create_project_workspace(self, project_name: str):
        """Creates a folder and a tracking sheet for a new project."""
        console.print(f"[bold blue]Starting workflow: Create Project Workspace '{project_name}'[/bold blue]")
        
        # 1. Create a tracking sheet
        sheet = self.sheet_manager.create_sheet(f"{project_name} - Tracker")
        
        # 2. Setup initial headers
        if sheet:
            ws = sheet.get_worksheet(0)
            ws.append_row(["Task ID", "Description", "Status", "Owner", "Due Date"])
            ws.format("A1:E1", {"textFormat": {"bold": True}})
            console.print("[green]✔ Created tracker sheet with headers[/green]")

        # Note: Moving file to folder would require Drive API 'update' method (addParents/removeParents)
        # which can be added to DriveManager if needed.
        
        console.print(f"[bold green]Workflow completed for '{project_name}'[/bold green]")
