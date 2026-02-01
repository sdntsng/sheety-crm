import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import gspread

# If modifying these scopes, delete the file token.json.
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
]

CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.json"

def authenticate(profile: str = "default"):
    """Authenticates the user and returns gspread client and google credentials."""
    # Check for Service Account JSON in Env (Production/Render)
    if os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON"):
        try:
            import json
            from google.oauth2.service_account import Credentials as ServiceAccountCredentials
            info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
            creds = ServiceAccountCredentials.from_service_account_info(info, scopes=SCOPES)
            gc = gspread.authorize(creds)
            return gc, creds
        except Exception as e:
            print(f"Warning: Failed to load Service Account from Env: {e}")
            # Fallback to local flow

    creds = None
    
    # 1. Check for Token JSON in Env (Production/Render with User Auth)
    if os.environ.get("GOOGLE_TOKEN_JSON"):
        try:
            import json
            token_info = json.loads(os.environ["GOOGLE_TOKEN_JSON"])
            # Reconstruct Credentials object from JSON data
            # We use Credentials.from_authorized_user_info instead of file
            creds = Credentials.from_authorized_user_info(token_info, SCOPES)
        except Exception as e:
            print(f"Warning: Failed to load Token from Env: {e}")

    # 2. Check for local token file (Dev)
    if not creds:
        token_filename = f"token_{profile}.json" if profile != "default" else TOKEN_FILE
        if os.path.exists(token_filename):
            try:
                creds = Credentials.from_authorized_user_file(token_filename, SCOPES)
            except Exception:
                creds = None

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Server-side: Cannot open browser for login if we are here
            if os.environ.get("RENDER") or os.environ.get("CI"):
                raise RuntimeError("No valid credentials found in Env (GOOGLE_TOKEN_JSON or GOOGLE_SERVICE_ACCOUNT_JSON). Cannot interactive login on server.")

            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(f"Could not find {CREDENTIALS_FILE}. Please download it from Google Cloud Console.")
            
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE, SCOPES
            )
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run (Local only)
        if not os.environ.get("RENDER"):
            with open(token_filename, "w") as token:
                token.write(creds.to_json())

    gc = gspread.authorize(creds)
    return gc, creds
