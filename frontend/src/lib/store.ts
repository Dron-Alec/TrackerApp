import fs from 'fs';
import path from 'path';
import type { Event } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAll(): Event[] {
  ensureDir();
  if (!fs.existsSync(EVENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAll(events: Event[]) {
  ensureDir();
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

interface Meta {
  lastIngested?: string;
}

function readMeta(): Meta {
  ensureDir();
  if (!fs.existsSync(META_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeMeta(meta: Meta) {
  ensureDir();
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

export const store = {
  count: () => readAll().length,
  getAll: () => readAll(),
  getById: (id: string) => readAll().find(e => e.id === id),
  getMeta: () => readMeta(),

  upsert(event: Event) {
    const events = readAll();
    const idx = events.findIndex(e => e.id === event.id);
    if (idx >= 0) events[idx] = event;
    else events.push(event);
    writeAll(events);
  },

  upsertMany(incoming: Event[]) {
    const events = readAll();
    for (const event of incoming) {
      const idx = events.findIndex(e => e.id === event.id);
      if (idx >= 0) {
        // Preserve AI-generated fields from existing record
        events[idx] = {
          ...event,
          aiSummary: events[idx].aiSummary,
          serviceLineInsights: events[idx].serviceLineInsights,
          personas: events[idx].personas,
          conversationStarters: events[idx].conversationStarters,
          keyTakeaway: events[idx].keyTakeaway,
          lastAnalyzedAt: events[idx].lastAnalyzedAt,
        };
      } else {
        events.push(event);
      }
    }
    writeAll(events);
    writeMeta({ lastIngested: new Date().toISOString() });
  },
};
