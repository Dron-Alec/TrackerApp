import Anthropic from '@anthropic-ai/sdk';
import type { Event, ServiceLineInsights, Persona } from '../types';
import { buildAnalysisPrompt } from './prompts';

interface AnalysisResult {
  summary: string;
  serviceLineInsights: ServiceLineInsights;
  personas: Persona[];
  conversationStarters: string[];
  keyTakeaway: string;
}

function buildMockAnalysis(event: Event): AnalysisResult {
  const isHighScore = event.relevanceScore >= 70;
  const isCompliance = event.categories.some(c => ['compliance', 'AML', 'BSA', 'regulatory'].includes(c));

  return {
    summary: `${event.name} is a ${event.type} taking place in ${event.location} that brings together professionals across the digital asset ecosystem. ${isHighScore ? 'The event draws a senior audience including compliance officers, risk leaders, and institutional investors at the forefront of crypto adoption.' : 'While primarily attracting a broad crypto audience, the event includes content relevant to financial services professionals.'} It represents an important gathering for understanding industry direction and identifying potential clients navigating regulatory and operational complexity.`,
    serviceLineInsights: {
      audit: isHighScore
        ? `Several firms represented at ${event.name} are at or approaching the stage where audited financial statements are required — either for investor relations, regulatory compliance, or exchange licensing purposes. Crowe can position its digital asset audit capabilities directly with CFOs and Controllers at these firms.`
        : `Some companies attending ${event.name} may be approaching audit readiness, particularly those seeking institutional investment or operating under regulatory frameworks that require third-party assurance.`,
      bsaAml: isCompliance
        ? `${event.name} draws compliance officers from exchanges, custodians, and fintechs who are actively building or maturing their AML programs. FinCEN's updated VASP guidance and the FATF travel rule create immediate demand for Crowe's BSA program design and transaction monitoring advisory work.`
        : `Attendees operating in financial services verticals likely face AML program requirements. Crowe can engage compliance leads on BSA readiness, transaction monitoring system selection, and independent AML testing — especially for firms scaling into new jurisdictions.`,
      riskConsulting: `Enterprise risk management is a consistent gap for fast-growing crypto firms at events like ${event.name}. Crowe can engage CROs and risk leads on internal controls design, SOC examination readiness, and operational risk frameworks — particularly for custody providers and exchanges with institutional client bases.`,
      advisory: `${event.name} is an ideal venue for Crowe's advisory practice to connect with firms evaluating regulatory strategy, digital asset product launch planning, or organizational readiness for increased regulatory scrutiny. Strategic advisory engagements often begin with conversations at conferences like this one.`,
    },
    personas: [
      {
        title: 'Chief Compliance Officer',
        description: 'Responsible for the firm\'s entire compliance program — AML, sanctions, licensing. Faces pressure from regulators and institutional investors demanding program maturity. A direct buyer of Crowe\'s BSA/AML and advisory services.',
        companyTypes: ['crypto exchange', 'digital asset custodian', 'fintech'],
        linkedinSearchQuery: 'Chief Compliance Officer crypto exchange digital assets',
      },
      {
        title: 'CFO / Chief Financial Officer',
        description: 'Owns audit relationships and financial reporting. For crypto companies approaching institutional investors or regulatory licensing, the CFO is the key buyer for audit and financial advisory services.',
        companyTypes: ['digital asset fund', 'crypto exchange', 'Web3 company'],
        linkedinSearchQuery: 'CFO Chief Financial Officer cryptocurrency blockchain digital assets',
      },
      {
        title: 'Head of Risk',
        description: 'Builds and owns the enterprise risk framework. Faces growing board pressure to demonstrate robust controls, especially post-FTX. Key buyer for Crowe\'s risk consulting and SOC examination services.',
        companyTypes: ['crypto exchange', 'institutional custody provider', 'digital bank'],
        linkedinSearchQuery: 'Head of Risk Management digital assets crypto',
      },
      {
        title: 'General Counsel',
        description: 'Oversees regulatory strategy and legal risk. Often the first point of contact for compliance advisory engagements and the internal champion for third-party risk assessments.',
        companyTypes: ['crypto exchange', 'DeFi protocol', 'tokenized asset issuer'],
        linkedinSearchQuery: 'General Counsel crypto blockchain digital assets regulatory',
      },
    ],
    conversationStarters: [
      `"We've been seeing a wave of exchanges and custodians engaging us right around the time they're applying for their first institutional client or pursuing a state trust charter — is that a stage your organization is approaching?"`,
      `"With FinCEN's updated VASP examination procedures now in effect, we're finding most BSA programs were built for 2020 requirements, not 2026 enforcement expectations — have you done a gap assessment recently?"`,
      `"We just completed a SOC 2 Type II examination for a custody provider that unlocked three new institutional clients in 90 days — it's become almost table stakes for firms trying to attract pension and endowment capital. Is that on your roadmap?"`,
    ],
    keyTakeaway: `${event.name} offers direct access to the compliance, risk, and institutional finance decision-makers who are Crowe's primary buyers in the digital asset space, making it one of the highest-ROI events for BD investment this year.`,
  };
}

export async function analyzeEvent(event: Event): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return buildMockAnalysis(event);
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildAnalysisPrompt(event);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    const parsed = JSON.parse(block.text) as AnalysisResult;
    return parsed;
  } catch (err) {
    console.error('AI analysis failed, using mock:', err);
    return buildMockAnalysis(event);
  }
}
