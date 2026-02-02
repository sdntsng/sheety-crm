import os
import json
from typing import Optional, Dict, Any
import requests
from openai import OpenAI
from .models import Lead, CompanySize


class EnrichmentService:
    def __init__(
        self, openai_api_key: Optional[str] = None, brave_api_key: Optional[str] = None
    ):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.brave_api_key = brave_api_key or os.getenv("BRAVE_API_KEY")
        if self.openai_api_key:
            self.client = OpenAI(api_key=self.openai_api_key)
        else:
            self.client = None

    def search_company(self, company_name: str) -> str:
        if not self.brave_api_key:
            return f"No Brave API key. Searching for: {company_name}"

        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": self.brave_api_key,
        }
        params = {
            "q": f"{company_name} company official website linkedin logo industry",
            "count": 5,
        }

        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return json.dumps(response.json())
        except Exception as e:
            print(f"[Enrichment] Brave search error: {e}")
            return f"Search failed: {e}"

    def enrich_lead_data(self, lead: Lead) -> Dict[str, Any]:
        """
        Enriches lead data using search and AI.
        Returns a dictionary of updated fields.
        """
        if not self.client:
            print("[Enrichment] OpenAI client not initialized")
            return {}

        print(f"[Enrichment] Enriching lead: {lead.company_name}")
        search_results = self.search_company(lead.company_name)

        prompt = f"""
        You are a lead enrichment assistant. Given a company name and search results, extract the following details.
        
        Company Name: {lead.company_name}
        Search Results: {search_results}
        
        Return ONLY a JSON object with these keys:
        - website (string or null)
        - linkedin_url (string or null)
        - logo_url (string or null)
        - industry (string or null)
        - company_size (string: "1-10", "11-50", "51-200", "201-500", "500+", or null)
        
        Do not include any other text or explanation.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that extracts structured data from search results.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            if not content:
                return {}

            data = json.loads(content)
            print(f"[Enrichment] Found data: {data}")
            return data
        except Exception as e:
            print(f"[Enrichment] AI enrichment error: {e}")
            return {}


enrichment_service = EnrichmentService()
