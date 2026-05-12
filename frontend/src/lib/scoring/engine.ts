import type { ScoreBreakdown, Speaker } from '../types';
import { POSITIVE_SIGNALS, NEGATIVE_SIGNALS } from './keywords';

export function scoreEvent(
  name: string,
  description: string,
  speakers: Speaker[],
  categories: string[],
): ScoreBreakdown {
  const speakerText = speakers.map(s => [s.name, s.title, s.company].filter(Boolean).join(' ')).join(' ');
  const corpus = [name, description, speakerText, categories.join(' ')].join(' ');

  const signals = [];
  let raw = 0;

  for (const rule of POSITIVE_SIGNALS) {
    if (rule.pattern.test(corpus)) {
      signals.push({ keyword: rule.label, points: rule.points });
      raw += rule.points;
    }
  }

  for (const rule of NEGATIVE_SIGNALS) {
    if (rule.pattern.test(corpus)) {
      signals.push({ keyword: rule.label, points: rule.points });
      raw += rule.points;
    }
  }

  const total = Math.max(0, Math.min(100, raw));
  return { total, signals };
}

export function scoreTier(score: number): 'high' | 'medium' | 'low' | 'minimal' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'minimal';
}
