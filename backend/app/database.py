import json
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./conference_radar.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class EventModel(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    date_start = Column(String)
    date_end = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    venue = Column(String)
    url = Column(String)
    description = Column(Text)
    categories = Column(String, default="[]")        # JSON array
    relevance_score = Column(Float, default=0.0)
    audit_score = Column(Float, default=0.0)
    bsa_aml_score = Column(Float, default=0.0)
    risk_consulting_score = Column(Float, default=0.0)
    advisory_score = Column(Float, default=0.0)
    attendance_size = Column(String, default="medium")
    decision_maker_density = Column(String, default="medium")
    status = Column(String, default="watching")
    source = Column(String, default="manual")        # eventbrite | scraped | manual
    external_id = Column(String)
    notes = Column(Text)
    tags = Column(String, default="[]")              # JSON array
    ai_reasoning = Column(Text)
    recommended_action = Column(String)
    cost_of_attendance = Column(Text)         # JSON: {tiers, registrationUrl, notes}
    last_updated = Column(String)
    created_at = Column(String)


class ContactModel(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    company = Column(String)
    email = Column(String)
    connection_location = Column(String)   # event/conference where connection was made
    notes = Column(Text)
    created_at = Column(String)
    last_updated = Column(String)


class EventContactModel(Base):
    __tablename__ = "event_contacts"

    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(String)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    # Migrate: add cost_of_attendance if the column didn't exist yet
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN cost_of_attendance TEXT"))
            conn.commit()
        except Exception:
            pass  # column already exists


def row_to_dict(row: EventModel) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "date_start": row.date_start,
        "date_end": row.date_end,
        "city": row.city,
        "state": row.state,
        "country": row.country,
        "venue": row.venue,
        "url": row.url,
        "description": row.description,
        "categories": json.loads(row.categories or "[]"),
        "relevance_score": row.relevance_score or 0,
        "audit_score": row.audit_score or 0,
        "bsa_aml_score": row.bsa_aml_score or 0,
        "risk_consulting_score": row.risk_consulting_score or 0,
        "advisory_score": row.advisory_score or 0,
        "attendance_size": row.attendance_size,
        "decision_maker_density": row.decision_maker_density,
        "status": row.status,
        "source": row.source,
        "notes": row.notes,
        "tags": json.loads(row.tags or "[]"),
        "ai_reasoning": row.ai_reasoning,
        "recommended_action": row.recommended_action,
        "cost_of_attendance": json.loads(row.cost_of_attendance or "null"),
        "last_updated": row.last_updated,
        "created_at": row.created_at,
    }


def upsert_event(db: Session, data: dict) -> EventModel:
    existing = db.query(EventModel).filter(EventModel.id == data["id"]).first()
    now = datetime.now(timezone.utc).isoformat()

    if existing:
        for key, value in data.items():
            if key != "id" and key != "created_at" and key != "status":
                setattr(existing, key, value)
        existing.last_updated = now
        db.commit()
        db.refresh(existing)
        return existing

    row = EventModel(**data, created_at=now, last_updated=now)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
