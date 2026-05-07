from typing import Optional
from pydantic import BaseModel


class EventResponse(BaseModel):
    id: str
    name: str
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    venue: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    categories: list[str] = []
    relevance_score: float = 0
    audit_score: float = 0
    bsa_aml_score: float = 0
    risk_consulting_score: float = 0
    advisory_score: float = 0
    attendance_size: Optional[str] = None
    decision_maker_density: str = "medium"
    status: str = "watching"
    source: str = "manual"
    notes: Optional[str] = None
    tags: list[str] = []
    ai_reasoning: Optional[str] = None
    recommended_action: Optional[str] = None
    cost_of_attendance: Optional[dict] = None
    last_updated: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class EventStatusUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class RefreshResponse(BaseModel):
    fetched: int
    scored: int
    total_in_db: int
    events: list[EventResponse]
