import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import ContactModel, EventContactModel, EventModel, get_db, row_to_dict, upsert_event
from app.models.contact import ContactResponse
from app.models.event import EventResponse, EventStatusUpdate, RefreshResponse
from app.services.eventbrite import fetch_eventbrite_events
from app.services.scraper import get_all_scraped_events
from app.services.scorer import score_events_batch


class EventContactCreate(BaseModel):
    contact_id: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    connection_location: Optional[str] = None
    notes: Optional[str] = None

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_events(
    status: Optional[str] = None,
    category: Optional[str] = None,
    min_score: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(EventModel)

    if status:
        query = query.filter(EventModel.status == status)
    if min_score is not None:
        query = query.filter(EventModel.relevance_score >= min_score)

    rows = query.order_by(EventModel.relevance_score.desc()).all()
    results = [row_to_dict(r) for r in rows]

    if category:
        results = [r for r in results if category in r.get("categories", [])]

    return results


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    row = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row_to_dict(row)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, body: EventStatusUpdate, db: Session = Depends(get_db)):
    row = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    if body.status is not None:
        row.status = body.status
    if body.notes is not None:
        row.notes = body.notes
    db.commit()
    db.refresh(row)
    return row_to_dict(row)


@router.get("/{event_id}/contacts", response_model=list[ContactResponse])
def list_event_contacts(event_id: str, db: Session = Depends(get_db)):
    if not db.query(EventModel).filter(EventModel.id == event_id).first():
        raise HTTPException(status_code=404, detail="Event not found")
    links = db.query(EventContactModel).filter(EventContactModel.event_id == event_id).all()
    contact_ids = [lnk.contact_id for lnk in links]
    if not contact_ids:
        return []
    return db.query(ContactModel).filter(ContactModel.id.in_(contact_ids)).all()


@router.post("/{event_id}/contacts", response_model=ContactResponse, status_code=201)
def link_event_contact(event_id: str, body: EventContactCreate, db: Session = Depends(get_db)):
    if not db.query(EventModel).filter(EventModel.id == event_id).first():
        raise HTTPException(status_code=404, detail="Event not found")

    now = datetime.now(timezone.utc).isoformat()

    if body.contact_id:
        contact = db.query(ContactModel).filter(ContactModel.id == body.contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
    else:
        if not body.name:
            raise HTTPException(status_code=422, detail="Provide either contact_id or name")
        contact = ContactModel(
            id=str(uuid.uuid4()),
            name=body.name,
            company=body.company,
            email=body.email,
            connection_location=body.connection_location,
            notes=body.notes,
            created_at=now,
            last_updated=now,
        )
        db.add(contact)
        db.flush()

    existing_link = (
        db.query(EventContactModel)
        .filter(EventContactModel.event_id == event_id, EventContactModel.contact_id == contact.id)
        .first()
    )
    if not existing_link:
        db.add(EventContactModel(event_id=event_id, contact_id=contact.id, added_at=now))

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{event_id}/contacts/{contact_id}", status_code=204)
def unlink_event_contact(event_id: str, contact_id: str, db: Session = Depends(get_db)):
    link = (
        db.query(EventContactModel)
        .filter(EventContactModel.event_id == event_id, EventContactModel.contact_id == contact_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_events(db: Session = Depends(get_db)):
    existing_ids = {row.id for row in db.query(EventModel.id).all()}

    eb_events = await fetch_eventbrite_events()
    scraped_events = await get_all_scraped_events()
    all_fetched = eb_events + scraped_events

    new_events = [e for e in all_fetched if e["id"] not in existing_ids]

    scored = 0
    if new_events:
        scored_events = await score_events_batch(new_events)
        for event in scored_events:
            upsert_event(db, event)
        scored = len(scored_events)

    for event in all_fetched:
        if event["id"] in existing_ids:
            pass

    total = db.query(EventModel).count()
    all_rows = db.query(EventModel).order_by(EventModel.relevance_score.desc()).all()

    return RefreshResponse(
        fetched=len(all_fetched),
        scored=scored,
        total_in_db=total,
        events=[row_to_dict(r) for r in all_rows],
    )
