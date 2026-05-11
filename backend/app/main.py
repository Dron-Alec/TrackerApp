import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, SessionLocal, upsert_event
from app.routes.contacts import router as contacts_router
from app.routes.events import router as events_router
from app.services.scraper import CURATED_EVENTS
from app.services.scorer import score_events_batch


async def seed_curated_events() -> None:
    """On startup, remove stale curated events and seed any new ones."""
    db = SessionLocal()
    try:
        from app.database import EventModel
        current_ids = {e["id"] for e in CURATED_EVENTS}
        stale = (
            db.query(EventModel)
            .filter(EventModel.id.like("curated_%"))
            .filter(EventModel.id.notin_(current_ids))
            .all()
        )
        for row in stale:
            db.delete(row)
        db.commit()

        existing_ids = {row.id for row in db.query(EventModel.id).all()}
        new_events = [e for e in CURATED_EVENTS if e["id"] not in existing_ids]
        if new_events:
            scored = await score_events_batch(new_events)
            for event in scored:
                upsert_event(db, event)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    await seed_curated_events()
    yield


app = FastAPI(
    title="Conference Radar API",
    description="Crypto event intelligence and BD radar for Crowe",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(contacts_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "conference-radar-api"}
