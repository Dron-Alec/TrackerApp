import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { analyzeEvent } from '@/lib/ai/analyzer';
import { apiEventToEvent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // Try local store first (may already have AI insights cached)
  let event = store.getById(id);

  if (!event) {
    // Not cached — fetch base data from backend
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/events/${id}`);
      if (!res.ok) return Response.json({ error: 'Event not found' }, { status: 404 });
      const apiEvent = await res.json();
      event = apiEventToEvent(apiEvent);
    } catch {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }
  }

  const analysis = await analyzeEvent(event);

  const updated = {
    ...event,
    aiSummary: analysis.summary,
    serviceLineInsights: analysis.serviceLineInsights,
    personas: analysis.personas,
    conversationStarters: analysis.conversationStarters,
    keyTakeaway: analysis.keyTakeaway,
    lastAnalyzedAt: new Date().toISOString(),
  };

  store.upsert(updated);

  return Response.json(updated);
}
