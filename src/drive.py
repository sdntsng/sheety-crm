from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from rich.console import Console
from rich.table import Table

console = Console()

class DriveManager:
    def __init__(self, credentials):
        self.service = build('drive', 'v3', credentials=credentials)

    def list_files(self, page_size: int = 10, query: str = None):
        """Lists files in Google Drive."""
        q_filter = f"name contains '{query}'" if query else None
        results = self.service.files().list(
            pageSize=page_size, q=q_filter, fields="nextPageToken, files(id, name, mimeType)").execute()
        items = results.get('files', [])

        if not items:
            console.print("No files found.")
        else:
            table = Table(title="Drive Files")
            table.add_column("ID", style="dim", no_wrap=True)
            table.add_column("Name", style="bold")
            table.add_column("Type")

            for item in items:
                table.add_row(item['id'], item['name'], item['mimeType'])
            console.print(table)
        return items

    def upload_file(self, file_path: str, mime_type: str = None):
        """Uploads a file to Google Drive."""
        file_metadata = {'name': file_path.split("/")[-1]}
        media = MediaFileUpload(file_path, mimetype=mime_type)
        file = self.service.files().create(body=file_metadata,
                                            media_body=media,
                                            fields='id').execute()
        console.print(f"[green]File ID: {file.get('id')} uploaded.[/green]")
        return file.get('id')
