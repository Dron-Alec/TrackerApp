import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import ContactModel, get_db
from app.models.contact import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactResponse])
def list_contacts(search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(ContactModel)
    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            ContactModel.name.ilike(term)
            | ContactModel.company.ilike(term)
            | ContactModel.email.ilike(term)
        )
    return q.order_by(ContactModel.last_updated.desc()).all()


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: str, db: Session = Depends(get_db)):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("", response_model=ContactResponse, status_code=201)
def create_contact(body: ContactCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
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
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: str, body: ContactUpdate, db: Session = Depends(get_db)):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(contact, field, value)
    contact.last_updated = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: str, db: Session = Depends(get_db)):
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
