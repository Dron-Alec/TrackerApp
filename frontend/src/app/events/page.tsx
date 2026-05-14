"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { api, APIEvent, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS, scoreColor, formatDateRange } from "@/lib/api";

function exportToExcel(events: APIEvent[]) {
  const rows = events.map((e) => ({
    "Name": e.name,
    "Status": STATUS_LABELS[e.status] ?? e.status,
    "Date Start": e.date_start ?? "",
    "Date End": e.date_end ?? "",
    "City": e.city ?? "",
    "State": e.state ?? "",
    "Country": e.country ?? "",
    "Venue": e.venue ?? "",
    "URL": e.url ?? "",
    "Relevance Score": e.relevance_score,
    "Audit Score": e.audit_score,
    "BSA / AML Score": e.bsa_aml_score,
    "Risk Consulting Score": e.risk_consulting_score,
    "Advisory Score": e.advisory_score,
    "Categories": e.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(", "),
    "Tags": e.tags.join(", "),
    "Attendance Size": e.attendance_size ?? "",
    "Decision Maker Density": e.decision_maker_density,
    "Recommended Action": e.recommended_action ?? "",
    "AI Reasoning": e.ai_reasoning ?? "",
    "Notes": e.notes ?? "",
    "Source": e.source,
    "Created At": e.created_at ?? "",
    "Last Updated": e.last_updated ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Events");

  // Auto-size columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r]).length)),
  }));
  ws["!cols"] = colWidths;

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `conference-radar-events-${date}.xlsx`);
}

const CATEGORIES = ["audit", "bsa_aml", "risk_consulting", "advisory", "crypto_general"];
const STATUSES = ["pending_review", "watching", "attending", "attended", "passed"];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-nexus-teal text-white" :
    score >= 60 ? "bg-nexus-amber text-nexus-indigo" :
    "bg-nexus-surface text-nexus-text-muted";
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${color}`}>
      {Math.round(score)}
    </span>
  );
}

function CategoryPill({ cat }: { cat: string }) {
  const colors: Record<string, string> = {
    audit: "bg-nexus-blue/10 text-nexus-blue-dark",
    bsa_aml: "bg-nexus-coral/10 text-nexus-coral-dark",
    risk_consulting: "bg-nexus-violet/10 text-nexus-violet-dark",
    advisory: "bg-nexus-teal/10 text-nexus-teal-dark",
    crypto_general: "bg-nexus-surface text-nexus-text-mid",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[cat] ?? "bg-nexus-surface text-nexus-text-muted"}`}>
      {CATEGORY_LABELS[cat] ?? cat}
    </span>
  );
}

function EventRow({ event, onStatusChange }: { event: APIEvent; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.events.update(event.id, { status });
      onStatusChange(event.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-nexus-border/60 p-5 flex gap-5 items-start hover:shadow-md transition-shadow">
      <ScoreBadge score={event.relevance_score} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-nexus-indigo text-sm leading-snug line-clamp-2">{event.name}</h3>
            <p className="text-nexus-text-muted text-xs mt-0.5">
              {formatDateRange(event.date_start, event.date_end)}
              {event.city && ` · ${event.city}${event.state ? `, ${event.state}` : ""}`}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[event.status] ?? "bg-nexus-surface text-nexus-text-muted"}`}>
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
        {event.ai_reasoning && (
          <p className="text-nexus-text-mid text-xs mt-2 line-clamp-2 italic">{event.ai_reasoning}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {event.categories.map((cat) => <CategoryPill key={cat} cat={cat} />)}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={updating || event.status === s}
                onClick={() => handleStatus(s)}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  event.status === s
                    ? "bg-nexus-indigo text-white border-nexus-indigo"
                    : "border-nexus-border text-nexus-text-muted hover:border-nexus-indigo hover:text-nexus-indigo"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-nexus-blue hover:underline"
            >
              View event →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<APIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("date_asc");
  const [refreshStats, setRefreshStats] = useState<{ fetched: number; scored: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.events.list({
        status: filterStatus || undefined,
        category: filterCategory || undefined,
        min_score: filterMinScore > 0 ? filterMinScore : undefined,
      });
      setEvents(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterMinScore]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshStats(null);
    try {
      const result = await api.events.refresh();
      setEvents(result.events);
      setLastRefreshed(new Date());
      setRefreshStats({ fetched: result.fetched, scored: result.scored });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  };

  const sortedEvents = [...events].sort((a, b) => {
    switch (sortBy) {
      case "date_asc": {
        if (!a.date_start && !b.date_start) return 0;
        if (!a.date_start) return 1;
        if (!b.date_start) return -1;
        return a.date_start.localeCompare(b.date_start);
      }
      case "date_desc": {
        if (!a.date_start && !b.date_start) return 0;
        if (!a.date_start) return 1;
        if (!b.date_start) return -1;
        return b.date_start.localeCompare(a.date_start);
      }
      case "score_desc": return b.relevance_score - a.relevance_score;
      case "score_asc":  return a.relevance_score - b.relevance_score;
      case "name_asc":   return a.name.localeCompare(b.name);
      case "name_desc":  return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nexus-indigo">Events</h1>
          <p className="text-nexus-text-muted text-sm mt-0.5">
            {events.length} events tracked
            {lastRefreshed && (
              <span className="ml-2 text-nexus-teal">
                · Last refreshed {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(events)}
            disabled={events.length === 0}
            className="flex items-center gap-2 border border-nexus-border text-nexus-indigo font-semibold text-sm px-4 py-2.5 rounded-lg hover:border-nexus-indigo transition-colors disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-nexus-amber text-nexus-indigo font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-nexus-amber-bright transition-colors disabled:opacity-60"
          >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={refreshing ? "animate-spin" : ""}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Refresh stats */}
      {refreshStats && (
        <div className="mb-5 px-4 py-3 bg-nexus-teal/10 border border-nexus-teal/20 rounded-lg text-sm text-nexus-teal-dark">
          Pulled <strong>{refreshStats.fetched}</strong> events from all sources · AI-scored <strong>{refreshStats.scored}</strong> new events
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl border border-nexus-border/60">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-nexus-border rounded-lg px-3 py-1.5 text-nexus-text bg-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm border border-nexus-border rounded-lg px-3 py-1.5 text-nexus-text bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-nexus-border rounded-lg px-3 py-1.5 text-nexus-text bg-white"
        >
          <option value="date_asc">Date: earliest first</option>
          <option value="date_desc">Date: latest first</option>
          <option value="score_desc">Score: highest first</option>
          <option value="score_asc">Score: lowest first</option>
          <option value="name_asc">Name: A → Z</option>
          <option value="name_desc">Name: Z → A</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-nexus-text-muted">Min score</label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(Number(e.target.value))}
            className="w-24 accent-nexus-amber"
          />
          <span className="text-xs font-semibold text-nexus-indigo w-7">{filterMinScore}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-nexus-text-muted">Loading events…</div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-nexus-coral font-medium">{error}</p>
          <p className="text-nexus-text-muted text-sm mt-1">Make sure the backend is running on port 8000</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-nexus-text-muted">
          No events found. Hit <strong>Refresh</strong> to pull from all sources.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <EventRow key={event.id} event={event} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
