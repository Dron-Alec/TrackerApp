import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { ingest } from '@/lib/ingestion';
import type { Event, EventFilters, SortOrder } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Auto-seed on first run
  if (store.count() === 0) {
    await ingest();
  }

  const { searchParams } = req.nextUrl;
  const dateRange = (searchParams.get('dateRange') ?? 'all') as EventFilters['dateRange'];
  const location = (searchParams.get('location') ?? 'all') as EventFilters['location'];
  const relevance = (searchParams.get('relevance') ?? 'all') as EventFilters['relevance'];
  const type = (searchParams.get('type') ?? 'all') as EventFilters['type'];
  const sort = (searchParams.get('sort') ?? 'score') as SortOrder;

  let events = store.getAll();

  // Filter: date range
  if (dateRange !== 'all') {
    const days = parseInt(dateRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    events = events.filter(e => {
      const d = new Date(e.date);
      return d >= new Date() && d <= cutoff;
    });
  }

  // Filter: location
  if (location === 'us') {
    events = events.filter(e => e.country === 'US');
  } else if (location === 'global') {
    events = events.filter(e => e.country === 'Global');
  }

  // Filter: relevance
  if (relevance === 'high') {
    events = events.filter(e => e.relevanceScore >= 75);
  }

  // Filter: event type
  if (type !== 'all') {
    events = events.filter(e => e.type === type);
  }

  // Sort
  if (sort === 'date') {
    events = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    events = events.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  const meta = store.getMeta();

  return Response.json({
    events,
    total: events.length,
    lastIngested: meta.lastIngested,
  });
}
