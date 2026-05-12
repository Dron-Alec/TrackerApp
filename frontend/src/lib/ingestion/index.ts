import { store } from '../store';
import { getMockEvents } from './sources/mock';
import { fetchCoinDeskEvents } from './sources/coindesk';
import { fetchTheBlockEvents } from './sources/theblock';
import type { Event } from '../types';

export interface IngestResult {
  total: number;
  sources: Record<string, number>;
  errors: string[];
}

export async function ingest(): Promise<IngestResult> {
  const sources: Record<string, number> = {};
  const errors: string[] = [];
  const collected: Event[] = [];

  // Always load mock data as the baseline
  const mockEvents = getMockEvents();
  collected.push(...mockEvents);
  sources['mock'] = mockEvents.length;

  // Attempt live RSS sources — fail gracefully
  const liveSources = [
    { name: 'coindesk', fn: fetchCoinDeskEvents },
    { name: 'theblock', fn: fetchTheBlockEvents },
  ];

  for (const { name, fn } of liveSources) {
    try {
      const events = await fn();
      collected.push(...events);
      sources[name] = events.length;
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      sources[name] = 0;
    }
  }

  // Deduplicate by URL similarity — keep first occurrence
  const seen = new Set<string>();
  const deduped = collected.filter(e => {
    const key = normalizeKey(e.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  store.upsertMany(deduped);

  return { total: deduped.length, sources, errors };
}

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
}
