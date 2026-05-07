from typing import Optional
from pydantic import BaseModel


class ContactResponse(BaseModel):
    id: str
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    connection_location: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    last_updated: Optional[str] = None

    class Config:
        from_attributes = True


class ContactCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    connection_location: Optional[str] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    connection_location: Optional[str] = None
    notes: Optional[str] = None
