import gspread
from rich.table import Table
from rich.console import Console
from typing import List, Optional

from .retry import sheets_api_retry

console = Console()


class SheetManager:
    def __init__(self, gc: gspread.Client):
        self.gc = gc
        self._sh_cache = {}  # Cache for opened Spreadsheet objects

    @sheets_api_retry
    def list_files(self):
        """Lists the 50 most recently modified spreadsheets."""
        # Use Drive API v3 directly to filter and sort
        url = "https://www.googleapis.com/drive/v3/files"
        params = {
            "q": "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            "orderBy": "modifiedTime desc",
            "pageSize": 50,
            "fields": "files(id, name, modifiedTime)"
        }
        
        try:
            # gspread Client exposes request method which handles auth
            res = self.gc.request("get", url, params=params)
            files = res.json().get("files", [])
            
            table = Table(title="Recent Google Sheets")
            table.add_column("ID", style="dim", no_wrap=True)
            table.add_column("Name", style="bold")
            table.add_column("Modified", style="cyan")
            
            for file in files:
                table.add_row(file.get('id'), file.get('name'), file.get('modifiedTime'))
            
            console.print(table)
            return files
        except Exception as e:
            console.print(f"[red]Error listing files: {e}[/red]")
            # Fallback to default if custom request fails (compatibility)
            return self.gc.list_spreadsheet_files()

    @sheets_api_retry
    def get_sheet(self, name_or_url: str):
        """Opens a spreadsheet by name, URL, or ID (cached)."""
        if name_or_url in self._sh_cache:
            return self._sh_cache[name_or_url]

        try:
            sh = None
            if "docs.google.com" in name_or_url:
                sh = self.gc.open_by_url(name_or_url)
            else:
                try:
                    sh = self.gc.open(name_or_url)
                except gspread.exceptions.SpreadsheetNotFound:
                    # Try opening by key (ID)
                    sh = self.gc.open_by_key(name_or_url)
            
            if sh:
                self._sh_cache[name_or_url] = sh
            return sh

        except gspread.exceptions.SpreadsheetNotFound:
            console.print(f"[red]Spreadsheet '{name_or_url}' not found.[/red]")
            return None

    @sheets_api_retry
    def read_data(self, sheet_name: str, worksheet_name: str = "Sheet1"):
        """Reads all records from a worksheet."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None

        try:
            ws = sh.worksheet(worksheet_name)
            # Use get_all_values to avoid duplicate header errors
            data = ws.get_all_values()
            
            # Print first 5 rows as a table for preview
            if data:
                headers = data[0]
                table = Table(title=f"Data Preview: {sheet_name}")
                for h in headers[:5]: # distinct col limit for display
                    table.add_column(str(h) if h else "Col", style="bold")
                
                for row in data[1:6]:
                    table.add_row(*[str(c) for c in row[:5]])
                console.print(table)

            return data
        except gspread.exceptions.WorksheetNotFound:
            console.print(f"[red]Worksheet '{worksheet_name}' not found in '{sheet_name}'.[/red]")
            return None

    @sheets_api_retry
    def create_sheet(self, title: str):
        """Creates a new spreadsheet."""
        sh = self.gc.create(title)
        console.print(f"[green]Created new sheet: {sh.title} ({sh.url})[/green]")
        return sh

    @sheets_api_retry
    def update_cell(self, sheet_name: str, cell_address: str, value: str, worksheet_name: str = "Sheet1"):
        """Updates a single cell in a worksheet."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None
        try:
            ws = sh.worksheet(worksheet_name)
            ws.update_acell(cell_address, value)
            console.print(f"[green]Updated {cell_address} in {sheet_name} to '{value}'[/green]")
        except Exception as e:
            console.print(f"[red]Error updating cell: {e}[/red]")

    @sheets_api_retry
    def update_row(self, sheet_name: str, row_index: int, row_data: list, worksheet_name: str = "Sheet1"):
        """Updates an entire row efficiently."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None
        try:
            ws = sh.worksheet(worksheet_name)
            # Calculate range, e.g., A2:Z2
            start_cell = f"A{row_index}"
            end_col = chr(65 + len(row_data) - 1) # simple logic for < 26 cols
            if len(row_data) > 26: append_col = "Z" # Fallback/TODO for >26 cols
            
            # gspread update usage: update([cell_list] or range_name, values=[[]])
            # For a single row, values is [[col1, col2, ...]]
            # Range identifier: "A2" works for starting point? range "A2:Z2" is safer
            range_name = f"A{row_index}"
            ws.update(check_input_data=False, range_name=range_name, values=[row_data])
            console.print(f"[green]Updated row {row_index} in {sheet_name} (Batch)[/green]")
        except Exception as e:
            console.print(f"[red]Error updating row: {e}[/red]")

    @sheets_api_retry
    def append_row(self, sheet_name: str, row_data: list, worksheet_name: str = "Sheet1"):
        """Appends a single row to the worksheet."""
        sh = self.get_sheet(sheet_name)
        if not sh:
            raise gspread.exceptions.SpreadsheetNotFound(sheet_name)
        
        ws = sh.worksheet(worksheet_name)
        ws.append_row(row_data)
        console.print(f"[green]Appended row to {sheet_name}: {row_data!r}[/green]")

    @sheets_api_retry
    def append_rows(self, sheet_name: str, rows_data: list, worksheet_name: str = "Sheet1"):
        """Appends multiple rows to the worksheet in one batch."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None
        try:
            ws = sh.worksheet(worksheet_name)
            ws.append_rows(rows_data)
            console.print(f"[green]Appended {len(rows_data)} rows to {sheet_name}[/green]")
        except Exception as e:
            console.print(f"[red]Error appending rows: {e}[/red]")
            
    @sheets_api_retry
    def clear_range(self, sheet_name: str, range_name: str, worksheet_name: str = "Sheet1"):
        """Clears a specific range of cells."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None
        try:
            ws = sh.worksheet(worksheet_name)
            ws.batch_clear([range_name])
            console.print(f"[green]Cleared range {range_name} in {sheet_name}[/green]")
        except Exception as e:
            console.print(f"[red]Error clearing range: {e}[/red]")

    @sheets_api_retry
    def delete_row(self, sheet_name: str, row_index: int, worksheet_name: str = "Sheet1"):
        """Deletes a specific row."""
        sh = self.get_sheet(sheet_name)
        if not sh: return None
        try:
            ws = sh.worksheet(worksheet_name)
            ws.delete_rows(row_index)
            console.print(f"[green]Deleted row {row_index} in {sheet_name}[/green]")
        except Exception as e:
            console.print(f"[red]Error deleting row: {e}[/red]")
