from googleapiclient.discovery import build
from rich.console import Console

console = Console()


class DocsManager:
    def __init__(self, credentials):
        self.service = build("docs", "v1", credentials=credentials)

    def read_doc(self, doc_id: str):
        """Reads the content of a Google Doc."""
        try:
            document = self.service.documents().get(documentId=doc_id).execute()
            console.print(
                f"[bold green]Read document: {document.get('title')}[/bold green]"
            )

            content = ""
            for value in document.get("body").get("content"):
                if "paragraph" in value:
                    elements = value.get("paragraph").get("elements")
                    for elem in elements:
                        if "textRun" in elem:
                            content += elem.get("textRun").get("content")

            return content
        except Exception as e:
            console.print(f"[red]Error reading doc: {e}[/red]")
            return None
