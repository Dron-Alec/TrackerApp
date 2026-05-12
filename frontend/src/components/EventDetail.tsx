'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Event } from '@/lib/types';
import { ScoreBadge, ScoreBar } from './ui/ScoreBadge';
import { TypeBadge } from './ui/Badge';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { formatDate, linkedInSearchUrl } from '@/lib/utils';
import { api, APIContact, ContactPayload } from '@/lib/api';

export function EventDetail({ initialEvent }: { initialEvent: Event }) {
  const [event, setEvent] = useState<Event>(initialEvent);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'bsaAml' | 'riskConsulting' | 'advisory'>('audit');

  const hasInsights = !!event.aiSummary;

  async function generateInsights() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/events/${event.id}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error('Analysis failed');
      const updated = await res.json() as Event;
      setEvent(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-crowe-amber transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Event header card */}
      <div className="bg-crowe-navy text-white rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <TypeBadge type={event.type} />
          <ScoreBadge score={event.relevanceScore} size="lg" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{event.name}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-1.5">
            <CalendarIcon />
            {formatDate(event.date, event.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <LocationIcon />
            {event.location}
          </span>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-crowe-amber hover:underline"
            >
              <LinkIcon />
              Event Website
            </a>
          )}
          {event.attendanceCost && (
            <span className="flex items-center gap-1.5">
              <TicketIcon />
              {event.attendanceCost.tiers[0]?.price === 'Free'
                ? 'Free'
                : event.attendanceCost.tiers[0]?.price === 'TBD' || event.attendanceCost.tiers[0]?.price === 'See website'
                  ? 'Pricing TBD'
                  : `From ${event.attendanceCost.tiers.find(t => t.price !== 'Free')?.price ?? event.attendanceCost.tiers[0]?.price}`}
            </span>
          )}
        </div>

        {event.keyTakeaway && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-sm text-white/80 italic">"{event.keyTakeaway}"</p>
          </div>
        )}
      </div>

      {/* Cost of Attendance */}
      {event.attendanceCost && (
        <Section title="Cost of Attendance" icon={<TicketIcon />}>
          <div className="divide-y divide-gray-100">
            {event.attendanceCost.tiers.map((tier, i) => (
              <div key={i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-sm text-gray-600">{tier.label}</span>
                <span className={`text-sm font-semibold ${tier.price === 'Free' ? 'text-crowe-teal' : tier.price === 'TBD' || tier.price === 'See website' ? 'text-gray-400' : 'text-crowe-navy'}`}>
                  {tier.price}
                </span>
              </div>
            ))}
          </div>
          {event.attendanceCost.notes && (
            <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3 mt-1">
              {event.attendanceCost.notes}
            </p>
          )}
          {event.attendanceCost.registrationUrl && (
            <a
              href={event.attendanceCost.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-crowe-blue hover:underline mt-1"
            >
              Register / View Pricing
              <LinkIcon />
            </a>
          )}
        </Section>
      )}

      {/* AI Summary section */}
      <Section title="AI Event Summary" icon={<SparkleIcon />}>
        {hasInsights ? (
          <p className="text-gray-700 leading-relaxed">{event.aiSummary}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-600 leading-relaxed text-sm">{event.description.slice(0, 400)}…</p>
            <button
              onClick={generateInsights}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-crowe-amber text-crowe-navy font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <LoadingSpinner size={16} />
                  Generating intelligence…
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate AI Insights
                </>
              )}
            </button>
            {!process.env.NEXT_PUBLIC_HAS_API_KEY && (
              <p className="text-xs text-gray-400">
                No <code>ANTHROPIC_API_KEY</code> detected — high-quality mock insights will be generated instead.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Why Crowe Should Care */}
      {hasInsights && event.serviceLineInsights && (
        <Section title="Why Crowe Should Care" icon={<BriefcaseIcon />}>
          {/* Tab nav */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            {(
              [
                { key: 'audit', label: 'Audit' },
                { key: 'bsaAml', label: 'BSA/AML' },
                { key: 'riskConsulting', label: 'Risk' },
                { key: 'advisory', label: 'Advisory' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-crowe-navy text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 bg-amber-50 border-l-4 border-crowe-amber rounded-r-lg">
            <p className="text-gray-700 leading-relaxed">
              {event.serviceLineInsights[activeTab]}
            </p>
          </div>

          {/* All four as summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {(
              [
                { key: 'audit', label: 'Audit', color: 'border-t-crowe-teal' },
                { key: 'bsaAml', label: 'BSA/AML', color: 'border-t-crowe-amber' },
                { key: 'riskConsulting', label: 'Risk Consulting', color: 'border-t-crowe-blue' },
                { key: 'advisory', label: 'Advisory', color: 'border-t-crowe-violet' },
              ] as const
            ).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`text-left p-3 rounded-lg border-t-4 border border-gray-200 bg-white hover:shadow-sm transition-shadow ${color}`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{event.serviceLineInsights![key]}</p>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Target Personas */}
      {hasInsights && event.personas && event.personas.length > 0 && (
        <Section title="Target Personas to Meet" icon={<PeopleIcon />}>
          <div className="space-y-3">
            {event.personas.map((persona, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 rounded-full bg-crowe-navy/10 flex items-center justify-center shrink-0 text-crowe-navy font-bold text-sm">
                  {persona.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-crowe-navy text-sm">{persona.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{persona.companyTypes.join(' · ')}</p>
                    </div>
                    {persona.linkedinSearchQuery && (
                      <a
                        href={linkedInSearchUrl(persona.linkedinSearchQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-[#0077B5] text-white hover:bg-[#005e8f] transition-colors shrink-0"
                      >
                        <LinkedInIcon />
                        Search LinkedIn
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{persona.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Conversation Starters */}
      {hasInsights && event.conversationStarters && event.conversationStarters.length > 0 && (
        <Section title="Suggested Conversation Starters" icon={<ChatIcon />}>
          <ol className="space-y-3">
            {event.conversationStarters.map((starter, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-crowe-amber/20 text-crowe-amber font-bold text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed italic">{starter}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Relevance Score Breakdown */}
      <Section title="Relevance Score Breakdown" icon={<ChartIcon />}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Overall Score</p>
            <ScoreBar score={event.relevanceScore} />
          </div>

          {event.scoreBreakdown.signals.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Detected Signals</p>
              <div className="space-y-1.5">
                {event.scoreBreakdown.signals
                  .sort((a, b) => b.points - a.points)
                  .map((signal, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{signal.keyword}</span>
                      <span className={`font-semibold ${signal.points > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                        {signal.points > 0 ? '+' : ''}{signal.points}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
              <span>High priority (75+)</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 ml-2" />
              <span>Medium (50–74)</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 ml-2" />
              <span>Low (25–49)</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Contacts at this event */}
      <EventContactsSection eventId={event.id} eventName={event.name} />

      {/* Raw description */}
      <Section title="Full Event Description" icon={<DocIcon />}>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {event.categories.map(c => (
            <span key={c} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{c}</span>
          ))}
        </div>
      </Section>
    </div>
  );
}

type ContactFormData = {
  name: string; company: string; email: string; connection_location: string; notes: string;
};
const EMPTY_CONTACT_FORM: ContactFormData = { name: '', company: '', email: '', connection_location: '', notes: '' };
const contactInputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-crowe-indigo placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-crowe-amber/40 focus:border-crowe-amber";

function EventContactsSection({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [contacts, setContacts] = useState<APIContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'closed' | 'new' | 'link'>('closed');
  const [allContacts, setAllContacts] = useState<APIContact[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [form, setForm] = useState<ContactFormData>(EMPTY_CONTACT_FORM);
  const [saving, setSaving] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  useEffect(() => {
    api.events.contacts.list(eventId).then(setContacts).finally(() => setLoading(false));
  }, [eventId]);

  function openNew() {
    setForm({ ...EMPTY_CONTACT_FORM, connection_location: eventName });
    setModal('new');
  }

  async function openLink() {
    setModal('link');
    setLinkSearch('');
    setLoadingAll(true);
    try {
      setAllContacts(await api.contacts.list());
    } finally {
      setLoadingAll(false);
    }
  }

  async function handleCreateAndLink(e: React.FormEvent) {
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
      const created = await api.events.contacts.createAndLink(eventId, payload);
      setContacts(cs => [created, ...cs]);
      setModal('closed');
    } finally {
      setSaving(false);
    }
  }

  async function handleLink(contactId: string) {
    const linked = await api.events.contacts.link(eventId, contactId);
    setContacts(cs => [linked, ...cs]);
    setModal('closed');
  }

  async function handleUnlink(contactId: string) {
    setUnlinkingId(contactId);
    try {
      await api.events.contacts.unlink(eventId, contactId);
      setContacts(cs => cs.filter(c => c.id !== contactId));
    } finally {
      setUnlinkingId(null);
    }
  }

  const linkedIds = new Set(contacts.map(c => c.id));
  const filteredLinkable = allContacts
    .filter(c => !linkedIds.has(c.id))
    .filter(c => {
      const q = linkSearch.toLowerCase();
      return !q || c.name.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q);
    });

  return (
    <Section title="Contacts at This Event" icon={<PeopleIcon />}>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-gray-400">No contacts linked yet. Add someone you met at this event.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className="w-8 h-8 rounded-full bg-crowe-navy/10 flex items-center justify-center text-crowe-indigo font-bold text-sm shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-crowe-indigo text-sm">{c.name}</p>
                {c.company && <p className="text-xs text-gray-500">{c.company}</p>}
              </div>
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-crowe-blue hover:underline text-xs hidden sm:block shrink-0">
                  {c.email}
                </a>
              )}
              <button
                onClick={() => handleUnlink(c.id)}
                disabled={unlinkingId === c.id}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1 shrink-0 disabled:opacity-40"
              >
                {unlinkingId === c.id ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={openNew}
          className="text-sm font-semibold px-3 py-1.5 rounded-md bg-crowe-amber text-crowe-indigo hover:opacity-90 transition-opacity"
        >
          + New Contact
        </button>
        <button
          onClick={openLink}
          className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-200 text-crowe-indigo hover:bg-gray-50 transition-colors"
        >
          Link Existing
        </button>
      </div>

      {modal === 'new' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal('closed')}>
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-crowe-indigo">New Contact</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create and link to this event</p>
            </div>
            <form onSubmit={handleCreateAndLink} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input className={contactInputCls} required placeholder="Jane Smith"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Company</label>
                  <input className={contactInputCls} placeholder="Chainalysis"
                    value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                  <input type="email" className={contactInputCls} placeholder="jane@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Where Connected</label>
                <input className={contactInputCls}
                  value={form.connection_location} onChange={e => setForm(f => ({ ...f, connection_location: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Notes</label>
                <textarea rows={3} className={`${contactInputCls} resize-none`}
                  placeholder="Discussion points, follow-up actions…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModal('closed')}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-crowe-indigo transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold bg-crowe-amber text-crowe-indigo rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving ? 'Saving…' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'link' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal('closed')}>
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-crowe-indigo">Link Existing Contact</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <input type="search" placeholder="Search by name or company…" autoFocus
                value={linkSearch} onChange={e => setLinkSearch(e.target.value)} className={contactInputCls} />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {loadingAll ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
                ) : filteredLinkable.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {allContacts.length === 0
                      ? 'No contacts yet — use "New Contact" instead.'
                      : 'All contacts are already linked to this event.'}
                  </p>
                ) : filteredLinkable.map(c => (
                  <button key={c.id} onClick={() => handleLink(c.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-crowe-indigo text-sm">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => setModal('closed')}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-crowe-indigo transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
        <span className="text-crowe-amber">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Icons
function SparkleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
function BriefcaseIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function PeopleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ChatIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function ChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function DocIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function CalendarIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function LocationIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function LinkIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>; }
function TicketIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>; }
function LinkedInIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
