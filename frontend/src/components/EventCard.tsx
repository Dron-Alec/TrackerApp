import Link from 'next/link';
import type { Event } from '@/lib/types';
import { ScoreBadge } from './ui/ScoreBadge';
import { TypeBadge } from './ui/Badge';
import { formatDate } from '@/lib/utils';

export function EventCard({ event }: { event: Event }) {
  const excerpt = event.description.slice(0, 160).trim() + '…';

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <article className="h-full bg-white rounded-lg border border-gray-200 p-5 hover:border-nexus-amber hover:shadow-md transition-all duration-150 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <TypeBadge type={event.type} />
          <ScoreBadge score={event.relevanceScore} size="sm" />
        </div>

        {/* Event name */}
        <h3 className="text-base font-semibold text-nexus-navy leading-snug group-hover:text-nexus-amber transition-colors line-clamp-2">
          {event.name}
        </h3>

        {/* Date and location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDate(event.date, event.endDate)}</span>
          <span className="text-gray-300">·</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        {/* Why it matters */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{excerpt}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {event.categories.slice(0, 3).map(cat => (
              <span key={cat} className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded">{cat}</span>
            ))}
          </div>
          <span className="text-xs font-semibold text-nexus-amber group-hover:underline flex items-center gap-1">
            View Intel
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}
