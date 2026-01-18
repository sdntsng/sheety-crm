"""
CRM Data Models using Pydantic for validation.
"""
from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
import uuid


def generate_id() -> str:
    """Generate a short UUID for IDs."""
    return str(uuid.uuid4())[:8]


class LeadStatus(str, Enum):
    """Lead lifecycle statuses."""
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    UNQUALIFIED = "Unqualified"
    LOST = "Lost"


class LeadSource(str, Enum):
    """How leads are acquired."""
    WEBSITE = "Website"
    REFERRAL = "Referral"
    COLD_OUTREACH = "Cold Outreach"
    EVENT = "Event"
    LINKEDIN = "LinkedIn"
    OTHER = "Other"


class CompanySize(str, Enum):
    """Company size buckets."""
    TINY = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-500"
    ENTERPRISE = "500+"


class PipelineStage(str, Enum):
    """Sales pipeline stages - from first contact to cash in bank."""
    PROSPECTING = "Prospecting"
    DISCOVERY = "Discovery"
    PROPOSAL = "Proposal"
    NEGOTIATION = "Negotiation"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"
    DELIVERY = "Delivery"
    INVOICING = "Invoicing"
    INVOICED = "Invoiced"
    CASH_IN_BANK = "Cash in Bank"


class ActivityType(str, Enum):
    """Types of activities logged."""
    CALL = "Call"
    EMAIL = "Email"
    MEETING = "Meeting"
    NOTE = "Note"
    TASK = "Task"


class Lead(BaseModel):
    """A sales lead - typically a company/organization."""
    lead_id: str = Field(default_factory=generate_id)
    company_name: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource = LeadSource.OTHER
    industry: Optional[str] = None
    company_size: Optional[CompanySize] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    owner: Optional[str] = None

    def to_row(self) -> list:
        """Convert to sheet row format."""
        return [
            self.lead_id,
            self.company_name,
            self.contact_name,
            self.contact_email or "",
            self.contact_phone or "",
            self.status.value,
            self.source.value,
            self.industry or "",
            self.company_size.value if self.company_size else "",
            self.notes or "",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
            self.owner or "",
        ]

    @classmethod
    def from_row(cls, row: list) -> "Lead":
        """Create Lead from sheet row."""
        try:
            # Safe enum parsing
            def safe_enum(enum_cls, val, default):
                if not val:
                    return default
                try:
                    return enum_cls(val)
                except ValueError:
                    return default
            
            return cls(
                lead_id=str(row[0]) if row[0] else "",
                company_name=str(row[1]) if len(row) > 1 else "",
                contact_name=str(row[2]) if len(row) > 2 else "",
                contact_email=row[3] if len(row) > 3 and row[3] else None,
                contact_phone=row[4] if len(row) > 4 and row[4] else None,
                status=safe_enum(LeadStatus, row[5] if len(row) > 5 else None, LeadStatus.NEW),
                source=safe_enum(LeadSource, row[6] if len(row) > 6 else None, LeadSource.OTHER),
                industry=row[7] if len(row) > 7 and row[7] else None,
                company_size=safe_enum(CompanySize, row[8] if len(row) > 8 else None, None),
                notes=row[9] if len(row) > 9 and row[9] else None,
                created_at=datetime.fromisoformat(row[10]) if len(row) > 10 and row[10] else datetime.now(),
                updated_at=datetime.fromisoformat(row[11]) if len(row) > 11 and row[11] else datetime.now(),
                owner=row[12] if len(row) > 12 and row[12] else None,
            )
        except Exception as e:
            print(f"[Warning] Failed to parse Lead row: {row[:3]}... Error: {e}")
            # Return a minimal Lead with just the ID
            return cls(
                lead_id=str(row[0]) if row and row[0] else "unknown",
                company_name=str(row[1]) if len(row) > 1 else "Parse Error",
                contact_name=str(row[2]) if len(row) > 2 else "",
            )

    @classmethod
    def headers(cls) -> list:
        """Return column headers for the Leads sheet."""
        return [
            "lead_id", "company_name", "contact_name", "contact_email", "contact_phone",
            "status", "source", "industry", "company_size", "notes",
            "created_at", "updated_at", "owner"
        ]


class Opportunity(BaseModel):
    """A sales opportunity - a potential deal."""
    opp_id: str = Field(default_factory=generate_id)
    lead_id: str
    title: str
    stage: PipelineStage = PipelineStage.PROSPECTING
    value: float = 0.0  # USD
    probability: int = 0  # 0-100
    close_date: Optional[date] = None
    product: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    owner: Optional[str] = None

    @property
    def expected_value(self) -> float:
        """Calculate expected value based on probability."""
        return self.value * (self.probability / 100)

    def to_row(self) -> list:
        """Convert to sheet row format."""
        return [
            self.opp_id,
            self.lead_id,
            self.title,
            self.stage.value,
            str(self.value),
            str(self.probability),
            str(self.expected_value),
            self.close_date.isoformat() if self.close_date else "",
            self.product or "",
            self.notes or "",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
            self.closed_at.isoformat() if self.closed_at else "",
            self.owner or "",
        ]

    @classmethod
    def from_row(cls, row: list) -> "Opportunity":
        """Create Opportunity from sheet row."""
        try:
            # Safe value parsing
            def safe_float(val, default=0.0):
                if not val:
                    return default
                try:
                    # Handle currency formatting
                    clean = str(val).replace(",", "").replace("$", "").strip()
                    return float(clean) if clean else default
                except (ValueError, TypeError):
                    return default
            
            def safe_int(val, default=0):
                if not val:
                    return default
                try:
                    return int(float(str(val)))
                except (ValueError, TypeError):
                    return default
            
            def safe_enum(enum_cls, val, default):
                if not val:
                    return default
                try:
                    return enum_cls(val)
                except ValueError:
                    return default
            
            def safe_date(val):
                if not val:
                    return None
                try:
                    return date.fromisoformat(str(val)[:10])
                except (ValueError, TypeError):
                    return None
            
            def safe_datetime(val):
                if not val:
                    return None
                try:
                    return datetime.fromisoformat(str(val))
                except (ValueError, TypeError):
                    return None
            
            return cls(
                opp_id=str(row[0]) if row[0] else "",
                lead_id=str(row[1]) if len(row) > 1 and row[1] else "",
                title=str(row[2]) if len(row) > 2 else "",
                stage=safe_enum(PipelineStage, row[3] if len(row) > 3 else None, PipelineStage.PROSPECTING),
                value=safe_float(row[4] if len(row) > 4 else None),
                probability=safe_int(row[5] if len(row) > 5 else None),
                # row[6] is expected_value formula, skip
                close_date=safe_date(row[7] if len(row) > 7 else None),
                product=row[8] if len(row) > 8 and row[8] else None,
                notes=row[9] if len(row) > 9 and row[9] else None,
                created_at=safe_datetime(row[10] if len(row) > 10 else None) or datetime.now(),
                updated_at=safe_datetime(row[11] if len(row) > 11 else None) or datetime.now(),
                closed_at=safe_datetime(row[12] if len(row) > 12 else None),
                owner=row[13] if len(row) > 13 and row[13] else None,
            )
        except Exception as e:
            print(f"[Warning] Failed to parse Opportunity row: {row[:3]}... Error: {e}")
            return cls(
                opp_id=str(row[0]) if row and row[0] else "unknown",
                lead_id=str(row[1]) if len(row) > 1 else "",
                title=str(row[2]) if len(row) > 2 else "Parse Error",
            )

    @classmethod
    def headers(cls) -> list:
        """Return column headers for the Opportunities sheet."""
        return [
            "opp_id", "lead_id", "title", "stage", "value", "probability", "expected_value",
            "close_date", "product", "notes", "created_at", "updated_at", "closed_at", "owner"
        ]


class Activity(BaseModel):
    """An activity log entry."""
    activity_id: str = Field(default_factory=generate_id)
    lead_id: str
    opp_id: Optional[str] = None
    type: ActivityType = ActivityType.NOTE
    subject: str
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.now)
    created_by: Optional[str] = None

    def to_row(self) -> list:
        """Convert to sheet row format."""
        return [
            self.activity_id,
            self.lead_id,
            self.opp_id or "",
            self.type.value,
            self.subject,
            self.description or "",
            self.date.isoformat(),
            self.created_by or "",
        ]

    @classmethod
    def from_row(cls, row: list) -> "Activity":
        """Create Activity from sheet row."""
        return cls(
            activity_id=row[0],
            lead_id=row[1],
            opp_id=row[2] if row[2] else None,
            type=ActivityType(row[3]) if row[3] else ActivityType.NOTE,
            subject=row[4],
            description=row[5] if row[5] else None,
            date=datetime.fromisoformat(row[6]) if row[6] else datetime.now(),
            created_by=row[7] if len(row) > 7 and row[7] else None,
        )

    @classmethod
    def headers(cls) -> list:
        """Return column headers for the Activities sheet."""
        return [
            "activity_id", "lead_id", "opp_id", "type", "subject",
            "description", "date", "created_by"
        ]
