export interface KeywordRule {
  pattern: RegExp;
  points: number;
  label: string;
}

export const POSITIVE_SIGNALS: KeywordRule[] = [
  { pattern: /\b(AML|anti[-\s]money[-\s]laundering)\b/i, points: 15, label: 'AML focus' },
  { pattern: /\b(BSA|Bank Secrecy Act)\b/i, points: 15, label: 'BSA focus' },
  { pattern: /\b(audit|auditing|auditor|assurance)\b/i, points: 12, label: 'Audit focus' },
  { pattern: /\b(SEC|CFTC|FinCEN|OFAC|OCC|FATF)\b/i, points: 12, label: 'Regulator presence' },
  { pattern: /\b(financial crime|money laundering)\b/i, points: 12, label: 'Financial crime focus' },
  { pattern: /\b(compliance|compliant|comply)\b/i, points: 10, label: 'Compliance focus' },
  { pattern: /\b(regulation|regulatory|regulated|regulator)\b/i, points: 10, label: 'Regulatory focus' },
  { pattern: /\b(KYC|know[-\s]your[-\s]customer)\b/i, points: 10, label: 'KYC focus' },
  { pattern: /\b(institutional|institution)\b/i, points: 10, label: 'Institutional focus' },
  { pattern: /\b(enterprise|financial institution|bank|banking)\b/i, points: 8, label: 'Enterprise/FI focus' },
  { pattern: /\b(risk management|controls?|governance|internal audit)\b/i, points: 8, label: 'Risk/Controls focus' },
  { pattern: /\b(custody|custodian|custodial)\b/i, points: 8, label: 'Custody services' },
  { pattern: /\b(CFO|CRO|CCO|CISO|General Counsel|Chief)\b/i, points: 8, label: 'C-suite decision-makers' },
  { pattern: /\b(stablecoin|CBDC|central bank digital)\b/i, points: 7, label: 'Stablecoin/CBDC context' },
  { pattern: /\b(tokenization|tokenized|RWA|real[-\s]world[-\s]asset)\b/i, points: 7, label: 'Tokenization/RWA' },
  { pattern: /\b(exchange|trading|clearing|settlement)\b/i, points: 6, label: 'Exchange/Trading' },
  { pattern: /\b(advisory|consulting|professional services)\b/i, points: 5, label: 'Professional services' },
  { pattern: /\b(digital asset|crypto asset|virtual asset)\b/i, points: 4, label: 'Digital asset context' },
];

export const NEGATIVE_SIGNALS: KeywordRule[] = [
  { pattern: /\b(NFT|non[-\s]fungible|digital art|collectible)\b/i, points: -12, label: 'NFT/Art focus' },
  { pattern: /\b(gaming|play[-\s]to[-\s]earn|metaverse|virtual world)\b/i, points: -12, label: 'Gaming/Metaverse focus' },
  { pattern: /\b(hackathon|buildathon|developer challenge)\b/i, points: -8, label: 'Developer hackathon' },
  { pattern: /\b(influencer|creator economy|content creator)\b/i, points: -10, label: 'Influencer/Creator focus' },
  { pattern: /\b(\bmeme\b|degen|WAGMI|NGMI|aping|pump)\b/i, points: -15, label: 'Retail/Meme culture' },
];
