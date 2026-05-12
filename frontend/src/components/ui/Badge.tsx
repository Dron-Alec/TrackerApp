import type { EventType } from '@/lib/types';

const TYPE_STYLES: Record<EventType, string> = {
  conference: 'bg-blue-50 text-blue-700 border border-blue-200',
  summit: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  institutional: 'bg-purple-50 text-purple-700 border border-purple-200',
  regulatory: 'bg-orange-50 text-orange-700 border border-orange-200',
  meetup: 'bg-green-50 text-green-700 border border-green-200',
  hackathon: 'bg-gray-100 text-gray-600 border border-gray-200',
  webinar: 'bg-sky-50 text-sky-700 border border-sky-200',
  other: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const TYPE_LABELS: Record<EventType, string> = {
  conference: 'Conference',
  summit: 'Summit',
  institutional: 'Institutional',
  regulatory: 'Regulatory',
  meetup: 'Meetup',
  hackathon: 'Hackathon',
  webinar: 'Webinar',
  other: 'Other',
};

export function TypeBadge({ type }: { type: EventType }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      {label}
    </span>
  );
}
