"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, APIEvent, CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, formatDateRange, scoreColor } from "@/lib/api";

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-nexus-border/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? "text-nexus-indigo"}`}>{value}</p>
      {sub && <p className="text-xs text-nexus-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function MiniEventRow({ event }: { event: APIEvent }) {
  return (
    <Link href="/events" className="flex items-center gap-3 py-2.5 border-b border-nexus-border/40 last:border-0 hover:bg-nexus-surface/30 -mx-2 px-2 rounded transition-colors">
      <span className={`text-base font-bold w-10 text-center ${scoreColor(event.relevance_score)}`}>
        {Math.round(event.relevance_score)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-nexus-indigo line-clamp-1">{event.name}</p>
        <p className="text-xs text-nexus-text-muted">
          {formatDateRange(event.date_start, event.date_end)}
          {event.city ? ` · ${event.city}` : ""}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? ""}`}>
        {STATUS_LABELS[event.status] ?? event.status}
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<APIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.events.list()
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const attending = events.filter((e) => e.status === "attending");
  const highPriority = events.filter((e) => e.relevance_score >= 80 && e.status !== "passed" && e.status !== "attended");
  const today = new Date().toISOString().split("T")[0];
  const upcoming = events
    .filter((e) => (e.date_start ?? "") >= today && e.status !== "passed")
    .sort((a, b) => (a.date_start ?? "").localeCompare(b.date_start ?? ""))
    .slice(0, 6);
  const avgScore = events.length
    ? Math.round(events.reduce((s, e) => s + e.relevance_score, 0) / events.length)
    : 0;
  const categoryBreakdown = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key, label,
    count: events.filter((e) => e.categories.includes(key)).length,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-nexus-indigo">Crypto Event Intelligence</h1>
        <p className="text-nexus-text-muted text-sm mt-1">
          BD radar for audit, BSA/AML, risk consulting, and advisory
        </p>
      </div>

      {loading ? (
        <div className="text-center py-24 text-nexus-text-muted">Loading…</div>
      ) : error ? (
        <div className="text-center py-24">
          <p className="text-nexus-coral font-medium mb-2">{error}</p>
          <p className="text-nexus-text-muted text-sm mt-1">
            Start the backend:{" "}
            <code className="bg-nexus-surface px-1.5 py-0.5 rounded text-xs">
              uvicorn app.main:app --reload --port 8000
            </code>
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Events" value={events.length} sub="in database" />
            <StatCard label="Attending" value={attending.length} accent="text-nexus-teal" sub="confirmed" />
            <StatCard label="High Priority" value={highPriority.length} accent="text-nexus-amber-dark" sub="score ≥ 80" />
            <StatCard label="Avg Score" value={avgScore} sub="AI relevance" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-nexus-border/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-nexus-indigo text-sm uppercase tracking-wider">Upcoming Events</h2>
                <Link href="/events" className="text-xs text-nexus-blue hover:underline">View all →</Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-nexus-text-muted text-sm py-4 text-center">
                  No upcoming events. Hit <Link href="/events" className="text-nexus-blue underline">Refresh</Link> on the Events page.
                </p>
              ) : (
                upcoming.map((e) => <MiniEventRow key={e.id} event={e} />)
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-nexus-border/60 p-5">
                <h2 className="font-semibold text-nexus-indigo text-sm uppercase tracking-wider mb-4">By Service Line</h2>
                <div className="space-y-3">
                  {categoryBreakdown.map(({ key, label, count }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-nexus-text-mid font-medium">{label}</span>
                        <span className="text-nexus-text-muted">{count}</span>
                      </div>
                      <div className="h-1.5 bg-nexus-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-nexus-amber rounded-full"
                          style={{ width: events.length ? `${(count / events.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {highPriority.length > 0 && (
                <div className="bg-white rounded-xl border border-nexus-border/60 p-5">
                  <h2 className="font-semibold text-nexus-coral text-xs uppercase tracking-wider mb-3">Must-Attend</h2>
                  {highPriority.slice(0, 4).map((e) => (
                    <p key={e.id} className="text-xs text-nexus-indigo font-medium py-1.5 border-b border-nexus-border/40 last:border-0 line-clamp-1">
                      {e.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
