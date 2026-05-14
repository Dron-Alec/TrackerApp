"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, APIEvent, STATUS_LABELS, STATUS_COLORS, formatDateRange, scoreColor } from "@/lib/api";

function ReviewCard({ event, onStatusChange }: { event: APIEvent; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);

  const move = async (status: string) => {
    setUpdating(true);
    try {
      await api.events.update(event.id, { status });
      onStatusChange(event.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="px-5 py-4 border-b border-nexus-border/30 last:border-0 hover:bg-nexus-surface/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-nexus-indigo leading-snug line-clamp-2">{event.name}</p>
        <span className={`shrink-0 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full ${scoreColor(event.relevance_score)}`}>
          {Math.round(event.relevance_score)}
        </span>
      </div>
      <p className="text-xs text-nexus-text-muted mb-2">
        {formatDateRange(event.date_start, event.date_end)}{event.city ? ` · ${event.city}` : ""}
      </p>
      {event.ai_reasoning && (
        <p className="text-xs text-nexus-text-mid italic line-clamp-3 mb-2">{event.ai_reasoning}</p>
      )}
      {event.recommended_action && (
        <p className="text-[10px] font-semibold text-nexus-amber-dark uppercase tracking-wide mb-3">
          {event.recommended_action}
        </p>
      )}
      <div className="flex gap-1.5 flex-wrap">
        {(["watching", "attending", "passed"] as const).map((s) => (
          <button
            key={s}
            disabled={updating}
            onClick={() => move(s)}
            className="text-[10px] px-2.5 py-1 rounded-full border border-nexus-border text-nexus-text-muted font-medium hover:border-nexus-indigo hover:text-nexus-indigo transition-colors disabled:opacity-50"
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

function PipelineCard({ event }: { event: APIEvent }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 border-b border-nexus-border/30 last:border-0 hover:bg-nexus-surface/30 transition-colors">
      <span className={`text-sm font-bold w-8 text-center shrink-0 ${scoreColor(event.relevance_score)}`}>
        {Math.round(event.relevance_score)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-nexus-indigo line-clamp-1">{event.name}</p>
        <p className="text-xs text-nexus-text-muted">
          {formatDateRange(event.date_start, event.date_end)}{event.city ? ` · ${event.city}` : ""}
        </p>
      </div>
      <Link href={`/events`} className="text-[10px] text-nexus-blue hover:underline shrink-0">Details →</Link>
    </div>
  );
}

export default function PipelinePage() {
  const [events, setEvents] = useState<APIEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.list().then(setEvents).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (id: string, status: string) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  };

  const pending = events.filter((e) => e.status === "pending_review")
    .sort((a, b) => b.relevance_score - a.relevance_score);
  const attending = events.filter((e) => e.status === "attending")
    .sort((a, b) => (a.date_start ?? "").localeCompare(b.date_start ?? ""));
  const attended = events.filter((e) => e.status === "attended")
    .sort((a, b) => (b.date_start ?? "").localeCompare(a.date_start ?? ""));

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-nexus-indigo">BD Pipeline</h1>
        <p className="text-nexus-text-muted text-sm mt-1">
          Review AI findings, confirm attendance, and track completed events
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-nexus-text-muted">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Pending SME Review */}
          <div className="bg-white rounded-xl border border-nexus-border/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-nexus-border/40 bg-nexus-amber/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-nexus-amber-dark">
                Pending SME Review
              </h2>
              <p className="text-xs text-nexus-amber-dark/70 mt-0.5">{pending.length} awaiting review</p>
            </div>
            <div className="divide-y divide-nexus-border/30">
              {pending.length === 0 ? (
                <p className="text-xs text-nexus-text-muted px-5 py-4">No events pending review</p>
              ) : pending.map((e) => (
                <ReviewCard key={e.id} event={e} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>

          {/* Attending */}
          <div className="bg-white rounded-xl border border-nexus-border/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-nexus-border/40 bg-nexus-teal/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-nexus-teal-dark">Attending</h2>
              <p className="text-xs text-nexus-teal-dark/70 mt-0.5">{attending.length} confirmed</p>
            </div>
            <div>
              {attending.length === 0 ? (
                <p className="text-xs text-nexus-text-muted px-5 py-4">None confirmed yet</p>
              ) : attending.map((e) => (
                <PipelineCard key={e.id} event={e} />
              ))}
            </div>
          </div>

          {/* Attended */}
          <div className="bg-white rounded-xl border border-nexus-border/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-nexus-border/40 bg-nexus-indigo/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-nexus-indigo">Attended</h2>
              <p className="text-xs text-nexus-indigo/50 mt-0.5">{attended.length} completed</p>
            </div>
            <div>
              {attended.length === 0 ? (
                <p className="text-xs text-nexus-text-muted px-5 py-4">None yet</p>
              ) : attended.map((e) => (
                <PipelineCard key={e.id} event={e} />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
