"""
Gmail API integration for fetching and managing email activities.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import base64
import email
from email.utils import parsedate_to_datetime
import re


class GmailManager:
    """Manages Gmail API operations for email activity logging."""

    def __init__(self, creds: Credentials):
        """Initialize Gmail service with credentials.

        Args:
            creds: Google OAuth2 credentials with gmail.readonly scope
        """
        self.service = build("gmail", "v1", credentials=creds)
        self.user_id = "me"

    def get_user_email(self) -> str:
        """Get the authenticated user's email address."""
        try:
            profile = self.service.users().getProfile(userId=self.user_id).execute()
            return profile.get("emailAddress", "")
        except HttpError as error:
            print(f"Error getting user profile: {error}")
            return ""

    def search_emails_by_contact(
        self, contact_email: str, max_results: int = 100, days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """Search for emails to/from a specific contact.

        Args:
            contact_email: Email address to search for
            max_results: Maximum number of emails to return
            days_back: How many days back to search

        Returns:
            List of email message dictionaries with parsed metadata
        """
        try:
            # Build search query
            # Search for emails to or from the contact
            query = f"from:{contact_email} OR to:{contact_email}"

            # Add date filter
            after_date = datetime.now() - timedelta(days=days_back)
            query += f" after:{after_date.strftime('%Y/%m/%d')}"

            # Get message IDs
            results = (
                self.service.users()
                .messages()
                .list(userId=self.user_id, q=query, maxResults=max_results)
                .execute()
            )

            messages = results.get("messages", [])

            if not messages:
                return []

            # Fetch full message details
            emails = []
            for msg in messages:
                email_data = self._get_email_details(msg["id"])
                if email_data:
                    emails.append(email_data)

            return emails

        except HttpError as error:
            print(f"Error searching emails: {error}")
            return []

    def _get_email_details(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific email.

        Args:
            message_id: Gmail message ID

        Returns:
            Dictionary with email details or None if error
        """
        try:
            message = (
                self.service.users()
                .messages()
                .get(userId=self.user_id, id=message_id, format="full")
                .execute()
            )

            headers = message["payload"].get("headers", [])

            # Extract key headers
            subject = self._get_header(headers, "Subject")
            from_email = self._get_header(headers, "From")
            to_email = self._get_header(headers, "To")
            date_str = self._get_header(headers, "Date")

            # Parse date
            try:
                if date_str:
                    email_date = parsedate_to_datetime(date_str)
                else:
                    # Fallback to internal date (milliseconds since epoch)
                    timestamp_ms = int(message.get("internalDate", 0))
                    email_date = datetime.fromtimestamp(timestamp_ms / 1000)
            except Exception:
                email_date = datetime.now()

            # Extract body snippet
            snippet = message.get("snippet", "")

            # Extract plain text body if available
            body = self._get_email_body(message["payload"])

            return {
                "id": message_id,
                "thread_id": message.get("threadId"),
                "subject": subject or "(No Subject)",
                "from": from_email,
                "to": to_email,
                "date": email_date,
                "snippet": snippet,
                "body": body or snippet,
                "labels": message.get("labelIds", []),
            }

        except HttpError as error:
            print(f"Error getting email details for {message_id}: {error}")
            return None

    def _get_header(self, headers: List[Dict], name: str) -> str:
        """Extract a specific header value from email headers.

        Args:
            headers: List of header dictionaries
            name: Header name to search for

        Returns:
            Header value or empty string
        """
        for header in headers:
            if header.get("name", "").lower() == name.lower():
                return header.get("value", "")
        return ""

    def _get_email_body(self, payload: Dict) -> str:
        """Extract plain text body from email payload.

        Args:
            payload: Email payload dictionary

        Returns:
            Plain text body or empty string
        """
        if "parts" in payload:
            # Multipart message
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    data = part.get("body", {}).get("data")
                    if data:
                        try:
                            return base64.urlsafe_b64decode(data).decode("utf-8")
                        except UnicodeDecodeError:
                            # Try with error replacement if strict decoding fails
                            return base64.urlsafe_b64decode(data).decode(
                                "utf-8", errors="replace"
                            )
                # Recursively check nested parts
                elif "parts" in part:
                    nested_body = self._get_email_body(part)
                    if nested_body:
                        return nested_body
        else:
            # Single part message
            data = payload.get("body", {}).get("data")
            if data:
                try:
                    return base64.urlsafe_b64decode(data).decode("utf-8")
                except UnicodeDecodeError:
                    # Try with error replacement if strict decoding fails
                    return base64.urlsafe_b64decode(data).decode(
                        "utf-8", errors="replace"
                    )

        return ""

    def extract_email_address(self, email_string: str) -> str:
        """Extract email address from a string like 'Name <email@domain.com>'.

        Args:
            email_string: String containing email address

        Returns:
            Extracted email address or original string
        """
        if not email_string:
            return ""

        # Try to extract email from "Name <email@domain.com>" format
        match = re.search(r"<(.+?)>", email_string)
        if match:
            return match.group(1).strip()

        # If no brackets, return as-is (might already be just the email)
        return email_string.strip()

    def get_recent_threads(self, max_results: int = 50) -> List[Dict[str, Any]]:
        """Get recent email threads.

        Args:
            max_results: Maximum number of threads to return

        Returns:
            List of thread dictionaries
        """
        try:
            results = (
                self.service.users()
                .threads()
                .list(userId=self.user_id, maxResults=max_results)
                .execute()
            )

            threads = results.get("threads", [])
            return threads

        except HttpError as error:
            print(f"Error getting threads: {error}")
            return []

    def batch_search_contacts(
        self, contact_emails: List[str], days_back: int = 30, max_per_contact: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Search emails for multiple contacts in batch.

        Args:
            contact_emails: List of email addresses to search
            days_back: How many days back to search
            max_per_contact: Max emails per contact

        Returns:
            Dictionary mapping email addresses to lists of emails
        """
        results = {}

        for contact_email in contact_emails:
            emails = self.search_emails_by_contact(
                contact_email, max_results=max_per_contact, days_back=days_back
            )
            results[contact_email] = emails

        return results
