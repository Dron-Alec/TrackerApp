import { cache } from 'react';
import { notFound } from 'next/navigation';
import { store } from '@/lib/store';
import { api, apiEventToEvent } from '@/lib/api';
import { EventDetail } from '@/components/EventDetail';
import { NavBar } from '@/components/NavBar';
import type { Event } from '@/lib/types';
import type { Metadata } from 'next';

// Deduplicate across generateMetadata + page render within a single request
const fetchEvent = cache(async (id: string): Promise<Event | null> => {
  try {
    const apiEvent = await api.events.get(id);
    const event = apiEventToEvent(apiEvent);

    // Merge AI insights from local store cache if present
    const cached = store.getById(id);
    if (cached?.aiSummary) {
      return {
        ...event,
        aiSummary: cached.aiSummary,
        serviceLineInsights: cached.serviceLineInsights,
        personas: cached.personas,
        conversationStarters: cached.conversationStarters,
        keyTakeaway: cached.keyTakeaway,
        lastAnalyzedAt: cached.lastAnalyzedAt,
      };
    }
    return event;
  } catch {
    // Backend unavailable — fall back to local store
    return store.getById(id) ?? null;
  }
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);
  if (!event) return { title: 'Event Not Found' };
  return {
    title: `${event.name} · Crowe Conference Radar`,
    description: event.description.slice(0, 160),
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await fetchEvent(id);

  if (!event) notFound();

  const meta = store.getMeta();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar lastIngested={meta.lastIngested} />
      <EventDetail initialEvent={event} />
    </div>
  );
}
