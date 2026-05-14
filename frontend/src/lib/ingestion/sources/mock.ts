import type { Event, AttendanceCost } from '../../types';
import { scoreEvent } from '../../scoring/engine';

interface RawMockEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  country: 'US' | 'Global';
  description: string;
  url: string;
  type: Event['type'];
  categories: string[];
  speakers: Event['speakers'];
  attendanceCost?: AttendanceCost;
}

const RAW_EVENTS: RawMockEvent[] = [
  {
    id: 'acams-crypto-aml-2026',
    name: 'ACAMS Cryptocurrency AML & Compliance Forum 2026',
    date: '2026-06-02',
    endDate: '2026-06-03',
    location: 'New York City, NY',
    country: 'US',
    description: `The ACAMS Cryptocurrency AML & Compliance Forum is the premier event for financial crime compliance professionals working in or alongside the digital asset industry. Now in its fifth year, the forum convenes BSA officers, Chief Compliance Officers, and AML program leads from crypto exchanges, fintech firms, and traditional financial institutions expanding into digital assets. Sessions cover FinCEN's latest guidance on virtual asset service providers, FATF travel rule implementation, on-chain transaction monitoring, and sanctions screening for blockchain-based transactions. Regulators from the SEC, CFTC, and OCC participate in panel discussions alongside compliance leadership from Coinbase, Kraken, and leading global exchanges. The event features structured networking designed for compliance and risk professionals, with dedicated tracks on audit readiness and internal controls for digital asset businesses.`,
    url: 'https://www.acams.org/en/events/crypto-aml',
    type: 'regulatory',
    categories: ['AML', 'BSA', 'compliance', 'regulatory', 'institutional'],
    speakers: [
      { name: 'Jennifer Crawford', title: 'Chief Compliance Officer', company: 'Coinbase' },
      { name: 'Michael Torres', title: 'Deputy Director, FinCEN', company: 'U.S. Treasury' },
      { name: 'Sarah Kim', title: 'Head of Financial Crime Risk', company: 'Gemini' },
      { name: 'David Chen', title: 'BSA Officer', company: 'Paxos Trust Company' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'ACAMS Member', price: 'See website' },
        { label: 'Non-Member', price: 'See website' },
      ],
      registrationUrl: 'https://www.acams.org/en/events',
      notes: 'Registration requires ACAMS member portal access; pricing varies by membership tier.',
    },
  },
  {
    id: 'crypto-compliance-summit-dc-2026',
    name: 'Crypto Compliance & Regulatory Summit 2026',
    date: '2026-06-09',
    endDate: '2026-06-10',
    location: 'Washington, D.C.',
    country: 'US',
    description: `The Crypto Compliance & Regulatory Summit brings together regulators, compliance officers, legal counsel, and risk leaders to address the fast-evolving regulatory landscape for digital assets in the United States and globally. The 2026 summit focuses on the Digital Asset Market Structure Act implementation, updated SEC and CFTC digital asset guidance, stablecoin regulation under the GENIUS Act, and international coordination on VASP compliance frameworks. Keynote speakers include commissioners from the SEC and CFTC, senior FinCEN officials, and General Counsels from leading crypto firms. Workshops cover internal audit programs for digital asset businesses, SOC 2 readiness for custody providers, and enterprise risk management frameworks for institutions entering crypto. A dedicated track for professional services firms covers how accounting and advisory firms can expand their digital asset practices.`,
    url: 'https://www.cryptocompliancesummit.com',
    type: 'regulatory',
    categories: ['compliance', 'regulatory', 'AML', 'audit', 'institutional', 'BSA'],
    speakers: [
      { name: 'Commissioner Lisa Park', title: 'Commissioner', company: 'U.S. Securities and Exchange Commission' },
      { name: 'James Whitfield', title: 'Senior Associate Director', company: 'FinCEN' },
      { name: 'Rachel Monroe', title: 'General Counsel', company: 'Circle' },
      { name: 'Thomas Briggs', title: 'Chief Risk Officer', company: 'Anchorage Digital' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Registration', price: 'See website' },
      ],
      registrationUrl: 'https://www.cryptocompliancesummit.com',
      notes: 'Registration details not yet publicly available.',
    },
  },
  {
    id: 'institutional-crypto-summit-chicago-2026',
    name: 'Institutional Crypto Summit 2026',
    date: '2026-07-07',
    endDate: '2026-07-08',
    location: 'Chicago, IL',
    country: 'US',
    description: `The Institutional Crypto Summit is designed exclusively for professionals at financial institutions, asset managers, custodians, and family offices who are actively integrating or evaluating digital assets. Now a fixture on the institutional calendar, the 2026 edition focuses on custody infrastructure, regulatory risk, and the audit and compliance requirements for institutions holding digital assets on behalf of clients. Attendees include CFOs, CROs, and Chief Investment Officers from hedge funds and traditional banks deploying crypto strategies, alongside compliance and operations leads responsible for building internal controls frameworks. Sessions address Bitcoin ETF operations, tokenized treasuries and RWA custody, enterprise-grade AML programs for institutional crypto desks, and the evolving role of third-party auditors in certifying digital asset custody. The summit is invite-only for institutional participants, ensuring a peer-level conversation.`,
    url: 'https://www.institutionalcryptosummit.com',
    type: 'institutional',
    categories: ['institutional', 'custody', 'audit', 'risk management', 'compliance', 'RWA'],
    speakers: [
      { name: 'Margaret Wilson', title: 'CFO', company: 'Fidelity Digital Assets' },
      { name: 'Robert Nakamura', title: 'Chief Risk Officer', company: 'Galaxy Digital' },
      { name: 'Elena Vasquez', title: 'Head of Digital Asset Compliance', company: 'BNY Mellon' },
      { name: 'Samuel Okafor', title: 'Managing Director, Digital Assets', company: 'State Street' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Institutional Attendee', price: 'Invite-only' },
      ],
      registrationUrl: 'https://www.institutionalcryptosummit.com',
      notes: 'Invite-only for institutional participants (asset managers, custodians, family offices). Contact organizers to request an invitation.',
    },
  },
  {
    id: 'digital-asset-summit-2026',
    name: 'Digital Asset Summit 2026',
    date: '2026-05-05',
    endDate: '2026-05-06',
    location: 'New York City, NY',
    country: 'US',
    description: `The Digital Asset Summit, produced in partnership with Bloomberg Intelligence, convenes senior leaders across institutional finance, asset management, and digital asset infrastructure for two days of strategic dialogue in Manhattan. The 2026 program centers on the post-ETF institutional adoption landscape, stablecoin market structure, tokenization of real-world assets, and the compliance and audit frameworks required for regulated entities operating in crypto markets. Speakers include Chief Investment Officers from major asset managers, heads of digital assets at bulge-bracket banks, and senior officials from financial regulators. Dedicated sessions cover risk management for digital asset portfolios, operational due diligence for crypto custodians, and what institutional-grade AML looks like in practice. Attendance is primarily composed of decision-makers from asset managers, hedge funds, banks, and family offices, making it one of the highest-density events for BD targeting in the institutional crypto space.`,
    url: 'https://www.digitalasset-summit.com',
    type: 'institutional',
    categories: ['institutional', 'compliance', 'audit', 'custody', 'risk management', 'RWA', 'stablecoin'],
    speakers: [
      { name: 'Catherine Ross', title: 'CIO, Digital Assets', company: 'BlackRock' },
      { name: 'Marcus Webb', title: 'Head of Digital Assets', company: 'JPMorgan' },
      { name: 'Nina Johansson', title: 'Chief Compliance Officer', company: 'Grayscale' },
      { name: 'Patrick Huang', title: 'Global Head of Regulatory Affairs', company: 'Binance' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Institutional Pass', price: 'See website' },
      ],
      registrationUrl: 'https://www.digitalasset-summit.com',
      notes: 'Senior institutional finance audience; pricing typically $2,000–$5,000+ for Bloomberg-produced events.',
    },
  },
  {
    id: 'consensus-2026',
    name: 'Consensus 2026 by CoinDesk',
    date: '2026-05-12',
    endDate: '2026-05-14',
    location: 'Austin, TX',
    country: 'US',
    description: `Consensus, produced by CoinDesk, is the crypto and Web3 industry's most established annual gathering. The 2026 edition in Austin draws over 15,000 attendees spanning founders, investors, institutional players, regulators, and technologists. The conference features a dedicated Institutional Finance track covering digital asset regulation, compliance infrastructure, and the evolving role of traditional financial institutions in crypto markets. Sessions address SEC enforcement trends, the operational challenges of running a compliant crypto exchange, AML program maturity at digital asset businesses, and how custody providers are building audit-ready infrastructure. Regulators, exchange CCOs, risk officers at crypto lenders, and institutional investors make Consensus the broadest-reach crypto conference in North America — and one of the most valuable for identifying and connecting with BD targets across the compliance and institutional finance space.`,
    url: 'https://consensus.coindesk.com',
    type: 'conference',
    categories: ['institutional', 'regulatory', 'compliance', 'exchange', 'custody', 'audit'],
    speakers: [
      { name: 'Hester Peirce', title: 'Commissioner', company: 'U.S. Securities and Exchange Commission' },
      { name: 'Brian Armstrong', title: 'CEO', company: 'Coinbase' },
      { name: 'Michael Saylor', title: 'Executive Chairman', company: 'MicroStrategy' },
      { name: 'Kristin Smith', title: 'CEO', company: 'Blockchain Association' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Pro Pass', price: '$1,049' },
        { label: 'Platinum Pass', price: '$1,849' },
        { label: 'Piranha Pass', price: '$5,999' },
        { label: 'Startup Package', price: '$1,049 (3 passes)' },
      ],
      registrationUrl: 'https://consensus.coindesk.com/register/',
      notes: 'Early bird pricing; rates increase after May 1, 2026. Group discounts: 5% (3+), 10% (5+), 20% (10+). Pro/Platinum passes do not include Wealth Management Day or Institutional Summit (separate registration).',
    },
  },
  {
    id: 'money2020-europe-2026',
    name: 'Money20/20 Europe 2026',
    date: '2026-06-01',
    endDate: '2026-06-04',
    location: 'Amsterdam, Netherlands',
    country: 'Global',
    description: `Money20/20 Europe is the world's leading fintech conference, drawing over 8,000 senior financial services executives to Amsterdam each year. While broader than crypto-focused events, the 2026 edition devotes significant programming to digital assets — specifically stablecoin infrastructure, CBDC deployment, tokenized payments, and the compliance and AML requirements for banks and payment networks integrating blockchain rails. Attendees include CEOs and CFOs of major European banks, payments networks, and neo-banks, alongside regulatory leaders from the EBA, ECB, and national financial supervisors implementing MiCA. The event's compliance and risk track draws Chief Compliance Officers and heads of financial crime prevention from institutions actively building or evaluating digital asset programs. For an advisory and BSA/AML practice, Money20/20 Europe provides access to decision-makers at financial institutions that are one to two years behind US counterparts in crypto compliance buildout — and actively seeking guidance.`,
    url: 'https://europe.money2020.com',
    type: 'conference',
    categories: ['institutional', 'compliance', 'regulatory', 'AML', 'stablecoin', 'CBDC', 'banking'],
    speakers: [
      { name: 'Mairead McGuinness', title: 'Financial Regulation Lead', company: 'European Commission' },
      { name: 'Anne Boden', title: 'Founder', company: 'Starling Bank' },
      { name: 'Fabrice Denèle', title: 'Head of Digital Assets', company: 'Société Générale' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Standard Pass', price: '€1,500–€3,000' },
        { label: 'VIP Pass', price: '€4,000+' },
      ],
      registrationUrl: 'https://europe.money2020.com/pass-picker',
      notes: 'Prices in EUR. Early-bird discounts available; startup pricing at ~50% off. 3 days, RAI Amsterdam.',
    },
  },
  {
    id: 'token2049-singapore-2026',
    name: 'TOKEN2049 Singapore 2026',
    date: '2026-09-16',
    endDate: '2026-09-17',
    location: 'Singapore',
    country: 'Global',
    description: `TOKEN2049 Singapore is one of the largest and most influential crypto events in Asia, typically drawing over 20,000 attendees from across the industry. The 2026 Singapore edition features strong institutional and regulatory content, reflecting Singapore's MAS-driven approach to digital asset regulation and its position as a global hub for licensed crypto exchanges and custody providers. Sessions cover the VASP licensing framework, institutional crypto adoption across APAC, AML/CFT compliance for digital asset businesses, and the expansion of tokenized securities markets in the region. Key attendees include compliance and risk leaders from licensed Singapore exchanges (Crypto.com, OKX, Bybit), institutional investors, fund managers, and regulators from MAS and regional supervisory bodies. For firms building out APAC digital asset practices, TOKEN2049 Singapore is the most efficient access point for decision-makers across institutional crypto, exchanges, and regulatory stakeholders.`,
    url: 'https://www.token2049.com',
    type: 'conference',
    categories: ['institutional', 'regulatory', 'compliance', 'exchange', 'custody', 'AML'],
    speakers: [
      { name: 'Ho Ching', title: 'Regulatory Affairs Director', company: 'MAS' },
      { name: 'Kris Marszalek', title: 'CEO', company: 'Crypto.com' },
      { name: 'Lennix Lai', title: 'Chief Commercial Officer', company: 'OKX' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Super Early Bird', price: '~$399' },
        { label: 'Standard', price: '~$1,299' },
      ],
      registrationUrl: 'https://www.token2049.com/singapore/tickets',
      notes: 'Prices in USD. Early bird allocation is limited. Crypto payment accepted via MoonPay. Student passes available (application required).',
    },
  },
  {
    id: 'bitcoin-2026',
    name: 'Bitcoin 2026',
    date: '2026-06-22',
    endDate: '2026-06-24',
    location: 'Nashville, TN',
    country: 'US',
    description: `Bitcoin 2026 in Nashville is the largest annual Bitcoin-focused conference globally, drawing over 25,000 attendees ranging from individual holders and advocates to institutional investors, miners, and policy makers. The event has grown substantially in its institutional programming as Bitcoin's adoption by public companies, sovereign wealth funds, and pension managers has expanded. The 2026 conference features tracks covering corporate Bitcoin treasury strategy, Bitcoin ETF operations and custody, regulatory and tax treatment of Bitcoin holdings, and compliance considerations for enterprises holding BTC. While heavily attended by retail investors and enthusiasts, the institutional and policy tracks attract CFOs from public companies with Bitcoin reserves, compliance officers at Bitcoin custody providers, and lobbyists working on Bitcoin-specific legislation. Best suited for an advisory and tax practice, with selective relevance for audit and risk consulting.`,
    url: 'https://b.tc/conference',
    type: 'conference',
    categories: ['institutional', 'custody', 'regulatory', 'exchange'],
    speakers: [
      { name: 'Cynthia Lummis', title: 'U.S. Senator', company: 'United States Senate' },
      { name: 'Michael Saylor', title: 'Executive Chairman', company: 'MicroStrategy' },
      { name: 'Jack Mallers', title: 'CEO', company: 'Strike' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'General Admission', price: '$699' },
        { label: 'Pro Pass', price: '$2,100' },
        { label: 'Whale Pass', price: '$12,999' },
      ],
      registrationUrl: 'https://2026.b.tc/',
      notes: 'GA covers Days 2–3 only. Pro Pass includes all 3 days, Pro Day reception, meals, and reserved seating. Whale Pass adds VIP dinners, private lounge, and all after-parties.',
    },
  },
  {
    id: 'blockchain-expo-na-2026',
    name: 'Blockchain Expo North America 2026',
    date: '2026-06-08',
    endDate: '2026-06-09',
    location: 'Santa Clara, CA',
    country: 'US',
    description: `Blockchain Expo North America brings together enterprise technology leaders, solution providers, and practitioners exploring blockchain adoption across financial services, supply chain, healthcare, and government. The 2026 event features significant content on financial services applications, including digital asset compliance for enterprise deployments, tokenization of securities and commodities, and risk management frameworks for organizations integrating blockchain infrastructure. Sessions include panels on KYC/AML requirements for enterprise blockchain networks, internal audit approaches to smart contract risk, and regulatory guidance for institutions issuing tokenized assets. While more technology-focused than pure finance conferences, the event draws heads of blockchain innovation, Chief Digital Officers, and technology risk leaders from banks and insurance companies — personas relevant to an advisory and risk consulting practice.`,
    url: 'https://www.blockchain-expo.com/northamerica',
    type: 'conference',
    categories: ['enterprise', 'regulatory', 'compliance', 'risk management', 'institutional', 'audit'],
    speakers: [
      { name: 'Diana Chen', title: 'Head of Blockchain, Financial Services', company: 'Deloitte' },
      { name: 'Marcus Ellison', title: 'Chief Digital Officer', company: 'Wells Fargo' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Free Pass', price: 'Free' },
        { label: 'Gold Pass', price: '$400' },
      ],
      registrationUrl: 'https://www.blockchain-expo.com/northamerica',
      notes: 'Free Pass covers the exhibition floor only. Gold Pass ($400) adds all conference sessions across both days, VIP networking area, lunch voucher, and full content library (250+ hours).',
    },
  },
  {
    id: 'chain-reaction-2026',
    name: 'Chain Reaction 2026',
    date: '2026-07-14',
    endDate: '2026-07-15',
    location: 'New York City, NY',
    country: 'US',
    description: `Chain Reaction is a mid-size crypto conference held annually in New York City, produced by The Block. Positioned as a more intimate alternative to large-scale events, it attracts crypto founders, investors, and institutional participants for candid discussions on market structure, regulatory developments, and business strategy. The 2026 program covers DeFi regulatory frameworks, institutional-grade custody and compliance infrastructure, and venture capital in the digital asset space. While not exclusively compliance-focused, the New York location and The Block's institutional editorial voice attract compliance officers from NY-based crypto firms, institutional investors, and legal and advisory professionals active in the space. Useful for BD networking in a less crowded setting than Consensus or TOKEN2049.`,
    url: 'https://www.theblock.co/chain-reaction',
    type: 'conference',
    categories: ['institutional', 'regulatory', 'compliance', 'exchange'],
    speakers: [
      { name: 'Mike Belshe', title: 'CEO', company: 'BitGo' },
      { name: 'Leah Wald', title: 'CEO', company: 'Valkyrie Digital Assets' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Registration', price: 'See website' },
      ],
      registrationUrl: 'https://www.theblock.co/chain-reaction',
      notes: 'Pricing not publicly listed; contact The Block directly for registration details.',
    },
  },
  {
    id: 'permissionless-iv-2026',
    name: 'Permissionless IV 2026',
    date: '2026-05-27',
    endDate: '2026-05-29',
    location: 'Salt Lake City, UT',
    country: 'US',
    description: `Permissionless IV is a leading DeFi and crypto infrastructure conference produced by Blockworks. The 2026 event attracts protocol founders, DeFi traders, institutional investors exploring on-chain opportunities, and an increasing number of compliance professionals grappling with DeFi regulatory risk. Sessions cover decentralized exchange compliance, regulatory approaches to DeFi protocols, institutional DeFi strategies, and the evolving risk landscape for on-chain financial applications. While primarily developer and investor-oriented, the growing institutional DeFi track and Blockworks' editorial focus on institutional crypto gives the event moderate relevance for BD in the compliance and risk consulting space. Attendees include risk officers at crypto hedge funds and compliance teams at firms building regulatory-compliant DeFi products.`,
    url: 'https://blockworks.co/events/permissionless',
    type: 'conference',
    categories: ['regulatory', 'compliance', 'institutional', 'exchange'],
    speakers: [
      { name: 'Hayden Adams', title: 'Founder', company: 'Uniswap Labs' },
      { name: 'Stani Kulechov', title: 'Founder', company: 'Aave' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Registration', price: 'TBD' },
      ],
      registrationUrl: 'https://blockworks.com/event/permissionless',
      notes: '2026 pricing not yet announced. Previous editions: $499–$1,499. Sign up on Blockworks for ticket release notifications.',
    },
  },
  {
    id: 'ethcc-9-2026',
    name: 'EthCC[9] 2026',
    date: '2026-07-21',
    endDate: '2026-07-24',
    location: 'Brussels, Belgium',
    country: 'Global',
    description: `EthCC (Ethereum Community Conference) is the largest annual European Ethereum gathering, drawing over 5,000 developers, researchers, and ecosystem builders to Brussels. While primarily a technical and developer-focused conference, EthCC attracts an increasing number of institutional participants drawn to the Ethereum ecosystem, including compliance officers at ETH-based businesses, legal teams from protocol foundations, and regulators from European financial supervisors monitoring DeFi. The 2026 edition includes programming on MiCA compliance for Ethereum-based services, smart contract audit standards, and institutional Ethereum adoption. Limited direct BD value for core compliance and audit practices, but relevant for advisory teams working with clients building on Ethereum infrastructure and legal/compliance teams monitoring the European regulatory landscape.`,
    url: 'https://ethcc.io',
    type: 'conference',
    categories: ['regulatory', 'institutional', 'audit'],
    speakers: [
      { name: 'Vitalik Buterin', title: 'Co-Founder', company: 'Ethereum Foundation' },
      { name: 'Aya Miyaguchi', title: 'Executive Director', company: 'Ethereum Foundation' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Single Day', price: '€125' },
        { label: 'Full Pass', price: '€500' },
        { label: 'Full Pass + Agora', price: '€1,300' },
        { label: 'Student Pass', price: 'Free' },
      ],
      registrationUrl: 'https://ethcc.io',
      notes: 'Prices include VAT. 4-day conference in Brussels. Student passes (400 spots) and volunteer positions available. Full+Agora tier typically sells out early.',
    },
  },
  {
    id: 'solana-breakpoint-2026',
    name: 'Solana Breakpoint 2026',
    date: '2026-09-08',
    endDate: '2026-09-09',
    location: 'Singapore',
    country: 'Global',
    description: `Solana Breakpoint is the annual flagship conference of the Solana ecosystem, bringing together developers, investors, and builders across the Solana network. The 2026 event in Singapore is expected to feature growing institutional content following Solana's ETF approval and its adoption by institutional asset managers. Sessions will cover institutional-grade Solana infrastructure, compliance considerations for Solana-based financial products, and the Solana-based stablecoin and payments ecosystem. Primarily developer and ecosystem focused, with selective institutional content. Limited direct relevance for a compliance and audit practice unless targeting Solana-native fintech companies or funds.`,
    url: 'https://solana.com/breakpoint',
    type: 'conference',
    categories: ['institutional', 'regulatory'],
    speakers: [
      { name: 'Anatoly Yakovenko', title: 'Co-Founder', company: 'Solana Labs' },
      { name: 'Raj Gokal', title: 'Co-Founder', company: 'Solana Labs' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'Registration', price: 'TBD' },
      ],
      registrationUrl: 'https://solana.com/breakpoint',
      notes: '2026 pricing not yet announced. Sign up for early registration notifications at breakpoint@solana.org.',
    },
  },
  {
    id: 'nft-nyc-2026',
    name: 'NFT.NYC 2026',
    date: '2026-06-03',
    endDate: '2026-06-05',
    location: 'New York City, NY',
    country: 'US',
    description: `NFT.NYC is the world's largest NFT and digital art conference, drawing artists, collectors, gaming studios, and brand marketers exploring the NFT ecosystem. The 2026 event focuses on digital art markets, creator economies, gaming NFTs, metaverse real estate, and community token models. While some panels address the broader regulatory and tax treatment of NFT transactions, the event is primarily retail and art-market focused with minimal institutional financial services content. Attendees are predominantly individual collectors, artists, and consumer-facing brand teams — not the compliance, risk, or institutional finance professionals that represent target BD personas. Low value for professional services BD except for niche tax advisory work on NFT creator taxation.`,
    url: 'https://www.nft.nyc',
    type: 'conference',
    categories: ['NFT', 'digital art', 'gaming', 'creator economy'],
    speakers: [
      { name: 'Beeple', title: 'Digital Artist', company: 'Independent' },
      { name: 'Gary Vaynerchuk', title: 'CEO', company: 'VaynerMedia' },
    ],
    attendanceCost: {
      tiers: [
        { label: 'General Admission', price: '~$599' },
      ],
      registrationUrl: 'https://shop.nft.nyc/collections/tickets',
      notes: 'Based on 2025 GA pricing; 2026 pricing TBD. Accepts fiat and crypto payment.',
    },
  },
  {
    id: 'ethglobal-hackathon-2026',
    name: 'ETHGlobal Bangkok 2026',
    date: '2026-05-09',
    endDate: '2026-05-11',
    location: 'Bangkok, Thailand',
    country: 'Global',
    description: `ETHGlobal Bangkok is a 48-hour Ethereum hackathon bringing together developers from around the world to build decentralized applications in a competitive format. Participants are primarily engineering students, individual developers, and protocol contributors competing for prizes funded by Ethereum ecosystem sponsors. The event is entirely developer-focused with no institutional, compliance, or financial services content. Hackathon attendees are not typical BD targets and the format does not lend itself to professional networking or business development. Minimal relevance for digital asset service lines.`,
    url: 'https://ethglobal.com',
    type: 'hackathon',
    categories: ['hackathon', 'developer', 'builder'],
    speakers: [],
    attendanceCost: {
      tiers: [
        { label: 'Participant', price: 'Free' },
      ],
      registrationUrl: 'https://ethglobal.com',
      notes: 'Application required; acceptance not guaranteed. ETHGlobal hackathons are free to attend for accepted participants.',
    },
  },
  {
    id: 'web3-gaming-summit-2026',
    name: 'Web3 Gaming Summit 2026',
    date: '2026-06-11',
    endDate: '2026-06-12',
    location: 'Los Angeles, CA',
    country: 'US',
    description: `The Web3 Gaming Summit brings together game developers, studio executives, and gaming NFT investors to explore the intersection of blockchain technology and gaming. The 2026 event focuses on play-to-earn mechanics, gaming metaverse infrastructure, in-game asset tokenization, and the creator economy within gaming. The audience is entirely composed of gaming industry professionals, individual players, and consumer-focused investors — not financial services or compliance professionals. The event has no content relevant to core digital asset practice areas. Attendance would provide no meaningful BD opportunity for audit, BSA/AML, risk consulting, or advisory services targeting institutional crypto and fintech clients.`,
    url: 'https://web3gamingsummit.com',
    type: 'conference',
    categories: ['gaming', 'NFT', 'metaverse', 'play-to-earn'],
    speakers: [],
    attendanceCost: {
      tiers: [
        { label: 'Registration', price: 'See website' },
      ],
      registrationUrl: 'https://web3gamingsummit.com',
    },
  },
];

export function getMockEvents(): Event[] {
  const now = new Date().toISOString();
  return RAW_EVENTS.map(raw => {
    const breakdown = scoreEvent(raw.name, raw.description, raw.speakers, raw.categories);
    return {
      id: raw.id,
      name: raw.name,
      date: raw.date,
      endDate: raw.endDate,
      location: raw.location,
      country: raw.country,
      description: raw.description,
      url: raw.url,
      source: 'mock',
      type: raw.type,
      categories: raw.categories,
      relevanceScore: breakdown.total,
      scoreBreakdown: breakdown,
      speakers: raw.speakers,
      attendanceCost: raw.attendanceCost,
      ingestedAt: now,
    };
  });
}
