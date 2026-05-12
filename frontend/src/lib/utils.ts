const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(startIso: string, endIso?: string): string {
  const s = parseLocalDate(startIso);

  if (!endIso) {
    return `${MONTH_SHORT[s.month]} ${s.day}, ${s.year}`;
  }

  const e = parseLocalDate(endIso);

  if (s.year === e.year && s.month === e.month) {
    return `${MONTH_SHORT[s.month]} ${s.day}–${e.day}, ${s.year}`;
  }

  return `${MONTH_SHORT[s.month]} ${s.day} – ${MONTH_SHORT[e.month]} ${e.day}, ${e.year}`;
}

function parseLocalDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
}

export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function linkedInSearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
}
