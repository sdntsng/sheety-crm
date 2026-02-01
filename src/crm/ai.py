"""
AI Manager for generating email drafts and other context-aware content.
"""
import os
import requests
import json
from typing import Optional, Dict, Any
from .models import Lead, Activity, Opportunity

class AIManager:
    """Manages AI-powered features for the CRM."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def suggest_next_action(
        self,
        lead: Lead,
        opportunity: Optional[Opportunity] = None,
        activities: list[Activity] = []
    ) -> Dict[str, Any]:
        """
        Suggest the 'Next Best Action' for a lead or opportunity.
        """
        if not self.api_key:
            return {
                "action": "Manual Review",
                "description": "AI suggestion requires an API key.",
                "reasoning": "AI analysis requires an API key to provide personalized suggestions.",
                "priority": "Medium",
                "task_type": "Task"
            }

        # Build context
        context = self._build_context(lead, activities)
        if opportunity:
            context += f"\n\nActive Opportunity: {opportunity.title}\n"
            context += f"- Stage: {opportunity.stage.value}\n"
            context += f"- Value: ${opportunity.value:,.2f}\n"
            context += f"- Probability: {opportunity.probability}%\n"
            context += f"- Notes: {opportunity.notes or 'None'}"

        prompt = f"""
        You are a smart CRM assistant. Suggest the "Next Best Action" for this lead to move the sales process forward.
        
        {context}
        
        Guidelines:
        - Be specific (e.g., "Follow up on the proposal sent Tuesday" instead of "Follow up").
        - Consider the lead status ({lead.status.value}) and recent activity history.
        - If there's an active opportunity, focus on moving it to the next stage.
        - If the lead is "New", suggest an initial outreach.
        - If the lead is "Qualified", focus on the proposal or next steps.
        
        Provide your suggestion in JSON format with the following keys:
        1. action: A short, descriptive title for the action (e.g., "Send Contract", "Research Competitors").
        2. description: A 1-2 sentence detailed instruction of what to do.
        3. reasoning: A brief explanation of why this action is recommended based on history.
        4. priority: One of "Low", "Medium", "High".
        5. task_type: One of "Email", "Call", "Meeting", "Research", "Task".
        
        Return ONLY the JSON object.
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a proactive sales coach and CRM assistant. Return data only in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.4
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            return json.loads(content)
            
        except Exception as e:
            print(f"[AI] Error suggesting next action: {e}")
            return {
                "action": "Manual Follow-up",
                "description": f"An error occurred while generating a suggestion: {str(e)}",
                "reasoning": "AI analysis failed, so a manual check of the lead's status is recommended.",
                "priority": "Medium",
                "task_type": "Task"
            }

    def generate_email_draft(
        self, 
        lead: Lead, 
        activities: list[Activity] = [], 
        purpose: str = "Introduction", 
        tone: str = "Professional"
    ) -> str:
        """Generate a context-aware email draft for a lead."""
        
        # If no API key, return a helpful message or a basic template
        if not self.api_key:
            return self._generate_template_fallback(lead, purpose)

        # Build context from lead and activities
        context = self._build_context(lead, activities)
        
        prompt = f"""
        You are a helpful sales assistant. Generate a {tone} email draft to {lead.contact_name} at {lead.company_name}.
        
        Purpose of the email: {purpose}
        
        Context about the lead:
        {context}
        
        Guidelines:
        - Keep it concise and personalized.
        - Use a {tone} tone.
        - Include a clear call to action.
        - Use placeholders like [Your Name] and [Your Company] where appropriate.
        - Return ONLY the email content (subject and body).
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",  # Using a cost-effective model
                "messages": [
                    {"role": "system", "content": "You are a professional sales assistant specializing in personalized outreach."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            print(f"[AI] Error generating email: {e}")
            return f"Error: Could not generate email draft. {str(e)}\n\nFallback Template:\n{self._generate_template_fallback(lead, purpose)}"

    def enrich_lead_data(self, lead: Lead) -> Dict[str, Any]:
        """
        Enrich lead data using AI based on company name or email domain.
        Returns a dictionary with industry, company_size, and a brief description.
        """
        if not self.api_key:
            return {}

        # Extract domain from email if available
        domain = ""
        if lead.contact_email and "@" in lead.contact_email:
            domain = lead.contact_email.split("@")[-1]
            # Ignore common public domains
            if domain in ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"]:
                domain = ""

        prompt = f"""
        Find information about the following company for a CRM enrichment service.
        
        Company Name: {lead.company_name}
        {f"Website/Domain: {domain}" if domain else ""}
        
        Provide the following details in JSON format:
        1. industry: A standard industry name (e.g., Software, Manufacturing, Healthcare).
        2. company_size: One of the following buckets: "1-10", "11-50", "51-200", "201-500", "500+".
        3. description: A 1-2 sentence description of what the company does.
        
        Return ONLY the JSON object.
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a business research assistant. Return data only in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.3
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            return json.loads(content)
            
        except Exception as e:
            print(f"[AI] Error enriching lead data: {e}")
            return {}

    def analyze_deal_risk(
        self,
        opportunity: Opportunity,
        lead: Lead,
        activities: list[Activity] = []
    ) -> Dict[str, Any]:
        """
        Analyze an opportunity for risks and blockers based on history.
        Returns a dictionary with risk_level, risks, and recommended_actions.
        """
        if not self.api_key:
            return {
                "risk_level": "Unknown",
                "risks": ["AI analysis requires an API key."],
                "recommended_actions": ["Configure OPENAI_API_KEY to enable deal risk analysis."]
            }

        # Build context from opportunity, lead, and activities
        context = [
            f"Opportunity: {opportunity.title}",
            f"Stage: {opportunity.stage.value}",
            f"Value: ${opportunity.value:,.2f}",
            f"Probability: {opportunity.probability}%",
            f"Close Date: {opportunity.close_date.isoformat() if opportunity.close_date else 'Not set'}",
            f"Notes: {opportunity.notes or 'None'}",
            "\nLead Info:",
            f"- Company: {lead.company_name}",
            f"- Contact: {lead.contact_name}",
            f"- Status: {lead.status.value}",
            f"- Industry: {lead.industry or 'Unknown'}",
        ]

        if activities:
            context.append("\nRecent Activity History:")
            for act in activities[-10:]:  # Last 10 activities for deeper context
                context.append(f"- {act.date.date()} ({act.type.value}): {act.subject} - {act.description or ''}")

        prompt = f"""
        Analyze the following sales deal for risks, blockers, and potential red flags.
        
        {chr(10).join(context)}
        
        Provide your analysis in JSON format with the following keys:
        1. risk_level: One of "Low", "Medium", "High", "Critical".
        2. risks: A list of specific risks or red flags identified (e.g., "No activity in 30 days", "Competitor mentioned").
        3. recommended_actions: A list of concrete next steps to mitigate risks or move the deal forward.
        4. insight: A brief (1-2 sentence) summary of the deal health.
        
        Return ONLY the JSON object.
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a senior sales strategy consultant. Return data only in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.4
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            return json.loads(content)
            
        except Exception as e:
            print(f"[AI] Error analyzing deal risk: {e}")
            return {
                "risk_level": "Error",
                "risks": [f"Analysis failed: {str(e)}"],
                "recommended_actions": ["Try again later or check API configuration."]
            }

    def score_lead(
        self,
        lead: Lead,
        activities: list[Activity] = []
    ) -> Dict[str, Any]:
        """
        Assign a score (0-100) to a lead based on company, role, and interaction history.
        """
        if not self.api_key:
            return {
                "score": 50,
                "reasoning": "AI scoring requires an API key. Defaulting to 50.",
                "strengths": [],
                "weaknesses": ["No AI analysis performed"]
            }

        # Build context
        context = self._build_context(lead, activities)
        
        prompt = f"""
        You are an expert sales operations analyst. Your task is to assign a "Lead Score" from 0 to 100 to the following lead.
        
        {context}
        
        Scoring Criteria:
        - Company Profile (0-40 points): Consider industry fit and company size.
        - Engagement History (0-40 points): Frequency and quality of recent interactions.
        - Role/Contact (0-20 points): Decision-making power based on contact name/title if available.
        
        Guidelines:
        - 80-100: Hot lead, immediate priority.
        - 50-79: Warm lead, regular follow-up.
        - 0-49: Cold lead, low priority.
        
        Provide your analysis in JSON format with the following keys:
        1. score: An integer between 0 and 100.
        2. reasoning: A 1-2 sentence explanation of the score.
        3. strengths: A list of 2-3 positive factors.
        4. weaknesses: A list of 2-3 negative factors or missing info.
        
        Return ONLY the JSON object.
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a data-driven sales analyst. Return data only in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.2
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            return json.loads(content)
            
        except Exception as e:
            print(f"[AI] Error scoring lead: {e}")
            return {
                "score": 0,
                "reasoning": f"An error occurred during scoring: {str(e)}",
                "strengths": [],
                "weaknesses": ["AI Scoring Failed"]
            }

    def _build_context(self, lead: Lead, activities: list[Activity]) -> str:
        """Combine lead info and recent activities into a context string."""
        context = [
            f"- Company: {lead.company_name}",
            f"- Contact: {lead.contact_name}",
            f"- Industry: {lead.industry or 'Unknown'}",
            f"- Lead Status: {lead.status.value}",
            f"- Source: {lead.source.value}",
            f"- Notes: {lead.notes or 'None'}"
        ]
        
        if activities:
            context.append("\nRecent Activities:")
            for act in activities[-3:]:  # Last 3 activities
                context.append(f"- {act.date.date()}: {act.subject} - {act.description or ''}")
                
        return "\n".join(context)

    def _generate_template_fallback(self, lead: Lead, purpose: str) -> str:
        """Basic template fallback when AI is unavailable."""
        subject = f"{purpose} - {lead.company_name}"
        body = f"Hi {lead.contact_name},\n\n"
        
        if "Intro" in purpose:
            body += f"I've been following {lead.company_name}'s work in the {lead.industry or 'industry'} and was impressed by what you're doing. "
            body += "I'd love to connect and share how we might be able to help you achieve your goals.\n\n"
        elif "Follow" in purpose:
            body += f"I'm following up on our previous conversation regarding {lead.company_name}. "
            body += "I'd love to hear your thoughts on the next steps.\n\n"
        else:
            body += f"I'm reaching out regarding {lead.company_name}. "
            body += "I'd love to schedule a brief call to discuss how we can work together.\n\n"
            
        body += "Are you available for a 15-minute chat next week?\n\nBest regards,\n\n[Your Name]\n[Your Company]"
        
        return f"Subject: {subject}\n\n{body}"
