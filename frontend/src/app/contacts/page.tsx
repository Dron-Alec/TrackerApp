"use client";

import { useState, useEffect, FormEvent } from "react";
import { api, APIContact, APIEvent, ContactPayload } from "@/lib/api";
import { ENGAGEMENTS, CONTACTS } from "../reporting/mockData";

// ── company options derived from reporting data ──────────────────────────────
const COMPANY_OPTIONS = [
  ...new Set([
    ...ENGAGEMENTS.map((e) => e.client),
    ...CONTACTS.filter((c) => c.side === "Client").map((c) => c.company),
  ]),
]
  .filter(Boolean)
  .sort() as string[];

// ── types ────────────────────────────────────────────────────────────────────

interface EventOption {
  value: string;
  label: string;
}

interface ContactForm {
  name: string;
  company: string;
  email: string;
  connection_location: string;
  notes: string;
}

const EMPTY_FORM: ContactForm = {
  name: "",
  company: "",
  email: "",
  connection_location: "",
  notes: "",
};

// ── shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-indigo placeholder:text-nexus-text-muted/60 focus:outline-none focus:ring-2 focus:ring-nexus-amber/40 focus:border-nexus-amber";

// ── field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-nexus-text-muted mb-1">
        {label}
        {required && <span className="text-nexus-coral ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── dropdown + other pattern ──────────────────────────────────────────────────

function SelectOrOther({
  value,
  onChange,
  options,
  placeholder,
  otherPlaceholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: EventOption[];
  placeholder: string;
  otherPlaceholder: string;
}) {
  const isKnown = value === "" || options.some((o) => o.value === value);
  const [mode, setMode] = useState<"select" | "other">(isKnown ? "select" : "other");

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "__other__") {
      setMode("other");
      onChange("");
    } else {
      setMode("select");
      onChange(e.target.value);
    }
  }

  return (
    <div>
      <select
        className={`${inputCls} appearance-none`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23828282' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: "2rem",
        }}
        value={mode === "other" ? "__other__" : value}
        onChange={handleSelect}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="__other__">Other…</option>
      </select>
      {mode === "other" && (
        <input
          required
          className={`${inputCls} mt-2`}
          placeholder={otherPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ── modal ─────────────────────────────────────────────────────────────────────

function ContactModal({
  title,
  form,
  onChange,
  onSubmit,
  onClose,
  saving,
  eventOptions,
}: {
  title: string;
  form: ContactForm;
  onChange: (f: ContactForm) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  eventOptions: EventOption[];
}) {
  const companyOptions: EventOption[] = COMPANY_OPTIONS.map((c) => ({ value: c, label: c }));

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-nexus-border/60 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-nexus-border/60">
          <h2 className="text-lg font-bold text-nexus-indigo">{title}</h2>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <Field label="Name" required>
            <input
              className={inputCls}
              required
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Company">
              <SelectOrOther
                value={form.company}
                onChange={(v) => onChange({ ...form, company: v })}
                options={companyOptions}
                placeholder="Select a company…"
                otherPlaceholder="Enter company name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Where Connected">
            <SelectOrOther
              value={form.connection_location}
              onChange={(v) => onChange({ ...form, connection_location: v })}
              options={eventOptions}
              placeholder={eventOptions.length === 0 ? "Loading events…" : "Select an event…"}
              otherPlaceholder="e.g. Consensus 2025, Austin TX"
            />
          </Field>

          <Field label="Notes & Discussion">
            <textarea
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Key discussion points, follow-up actions, service line interest…"
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-nexus-text-muted hover:text-nexus-indigo transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold bg-nexus-amber text-nexus-indigo rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : "Save Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── notes expander ────────────────────────────────────────────────────────────

function NotesExpander({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);
  const short = notes.length > 60;
  return (
    <span>
      {expanded || !short ? notes : notes.slice(0, 60) + "…"}
      {short && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 text-nexus-blue hover:underline text-xs"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </span>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<APIContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing?: APIContact }>({ open: false });
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);

  async function load() {
    try {
      const data = await api.contacts.list();
      setContacts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.events
      .list()
      .then((events: APIEvent[]) => {
        const opts = events
          .filter((e) => e.name)
          .sort((a, b) => {
            // upcoming first, then by name
            const aDate = a.date_start ?? "";
            const bDate = b.date_start ?? "";
            return aDate.localeCompare(bDate) || a.name.localeCompare(b.name);
          })
          .map((e) => {
            const parts = [
              e.city,
              e.date_start ? e.date_start.slice(0, 4) : null,
            ].filter(Boolean);
            const label = parts.length > 0 ? `${e.name} — ${parts.join(", ")}` : e.name;
            return { value: e.name, label };
          });
        // deduplicate by value
        const seen = new Set<string>();
        setEventOptions(
          opts.filter((o) => {
            if (seen.has(o.value)) return false;
            seen.add(o.value);
            return true;
          })
        );
      })
      .catch(() => {});
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.connection_location ?? "").toLowerCase().includes(q)
    );
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ open: true });
  }

  function openEdit(c: APIContact) {
    setForm({
      name: c.name,
      company: c.company ?? "",
      email: c.email ?? "",
      connection_location: c.connection_location ?? "",
      notes: c.notes ?? "",
    });
    setModal({ open: true, editing: c });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ContactPayload = {
        name: form.name,
        company: form.company || null,
        email: form.email || null,
        connection_location: form.connection_location || null,
        notes: form.notes || null,
      };
      if (modal.editing) {
        const updated = await api.contacts.update(modal.editing.id, payload);
        setContacts((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await api.contacts.create(payload);
        setContacts((cs) => [created, ...cs]);
      }
      setModal({ open: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await api.contacts.delete(id);
      setContacts((cs) => cs.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-nexus-indigo">Contacts</h1>
          <p className="text-nexus-text-muted text-sm mt-1">
            Decision-makers and BD contacts from tracked events
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-nexus-amber text-nexus-indigo font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm shrink-0"
        >
          + Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          placeholder="Search by name, company, email, or event…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* States */}
      {loading ? (
        <div className="bg-white rounded-xl border border-nexus-border/60 p-12 text-center text-nexus-text-muted text-sm">
          Loading…
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-nexus-border/60 p-12 text-center text-nexus-coral text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-nexus-border/60 p-12 text-center">
          <p className="text-nexus-text-muted text-sm">
            {search ? "No contacts match your search." : "No contacts yet."}
          </p>
          {!search && (
            <p className="text-nexus-text-muted text-xs mt-1">
              Add your first contact using the button above.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-nexus-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nexus-border/60 bg-nexus-surface/40">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                  Company
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                  Connected At
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                  Notes
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/40">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-nexus-surface/30 transition-colors align-top"
                >
                  <td className="px-5 py-3.5 font-semibold text-nexus-indigo whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="px-5 py-3.5 text-nexus-text-muted whitespace-nowrap">
                    {c.company ?? <span className="text-nexus-border/60">—</span>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-nexus-blue hover:underline">
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-nexus-border/60">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {c.connection_location ? (
                      <span className="inline-block bg-nexus-amber/10 text-nexus-indigo text-xs font-medium px-2 py-0.5 rounded-full">
                        {c.connection_location}
                      </span>
                    ) : (
                      <span className="text-nexus-border/60">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-nexus-text-muted max-w-xs">
                    {c.notes ? (
                      <NotesExpander notes={c.notes} />
                    ) : (
                      <span className="text-nexus-border/60">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-nexus-blue hover:text-nexus-indigo text-xs font-medium mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    {confirmDelete === c.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="text-nexus-coral text-xs font-semibold hover:text-red-700 transition-colors disabled:opacity-40"
                        >
                          {deletingId === c.id ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-nexus-text-muted text-xs hover:text-nexus-indigo transition-colors"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="text-nexus-text-muted hover:text-nexus-coral text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      {!loading && contacts.length > 0 && (
        <p className="text-xs text-nexus-text-muted mt-3">
          {filtered.length} of {contacts.length} contact
          {contacts.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modal */}
      {modal.open && (
        <ContactModal
          title={modal.editing ? "Edit Contact" : "Add Contact"}
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onClose={() => setModal({ open: false })}
          saving={saving}
          eventOptions={eventOptions}
        />
      )}
    </div>
  );
}
