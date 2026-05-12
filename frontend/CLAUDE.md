# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js version warning

@AGENTS.md

This is **Next.js 16** — a version with breaking changes from what most training data covers. Before writing any code touching Next.js internals, routing, or server components, consult `node_modules/next/dist/docs/`. Heed deprecation notices. Route handler `params` is a `Promise` in this version — always `await ctx.params`.

---

## Monorepo Structure

```
conference-radar/
├── backend/    Python + FastAPI — event ingestion, scoring, persistence
└── frontend/   Next.js 16 — dashboard UI (this directory)
```

---

## Commands

### Frontend (run from `frontend/`)

```bash
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

### Backend (run from `backend/`)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Windows note:** Python and Node are not on the default PATH. Use PowerShell with full executable paths:

```powershell
# Backend — install deps (first time only)
& "C:\Users\DronAJ\python\python.exe" -m pip install -r requirements.txt

# Backend — start server
Set-Location "C:\Users\DronAJ\.vscode\conference-radar\backend"
& "C:\Users\DronAJ\python\python.exe" -m uvicorn app.main:app --reload --port 8000

# Frontend — node is at C:\Users\DronAJ\nodejs\; npm must be run with node on PATH
$env:PATH = "C:\Users\DronAJ\nodejs;" + $env:PATH
Set-Location "C:\Users\DronAJ\.vscode\conference-radar\frontend"
& "C:\Users\DronAJ\nodejs\npm.cmd" run dev
```

Backend must be running for the frontend to load real data. The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

---

## Architecture

### Data Flow

```
Eventbrite API ──┐
Web scrapers   ──┼──► FastAPI backend ──► Claude scoring ──► SQLite
Curated catalog ─┘         │
                            ▼
                    REST API (:8000)
                            │
                    Next.js frontend (:3000)
```

### Backend (`backend/app/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS for localhost:3000, startup seeding (7 curated events) |
| `database.py` | SQLAlchemy ORM, `EventModel` (29 cols), upsert logic that preserves `status` and `created_at` |
| `models/event.py` | Pydantic response schemas: `EventResponse`, `EventStatusUpdate`, `RefreshResponse` |
| `routes/events.py` | `GET /events`, `GET /events/{id}`, `PATCH /events/{id}`, `POST /events/refresh` |
| `services/scorer.py` | Claude Haiku scoring — 4 service lines, prompt caching, batches ≤5 concurrent |
| `services/eventbrite.py` | Eventbrite API client, 7 keyword queries |
| `services/scraper.py` | ACAMS, IIA, crypto.news scrapers + CoinMarketCap placeholder + 7 curated high-value events (Consensus, Money20/20, etc.) |

**Claude scoring output per event:** `audit_score`, `bsa_aml_score`, `risk_consulting_score`, `advisory_score`, `categories[]`, `decision_maker_density` (high/medium/low), `recommended_action`, `ai_reasoning`. Model: `claude-haiku-4-5-20251001` with prompt caching.

**Event status lifecycle:** `watching` → `attending` → `attended` (plus `passed` for expired events). Status is user-editable via `PATCH /events/{id}` and is preserved across re-ingestion.

### Frontend (`frontend/src/`)

**`lib/api.ts`** — the sole bridge to the backend. All API calls go through:
```typescript
api.events.list({ status?, category?, min_score? })
api.events.get(id)
api.events.update(id, { status?, notes? })
api.events.refresh()
```

**`APIEvent` key fields:** `id`, `name`, `date_start`, `date_end`, `city`, `state`, `country`, `venue`, `url`, `description`, `categories`, `relevance_score`, `audit_score`, `bsa_aml_score`, `risk_consulting_score`, `advisory_score`, `attendance_size`, `decision_maker_density`, `status`, `source`, `notes`, `tags`, `ai_reasoning`, `recommended_action`.

**`CATEGORY_LABELS`** maps service line keys to display names (audit, bsa_aml, risk_consulting, advisory, crypto_general).

**`STATUS_COLORS` / `STATUS_LABELS`** map status strings to Tailwind classes and display text.

**Layout:** Fixed 240px indigo sidebar (`components/layout/Sidebar.tsx`) + `<main>` flex column. No top navbar.

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Dashboard — stat cards (total, attending, high priority, avg score), upcoming events list, service line breakdown chart, must-attend highlights |
| `/events` | `app/events/page.tsx` | Full event list with filter/sort |
| `/events/[id]` | `app/events/[id]/page.tsx` | Event detail — AI insights, service line tabs, personas, score breakdown |
| `/pipeline` | `app/pipeline/page.tsx` | BD pipeline — 3-column layout by status (Attending / Watching / Attended) |
| `/contacts` | `app/contacts/page.tsx` | Placeholder (not yet built) |

### Scoring

**Frontend scoring** (legacy, in `lib/scoring/`) — keyword-based 0–100, used by the old JSON store.

**Backend scoring** (authoritative) — Claude AI returns per-service-line scores plus an overall `relevance_score`. The frontend always uses `relevance_score` from the API, not the local scoring engine.

`scoreColor(score)` in `lib/api.ts`:
- `≥80` → `text-crowe-teal` (high priority)
- `≥60` → `text-crowe-amber-dark` (medium)
- `<60` → `text-crowe-text-muted` (low)

---

## Styling

Tailwind CSS 4 — no `tailwind.config.*`. All brand tokens defined via `@theme` in `globals.css`.

**Key Crowe brand tokens:**
- `crowe-indigo` (`#011E41`) — primary dark, sidebar, headings
- `crowe-amber` (`#F5A800`) — primary accent, CTAs, active nav
- `crowe-teal` (`#05AB8C`) — success/high-score
- `crowe-blue` (`#0075C9`) — links
- `crowe-coral` (`#E5376B`) — warnings, alerts
- `crowe-border` / `crowe-surface` / `crowe-text-muted` — neutrals

Header always uses white wordmark on indigo. Never assign colors to specific service lines.

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000   # Backend base URL
ANTHROPIC_API_KEY=sk-ant-...               # Only needed for legacy Next.js AI routes
NEXT_PUBLIC_HAS_API_KEY=true
```

### Backend (`backend/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
EVENTBRITE_API_KEY=...
DATABASE_URL=sqlite:///./conference_radar.db
```

---

## Legacy vs Active Code

Some files from the initial build remain but are superseded by the backend:

| Legacy (frontend-only) | Replaced by |
|------------------------|-------------|
| `lib/store.ts` — JSON file store | Backend SQLite via `lib/api.ts` |
| `lib/ingestion/` — RSS parsers + mock data | `backend/app/services/` |
| `lib/ai/analyzer.ts` — Next.js AI route | `backend/app/services/scorer.py` |
| `lib/scoring/` — keyword scoring | Claude scoring in backend |
| `app/api/events/` — Next.js API routes | FastAPI REST endpoints |

The Next.js API routes (`app/api/`) still exist but are not used by the main UI. `lib/api.ts` is the active data layer.

---

## Known scraper limitations

**Corporate SSL proxy:** Crowe's network does SSL inspection. All `httpx` clients in `scraper.py` and `eventbrite.py` use `verify=False` to bypass this. This is intentional.

**CoinMarketCap:** CMC's events calendar is a client-side-only React SPA — their `/data-api/v3/event/calendar` API is private (returns 404) and `__NEXT_DATA__` pre-renders an empty events list. The `scrape_coinmarketcap()` function is retained as a no-op placeholder. To activate it, either obtain a CMC API key or add Playwright for headless rendering.

**crypto.news:** Scrapes the 4 featured event cards from the slider on `/events/`. The full calendar below is AJAX-loaded and not accessible via simple HTTP.
