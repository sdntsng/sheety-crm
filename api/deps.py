from fastapi import Header, HTTPException, Depends
from typing import Dict, Optional
import gspread
from google.oauth2.credentials import Credentials
from src.sheets import SheetManager
from src.crm.manager import CRMManager
import os

# Cache CRM sessions by Access Token to preserve data caching (Quota protection)
# In a real production app, use Redis or Memcached.
_user_sessions: Dict[str, CRMManager] = {}

async def get_crm_session(
    authorization: Optional[str] = Header(None),
    x_sheet_id: Optional[str] = Header(None)
) -> CRMManager:
    """
    Dependency that returns a CRMManager authenticated with the user's Bearer token.
    Supports Singleton fallback for Local Dev if no header is present (and not in Render).
    """

    # 1. Local/Singleton Fallback (CLI or Single-Tenant Dev)
    # If no Auth header is present, we check if we have server-side credentials
    if not authorization:
        # Check if we have server credentials loaded globally (from server.py's old logic)
        # But better to just re-authentication using src.auth default
        from src.auth import authenticate
        try:
             # This uses local token.json or Service Account Env
             # This uses local token.json or Service Account Env
             gc, _ = authenticate()
             
             # Use a fixed key for local dev session
             cache_key = f"local_dev::{x_sheet_id or 'default'}"
             
             if cache_key in _user_sessions:
                 return _user_sessions[cache_key]
                 
             sheet_name = x_sheet_id or "Sales Pipeline 2026"
             crm = CRMManager(SheetManager(gc), sheet_name=sheet_name)
             _user_sessions[cache_key] = crm
             return crm
        except Exception as e:
            print(f"Auth Fallback Error: {e}")
            raise HTTPException(status_code=401, detail="Authentication required (Bearer Token or Server Credentials)")

    # 2. Multi-Tenant / SaaS Mode
    token = authorization.replace("Bearer ", "").strip()
    if not token:
         raise HTTPException(status_code=401, detail="Invalid authorization header")

    # Return cached session if available
    # Note: Tokens rotate, so this dict will grow. We should clear it periodically?
    # For MVP, it's fine.
    cache_key = f"{token}::{x_sheet_id or 'default'}"
    if cache_key in _user_sessions:
        return _user_sessions[cache_key]

    try:
        # Create Credentials from Access Token
        # NOTE: We only have access_token here. Refresh handled by Frontend (NextAuth).
        creds = Credentials(token=token)
        gc = gspread.authorize(creds)
        
        # Instantiate CRM Manager for this user
        # We assume the user has the "Sales Pipeline 2026" sheet.
        # If not, errors will occur in methods, can be handled there.
        sm = SheetManager(gc)
        # Use provided sheet_id or default
        sheet_name = x_sheet_id if x_sheet_id else "Sales Pipeline 2026"
        crm = CRMManager(sm, sheet_name=sheet_name)
        
        _user_sessions[cache_key] = crm
        return crm
        
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
