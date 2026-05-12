import Parser from 'rss-parser';
import type { Event } from '../../types';
import { scoreEvent } from '../../scoring/engine';

const RSS_URL = 'https://www.coindesk.com/arc/outboundfeeds/rss/';

const EVENT_KEYWORDS = /\b(conference|summit|forum|symposium|expo|congress|convention|meetup|event)\b/i;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export async function fetchCoinDeskEvents(): Promise<Event[]> {
  const parser = new Parser({ timeout: 8000 });
  const feed = await parser.parseURL(RSS_URL);
  const now = new Date().toISOString();
  const events: Event[] = [];

  for (const item of feed.items || []) {
    const title = item.title ?? '';
    const content = item.contentSnippet ?? item.content ?? '';
    const combined = `${title} ${content}`;

    if (!EVENT_KEYWORDS.test(combined)) continue;

    const breakdown = scoreEvent(title, content, [], []);
    if (breakdown.total < 20) continue; // skip low-relevance RSS items

    events.push({
      id: `coindesk-${slugify(title)}`,
      name: title,
      date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : now.split('T')[0],
      location: 'TBD',
      country: 'Global',
      description: content.slice(0, 1000),
      url: item.link ?? RSS_URL,
      source: 'coindesk',
      type: 'conference',
      categories: [],
      relevanceScore: breakdown.total,
      scoreBreakdown: breakdown,
      speakers: [],
      ingestedAt: now,
    });
  }

  return events;
}
