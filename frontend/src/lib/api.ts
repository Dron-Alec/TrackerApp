import type { Event, EventType, AttendanceCost } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface APIEvent {
  id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  venue: string | null;
  url: string | null;
  description: string | null;
  categories: string[];
  relevance_score: number;
  audit_score: number;
  bsa_aml_score: number;
  risk_consulting_score: number;
  advisory_score: number;
  attendance_size: string | null;
  decision_maker_density: string;
  status: string;
  source: string;
  notes: string | null;
  tags: string[];
  ai_reasoning: string | null;
  recommended_action: string | null;
  cost_of_attendance: AttendanceCost | null;
  last_updated: string | null;
  created_at: string | null;
}

function inferEventType(categories: string[]): EventType {
  if (categories.includes("bsa_aml") || categories.includes("audit")) return "regulatory";
  if (categories.includes("advisory")) return "institutional";
  return "conference";
}

export function apiEventToEvent(e: APIEvent): Event {
  const isUS = e.country === "USA" || e.country === "US";
  const location = [e.city, e.state, isUS ? null : e.country]
    .filter(Boolean)
    .join(", ") || e.country || "Unknown";

  const signals = [
    { keyword: "Audit", points: Math.round(e.audit_score) },
    { keyword: "BSA / AML", points: Math.round(e.bsa_aml_score) },
    { keyword: "Risk Consulting", points: Math.round(e.risk_consulting_score) },
    { keyword: "Advisory", points: Math.round(e.advisory_score) },
  ].filter((s) => s.points > 0);

  return {
    id: e.id,
    name: e.name,
    date: e.date_start ?? "",
    endDate: e.date_end ?? undefined,
    location,
    country: isUS ? "US" : "Global",
    description: e.description ?? "",
    url: e.url ?? "",
    source: e.source,
    type: inferEventType(e.categories),
    categories: e.categories,
    relevanceScore: e.relevance_score,
    scoreBreakdown: { total: e.relevance_score, signals },
    speakers: [],
    attendanceCost: e.cost_of_attendance ?? undefined,
    ingestedAt: e.created_at ?? new Date().toISOString(),
  };
}

export interface RefreshResult {
  fetched: number;
  scored: number;
  total_in_db: number;
  events: APIEvent[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface APIContact {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  connection_location: string | null;
  notes: string | null;
  created_at: string | null;
  last_updated: string | null;
}

export interface ContactPayload {
  name: string;
  company?: string | null;
  email?: string | null;
  connection_location?: string | null;
  notes?: string | null;
}

export const api = {
  contacts: {
    list: () => apiFetch<APIContact[]>("/contacts"),
    get: (id: string) => apiFetch<APIContact>(`/contacts/${id}`),
    create: (body: ContactPayload) =>
      apiFetch<APIContact>("/contacts", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: ContactPayload) =>
      apiFetch<APIContact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiFetch<void>(`/contacts/${id}`, { method: "DELETE" }),
  },
  events: {
    list: (params?: { status?: string; category?: string; min_score?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.category) qs.set("category", params.category);
      if (params?.min_score != null) qs.set("min_score", String(params.min_score));
      const query = qs.toString();
      return apiFetch<APIEvent[]>(`/events${query ? "?" + query : ""}`);
    },

    get: (id: string) => apiFetch<APIEvent>(`/events/${id}`),

    update: (id: string, body: { status?: string; notes?: string }) =>
      apiFetch<APIEvent>(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    refresh: () =>
      apiFetch<RefreshResult>("/events/refresh", { method: "POST" }),

    contacts: {
      list: (eventId: string) =>
        apiFetch<APIContact[]>(`/events/${eventId}/contacts`),
      link: (eventId: string, contactId: string) =>
        apiFetch<APIContact>(`/events/${eventId}/contacts`, {
          method: "POST",
          body: JSON.stringify({ contact_id: contactId }),
        }),
      createAndLink: (eventId: string, payload: ContactPayload) =>
        apiFetch<APIContact>(`/events/${eventId}/contacts`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      unlink: (eventId: string, contactId: string) =>
        apiFetch<void>(`/events/${eventId}/contacts/${contactId}`, { method: "DELETE" }),
    },
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  audit: "Audit",
  bsa_aml: "BSA / AML",
  risk_consulting: "Risk Consulting",
  advisory: "Advisory",
  crypto_general: "Crypto General",
};

export const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  watching: "Watching",
  attending: "Attending",
  attended: "Attended",
  passed: "Passed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-crowe-amber/15 text-crowe-amber-dark",
  watching: "bg-crowe-cyan/15 text-crowe-cyan-dark",
  attending: "bg-crowe-teal/15 text-crowe-teal-dark",
  attended: "bg-crowe-indigo/10 text-crowe-indigo",
  passed: "bg-crowe-surface text-crowe-text-muted",
};

export const DENSITY_COLORS: Record<string, string> = {
  high: "text-crowe-teal",
  medium: "text-crowe-amber",
  low: "text-crowe-text-muted",
};

export function scoreColor(score: number): string {
  if (score >= 80) return "text-crowe-teal font-semibold";
  if (score >= 60) return "text-crowe-amber font-semibold";
  return "text-crowe-text-muted";
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "Date TBD";
  const s = new Date(start + "T00:00:00");
  const e = end ? new Date(end + "T00:00:00") : null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  if (!e || start === end) return s.toLocaleDateString("en-US", yearOpts);
  if (s.getMonth() === e.getMonth())
    return `${s.toLocaleDateString("en-US", opts)}–${e.getDate()}, ${e.getFullYear()}`;
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
}
