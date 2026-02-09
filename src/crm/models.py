"""
CRM Data Models using Pydantic for validation.
"""
import json
from datetime import datetime, date
from enum import Enum
from typing import Any, Dict, Optional
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
    UNKNOWN = "Unknown"  # Fallback for unrecognized statuses


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
    CASH_IN_BANK = "Cash in Bank"
    UNKNOWN = "Unknown"  # Fallback for unrecognized stages


class ActivityType(str, Enum):
    """Types of activities logged."""
    CALL = "Call"
    EMAIL = "Email"
    MEETING = "Meeting"
    NOTE = "Note"
    TASK = "Task"


class TaskStatus(str, Enum):
    """Task lifecycle status."""
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class CustomFieldType(str, Enum):
    """Custom field data types."""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    MULTI_SELECT = "multi-select"


class Lead(BaseModel):
    """A sales lead - typically a company/organization."""
    lead_id: str = Field(default_factory=generate_id)
    company_name: str
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    status_raw: Optional[str] = None  # Original status text if unrecognized
    source: LeadSource = LeadSource.OTHER
    industry: Optional[str] = None
    company_size: Optional[CompanySize] = None
    notes: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    logo_url: Optional[str] = None
    enrichment_status: Optional[str] = None  # None, "Enriching", "Completed", "Failed"
    score: Optional[int] = Field(None, ge=0, le=100)
    heat_level: Optional[str] = None  # Cold, Warm, Hot
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
            self.status.value if self.status != LeadStatus.UNKNOWN else (self.status_raw or ""),
            self.source.value,
            self.industry or "",
            self.company_size.value if self.company_size else "",
            self.notes or "",
            self.website or "",
            self.linkedin_url or "",
            self.logo_url or "",
            self.enrichment_status or "",
            str(self.score) if self.score is not None else "",
            self.heat_level or "",
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
            
            def safe_int(val, default=None):
                if not val:
                    return default
                try:
                    return int(float(str(val)))
                except (ValueError, TypeError):
                    return default

            # Custom status parsing logic
            status_val = row[5] if len(row) > 5 else None
            status = LeadStatus.NEW
            status_raw = None
            
            if status_val:
                try:
                    status = LeadStatus(status_val)
                except ValueError:
                    status = LeadStatus.UNKNOWN
                    status_raw = str(status_val)

            return cls(
                lead_id=str(row[0]) if row[0] else "",
                company_name=str(row[1]) if len(row) > 1 else "",
                contact_name=str(row[2]) if len(row) > 2 else "",
                contact_email=row[3] if len(row) > 3 and row[3] else None,
                contact_phone=row[4] if len(row) > 4 and row[4] else None,
                status=status,
                status_raw=status_raw,
                source=safe_enum(LeadSource, row[6] if len(row) > 6 else None, LeadSource.OTHER),
                industry=row[7] if len(row) > 7 and row[7] else None,
                company_size=safe_enum(CompanySize, row[8] if len(row) > 8 else None, None),
                notes=row[9] if len(row) > 9 and row[9] else None,
                website=row[10] if len(row) > 10 and row[10] else None,
                linkedin_url=row[11] if len(row) > 11 and row[11] else None,
                logo_url=row[12] if len(row) > 12 and row[12] else None,
                enrichment_status=row[13] if len(row) > 13 and row[13] else None,
                score=safe_int(row[14] if len(row) > 14 else None),
                heat_level=row[15] if len(row) > 15 and row[15] else None,
                created_at=datetime.fromisoformat(row[16]) if len(row) > 16 and row[16] else datetime.now(),
                updated_at=datetime.fromisoformat(row[17]) if len(row) > 17 and row[17] else datetime.now(),
                owner=row[18] if len(row) > 18 and row[18] else None,
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
            "website", "linkedin_url", "logo_url", "enrichment_status",
            "score", "heat_level",
            "created_at", "updated_at", "owner"
        ]




class Opportunity(BaseModel):
    """A sales opportunity - a potential deal."""
    opp_id: str = Field(default_factory=generate_id)
    lead_id: str
    title: str
    stage: PipelineStage = PipelineStage.PROSPECTING
    stage_raw: Optional[str] = None  # Original stage text if unrecognized
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
            self.stage.value if self.stage != PipelineStage.UNKNOWN else (self.stage_raw or ""),
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
            
            # Custom stage parsing logic
            stage_val = row[3] if len(row) > 3 else None
            stage = PipelineStage.PROSPECTING
            stage_raw = None
            
            if stage_val:
                try:
                    stage = PipelineStage(stage_val)
                except ValueError:
                    stage = PipelineStage.UNKNOWN
                    stage_raw = str(stage_val)

            return cls(
                opp_id=str(row[0]) if row[0] else "",
                lead_id=str(row[1]) if len(row) > 1 and row[1] else "",
                title=str(row[2]) if len(row) > 2 else "",
                stage=stage,
                stage_raw=stage_raw,
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


class Task(BaseModel):
    """A follow-up task linked to a lead and optionally an opportunity."""
    task_id: str = Field(default_factory=generate_id)
    title: str
    due_date: Optional[date] = None
    status: TaskStatus = TaskStatus.OPEN
    priority: TaskPriority = TaskPriority.MEDIUM
    lead_id: Optional[str] = None
    opp_id: Optional[str] = None
    assignee: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def to_row(self) -> list:
        """Convert to sheet row format."""
        return [
            self.task_id,
            self.title,
            self.due_date.isoformat() if self.due_date else "",
            self.status.value,
            self.priority.value,
            self.lead_id or "",
            self.opp_id or "",
            self.assignee or "",
            self.notes or "",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
            self.completed_at.isoformat() if self.completed_at else "",
        ]

    @classmethod
    def from_row(cls, row: list) -> "Task":
        """Create Task from sheet row."""
        def safe_date(value: Any) -> Optional[date]:
            if not value:
                return None
            try:
                return date.fromisoformat(str(value)[:10])
            except (TypeError, ValueError):
                return None

        def safe_datetime(value: Any) -> Optional[datetime]:
            if not value:
                return None
            try:
                return datetime.fromisoformat(str(value))
            except (TypeError, ValueError):
                return None

        status_value = row[3] if len(row) > 3 and row[3] else TaskStatus.OPEN.value
        priority_value = row[4] if len(row) > 4 and row[4] else TaskPriority.MEDIUM.value

        try:
            status = TaskStatus(status_value)
        except ValueError:
            status = TaskStatus.OPEN

        try:
            priority = TaskPriority(priority_value)
        except ValueError:
            priority = TaskPriority.MEDIUM

        return cls(
            task_id=str(row[0]) if row and row[0] else generate_id(),
            title=str(row[1]) if len(row) > 1 else "",
            due_date=safe_date(row[2] if len(row) > 2 else None),
            status=status,
            priority=priority,
            lead_id=row[5] if len(row) > 5 and row[5] else None,
            opp_id=row[6] if len(row) > 6 and row[6] else None,
            assignee=row[7] if len(row) > 7 and row[7] else None,
            notes=row[8] if len(row) > 8 and row[8] else None,
            created_at=safe_datetime(row[9] if len(row) > 9 else None) or datetime.now(),
            updated_at=safe_datetime(row[10] if len(row) > 10 else None) or datetime.now(),
            completed_at=safe_datetime(row[11] if len(row) > 11 else None),
        )

    @classmethod
    def headers(cls) -> list:
        """Return column headers for the Tasks sheet."""
        return [
            "task_id", "title", "due_date", "status", "priority",
            "lead_id", "opp_id", "assignee", "notes", "created_at",
            "updated_at", "completed_at"
        ]


class SavedView(BaseModel):
    """A reusable filter/sort configuration for an entity list."""
    view_id: str = Field(default_factory=generate_id)
    name: str
    entity: str  # leads | opportunities | pipeline | tasks
    filters: list[dict[str, Any]] = Field(default_factory=list)
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    owner: Optional[str] = None
    is_shared: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        """Convert to sheet row format."""
        return [
            self.view_id,
            self.name,
            self.entity,
            json.dumps(self.filters),
            self.sort_by or "",
            self.sort_order,
            self.owner or "",
            "true" if self.is_shared else "false",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "SavedView":
        """Create SavedView from sheet row."""
        filters_raw = row[3] if len(row) > 3 and row[3] else "[]"
        try:
            filters = json.loads(filters_raw)
            if not isinstance(filters, list):
                filters = []
        except (json.JSONDecodeError, TypeError):
            filters = []

        is_shared_raw = row[7] if len(row) > 7 and row[7] else "false"
        is_shared = str(is_shared_raw).lower() in {"1", "true", "yes"}

        created_raw = row[8] if len(row) > 8 and row[8] else None
        updated_raw = row[9] if len(row) > 9 and row[9] else None

        return cls(
            view_id=str(row[0]) if row and row[0] else generate_id(),
            name=str(row[1]) if len(row) > 1 else "Untitled View",
            entity=str(row[2]) if len(row) > 2 and row[2] else "leads",
            filters=filters,
            sort_by=row[4] if len(row) > 4 and row[4] else None,
            sort_order=str(row[5]) if len(row) > 5 and row[5] else "asc",
            owner=row[6] if len(row) > 6 and row[6] else None,
            is_shared=is_shared,
            created_at=datetime.fromisoformat(created_raw) if created_raw else datetime.now(),
            updated_at=datetime.fromisoformat(updated_raw) if updated_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        """Return column headers for saved views."""
        return [
            "view_id", "name", "entity", "filters", "sort_by",
            "sort_order", "owner", "is_shared", "created_at", "updated_at"
        ]


class CustomFieldDefinition(BaseModel):
    """Defines a reusable custom field for an entity."""
    field_id: str = Field(default_factory=generate_id)
    entity: str  # leads | opportunities
    key: str
    label: str
    field_type: CustomFieldType
    required: bool = False
    options: list[str] = Field(default_factory=list)
    validation_rule: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        return [
            self.field_id,
            self.entity,
            self.key,
            self.label,
            self.field_type.value,
            "true" if self.required else "false",
            json.dumps(self.options),
            self.validation_rule or "",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "CustomFieldDefinition":
        raw_options = row[6] if len(row) > 6 and row[6] else "[]"
        try:
            options = json.loads(raw_options)
            if not isinstance(options, list):
                options = []
            options = [str(item) for item in options]
        except (json.JSONDecodeError, TypeError):
            options = []

        field_type = row[4] if len(row) > 4 and row[4] else CustomFieldType.TEXT.value
        try:
            parsed_type = CustomFieldType(field_type)
        except ValueError:
            parsed_type = CustomFieldType.TEXT

        required_raw = row[5] if len(row) > 5 and row[5] else "false"
        required = str(required_raw).lower() in {"1", "true", "yes"}

        created_raw = row[8] if len(row) > 8 and row[8] else None
        updated_raw = row[9] if len(row) > 9 and row[9] else None

        return cls(
            field_id=str(row[0]) if row and row[0] else generate_id(),
            entity=str(row[1]) if len(row) > 1 and row[1] else "leads",
            key=str(row[2]) if len(row) > 2 else "",
            label=str(row[3]) if len(row) > 3 else "",
            field_type=parsed_type,
            required=required,
            options=options,
            validation_rule=row[7] if len(row) > 7 and row[7] else None,
            created_at=datetime.fromisoformat(created_raw) if created_raw else datetime.now(),
            updated_at=datetime.fromisoformat(updated_raw) if updated_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "field_id", "entity", "key", "label", "field_type", "required",
            "options", "validation_rule", "created_at", "updated_at"
        ]


class CustomFieldValue(BaseModel):
    """A key/value custom field assignment for a record."""
    value_id: str = Field(default_factory=generate_id)
    entity: str
    record_id: str
    field_key: str
    field_value: str
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        return [
            self.value_id,
            self.entity,
            self.record_id,
            self.field_key,
            self.field_value,
            self.updated_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "CustomFieldValue":
        updated_raw = row[5] if len(row) > 5 and row[5] else None
        return cls(
            value_id=str(row[0]) if row and row[0] else generate_id(),
            entity=str(row[1]) if len(row) > 1 else "",
            record_id=str(row[2]) if len(row) > 2 else "",
            field_key=str(row[3]) if len(row) > 3 else "",
            field_value=str(row[4]) if len(row) > 4 else "",
            updated_at=datetime.fromisoformat(updated_raw) if updated_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "value_id", "entity", "record_id", "field_key", "field_value", "updated_at"
        ]


class EmailTemplate(BaseModel):
    """Reusable email template with merge variables."""
    template_id: str = Field(default_factory=generate_id)
    name: str
    entity: str = "leads"  # leads | opportunities
    subject: str
    body: str
    owner: Optional[str] = None
    is_shared: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        return [
            self.template_id,
            self.name,
            self.entity,
            self.subject,
            self.body,
            self.owner or "",
            "true" if self.is_shared else "false",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "EmailTemplate":
        is_shared_raw = row[6] if len(row) > 6 and row[6] else "true"
        created_raw = row[7] if len(row) > 7 and row[7] else None
        updated_raw = row[8] if len(row) > 8 and row[8] else None
        return cls(
            template_id=str(row[0]) if row and row[0] else generate_id(),
            name=str(row[1]) if len(row) > 1 and row[1] else "Untitled Template",
            entity=str(row[2]) if len(row) > 2 and row[2] else "leads",
            subject=str(row[3]) if len(row) > 3 else "",
            body=str(row[4]) if len(row) > 4 else "",
            owner=str(row[5]) if len(row) > 5 and row[5] else None,
            is_shared=str(is_shared_raw).lower() in {"1", "true", "yes"},
            created_at=datetime.fromisoformat(created_raw) if created_raw else datetime.now(),
            updated_at=datetime.fromisoformat(updated_raw) if updated_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "template_id",
            "name",
            "entity",
            "subject",
            "body",
            "owner",
            "is_shared",
            "created_at",
            "updated_at",
        ]


class IntegrationConnection(BaseModel):
    """Connection/configuration for an external integration provider."""
    integration_id: str = Field(default_factory=generate_id)
    provider: str
    status: str = "connected"
    config: Dict[str, Any] = Field(default_factory=dict)
    last_sync_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        return [
            self.integration_id,
            self.provider,
            self.status,
            json.dumps(self.config),
            self.last_sync_at.isoformat() if self.last_sync_at else "",
            self.updated_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "IntegrationConnection":
        raw_config = row[3] if len(row) > 3 and row[3] else "{}"
        try:
            config = json.loads(raw_config)
            if not isinstance(config, dict):
                config = {}
        except (json.JSONDecodeError, TypeError):
            config = {}

        last_sync_raw = row[4] if len(row) > 4 and row[4] else None
        updated_raw = row[5] if len(row) > 5 and row[5] else None
        return cls(
            integration_id=str(row[0]) if row and row[0] else generate_id(),
            provider=str(row[1]) if len(row) > 1 else "",
            status=str(row[2]) if len(row) > 2 and row[2] else "connected",
            config=config,
            last_sync_at=datetime.fromisoformat(last_sync_raw) if last_sync_raw else None,
            updated_at=datetime.fromisoformat(updated_raw) if updated_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "integration_id", "provider", "status", "config", "last_sync_at", "updated_at"
        ]


class IntegrationSyncRun(BaseModel):
    """One execution run of an integration sync."""
    run_id: str = Field(default_factory=generate_id)
    provider: str
    idempotency_key: Optional[str] = None
    status: str = "running"  # running | succeeded | failed
    retry_count: int = 0
    synced_records: int = 0
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.now)
    finished_at: Optional[datetime] = None

    def to_row(self) -> list:
        return [
            self.run_id,
            self.provider,
            self.idempotency_key or "",
            self.status,
            str(self.retry_count),
            str(self.synced_records),
            self.error or "",
            self.started_at.isoformat(),
            self.finished_at.isoformat() if self.finished_at else "",
        ]

    @classmethod
    def from_row(cls, row: list) -> "IntegrationSyncRun":
        started_raw = row[7] if len(row) > 7 and row[7] else None
        finished_raw = row[8] if len(row) > 8 and row[8] else None
        return cls(
            run_id=str(row[0]) if row and row[0] else generate_id(),
            provider=str(row[1]) if len(row) > 1 else "",
            idempotency_key=str(row[2]) if len(row) > 2 and row[2] else None,
            status=str(row[3]) if len(row) > 3 and row[3] else "running",
            retry_count=int(float(row[4])) if len(row) > 4 and row[4] else 0,
            synced_records=int(float(row[5])) if len(row) > 5 and row[5] else 0,
            error=str(row[6]) if len(row) > 6 and row[6] else None,
            started_at=datetime.fromisoformat(started_raw) if started_raw else datetime.now(),
            finished_at=datetime.fromisoformat(finished_raw) if finished_raw else None,
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "run_id",
            "provider",
            "idempotency_key",
            "status",
            "retry_count",
            "synced_records",
            "error",
            "started_at",
            "finished_at",
        ]


class AuditLogEntry(BaseModel):
    """System audit trail entry."""
    event_id: str = Field(default_factory=generate_id)
    action: str
    entity: str
    record_id: Optional[str] = None
    status: str = "success"
    actor: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)

    def to_row(self) -> list:
        return [
            self.event_id,
            self.action,
            self.entity,
            self.record_id or "",
            self.status,
            self.actor or "",
            json.dumps(self.metadata),
            self.created_at.isoformat(),
        ]

    @classmethod
    def from_row(cls, row: list) -> "AuditLogEntry":
        raw_meta = row[6] if len(row) > 6 and row[6] else "{}"
        try:
            metadata = json.loads(raw_meta)
            if not isinstance(metadata, dict):
                metadata = {}
        except (json.JSONDecodeError, TypeError):
            metadata = {}

        created_raw = row[7] if len(row) > 7 and row[7] else None
        return cls(
            event_id=str(row[0]) if row and row[0] else generate_id(),
            action=str(row[1]) if len(row) > 1 else "",
            entity=str(row[2]) if len(row) > 2 else "",
            record_id=str(row[3]) if len(row) > 3 and row[3] else None,
            status=str(row[4]) if len(row) > 4 and row[4] else "success",
            actor=str(row[5]) if len(row) > 5 and row[5] else None,
            metadata=metadata,
            created_at=datetime.fromisoformat(created_raw) if created_raw else datetime.now(),
        )

    @classmethod
    def headers(cls) -> list:
        return [
            "event_id",
            "action",
            "entity",
            "record_id",
            "status",
            "actor",
            "metadata",
            "created_at",
        ]
