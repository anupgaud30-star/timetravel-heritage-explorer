export type HistoricalPeriod = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
  dynasties: string[];
};

export type TimelineEvent = {
  id: string;
  periodId: string;
  year: number;
  date: string;
  title: string;
  summary: string;
  rulers: string[];
  achievements: string[];
  monuments: string[];
  references: string[];
};

export const historicalPeriods: HistoricalPeriod[] = [
  { id: "indus", name: "Indus Valley Civilization", startYear: -3300, endYear: -1300, description: "Explore one of the ancient world's great urban traditions through its planned cities, craft, and long-distance exchange.", dynasties: ["Harappan communities"] },
  { id: "vedic", name: "Vedic Period", startYear: -1500, endYear: -500, description: "A broad early historical period associated with Vedic texts, changing settlement patterns, and new political communities.", dynasties: ["Kuru-Panchala", "Mahajanapadas"] },
  { id: "maurya", name: "Maurya Empire", startYear: -322, endYear: -185, description: "A large imperial formation linked by administration, roads, trade, and the inscriptions of Ashoka.", dynasties: ["Maurya"] },
  { id: "gupta", name: "Gupta Empire", startYear: 300, endYear: 600, description: "A period of regional power, artistic production, scholarship, and expanding networks across northern India.", dynasties: ["Gupta", "Vakataka"] },
  { id: "sultanate", name: "Delhi Sultanate", startYear: 1206, endYear: 1526, description: "Several successive sultanates shaped Delhi and a wide network of political and cultural centers.", dynasties: ["Mamluk", "Khalji", "Tughlaq", "Lodi"] },
  { id: "mughal", name: "Mughal Empire", startYear: 1526, endYear: 1857, description: "A long-lived imperial court known for layered regional administration, cultural exchange, and monumental architecture.", dynasties: ["Mughal"] },
  { id: "maratha", name: "Maratha Empire", startYear: 1674, endYear: 1818, description: "A powerful confederacy grew from the western Deccan and became a major force in early modern India.", dynasties: ["Bhonsle", "Peshwa"] },
  { id: "colonial", name: "British Colonial Period", startYear: 1757, endYear: 1947, description: "Company rule and the British Raj transformed India's governance, economy, public life, and resistance movements.", dynasties: ["East India Company", "British Raj"] },
  { id: "modern", name: "Modern India", startYear: 1947, endYear: 2025, description: "Follow independence, the making of the republic, and milestones in science and public life.", dynasties: ["Republic of India"] },
];

export const timelineEvents: TimelineEvent[] = [
  { id: "harappa-urban", periodId: "indus", year: -2600, date: "c. 2600 BCE", title: "Mature Harappan cities flourish", summary: "Major settlements including Harappa and Mohenjo-daro developed carefully planned streets, drainage systems, craft districts, and wide exchange networks.", rulers: ["No named rulers are securely attested"], achievements: ["Planned urban settlements", "Standardized weights and long-distance trade"], monuments: ["Mohenjo-daro", "Harappa", "Dholavira"], references: ["UNESCO World Heritage Centre — Dholavira", "Archaeological Survey of India"] },
  { id: "dholavira", periodId: "indus", year: -2500, date: "c. 2500–1900 BCE", title: "Dholavira's water system", summary: "The settlement at Dholavira developed reservoirs and channels adapted to a dry island environment; exact construction phases span centuries.", rulers: ["No named rulers are securely attested"], achievements: ["Large-scale rainwater collection", "Distinctive urban planning"], monuments: ["Dholavira"], references: ["UNESCO World Heritage Centre — Dholavira"] },
  { id: "indus-transition", periodId: "indus", year: -1900, date: "after c. 1900 BCE", title: "Regional transformations", summary: "Many large urban centers declined or changed, while populations and settlement patterns shifted across the wider region over an extended period.", rulers: ["No named rulers are securely attested"], achievements: ["Regional traditions continued and adapted"], monuments: ["Lothal", "Kalibangan"], references: ["Archaeological Survey of India"] },
  { id: "rigveda", periodId: "vedic", year: -1200, date: "c. 1500–1000 BCE (approximate)", title: "Early Vedic compositions", summary: "The oldest layers of the Rigveda are generally placed in the second millennium BCE; precise dates and chronology remain debated.", rulers: ["Many chiefdoms; no single imperial ruler"], achievements: ["Oral composition and transmission of Vedic hymns"], monuments: ["No securely identified surviving monument"], references: ["Standard academic histories of ancient South Asia"] },
  { id: "later-vedic", periodId: "vedic", year: -800, date: "c. 1000–600 BCE (approximate)", title: "Later Vedic communities", summary: "Agriculture, iron use, and settled communities expanded in parts of the Ganges plain; chronology varies by region and source.", rulers: ["Kuru and Panchala lineages (traditional accounts)"], achievements: ["Growth of agrarian settlements and ritual traditions"], monuments: ["Archaeological sites of the upper Ganges plain"], references: ["Archaeological Survey of India"] },
  { id: "mahajanapadas", periodId: "vedic", year: -600, date: "c. 600 BCE", title: "Mahajanapadas emerge", summary: "Texts describe a landscape of sixteen major states and republics, alongside new cities, trade, and religious movements.", rulers: ["Multiple regional rulers and gana-sanghas"], achievements: ["Urban growth", "New political and religious traditions"], monuments: ["Rajgir", "Vaishali"], references: ["Archaeological Survey of India"] },
  { id: "chandragupta", periodId: "maurya", year: -321, date: "c. 321 BCE (approximate)", title: "Maurya rule begins", summary: "Chandragupta Maurya established a powerful kingdom centered on Magadha; accounts of the empire's early chronology differ.", rulers: ["Chandragupta Maurya"], achievements: ["Consolidation of a large north Indian empire"], monuments: ["Pataliputra archaeological remains"], references: ["Archaeological Survey of India"] },
  { id: "ashoka", periodId: "maurya", year: -268, date: "c. 268–232 BCE (approximate)", title: "Ashoka's reign and inscriptions", summary: "Ashoka's inscriptions, distributed across the subcontinent, communicate principles of dhamma and document imperial administration.", rulers: ["Ashoka"], achievements: ["Rock and pillar edicts", "Public works and diplomatic outreach"], monuments: ["Sanchi Stupa", "Ashokan Pillar at Sarnath"], references: ["Archaeological Survey of India", "UNESCO World Heritage Centre — Sanchi"] },
  { id: "sanchi-gateway", periodId: "maurya", year: -150, date: "c. 2nd–1st century BCE", title: "Sanchi's stone monuments expand", summary: "The stupa complex was enlarged and its carved gateways added in later centuries; these works postdate Ashoka and have approximate dates.", rulers: ["Shunga and Satavahana-era patrons"], achievements: ["Development of Buddhist architectural and narrative sculpture"], monuments: ["Great Stupa at Sanchi"], references: ["UNESCO World Heritage Centre — Buddhist Monuments at Sanchi"] },
  { id: "gupta-foundation", periodId: "gupta", year: 320, date: "c. 320 CE (approximate)", title: "Gupta imperial power rises", summary: "Chandragupta I's reign is often used as a marker for Gupta expansion, though the chronology is reconstructed from inscriptions and coins.", rulers: ["Chandragupta I"], achievements: ["Expansion of royal authority and regional alliances"], monuments: ["Early Gupta temple sites"], references: ["Archaeological Survey of India"] },
  { id: "samudragupta", periodId: "gupta", year: 350, date: "mid-4th century CE (approximate)", title: "Samudragupta's campaigns", summary: "The Allahabad pillar inscription records campaigns and political relationships during Samudragupta's reign; the account reflects royal commemoration.", rulers: ["Samudragupta"], achievements: ["Court poetry and inscriptional record", "Regional diplomacy and campaigns"], monuments: ["Ashokan Pillar at Prayagraj"], references: ["Archaeological Survey of India"] },
  { id: "aryabhata", periodId: "gupta", year: 499, date: "499 CE (text date)", title: "Aryabhata writes the Aryabhatiya", summary: "The astronomer Aryabhata dated his work to 499 CE, an important landmark in the history of mathematical astronomy.", rulers: ["Chandragupta II (earlier reign); regional Gupta rulers"], achievements: ["Mathematical astronomy and place-value notation"], monuments: ["Nalanda region"], references: ["Aryabhatiya, dated 499 CE"] },
  { id: "qutub", periodId: "sultanate", year: 1206, date: "c. 1200–1220 CE", title: "Qutub Minar complex develops", summary: "The minaret was begun under Qutb al-Din Aibak and continued under Iltutmish; construction and repair unfolded in stages.", rulers: ["Qutb al-Din Aibak", "Iltutmish"], achievements: ["Early Sultanate-era monumental architecture in Delhi"], monuments: ["Qutub Minar", "Quwwat-ul-Islam Mosque"], references: ["UNESCO World Heritage Centre — Qutb Minar and its Monuments", "Archaeological Survey of India"] },
  { id: "khalji", periodId: "sultanate", year: 1303, date: "1296–1316 CE", title: "Alauddin Khalji's reign", summary: "The Khalji court expanded its authority and introduced notable market and military measures, recorded in later chronicles.", rulers: ["Alauddin Khalji"], achievements: ["Administrative and market reforms", "Expansion of Sultanate power"], monuments: ["Siri Fort remains", "Alai Darwaza"], references: ["Archaeological Survey of India"] },
  { id: "tughlaq", periodId: "sultanate", year: 1327, date: "1327 CE (approximate)", title: "Capital shifts to Daulatabad", summary: "Muhammad bin Tughluq's attempted shift of the capital toward Daulatabad is described in historical chronicles; its scope and sequence are debated.", rulers: ["Muhammad bin Tughluq"], achievements: ["Major fortification and urban projects"], monuments: ["Daulatabad Fort", "Tughlaqabad Fort"], references: ["Archaeological Survey of India"] },
  { id: "panipat-1526", periodId: "mughal", year: 1526, date: "1526 CE", title: "First Battle of Panipat", summary: "Babur's victory over Ibrahim Lodi marked the start of Mughal rule in northern India, though consolidation followed over time.", rulers: ["Babur", "Ibrahim Lodi"], achievements: ["Establishment of a new imperial dynasty"], monuments: ["Panipat historic battlefield"], references: ["Archaeological Survey of India"] },
  { id: "akbar", periodId: "mughal", year: 1571, date: "1556–1605 CE", title: "Akbar's reign and imperial expansion", summary: "Akbar expanded the empire and developed court institutions and alliances across diverse regions.", rulers: ["Akbar"], achievements: ["Administrative reorganization", "Court arts and architectural patronage"], monuments: ["Fatehpur Sikri", "Agra Fort"], references: ["UNESCO World Heritage Centre — Fatehpur Sikri"] },
  { id: "taj", periodId: "mughal", year: 1648, date: "c. 1632–1653 CE", title: "Taj Mahal construction", summary: "Shah Jahan commissioned the mausoleum at Agra; construction took place over many years and completion dates are reported differently.", rulers: ["Shah Jahan"], achievements: ["Monumental marble architecture and garden planning"], monuments: ["Taj Mahal", "Agra Fort"], references: ["UNESCO World Heritage Centre — Taj Mahal", "Archaeological Survey of India"] },
  { id: "shivaji", periodId: "maratha", year: 1674, date: "1674 CE", title: "Shivaji is crowned at Raigad", summary: "The coronation at Raigad formalized Shivaji's kingship and the emerging Maratha state.", rulers: ["Chhatrapati Shivaji Maharaj"], achievements: ["State institutions and regional fort networks"], monuments: ["Raigad Fort", "Pratapgad Fort"], references: ["Archaeological Survey of India"] },
  { id: "peshwa", periodId: "maratha", year: 1713, date: "1713 CE", title: "Peshwa office gains prominence", summary: "Balaji Vishwanath's appointment as Peshwa marked the growing influence of the office in Maratha politics.", rulers: ["Shahu I", "Balaji Vishwanath"], achievements: ["Expansion of Maratha confederate administration"], monuments: ["Shaniwar Wada (built later)"], references: ["Archaeological Survey of India"] },
  { id: "panipat-1761", periodId: "maratha", year: 1761, date: "1761 CE", title: "Third Battle of Panipat", summary: "The battle was a major turning point in north Indian politics; Maratha power continued in new forms in the decades that followed.", rulers: ["Peshwa Balaji Baji Rao", "Ahmad Shah Durrani"], achievements: ["Reshaped regional alliances and political balance"], monuments: ["Panipat historic battlefield"], references: ["Archaeological Survey of India"] },
  { id: "plassey", periodId: "colonial", year: 1757, date: "1757 CE", title: "Battle of Plassey", summary: "The East India Company's victory in Bengal strengthened its political influence; it was one stage in a longer process of expansion.", rulers: ["Robert Clive", "Siraj ud-Daulah"], achievements: ["Company power expanded in Bengal"], monuments: ["Palashi battlefield region"], references: ["National Archives of India"] },
  { id: "revolt-1857", periodId: "colonial", year: 1857, date: "1857–1858 CE", title: "Revolt of 1857", summary: "A major uprising against Company rule involved soldiers, rulers, and communities across several regions, with varied local aims.", rulers: ["Bahadur Shah Zafar", "Rani Lakshmibai", "Nana Sahib"], achievements: ["Brought an end to East India Company rule"], monuments: ["Red Fort", "Jhansi Fort"], references: ["National Archives of India", "Archaeological Survey of India"] },
  { id: "independence", periodId: "colonial", year: 1947, date: "15 August 1947", title: "India becomes independent", summary: "India gained independence as British rule ended; Partition accompanied independence and displaced millions of people.", rulers: ["Jawaharlal Nehru (first Prime Minister)"], achievements: ["End of British colonial rule", "Creation of an independent state"], monuments: ["Red Fort", "India Gate"], references: ["National Archives of India"] },
  { id: "republic", periodId: "modern", year: 1950, date: "26 January 1950", title: "India becomes a republic", summary: "The Constitution came into effect, establishing the Republic of India and its constitutional institutions.", rulers: ["Dr. Rajendra Prasad", "Jawaharlal Nehru"], achievements: ["Constitutional republic established"], monuments: ["Parliament House, New Delhi"], references: ["Constitution of India", "National Archives of India"] },
  { id: "space", periodId: "modern", year: 2023, date: "23 August 2023", title: "Chandrayaan-3 lands near the lunar south pole", summary: "India's lander made a successful lunar landing, a milestone in the country's space program.", rulers: ["No monarch; Republic of India"], achievements: ["Successful lunar surface landing"], monuments: ["Indian Space Research Organisation facilities"], references: ["Indian Space Research Organisation (ISRO)"] },
];

export const timelineDynastiesByEvent: Record<string, string> = {
  "harappa-urban": "Harappan communities",
  dholavira: "Harappan communities",
  "indus-transition": "Harappan communities",
  rigveda: "Kuru-Panchala",
  "later-vedic": "Kuru-Panchala",
  mahajanapadas: "Mahajanapadas",
  chandragupta: "Maurya",
  ashoka: "Maurya",
  "sanchi-gateway": "Shunga and Satavahana patrons",
  "gupta-foundation": "Gupta",
  samudragupta: "Gupta",
  aryabhata: "Gupta",
  qutub: "Mamluk",
  khalji: "Khalji",
  tughlaq: "Tughlaq",
  "panipat-1526": "Mughal",
  akbar: "Mughal",
  taj: "Mughal",
  shivaji: "Bhonsle",
  peshwa: "Peshwa",
  "panipat-1761": "Peshwa",
  plassey: "East India Company",
  "revolt-1857": "British Raj",
  independence: "British Raj",
  republic: "Republic of India",
  space: "Republic of India",
};

export const timelineApiPaths = {
  explore: "/api/timeline/explore",
  events: "/api/timeline/events",
} as const;

export type TimelineExploreRequest = {
  year: number;
  periodId: string;
  dynasty?: string;
  eventId?: string;
};

export type TimelineEventsResponse = {
  events: TimelineEvent[];
};

export function formatHistoricalYear(year: number) {
  return year < 0 ? `${Math.abs(year).toLocaleString()} BCE` : `${year.toLocaleString()} CE`;
}
