import os
import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from .models import Opportunity, Activity, PipelineStage
from openai import OpenAI

class DealAnalyzer:
    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.client = OpenAI(api_key=self.openai_api_key)
        else:
            self.client = None

    def analyze_opportunity(self, opp: Opportunity, activities: List[Activity]) -> Dict[str, Any]:
        """
        Analyzes an opportunity for risk and provides insights.
        """
        # 1. Calculate basic metrics
        today = datetime.now()
        age_days = (today - opp.created_at).days
        
        last_activity_date = None
        if activities:
            last_activity_date = max(a.date for a in activities)
            days_since_last_activity = (today - last_activity_date).days
        else:
            days_since_last_activity = age_days

        # 2. Heuristic risk assessment
        is_stale = days_since_last_activity > 14
        is_old = age_days > 90 and opp.stage not in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]
        
        risk_score = 0
        if is_stale: risk_score += 40
        if is_old: risk_score += 30
        if opp.probability < 20: risk_score += 20
        
        # 3. AI-powered deep analysis
        ai_insight = self._get_ai_insight(opp, activities, age_days, days_since_last_activity)
        
        return {
            "opp_id": opp.opp_id,
            "risk_score": min(risk_score + ai_insight.get("score_adjustment", 0), 100),
            "risk_level": "High" if risk_score > 60 else "Medium" if risk_score > 30 else "Low",
            "risk_reason": ai_insight.get("reason", "No immediate risks identified."),
            "next_best_action": ai_insight.get("next_action", "Continue regular follow-up."),
            "metrics": {
                "age_days": age_days,
                "days_since_last_activity": days_since_last_activity,
                "activity_count": len(activities)
            }
        }

    def _get_ai_insight(self, opp: Opportunity, activities: List[Activity], age: int, inactive_days: int) -> Dict[str, Any]:
        if not self.client:
            return {
                "score_adjustment": 0,
                "reason": f"Deal is {age} days old. Last activity was {inactive_days} days ago.",
                "next_action": "Schedule a follow-up meeting."
            }

        activity_summary = "\n".join([
            f"- {a.date.date()}: {a.type.value} - {a.subject}"
            for a in activities[-5:] # Last 5 activities
        ])

        prompt = f"""
        You are a sales expert analyzing a deal for risk.
        
        Deal: {opp.title}
        Stage: {opp.stage.value}
        Value: ${opp.value}
        Probability: {opp.probability}%
        Created: {opp.created_at.date()} (Age: {age} days)
        Last Activity: {inactive_days} days ago.
        
        Recent Activities:
        {activity_summary}
        
        Analyze the risk. If the deal is stuck or neglected, identify why.
        Provide a concise "reason" and a specific "next_action".
        Also provide a "score_adjustment" (-20 to +40) based on your analysis.
        
        Return ONLY a JSON object:
        {{
            "reason": "short string",
            "next_action": "short string",
            "score_adjustment": integer
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a sales performance analyzer."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[Analyzer] AI error: {e}")
            return {}

deal_analyzer = DealAnalyzer()
