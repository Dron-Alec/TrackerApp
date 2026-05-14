import type { Event } from '../types';

export function buildAnalysisPrompt(event: Event): string {
  const speakerText = event.speakers.length > 0
    ? event.speakers.map(s => [s.name, s.title, s.company].filter(Boolean).join(', ')).join(' | ')
    : 'Not listed';

  return `You are an intelligence analyst for Nexus Advisory Group, a Top 10 professional services firm. Nexus Advisory's digital asset practice provides:
- Audit: Financial statement audits for crypto exchanges, digital asset funds, and Web3 companies
- BSA/AML: Bank Secrecy Act compliance program design, transaction monitoring, AML testing
- Risk Consulting: Enterprise risk management, internal controls, SOC examinations for crypto custodians
- Advisory: Strategic advisory on regulatory readiness, crypto adoption, technology risk

Analyze the following event and produce actionable business development intelligence for firm partners.

EVENT DETAILS
Name: ${event.name}
Date: ${event.date}${event.endDate ? ' through ' + event.endDate : ''}
Location: ${event.location}
Type: ${event.type}
Categories: ${event.categories.join(', ')}
Relevance Score: ${event.relevanceScore}/100
Confirmed Speakers: ${speakerText}

Description:
${event.description}

INSTRUCTIONS
Return ONLY a valid JSON object — no markdown, no code fences, no explanation outside the JSON.

{
  "summary": "2-3 sentence paragraph: what the event is, who typically attends, and why it matters in the crypto industry",
  "serviceLineInsights": {
    "audit": "1-2 sentences: specific audit BD opportunity — what types of clients to find and what they need",
    "bsaAml": "1-2 sentences: specific BSA/AML BD opportunity at this event",
    "riskConsulting": "1-2 sentences: specific risk consulting BD opportunity",
    "advisory": "1-2 sentences: specific advisory BD opportunity"
  },
  "personas": [
    {
      "title": "Exact job title (e.g. Chief Compliance Officer)",
      "description": "Why this person matters — what challenge they face that our firm solves",
      "companyTypes": ["list of company types where this persona works"],
      "linkedinSearchQuery": "keywords for LinkedIn people search to find this persona at this event"
    }
  ],
  "conversationStarters": [
    "Natural, specific opening line or question tied to a theme at this event (not generic — reference the event context)",
    "Second angle based on a current regulatory or enforcement pressure relevant to this audience",
    "Third angle referencing a specific challenge like audit readiness, AML program maturity, or scaling compliance"
  ],
  "keyTakeaway": "One sentence: the single most important reason to prioritize attending this event"
}

Personas array should have 3-5 entries. Conversation starters should feel like something a senior partner would actually say — specific, not boilerplate.`;
}
