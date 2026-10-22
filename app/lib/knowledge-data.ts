export type KnowledgeCategory =
  | "Personality"
  | "Dynasty"
  | "Battle"
  | "Monument"
  | "Civilization"
  | "Art"
  | "Architecture";

export type KnowledgeRecord = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  period: string;
  summary: string;
  dates: string;
  relatedMonuments: string[];
  relatedEvents: string[];
  references: { label: string; url?: string }[];
};

export const knowledgeCategories: KnowledgeCategory[] = [
  "Personality",
  "Dynasty",
  "Battle",
  "Monument",
  "Civilization",
  "Art",
  "Architecture",
];

export const historicalKnowledge: KnowledgeRecord[] = [
  {
    id: "ashoka",
    title: "Ashoka",
    category: "Personality",
    period: "Maurya Empire",
    dates: "Reigned c. 268–232 BCE",
    summary: "Mauryan emperor whose edicts, inscribed on rocks and pillars across the subcontinent, describe dhamma and aspects of imperial governance.",
    relatedMonuments: ["Sanchi Stupa", "Ashokan pillars"],
    relatedEvents: ["Kalinga campaign and its aftermath", "Major edict inscriptions"],
    references: [{ label: "UNESCO — Buddhist Monuments at Sanchi", url: "https://whc.unesco.org/en/list/524/" }, { label: "Archaeological Survey of India", url: "https://asi.nic.in/" }],
  },
  {
    id: "rani-lakshmibai",
    title: "Rani Lakshmibai of Jhansi",
    category: "Personality",
    period: "Revolt of 1857–1858",
    dates: "c. 1828–1858",
    summary: "The queen of Jhansi became a prominent leader during the uprising of 1857–1858. Accounts of her life come from varied contemporary and later sources.",
    relatedMonuments: ["Jhansi Fort"],
    relatedEvents: ["Revolt of 1857"],
    references: [{ label: "National Archives of India", url: "https://nationalarchives.nic.in/" }],
  },
  {
    id: "maurya-dynasty",
    title: "Maurya Empire",
    category: "Dynasty",
    period: "c. 322–185 BCE",
    dates: "Approximate dates",
    summary: "An early South Asian empire centered on Magadha, known through inscriptions, archaeology, and literary accounts whose details vary in reliability.",
    relatedMonuments: ["Sanchi Stupa", "Pataliputra archaeological remains"],
    relatedEvents: ["Maurya rule begins", "Ashoka's edicts"],
    references: [{ label: "Archaeological Survey of India", url: "https://asi.nic.in/" }],
  },
  {
    id: "vijayanagara",
    title: "Vijayanagara Empire",
    category: "Dynasty",
    period: "14th–17th century",
    dates: "Founded in the 14th century; political power changed after 1565",
    summary: "A major South Indian empire with its capital at Vijayanagara, now represented by the archaeological landscape at Hampi.",
    relatedMonuments: ["Hampi"],
    relatedEvents: ["Battle of Talikota (1565)"],
    references: [{ label: "UNESCO — Group of Monuments at Hampi", url: "https://whc.unesco.org/en/list/241/" }],
  },
  {
    id: "panipat-1526",
    title: "First Battle of Panipat",
    category: "Battle",
    period: "Mughal period",
    dates: "1526 CE",
    summary: "Babur defeated Sultan Ibrahim Lodi near Panipat. The victory helped establish Mughal power in northern India, though consolidation took time.",
    relatedMonuments: ["Historic battlefield region at Panipat"],
    relatedEvents: ["Beginning of Mughal rule in northern India"],
    references: [{ label: "National Archives of India", url: "https://nationalarchives.nic.in/" }],
  },
  {
    id: "plassey",
    title: "Battle of Plassey",
    category: "Battle",
    period: "Company rule in Bengal",
    dates: "1757 CE",
    summary: "The East India Company's victory over Siraj ud-Daulah and his allies increased Company political influence in Bengal; it was part of a longer expansion.",
    relatedMonuments: ["Palashi battlefield region"],
    relatedEvents: ["Company political influence expands in Bengal"],
    references: [{ label: "National Archives of India", url: "https://nationalarchives.nic.in/" }],
  },
  {
    id: "sanchi-stupa",
    title: "Great Stupa at Sanchi",
    category: "Monument",
    period: "3rd century BCE onward",
    dates: "Core traditionally associated with Ashoka; later additions span centuries",
    summary: "A Buddhist monument complex with a hemispherical stupa, stone railings, terraces, and elaborately carved gateways added in later periods.",
    relatedMonuments: ["Ashokan pillar at Sanchi"],
    relatedEvents: ["Mauryan patronage", "Later Shunga and Satavahana-era additions"],
    references: [{ label: "UNESCO — Buddhist Monuments at Sanchi", url: "https://whc.unesco.org/en/list/524/" }],
  },
  {
    id: "konark-temple",
    title: "Konark Sun Temple",
    category: "Monument",
    period: "13th century",
    dates: "Built around 1250 CE",
    summary: "Commissioned under Eastern Ganga ruler Narasimhadeva I, the temple was conceived as a monumental stone chariot of Surya.",
    relatedMonuments: ["Konark Sun Temple complex"],
    relatedEvents: ["Reign of Narasimhadeva I"],
    references: [{ label: "UNESCO — Sun Temple, Konârak", url: "https://whc.unesco.org/en/list/246/" }],
  },
  {
    id: "indus-civilization",
    title: "Indus Valley Civilization",
    category: "Civilization",
    period: "c. 3300–1300 BCE; mature phase c. 2600–1900 BCE",
    dates: "Approximate archaeological chronology",
    summary: "A Bronze Age civilization with large planned settlements, standardized weights, craft production, and exchange networks. Its script remains undeciphered.",
    relatedMonuments: ["Dholavira", "Mohenjo-daro", "Harappa"],
    relatedEvents: ["Mature Harappan urban phase", "Regional transformations after c. 1900 BCE"],
    references: [{ label: "UNESCO — Dholavira", url: "https://whc.unesco.org/en/list/1645/" }],
  },
  {
    id: "ajanta-paintings",
    title: "Ajanta murals",
    category: "Art",
    period: "2nd century BCE–6th century CE",
    dates: "Created in more than one major phase",
    summary: "Painted narratives and devotional imagery survive in Buddhist cave monasteries at Ajanta, with notable later work associated with Vakataka-era patronage.",
    relatedMonuments: ["Ajanta Caves"],
    relatedEvents: ["Vakataka patronage under Harisena"],
    references: [{ label: "UNESCO — Ajanta Caves", url: "https://whc.unesco.org/en/list/242/" }],
  },
  {
    id: "dravidian-temple-architecture",
    title: "South Indian Dravidian temple architecture",
    category: "Architecture",
    period: "Developed across many centuries",
    dates: "Regional forms evolved over time",
    summary: "A broad architectural tradition featuring sanctums, pyramidal towers, sculpted halls, and temple enclosures, with substantial regional and historical variation.",
    relatedMonuments: ["Shore Temple at Mahabalipuram", "Brihadisvara Temple at Thanjavur"],
    relatedEvents: ["Pallava temple building", "Chola temple patronage"],
    references: [{ label: "UNESCO — Group of Monuments at Mahabalipuram", url: "https://whc.unesco.org/en/list/249/" }],
  },
];

export const knowledgeApiPaths = { search: "/api/knowledge/search" } as const;

export type KnowledgeSearchQuery = {
  query?: string;
  category?: KnowledgeCategory;
};

export type KnowledgeSearchResponse = {
  records: KnowledgeRecord[];
};
