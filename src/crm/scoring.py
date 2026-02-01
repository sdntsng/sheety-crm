import os
import json
from typing import List, Optional, Dict, Any
from openai import OpenAI
from .models import Lead, Activity


class LeadScoringService:
    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.client = OpenAI(api_key=self.openai_api_key)
        else:
            self.client = None

    def score_lead(self, lead: Lead, activities: List[Activity]) -> Dict[str, Any]:
        """
        Scores a lead based on data fields and activity history.
        Returns a dictionary with 'score' (0-100) and 'heat_level' (Cold, Warm, Hot).
        """
        if not self.client:
            print("[Scoring] OpenAI client not initialized, using heuristic scoring")
            return self._heuristic_score(lead, activities)

        activity_summary = [
            {"type": a.type.value, "subject": a.subject, "date": a.date.isoformat()}
            for a in activities
        ]

        prompt = f"""
        You are an AI Lead Scoring Engine. Analyze the following lead data and engagement history to assign a score and heat level.
        
        Lead Data:
        - Company: {lead.company_name}
        - Industry: {lead.industry or "Unknown"}
        - Company Size: {lead.company_size.value if lead.company_size else "Unknown"}
        - Source: {lead.source.value}
        - Notes: {lead.notes or "None"}
        
        Engagement History (Recent Activities):
        {json.dumps(activity_summary, indent=2)}
        
        Rubric:
        - Score (0-100):
            - 80-100: Ideal customer profile, high engagement (recent calls/meetings).
            - 50-79: Good fit, some engagement (emails, notes).
            - 20-49: Poor fit or low engagement.
            - 0-19: Unqualified or no engagement.
        - Heat Level:
            - Hot: Highly active and good fit.
            - Warm: Moderately active or good fit with low activity.
            - Cold: Inactive or poor fit.
            
        Return ONLY a JSON object with these keys:
        - score (integer)
        - heat_level (string: "Cold", "Warm", "Hot")
        - reasoning (string: short explanation)
        
        Do not include any other text or explanation.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a lead scoring expert."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            if not content:
                return {"score": 0, "heat_level": "Cold"}

            data = json.loads(content)
            print(
                f"[Scoring] Scored lead {lead.company_name}: {data['score']} ({data['heat_level']})"
            )
            return data
        except Exception as e:
            print(f"[Scoring] AI scoring error: {e}")
            return self._heuristic_score(lead, activities)

    def _heuristic_score(
        self, lead: Lead, activities: List[Activity]
    ) -> Dict[str, Any]:
        """Fallback heuristic scoring."""
        score = 20  # Base score

        # Company size bonus
        if lead.company_size:
            if lead.company_size.value in ["51-200", "201-500"]:
                score += 20
            elif lead.company_size.value == "500+":
                score += 30

        # Activity bonus
        score += min(len(activities) * 10, 40)

        # Source bonus
        if lead.source.value == "Referral":
            score += 20
        elif lead.source.value == "Website":
            score += 10

        score = min(score, 100)

        heat_level = "Cold"
        if score >= 80:
            heat_level = "Hot"
        elif score >= 50:
            heat_level = "Warm"

        return {
            "score": score,
            "heat_level": heat_level,
            "reasoning": "Heuristic scoring based on company size, source, and activity count.",
        }


scoring_service = LeadScoringService()
