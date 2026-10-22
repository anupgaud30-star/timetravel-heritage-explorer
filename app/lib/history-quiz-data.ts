export type QuizDifficulty = "Easy" | "Medium" | "Hard";
export type QuizCategory = "Monument" | "Dynasty" | "Ruler" | "Event";

export type QuizQuestion = {
  id: string;
  difficulty: QuizDifficulty;
  category: QuizCategory;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export const quizDifficulties: QuizDifficulty[] = ["Easy", "Medium", "Hard"];
export const quizCategories: QuizCategory[] = ["Monument", "Dynasty", "Ruler", "Event"];

export const historyQuizQuestions: QuizQuestion[] = [
  { id: "easy-monument-sanchi", difficulty: "Easy", category: "Monument", prompt: "Which Buddhist site is famous for its Great Stupa and carved gateways?", options: ["Sanchi", "Konark", "Hampi", "Daulatabad"], answerIndex: 0, explanation: "The Great Stupa at Sanchi is surrounded by stone railings and elaborately carved gateways known as toranas." },
  { id: "easy-dynasty-maurya", difficulty: "Easy", category: "Dynasty", prompt: "Which dynasty was Ashoka part of?", options: ["Maurya", "Pallava", "Mughal", "Chola"], answerIndex: 0, explanation: "Ashoka was a Mauryan emperor; his inscriptions are found across many parts of the subcontinent." },
  { id: "easy-ruler-akbar", difficulty: "Easy", category: "Ruler", prompt: "Which Mughal ruler commissioned Fatehpur Sikri as an imperial city?", options: ["Akbar", "Babur", "Aurangzeb", "Shah Jahan"], answerIndex: 0, explanation: "Akbar developed Fatehpur Sikri in the 16th century and used it as an imperial capital for a period." },
  { id: "easy-event-independence", difficulty: "Easy", category: "Event", prompt: "In which year did India become independent from British rule?", options: ["1947", "1857", "1950", "1757"], answerIndex: 0, explanation: "India became independent on 15 August 1947. The Constitution came into effect later, on 26 January 1950." },
  { id: "medium-monument-konark", difficulty: "Medium", category: "Monument", prompt: "The Konark Sun Temple was designed to evoke the chariot of which deity?", options: ["Surya", "Shiva", "Vishnu", "Indra"], answerIndex: 0, explanation: "The 13th-century temple is conceived as the stone chariot of Surya, the Sun God." },
  { id: "medium-dynasty-vijayanagara", difficulty: "Medium", category: "Dynasty", prompt: "Hampi was the capital of which major South Indian empire?", options: ["Vijayanagara Empire", "Maurya Empire", "Pala Empire", "Delhi Sultanate"], answerIndex: 0, explanation: "Hampi contains the remains of Vijayanagara, a major imperial capital that flourished from the 14th century onward." },
  { id: "medium-ruler-shahjahan", difficulty: "Medium", category: "Ruler", prompt: "Which Mughal emperor commissioned the Taj Mahal?", options: ["Shah Jahan", "Humayun", "Akbar", "Jahangir"], answerIndex: 0, explanation: "Shah Jahan commissioned the mausoleum at Agra in memory of Mumtaz Mahal; construction unfolded over many years." },
  { id: "medium-event-panipat", difficulty: "Medium", category: "Event", prompt: "Babur's victory over Ibrahim Lodi in 1526 is known as which battle?", options: ["First Battle of Panipat", "Battle of Plassey", "Battle of Talikota", "Third Battle of Panipat"], answerIndex: 0, explanation: "The First Battle of Panipat in 1526 helped establish Mughal power in northern India." },
  { id: "hard-monument-ajanta", difficulty: "Hard", category: "Monument", prompt: "Which dynasty is especially associated with the later major phase of Ajanta's cave paintings?", options: ["Vakataka", "Lodi", "Pallava", "Khalji"], answerIndex: 0, explanation: "The later major phase of Ajanta is associated with Vakataka-era patronage, particularly during the reign of Harisena." },
  { id: "hard-dynasty-eastern-ganga", difficulty: "Hard", category: "Dynasty", prompt: "Which dynasty ruled when Narasimhadeva I commissioned the Konark Sun Temple?", options: ["Eastern Ganga", "Chola", "Kachwaha", "Rashtrakuta"], answerIndex: 0, explanation: "Narasimhadeva I of the Eastern Ganga dynasty commissioned the temple, generally dated to around 1250 CE." },
  { id: "hard-ruler-ashoka", difficulty: "Hard", category: "Ruler", prompt: "What term appears prominently in Ashoka's inscriptions to describe a set of ethical and social principles?", options: ["Dhamma", "Din-i Ilahi", "Arthashastra", "Swaraj"], answerIndex: 0, explanation: "Ashoka's edicts discuss dhamma. Interpretations of the term and its application are a subject of historical study." },
  { id: "hard-event-plassey", difficulty: "Hard", category: "Event", prompt: "Which 1757 battle strengthened the East India Company's political influence in Bengal?", options: ["Battle of Plassey", "Battle of Buxar", "First Battle of Panipat", "Battle of Wandiwash"], answerIndex: 0, explanation: "The Company's victory at Plassey was a key step in its political expansion in Bengal, not the sole cause of later colonial rule." },
];

export const quizApiPaths = {
  questions: "/api/quiz/questions",
  submit: "/api/quiz/submit",
} as const;

export type QuizQuestionsRequest = {
  difficulty?: QuizDifficulty;
  category?: QuizCategory;
};

export type QuizQuestionsResponse = {
  questions: QuizQuestion[];
};

export type QuizSubmitRequest = {
  answers: { questionId: string; selectedOptionIndex: number }[];
};

export type QuizSubmitResponse = {
  score: number;
  total: number;
  incorrectQuestionIds: string[];
};
