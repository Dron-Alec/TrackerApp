"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { ENGAGEMENTS, CONTACTS, type Engagement, type Contact, type BusinessUnit, type EngagementStatus, type ContactSide } from "./mockData";
import { api } from "@/lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const contactMap = new Map<string, Contact>(CONTACTS.map((c) => [c.id, c]));
function getContact(id: string) { return contactMap.get(id); }

function fmtRevenue(k: number) {
  return k >= 1000 ? `$${(k / 1000).toFixed(2)}M` : `$${k}K`;
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ─── badge components ────────────────────────────────────────────────────────

function BUBadge({ bu }: { bu: BusinessUnit }) {
  const cls: Record<BusinessUnit, string> = {
    Audit: "bg-blue-50 text-blue-700 border border-blue-200",
    Tax: "bg-amber-50 text-amber-700 border border-amber-200",
    Consulting: "bg-teal-50 text-teal-700 border border-teal-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls[bu]}`}>
      {bu}
    </span>
  );
}

function StatusBadge({ status }: { status: EngagementStatus }) {
  const cls: Record<EngagementStatus, string> = {
    Active: "bg-teal-50 text-teal-700 border border-teal-200",
    Completed: "bg-gray-100 text-gray-600 border border-gray-200",
    Proposed: "bg-amber-50 text-amber-700 border border-amber-200",
    "On Hold": "bg-red-50 text-red-600 border border-red-200",
  };
  const label: Record<EngagementStatus, string> = {
    Active: "Yes",
    Completed: "Former Client",
    Proposed: "No / Prospect",
    "On Hold": "On Hold",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cls[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-teal-500" : status === "Proposed" ? "bg-amber-500" : status === "On Hold" ? "bg-red-500" : "bg-gray-400"}`} />
      {label[status]}
    </span>
  );
}

function SideBadge({ side }: { side: ContactSide }) {
  return side === "Firm"
    ? <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Firm</span>
    : <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Client</span>;
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const colors = ["bg-indigo-600", "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-sky-500"];
  const idx = name.charCodeAt(0) % colors.length;
  const sz = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <span className={`${colors[idx]} text-white rounded-full ${sz} flex items-center justify-center font-semibold shrink-0`}>
      {initials(name)}
    </span>
  );
}

// ─── sort helpers ────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
      {dir === "asc" || !active
        ? <polyline points="2,8 6,4 10,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function SortTh({ label, col, sort, onSort }: { label: string; col: string; sort: { col: string; dir: SortDir }; onSort: (c: string) => void }) {
  const active = sort.col === col;
  return (
    <th className="px-4 py-3 text-left" onClick={() => onSort(col)}>
      <button className="flex items-center gap-1 text-xs font-semibold text-nexus-text-muted uppercase tracking-wider hover:text-nexus-indigo transition-colors select-none">
        {label}
        <SortIcon active={active} dir={active ? sort.dir : "asc"} />
      </button>
    </th>
  );
}

// ─── export ──────────────────────────────────────────────────────────────────

function exportEngagements(engs: Engagement[]) {
  const rows = engs.map((e) => {
    const partner = getContact(e.partnerId);
    const mgr = getContact(e.managerId);
    const clients = e.clientContactIds.map((id) => getContact(id)?.name ?? "").filter(Boolean).join("; ");
    const team = [e.partnerId, e.managerId, ...e.teamIds]
      .map((id) => getContact(id)?.name ?? "")
      .filter(Boolean).join("; ");
    return {
      "Engagement ID": e.id,
      Client: e.client,
      Industry: e.industry,
      "Engagement Name": e.engagementName,
      "Business Unit": e.businessUnit,
      "Service Type": e.serviceType,
      Status: e.status,
      Partner: partner?.name ?? "",
      "Engagement Manager": mgr?.name ?? "",
      "Firm Team": team,
      "Client Contacts": clients,
      "Revenue ($K)": e.revenueK,
      "Start Date": e.startDate,
      "End Date": e.endDate,
      "Billing Arrangement": e.billingArrangement,
      "Office / Region": e.office,
      Notes: e.notes,
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Engagements");
  XLSX.writeFile(wb, "Engagements_Demo.xlsx");
}

function exportContacts(contacts: Contact[], allEngs: Engagement[]) {
  const engCountMap = buildEngCountMap(allEngs);
  const rows = contacts.map((c) => ({
    Name: c.name,
    Title: c.title,
    Company: c.company,
    Side: c.side,
    Department: c.department,
    Level: c.level,
    Email: c.email,
    Phone: c.phone,
    Location: c.location,
    "# Engagements": engCountMap.get(c.id) ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(wb, "Contacts_Demo.xlsx");
}

function buildEngCountMap(engs: Engagement[]) {
  const m = new Map<string, number>();
  engs.forEach((e) => {
    [e.partnerId, e.managerId, ...e.teamIds, ...e.clientContactIds].forEach((id) => {
      m.set(id, (m.get(id) ?? 0) + 1);
    });
  });
  return m;
}

// ─── expanded row ─────────────────────────────────────────────────────────────

function PersonCard({ c, role }: { c: Contact; role?: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white border border-nexus-border/50 rounded-lg px-3 py-2 min-w-0">
      <Avatar name={c.name} size="md" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-nexus-indigo truncate">{c.name}</p>
        <p className="text-[11px] text-nexus-text-muted truncate">{role ?? c.title}</p>
      </div>
    </div>
  );
}

function EngagementDetail({ eng }: { eng: Engagement }) {
  const partner = getContact(eng.partnerId);
  const mgr = getContact(eng.managerId);
  const team = eng.teamIds.map(getContact).filter(Boolean) as Contact[];
  const clients = eng.clientContactIds.map(getContact).filter(Boolean) as Contact[];

  return (
    <div className="bg-[#f8f9fb] border-t border-nexus-border/40 px-6 py-5">
      <div className="max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/\* Firm team \*/}
        <div className="lg:col-span-2">
          <p className="text-[10px] font-semibold text-nexus-text-muted uppercase tracking-wider mb-2.5">Firm Team</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {partner && <PersonCard c={partner} role={`Partner — ${partner.department}`} />}
            {mgr && <PersonCard c={mgr} role={`Manager — ${mgr.department}`} />}
            {team.map((c) => <PersonCard key={c.id} c={c} role={`${c.level} — ${c.department}`} />)}
          </div>
        </div>

        {/* Client contacts */}
        <div>
          <p className="text-[10px] font-semibold text-nexus-text-muted uppercase tracking-wider mb-2.5">Client Contacts</p>
          {clients.length === 0
            ? <p className="text-xs text-nexus-text-muted italic">Not yet assigned</p>
            : <div className="flex flex-col gap-2">
                {clients.map((c) => <PersonCard key={c.id} c={c} />)}
              </div>}
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 pt-4 border-t border-nexus-border/30 flex flex-wrap gap-x-8 gap-y-2">
        {[
          ["Market Segment / Role", eng.industry],
          ["Billing", eng.billingArrangement],
          ["Office", eng.office],
          ["Revenue", fmtRevenue(eng.revenueK)],
          ["Period", `${fmtDate(eng.startDate)}${eng.endDate ? ` – ${fmtDate(eng.endDate)}` : " – Present"}`],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="text-[10px] text-nexus-text-muted uppercase tracking-wider">{k}: </span>
            <span className="text-xs font-medium text-nexus-indigo">{v}</span>
          </div>
        ))}
        {eng.notes && (
          <div className="w-full">
            <span className="text-[10px] text-nexus-text-muted uppercase tracking-wider">Summary of DA Activities / Engagements Conducted: </span>
            <span className="text-xs text-nexus-text-mid italic">{eng.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const [tab, setTab] = useState<"engagements" | "contacts">("engagements");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── engagement filters
  const [engSearch, setEngSearch] = useState("");
  const [engBU, setEngBU] = useState("");
  const [engStatus, setEngStatus] = useState("");
  const [engType, setEngType] = useState("");
  const [engYear, setEngYear] = useState("");
  const [engSort, setEngSort] = useState<{ col: string; dir: SortDir }>({ col: "startDate", dir: "desc" });

  // ── contact filters
  const [ctSearch, setCtSearch] = useState("");
  const [ctSide, setCtSide] = useState("");
  const [ctLevel, setCtLevel] = useState("");
  const [ctDept, setCtDept] = useState("");
  const [ctSort, setCtSort] = useState<{ col: string; dir: SortDir }>({ col: "name", dir: "asc" });

  // ── api contacts (merged from /contacts page)
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);

  useEffect(() => {
    api.contacts.list().then((list) => {
      setApiContacts(list.map((c): Contact => ({
        id: `api-${c.id}`,
        name: c.name,
        title: "",
        company: c.company ?? "",
        side: "Client",
        email: c.email ?? "",
        phone: "",
        location: c.connection_location ?? "",
        department: "",
        level: "",
      })));
    }).catch(() => {});
  }, []);

  const allContacts = useMemo(() => [...CONTACTS, ...apiContacts], [apiContacts]);

  // ── derived options
  const serviceTypes = useMemo(() => [...new Set(ENGAGEMENTS.map((e) => e.serviceType))].sort(), []);
  const years = useMemo(() => [...new Set(ENGAGEMENTS.map((e) => e.startDate.slice(0, 4)))].sort().reverse(), []);
  const levels = useMemo(() => [...new Set(allContacts.map((c) => c.level))].filter(Boolean).sort(), [allContacts]);
  const departments = useMemo(() => [...new Set(allContacts.map((c) => c.department))].filter(Boolean).sort(), [allContacts]);
  const engCountMap = useMemo(() => buildEngCountMap(ENGAGEMENTS), []);

  // ── stats
  const totalRevenue = useMemo(() => ENGAGEMENTS.reduce((s, e) => s + e.revenueK, 0), []);
  const activeCount = useMemo(() => ENGAGEMENTS.filter((e) => e.status === "Active").length, []);
  const croweCount = useMemo(() => allContacts.filter((c) => c.side === "Firm").length, [allContacts]);
  const clientCount = useMemo(() => allContacts.filter((c) => c.side === "Client").length, [allContacts]);

  // ── sort toggle
  const toggleEngSort = useCallback((col: string) => {
    setEngSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
  }, []);
  const toggleCtSort = useCallback((col: string) => {
    setCtSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
  }, []);

  // ── filtered + sorted engagements
  const filteredEngagements = useMemo(() => {
    const q = engSearch.toLowerCase();
    let list = ENGAGEMENTS.filter((e) => {
      if (q && !e.client.toLowerCase().includes(q) && !e.engagementName.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
      if (engBU && e.businessUnit !== engBU) return false;
      if (engStatus && e.status !== engStatus) return false;
      if (engType && e.serviceType !== engType) return false;
      if (engYear && !e.startDate.startsWith(engYear)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = engSort.dir === "asc" ? 1 : -1;
      switch (engSort.col) {
        case "id": return dir * a.id.localeCompare(b.id);
        case "client": return dir * a.client.localeCompare(b.client);
        case "bu": return dir * a.businessUnit.localeCompare(b.businessUnit);
        case "status": return dir * a.status.localeCompare(b.status);
        case "revenue": return dir * (a.revenueK - b.revenueK);
        case "startDate": return dir * a.startDate.localeCompare(b.startDate);
        default: return 0;
      }
    });
    return list;
  }, [engSearch, engBU, engStatus, engType, engYear, engSort]);

  // ── filtered + sorted contacts
  const filteredContacts = useMemo(() => {
    const q = ctSearch.toLowerCase();
    let list = allContacts.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (ctSide && c.side !== ctSide) return false;
      if (ctLevel && c.level !== ctLevel) return false;
      if (ctDept && c.department !== ctDept) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = ctSort.dir === "asc" ? 1 : -1;
      switch (ctSort.col) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "company": return dir * a.company.localeCompare(b.company);
        case "level": return dir * a.level.localeCompare(b.level);
        case "department": return dir * a.department.localeCompare(b.department);
        case "engagements": return dir * ((engCountMap.get(a.id) ?? 0) - (engCountMap.get(b.id) ?? 0));
        default: return 0;
      }
    });
    return list;
  }, [ctSearch, ctSide, ctLevel, ctDept, ctSort, engCountMap, allContacts]);

  function clearEngFilters() { setEngSearch(""); setEngBU(""); setEngStatus(""); setEngType(""); setEngYear(""); }
  function clearCtFilters() { setCtSearch(""); setCtSide(""); setCtLevel(""); setCtDept(""); }

  const engFiltersActive = engSearch || engBU || engStatus || engType || engYear;
  const ctFiltersActive = ctSearch || ctSide || ctLevel || ctDept;

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nexus-indigo">Reporting</h1>
          <p className="text-sm text-nexus-text-muted mt-0.5">D365 Engagement & Contact Intelligence — Digital Assets Practice</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            className="flex items-center gap-2 bg-nexus-amber text-nexus-indigo font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-nexus-amber/90 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-nexus-border rounded-lg shadow-lg z-20 min-w-[200px] py-1">
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-nexus-surface/60 text-nexus-indigo"
                onClick={() => { exportEngagements(filteredEngagements); setShowExportMenu(false); }}>
                Export Engagements ({filteredEngagements.length})
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-nexus-surface/60 text-nexus-indigo"
                onClick={() => { exportContacts(filteredContacts, ENGAGEMENTS); setShowExportMenu(false); }}>
                Export Contacts ({filteredContacts.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Engagements", value: ENGAGEMENTS.length, sub: `${activeCount} active` },
          { label: "Pipeline Revenue", value: fmtRevenue(totalRevenue), sub: "across 30 engagements" },
          { label: "Firm Personnel", value: croweCount, sub: "partners · managers · staff" },
          { label: "Client Contacts", value: clientCount, sub: "across 18 organizations" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-nexus-border/60 p-5">
            <p className="text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-nexus-indigo mt-1">{s.value}</p>
            <p className="text-xs text-nexus-text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 bg-nexus-surface/40 border border-nexus-border/60 rounded-lg p-1 w-fit">
        {(["engagements", "contacts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-nexus-indigo shadow-sm border border-nexus-border/60" : "text-nexus-text-muted hover:text-nexus-indigo"}`}
          >
            {t === "engagements" ? `Engagements (${filteredEngagements.length})` : `Contacts (${filteredContacts.length})`}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          ENGAGEMENTS TAB
      ══════════════════════════════════════════════════ */}
      {tab === "engagements" && (
        <>
          {/* Filters */}
          <div className="bg-white border border-nexus-border/60 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={engSearch} onChange={(e) => setEngSearch(e.target.value)} placeholder="Search client or engagement…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-nexus-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-amber/40 focus:border-nexus-amber" />
              </div>
              <Select value={engBU} onChange={setEngBU} placeholder="Business Unit" options={["Audit", "Tax", "Consulting"]} />
              <Select value={engStatus} onChange={setEngStatus} placeholder="Status" options={["Active", "Completed", "Proposed", "On Hold"]} />
              <Select value={engType} onChange={setEngType} placeholder="Service Type" options={serviceTypes} />
              <Select value={engYear} onChange={setEngYear} placeholder="Year" options={years} />
              {engFiltersActive && (
                <button onClick={clearEngFilters} className="text-xs text-nexus-coral hover:underline font-medium ml-1">
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-nexus-border/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-nexus-border/60 bg-[#f8f9fb]">
                  <tr>
                    <SortTh label="Firm Name" col="client" sort={engSort} onSort={toggleEngSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Market Segment / Role</th>
                    <SortTh label="Client Status" col="status" sort={engSort} onSort={toggleEngSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Lead Partner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Engagements Conducted</th>
                    <SortTh label="BU" col="bu" sort={engSort} onSort={toggleEngSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Client Contact</th>
                    <SortTh label="Revenue" col="revenue" sort={engSort} onSort={toggleEngSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/30">
                  {filteredEngagements.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-sm text-nexus-text-muted">No engagements match the current filters.</td></tr>
                  )}
                  {filteredEngagements.map((eng) => {
                    const isExpanded = expandedId === eng.id;
                    const partner = getContact(eng.partnerId);
                    const crewTotal = 2 + eng.teamIds.length;
                    return (
                      <>
                        <tr
                          key={eng.id}
                          onClick={() => setExpandedId(isExpanded ? null : eng.id)}
                          className={`cursor-pointer transition-colors ${isExpanded ? "bg-[#f0f4ff]" : "hover:bg-[#f8f9fb]"}`}
                        >
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-nexus-indigo whitespace-nowrap">{eng.client}</p>
                            <p className="text-[11px] text-nexus-text-muted font-mono">{eng.id}</p>
                          </td>
                          <td className="px-4 py-3.5 max-w-[160px]">
                            <span className="text-xs text-nexus-text-mid">{eng.industry}</span>
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status={eng.status} /></td>
                          <td className="px-4 py-3.5">
                            {partner && (
                              <div className="flex items-center gap-2">
                                <Avatar name={partner.name} />
                                <div>
                                  <p className="text-xs font-medium text-nexus-indigo whitespace-nowrap">{partner.name}</p>
                                  <p className="text-[11px] text-nexus-text-muted">{partner.level}</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 max-w-[240px]">
                            <p className="text-xs text-nexus-text line-clamp-2">{eng.engagementName}</p>
                            <p className="text-[11px] text-nexus-text-muted mt-0.5">{eng.serviceType}</p>
                          </td>
                          <td className="px-4 py-3.5"><BUBadge bu={eng.businessUnit} /></td>
                          <td className="px-4 py-3.5 max-w-[160px]">
                            {(() => {
                              const first = eng.clientContactIds[0] ? getContact(eng.clientContactIds[0]) : null;
                              return first
                                ? <div>
                                    <p className="text-xs font-medium text-nexus-indigo whitespace-nowrap">{first.name}</p>
                                    <p className="text-[11px] text-nexus-text-muted">{first.title}</p>
                                    {eng.clientContactIds.length > 1 && (
                                      <p className="text-[11px] text-nexus-text-muted">+{eng.clientContactIds.length - 1} more</p>
                                    )}
                                  </div>
                                : <span className="text-xs text-nexus-text-muted">—</span>;
                            })()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold text-nexus-indigo">{fmtRevenue(eng.revenueK)}</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${eng.id}-detail`}>
                            <td colSpan={8} className="p-0">
                              <EngagementDetail eng={eng} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-nexus-border/40 bg-[#f8f9fb] flex items-center justify-between">
              <p className="text-xs text-nexus-text-muted">
                Showing <span className="font-semibold text-nexus-indigo">{filteredEngagements.length}</span> of {ENGAGEMENTS.length} engagements
              </p>
              <p className="text-xs text-nexus-text-muted">Click any row to expand team details</p>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          CONTACTS TAB
      ══════════════════════════════════════════════════ */}
      {tab === "contacts" && (
        <>
          {/* Filters */}
          <div className="bg-white border border-nexus-border/60 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={ctSearch} onChange={(e) => setCtSearch(e.target.value)} placeholder="Search name, company, title…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-nexus-border rounded-lg focus:outline-none focus:ring-2 focus:ring-nexus-amber/40 focus:border-nexus-amber" />
              </div>
              <Select value={ctSide} onChange={setCtSide} placeholder="Side" options={["Firm", "Client"]} />
              <Select value={ctLevel} onChange={setCtLevel} placeholder="Level" options={levels} />
              <Select value={ctDept} onChange={setCtDept} placeholder="Department" options={departments} />
              {ctFiltersActive && (
                <button onClick={clearCtFilters} className="text-xs text-nexus-coral hover:underline font-medium ml-1">
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-nexus-border/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-nexus-border/60 bg-[#f8f9fb]">
                  <tr>
                    <SortTh label="Name" col="name" sort={ctSort} onSort={toggleCtSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Role</th>
                    <SortTh label="Company" col="company" sort={ctSort} onSort={toggleCtSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Side</th>
                    <SortTh label="Department" col="department" sort={ctSort} onSort={toggleCtSort} />
                    <SortTh label="Level" col="level" sort={ctSort} onSort={toggleCtSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">Location</th>
                    <SortTh label="Engagements" col="engagements" sort={ctSort} onSort={toggleCtSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/30">
                  {filteredContacts.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-12 text-sm text-nexus-text-muted">No contacts match the current filters.</td></tr>
                  )}
                  {filteredContacts.map((c) => {
                    const engCount = engCountMap.get(c.id) ?? 0;
                    const isApiContact = c.id.startsWith("api-");
                    return (
                      <tr key={c.id} className="hover:bg-[#f8f9fb] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.name} />
                            <div>
                              <span className="text-sm font-semibold text-nexus-indigo whitespace-nowrap">{c.name}</span>
                              {isApiContact && (
                                <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-nexus-amber/20 text-nexus-indigo border border-nexus-amber/30 align-middle">Added</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-nexus-text-mid">{c.title}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-nexus-text whitespace-nowrap">{c.company}</span>
                        </td>
                        <td className="px-4 py-3.5"><SideBadge side={c.side} /></td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-nexus-text-mid">{c.department}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-nexus-text-muted">{c.level}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <a href={`mailto:${c.email}`} className="text-xs text-nexus-blue hover:underline">{c.email}</a>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-nexus-text-muted whitespace-nowrap">{c.location}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {engCount > 0
                            ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-nexus-indigo/10 text-nexus-indigo text-xs font-bold">{engCount}</span>
                            : <span className="text-xs text-nexus-text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-nexus-border/40 bg-[#f8f9fb]">
              <p className="text-xs text-nexus-text-muted">
                Showing <span className="font-semibold text-nexus-indigo">{filteredContacts.length}</span> of {allContacts.length} contacts
                &nbsp;·&nbsp; {croweCount} Firm · {clientCount} Client
                {apiContacts.length > 0 && <>&nbsp;·&nbsp; <span className="text-nexus-amber-dark font-medium">{apiContacts.length} manually added</span></>}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── reusable select ─────────────────────────────────────────────────────────

function Select({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-nexus-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-nexus-amber/40 focus:border-nexus-amber text-nexus-text appearance-none pr-8"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23828282' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
