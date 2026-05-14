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
npm install
npm run dev -- --webpack    # http://localhost:3001 (use --webpack; Turbopack has a workspace root conflict)
npm run build
npm run lint
```

### Backend (run from `backend/`)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** Use `--host 0.0.0.0` — binding to `127.0.0.1` only (the default) causes Docker on macOS to intercept `localhost` via IPv6, making the backend unreachable from the frontend.

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
                    Next.js frontend (:3001)
```

### Backend (`backend/app/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS for localhost:3000/3001, startup seeding of curated events |
| `database.py` | SQLAlchemy ORM, `EventModel` (29 cols), upsert logic that preserves `status` and `created_at` |
| `models/event.py` | Pydantic response schemas: `EventResponse`, `EventStatusUpdate`, `RefreshResponse` |
| `routes/events.py` | `GET /events`, `GET /events/{id}`, `PATCH /events/{id}`, `POST /events/refresh` |
| `services/scorer.py` | Claude Haiku scoring — 4 service lines, prompt caching, batches ≤5 concurrent |
| `services/eventbrite.py` | Eventbrite API client, 7 keyword queries |
| `services/scraper.py` | ACAMS, IIA, crypto.news scrapers + CoinMarketCap placeholder + curated high-value events |

**Claude scoring output per event:** `audit_score`, `bsa_aml_score`, `risk_consulting_score`, `advisory_score`, `categories[]`, `decision_maker_density` (high/medium/low), `recommended_action`, `ai_reasoning`. Model: `claude-haiku-4-5-20251001` with prompt caching.

**Event status lifecycle:** `watching` → `attending` → `attended` (plus `passed` for expired events). Status is user-editable via `PATCH /events/{id}` and preserved across re-ingestion.

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

**Layout:** Fixed 240px dark sidebar (`components/layout/Sidebar.tsx`) + `<main>` flex column. No top navbar.

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Dashboard — stat cards, upcoming events list, service line breakdown, must-attend highlights |
| `/events` | `app/events/page.tsx` | Full event list with filter/sort; event names link to detail page |
| `/events/[id]` | `app/events/[id]/page.tsx` | Event detail — AI insights, service line tabs, personas, conversation starters, score breakdown |
| `/pipeline` | `app/pipeline/page.tsx` | BD pipeline — 3-column layout by status (Attending / Watching / Attended) |
| `/contacts` | `app/contacts/page.tsx` | Contact tracker — add contacts and link to events |
| `/reporting` | `app/reporting/page.tsx` | Engagement & contact intelligence — filterable tables, Excel export |

### AI Insights (Event Detail)

The `/events/[id]` page has an **Analyze** button that triggers `POST /api/events/{id}/analyze`. This calls `lib/ai/analyzer.ts`, which:
- Calls Claude Haiku if `ANTHROPIC_API_KEY` is set in `frontend/.env.local`
- Falls back to `buildMockAnalysis()` (structurally identical output) if no key is present

Output fields: `summary`, `serviceLineInsights` (audit/bsaAml/riskConsulting/advisory), `personas[]`, `conversationStarters[]`, `keyTakeaway`.

### Scoring

**Backend scoring** (authoritative) — Claude returns per-service-line scores plus an overall `relevance_score`. The frontend always uses `relevance_score` from the API.

`scoreColor(score)` in `lib/api.ts`:
- `≥80` → `text-nexus-teal` (high priority)
- `≥60` → `text-nexus-amber-dark` (medium)
- `<60` → `text-nexus-text-muted` (low)

---

## Styling

Tailwind CSS 4 — no `tailwind.config.*`. All design tokens defined via `@theme` in `globals.css`.

**Color tokens (all prefixed `nexus-`):**
- `nexus-indigo` (`#0f172a`) — primary dark, sidebar, headings
- `nexus-amber` (`#6366f1`) — primary accent, CTAs, active nav
- `nexus-teal` (`#10b981`) — success / high score
- `nexus-blue` (`#3b82f6`) — links
- `nexus-coral` (`#f43f5e`) — warnings, alerts
- `nexus-border` / `nexus-surface` / `nexus-text-muted` — neutrals

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000   # Backend base URL
ANTHROPIC_API_KEY=sk-ant-...               # Enables live AI analysis on event detail page
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

The Next.js API routes (`app/api/`) still exist and handle the per-event AI analysis trigger. `lib/api.ts` is the active data layer for everything else.

---

## Known Issues / Limitations

**Turbopack conflict:** The project git root is at `conference-radar/` but the Next.js project is in `frontend/`. Turbopack misdetects the workspace root and fails to resolve `next/package.json`. Always run with `--webpack`.

**CoinMarketCap:** CMC's events calendar is a client-side-only React SPA — the scraper is retained as a no-op placeholder. To activate, obtain a CMC API key or add Playwright for headless rendering.

**crypto.news:** Scrapes the 4 featured event cards from the events slider only. The full calendar is AJAX-loaded and not accessible via simple HTTP.
