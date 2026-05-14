# Conference Radar

A crypto event intelligence dashboard for tracking conferences, managing BD contacts, and analyzing engagement opportunities in the digital assets space.

---

## Overview

Conference Radar helps professional services teams:

- **Discover and score** crypto/fintech conferences by relevance to audit, BSA/AML, risk consulting, and advisory practices
- **Manage a BD pipeline** — mark events as watching, attending, or attended
- **Track contacts and engagements** — link client contacts to events and manage engagement history
- **Generate AI-powered insights** — per-event analysis including target personas, conversation starters, and service line BD angles

---

## Architecture

```
conference-radar/
├── frontend/   Next.js 16 — dashboard UI
└── backend/    Python + FastAPI — event ingestion, scoring, persistence
```

**Data flow:**

```
Web scrapers ──┐
Curated events ┼──► FastAPI (:8000) ──► Claude scoring ──► SQLite
Eventbrite API ┘          │
                           ▼
                   Next.js frontend (:3001)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend seeds a set of curated events on startup and exposes a REST API at `http://localhost:8000`. Use `--host 0.0.0.0` — the default `127.0.0.1` binding is intercepted by Docker on macOS when the frontend uses `localhost`.

Optional environment variables (`backend/.env`):

```
ANTHROPIC_API_KEY=sk-ant-...      # Enables AI scoring via Claude
EVENTBRITE_API_KEY=...            # Enables Eventbrite event ingestion
DATABASE_URL=sqlite:///./conference_radar.db
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --webpack
```

Opens at `http://localhost:3001` (or 3000 if free). The `--webpack` flag is required — Turbopack has a workspace root conflict with this repo structure.

Optional environment variables (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
ANTHROPIC_API_KEY=sk-ant-...      # Enables live AI analysis on event detail pages
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — event stats, upcoming events, service line breakdown |
| `/events` | Full event list with filtering and scoring; click any event name to open detail |
| `/events/[id]` | Event detail — AI insights, personas, conversation starters, score breakdown |
| `/pipeline` | BD pipeline — Watching / Attending / Attended columns |
| `/contacts` | Contact tracker — add contacts and link them to events |
| `/reporting` | Engagement & contact intelligence — filterable tables with Excel export |

---

## Event Scoring

Each event is scored 0–100 across four service lines by Claude (Haiku):

| Service Line | What it measures |
|---|---|
| **Audit** | Presence of firms needing financial statement audits or attestation |
| **BSA / AML** | Compliance officers, FinCEN-adjacent topics, AML program demand |
| **Risk Consulting** | CROs, SOC exam readiness, enterprise risk content |
| **Advisory** | Strategic crypto adoption, regulatory readiness conversations |

When no API key is set, the backend falls back to keyword-based scoring.

## AI Event Analysis

On any event detail page, clicking **Analyze** generates:

- **Summary** — what the event is and why it matters
- **Service line insights** — specific BD angles per practice area
- **Target personas** — job titles, challenges, and LinkedIn search queries
- **Conversation starters** — specific, non-generic opening lines
- **Key takeaway** — one-sentence prioritization rationale

Requires `ANTHROPIC_API_KEY` in `frontend/.env.local` for live output; falls back to structured mock data if not set.

---

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS 4, TypeScript
- **Backend**: FastAPI, SQLAlchemy, SQLite, httpx, BeautifulSoup
- **AI**: Anthropic Claude (Haiku) for event scoring and analysis
- **Export**: xlsx (client-side spreadsheet export from Reporting page)
