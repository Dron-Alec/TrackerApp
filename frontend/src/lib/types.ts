export type EventType =
  | 'conference'
  | 'summit'
  | 'meetup'
  | 'hackathon'
  | 'institutional'
  | 'regulatory'
  | 'webinar'
  | 'other';

export interface Speaker {
  name: string;
  title?: string;
  company?: string;
}

export interface ScoringSignal {
  keyword: string;
  points: number;
}

export interface ScoreBreakdown {
  total: number;
  signals: ScoringSignal[];
}

export interface CostTier {
  label: string;
  price: string;
}

export interface AttendanceCost {
  tiers: CostTier[];
  registrationUrl?: string;
  notes?: string;
}

export interface Persona {
  title: string;
  description: string;
  companyTypes: string[];
  linkedinSearchQuery?: string;
}

export interface ServiceLineInsights {
  audit: string;
  bsaAml: string;
  riskConsulting: string;
  advisory: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  country: 'US' | 'Global';
  description: string;
  url: string;
  source: string;
  type: EventType;
  categories: string[];
  relevanceScore: number;
  scoreBreakdown: ScoreBreakdown;
  speakers: Speaker[];
  // AI-generated — populated on demand
  aiSummary?: string;
  serviceLineInsights?: ServiceLineInsights;
  personas?: Persona[];
  conversationStarters?: string[];
  keyTakeaway?: string;
  attendanceCost?: AttendanceCost;
  ingestedAt: string;
  lastAnalyzedAt?: string;
}

export interface EventFilters {
  dateRange: '30' | '60' | '90' | 'all';
  location: 'us' | 'global' | 'all';
  relevance: 'high' | 'all';
  type: EventType | 'all';
}

export type SortOrder = 'score' | 'date';

export interface ApiEventsResponse {
  events: Event[];
  total: number;
  lastIngested?: string;
}
