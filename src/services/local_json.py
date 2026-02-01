import json
import os
from typing import List, Optional, Any
from rich.console import Console
from rich.table import Table

console = Console()


class MockSheetManager:
    """
    A mock implementation of SheetManager that reads/writes to a local JSON file.
    Mimics the interface of src.sheets.SheetManager.
    """

    def __init__(self, file_path: str = "data/mock_crm.json"):
        self.file_path = file_path
        self.sheets = self._load_data()
        self.gc = None  # Public property compatibility

    def _load_data(self) -> dict:
        """Load data from JSON file."""
        if not os.path.exists(self.file_path):
            console.print(
                f"[yellow]Mock data file not found at {self.file_path}. Creating new one.[/yellow]"
            )
            return {"Sales Pipeline 2026": {}}
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            console.print(
                f"[red]Error decoding {self.file_path}. Starting empty.[/red]"
            )
            return {"Sales Pipeline 2026": {}}

    def _save_data(self):
        """Save data to JSON file."""
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, "w") as f:
            json.dump(self.sheets, f, indent=2, default=str)

    def list_files(self):
        """Mock listing files."""
        # Return a list of dicts mimicking Google Drive file objects
        files = []
        for name in self.sheets.keys():
            files.append(
                {
                    "id": f"mock_id_{name}",
                    "name": name,
                    "modifiedTime": "2023-10-27T10:00:00Z",  # Static mock time
                }
            )

        table = Table(title="Recent Google Sheets (MOCK)")
        table.add_column("ID", style="dim", no_wrap=True)
        table.add_column("Name", style="bold")
        table.add_column("Modified", style="cyan")

        for file in files:
            table.add_row(file.get("id"), file.get("name"), file.get("modifiedTime"))

        console.print(table)
        return files

    def get_sheet(self, name_or_url: str):
        """Mock get sheet. Returns self to mimic worksheet lookup on a 'Sheet' object."""
        # In real implementation this returns a gspread.Spreadsheet.
        # Here we return a dummy object that has a .worksheet() method.
        valid_names = list(self.sheets.keys())

        # Simple fuzzy match or direct lookup logic
        target_name = name_or_url
        if name_or_url not in valid_names:
            # Check if it's an ID we generated
            for name in valid_names:
                if f"mock_id_{name}" == name_or_url:
                    target_name = name
                    break

        if target_name not in valid_names:
            # Auto-create for convenience in mock mode?
            # Or return None like real one
            if "Sales" in name_or_url:  # Auto-create default CRM sheet
                self.sheets[name_or_url] = {}
                self._save_data()
                target_name = name_or_url
            else:
                return None

        # Return a dummy object that mimics gspread.Spreadsheet
        class MockSpreadsheet:
            def __init__(self, parent, name):
                self.parent = parent
                self.title = name
                self.id = f"mock_id_{name}"
                self.url = f"http://mock.local/sheets/{name}"

            def worksheet(self, title):
                # Ensure worksheet exists in data
                if title not in self.parent.sheets[self.title]:
                    # raise gspread.exceptions.WorksheetNotFound like real one
                    # But we can just init it for mock convenience
                    self.parent.sheets[self.title][title] = []
                    self.parent._save_data()

                # Return dummy Worksheet
                return MockWorksheet(self.parent, self.title, title)

            def add_worksheet(self, title, rows=100, cols=20):
                if title not in self.parent.sheets[self.title]:
                    self.parent.sheets[self.title][title] = []
                    self.parent._save_data()
                return MockWorksheet(self.parent, self.title, title)

        return MockSpreadsheet(self, target_name)

    def read_data(self, sheet_name: str, worksheet_name: str = "Sheet1"):
        """Reads mock data."""
        if sheet_name not in self.sheets:
            return None
        return self.sheets[sheet_name].get(worksheet_name, [])

    def create_sheet(self, title: str):
        """Creates a new mock sheet."""
        if title not in self.sheets:
            self.sheets[title] = {}
            self._save_data()

        console.print(f"[green]Created new MOCK sheet: {title}[/green]")
        return self.get_sheet(title)

    def update_cell(
        self,
        sheet_name: str,
        cell_address: str,
        value: str,
        worksheet_name: str = "Sheet1",
    ):
        """Mock update single cell - NOT IMPLEMENTED FULLY (complex parsing w/o gspread)."""
        console.print(
            f"[yellow]MOCK: Single cell update {cell_address} not supported yet. Use row updates.[/yellow]"
        )

    def update_row(
        self,
        sheet_name: str,
        row_index: int,
        row_data: list,
        worksheet_name: str = "Sheet1",
    ):
        """Updates an entire row."""
        if sheet_name not in self.sheets:
            return
        ws_data = self.sheets[sheet_name].get(worksheet_name, [])

        # row_index is 1-based
        idx = row_index - 1

        # Extend if needed
        while len(ws_data) <= idx:
            ws_data.append([])

        ws_data[idx] = row_data
        self.sheets[sheet_name][worksheet_name] = ws_data
        self._save_data()
        console.print(f"[green]MOCK: Updated row {row_index} in {sheet_name}[/green]")

    def append_row(
        self, sheet_name: str, row_data: list, worksheet_name: str = "Sheet1"
    ):
        """Appends a row."""
        if sheet_name not in self.sheets:
            self.sheets[sheet_name] = {}

        ws_data = self.sheets[sheet_name].get(worksheet_name, [])
        ws_data.append(row_data)
        self.sheets[sheet_name][worksheet_name] = ws_data
        self._save_data()
        console.print(f"[green]MOCK: Appended row to {sheet_name}[/green]")

    def append_rows(
        self, sheet_name: str, rows_data: list, worksheet_name: str = "Sheet1"
    ):
        for row in rows_data:
            self.append_row(sheet_name, row, worksheet_name)

    def clear_range(
        self, sheet_name: str, range_name: str, worksheet_name: str = "Sheet1"
    ):
        pass  # Todo

    def delete_row(
        self, sheet_name: str, row_index: int, worksheet_name: str = "Sheet1"
    ):
        if sheet_name not in self.sheets:
            return
        ws_data = self.sheets[sheet_name].get(worksheet_name, [])

        idx = row_index - 1
        if 0 <= idx < len(ws_data):
            ws_data.pop(idx)
            self.sheets[sheet_name][worksheet_name] = ws_data
            self._save_data()
            console.print(f"[green]MOCK: Deleted row {row_index}[/green]")


class MockWorksheet:
    """Mimics gspread.Worksheet objects returned by .worksheet()"""

    def __init__(self, manager, sheet_name, title):
        self.manager = manager
        self.sheet_name = sheet_name
        self.title = title

    def get_all_values(self):
        return self.manager.read_data(self.sheet_name, self.title)

    def update(self, range_name, values):
        # range_name like 'A2' -> row 2
        # Extremely simplified parsing
        if range_name.startswith("A"):
            try:
                row_idx = int(range_name[1:])
                if len(values) == 1:
                    self.manager.update_row(
                        self.sheet_name, row_idx, values[0], self.title
                    )
            except Exception:
                # Intentionally ignore invalid ranges or update errors in this mock implementation.
                return

    def append_row(self, values):
        self.manager.append_row(self.sheet_name, values, self.title)

    def append_rows(self, values):
        self.manager.append_rows(self.sheet_name, values, self.title)

    def delete_rows(self, row_index):
        self.manager.delete_row(self.sheet_name, row_index, self.title)

    def batch_clear(self, ranges):
        pass
