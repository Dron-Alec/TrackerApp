export type EventCategory = 'audit' | 'bsa_aml' | 'risk_consulting' | 'advisory' | 'crypto_general';
export type EventStatus = 'watching' | 'attending' | 'attended' | 'passed';
export type DecisionMakerDensity = 'low' | 'medium' | 'high';
export type AttendanceSize = 'small' | 'medium' | 'large' | 'enterprise';
export type OpportunityStatus = 'open' | 'in_progress' | 'won' | 'lost';
export type Priority = 'low' | 'medium' | 'high';

export interface EventLocation {
  city: string;
  state?: string;
  country: string;
  venue: string;
}

export interface Speaker {
  name: string;
  title: string;
  company: string;
  linkedinUrl?: string;
}

export interface ConferenceEvent {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  location: EventLocation;
  url: string;
  description: string;
  categories: EventCategory[];
  relevanceScore: number;
  attendanceSize: AttendanceSize;
  decisionMakerDensity: DecisionMakerDensity;
  status: EventStatus;
  registrationDeadline?: string;
  estimatedCost?: number;
  speakers?: Speaker[];
  sponsors?: string[];
  notes?: string;
  tags?: string[];
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl?: string;
  categories: EventCategory[];
  eventIds: string[];
  email?: string;
  phone?: string;
  notes?: string;
}

export interface BDOpportunity {
  id: string;
  eventId: string;
  contactId?: string;
  title: string;
  notes: string;
  priority: Priority;
  status: OpportunityStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  audit: 'Audit',
  bsa_aml: 'BSA / AML',
  risk_consulting: 'Risk Consulting',
  advisory: 'Advisory',
  crypto_general: 'Crypto General',
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  watching: 'Watching',
  attending: 'Attending',
  attended: 'Attended',
  passed: 'Passed',
};
