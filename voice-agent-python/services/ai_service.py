"""
AI Service Module for TimeTravel Voice Companion.
Integrates with Google Gemini API and OpenAI API with seamless fallback
to an explicitly labelled historical Demo Mode when no API key is provided.
"""

import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

# System prompt tuned for a historical museum voice guide
HISTORICAL_GUIDE_PROMPT = """You are the TimeTravel Voice Companion, a distinguished and captivating historical guide inside an interactive digital museum.

Your purpose is to answer the traveler's questions about ancient, medieval, and modern world history—with special expertise in Indian heritage, monuments, and civilizations.

Your voice output will be read aloud through speech synthesis, so adhere to these guidelines:
1. Explain historical events in clear, engaging, and accessible language.
2. Provide authentic historical context: key eras, dates, dynasties, geographical regions, and notable figures.
3. Distinguish established historical facts from legends, oral folklore, or historical uncertainties.
4. Never invent sources, archaeological findings, or dates. If something is unknown, debated, or lost to antiquity, state that honestly.
5. Keep your responses concise (2 to 3 short paragraphs, roughly 100 to 180 words) so they sound natural and engaging when spoken aloud, unless the user explicitly requests an exhaustive breakdown.
6. Avoid complex formatting, markdown tables, raw URLs, asterisks, bullet marks, or strange punctuation that could cause speech synthesizers to stutter.
7. Use the recent conversation context to provide smooth, natural follow-up responses.
"""

# Bundled sample knowledge base for offline / demo mode
DEMO_RESPONSES = {
    "hampi": (
        "Hampi, located along the Tungabhadra River in Karnataka, was the majestic 14th-century capital of the Vijayanagara Empire. "
        "Founded around 1336 by the brothers Harihara and Bukka Raya, it grew into one of the world's largest and wealthiest metropolitan centres by the 16th century, especially under Emperor Krishnadevaraya.\n\n"
        "Travelers from Persia and Portugal marveled at its grand bazaars where diamonds and pearls were traded freely. "
        "The city's breathtaking Dravidian architecture is preserved today in the iconic stone chariot of the Vittala Temple and the towering Virupaksha Temple. "
        "Following the Battle of Talikota in 1565, Hampi was sacked and fell into ruins, surviving today as a celebrated UNESCO World Heritage Site."
    ),
    "daulatabad": (
        "Daulatabad Fort, originally known as Devagiri, stands dramatically atop a 200-meter conical hill near Aurangabad in Maharashtra. "
        "Built in the 12th century by the Yadava dynasty, it was renowned as one of the most impregnable medieval citadels in the Indian subcontinent.\n\n"
        "Its defensive engineering was formidable: featuring steep scarped rock faces, a deep crocodile-infested moat, deceptive acoustic chambers, and the famous 'Andhari'—a subterranean pitch-black labyrinth where torches would mislead attackers into boiling cauldrons or steep drops. "
        "In 1327, Sultan Muhammad bin Tughlaq famously ordered the entire imperial capital moved from Delhi to Daulatabad, though severe logistical and water challenges eventually forced an arduous retreat back north."
    ),
    "indus": (
        "The Indus Valley Civilization, flourishing between 2600 and 1900 BCE across modern-day India and Pakistan, was one of the world's earliest and most advanced urban societies alongside ancient Mesopotamia and Egypt.\n\n"
        "Major settlements like Harappa, Mohenjo-daro, and the coastal dockyard at Lothal showcased sophisticated civil engineering: uniform baked brick architecture, covered underground drainage systems, granaries, and the Great Bath. "
        "The civilization maintained maritime trade routes with ancient Sumeria and crafted exquisite steatite seals with a script that remains undeciphered. "
        "Rather than warfare, environmental shifts like tectonic changes and drying river systems are widely believed to have caused its gradual urban decline."
    ),
    "mughal": (
        "The Mughal Empire dominated South Asia from 1526 until the mid-19th century, founded by Babur after his decisive victory at the First Battle of Panipat. "
        "It reached its political, cultural, and architectural pinnacle between the 16th and 17th centuries under emperors like Akbar the Great, Shah Jahan, and Aurangzeb.\n\n"
        "Akbar established an efficient centralized administrative system, fostered interfaith dialogue through his philosophy of Sulh-i-kul, and welcomed art and literature. "
        "This era synthesized Persian, Central Asian, and Indian architectural styles, leaving humanity monuments of sublime beauty including the Taj Mahal, the Red Fort, Fatehpur Sikri, and Humayun's Tomb. "
        "Internal succession conflicts and rising regional powers, notably the Marathas and European trading companies, contributed to the empire's eventual decline."
    ),
    "maurya": (
        "The Maurya and Gupta empires represent two golden milestones of classical Indian civilization, each leaving a distinct imperial legacy.\n\n"
        "The Maurya Empire, founded around 322 BCE by Chandragupta Maurya and philosopher Chanakya, was a vast centralized state spanning almost the entire subcontinent. "
        "Its third ruler, Emperor Ashoka, transformed after the brutal Kalinga War, renouncing violence and propagating Buddhist principles of peace through stone-inscribed edicts across Asia.\n\n"
        "In contrast, the Gupta Empire, flourishing from the 4th to 6th centuries CE, is hailed as classical India's Golden Age. "
        "Characterized by cultural flowering, scientific breakthroughs by mathematicians like Aryabhata, the timeless Sanskrit dramas of Kalidasa, and decentralized regional autonomy, the Guptas ushered in profound developments in metallurgy, astronomy, and classical temple art."
    ),
    "ajanta": (
        "The Ajanta and Ellora Caves, nestled in Maharashtra, represent twenty-nine rock-cut Buddhist monument caves at Ajanta dating from the 2nd century BCE to the 5th century CE, and thirty-four multi-faith monuments at Ellora.\n\n"
        "Ajanta is celebrated worldwide for its expressive mural frescoes depicting the Jataka tales of the Buddha's past lives, executed with masterly shading and emotion. "
        "Meanwhile, Ellora's highlight is the astounding Kailasa Temple—a colossal monolithic temple carved entirely from the top downward out of a single volcanic basalt cliff, an unmatched feat of medieval rock engineering."
    ),
    "konark": (
        "The 13th-century Konark Sun Temple in Odisha was conceived as a monumental stone chariot for Surya, the Sun God. "
        "Commissioned by King Narasimhadeva I of the Eastern Ganga Dynasty around 1250 CE, it is designed with twenty-four elaborately carved stone wheels that double as functioning sundials, pulled by seven galloping stone horses representing the days of the week."
    ),
    "nalanda": (
        "Nalanda Mahavihara, located in ancient Magadha in Bihar, was the ancient world's premier residential university. "
        "Founded in the 5th century CE under the Gupta emperors, it housed over ten thousand students and two thousand teachers from China, Korea, Tibet, and Central Asia. "
        "Its legendary multi-story library, Dharmaganja, housed millions of manuscripts on medicine, logic, mathematics, astronomy, and philosophy before its destruction in the late 12th century."
    )
}


class AIService:
    """Manages AI interactions with Google Gemini, OpenAI, or bundles demo historical answers."""

    def __init__(self, gemini_key=None, gemini_model=None, openai_key=None, openai_model=None):
        self.gemini_key = (gemini_key or os.getenv("GEMINI_API_KEY", "")).strip()
        self.gemini_model = (gemini_model or os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")).strip()

        self.openai_key = (openai_key or os.getenv("OPENAI_API_KEY", "")).strip()
        self.openai_model = (openai_model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")).strip()

        self.openai_client = None
        self._init_providers()

    def _init_providers(self):
        """Determine active provider based on configured API keys."""
        # 1. Check Gemini Key
        if self.gemini_key and not self.gemini_key.startswith("your-") and len(self.gemini_key) > 10:
            logger.info(f"Gemini API configured with model: {self.gemini_model}")
            return

        # 2. Check OpenAI Key
        if self.openai_key and not self.openai_key.startswith("your-") and len(self.openai_key) > 10:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=self.openai_key, timeout=18.0)
                logger.info(f"OpenAI client initialized with model: {self.openai_model}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        else:
            logger.info("No AI key detected. Operating in Demo Mode.")

    @property
    def is_configured(self):
        """Check if any live AI provider is active."""
        has_gemini = bool(self.gemini_key and len(self.gemini_key) > 10 and not self.gemini_key.startswith("your-"))
        has_openai = bool(self.openai_client is not None)
        return has_gemini or has_openai

    def get_status(self):
        """Return provider configuration info for health checks."""
        if self.gemini_key and len(self.gemini_key) > 10:
            return {
                "ai_configured": True,
                "mode": "live",
                "model": self.gemini_model,
                "provider": "Google Gemini"
            }
        elif self.openai_client:
            return {
                "ai_configured": True,
                "mode": "live",
                "model": self.openai_model,
                "provider": "OpenAI"
            }
        else:
            return {
                "ai_configured": False,
                "mode": "demo",
                "model": "historical-demo-v1",
                "provider": "Built-in Historical Knowledge"
            }

    def generate_response(self, question, history=None):
        """
        Generate an answer for the user's historical query.
        Returns a tuple: (response_text, mode_str) where mode is 'live' or 'demo'.
        """
        # Try Gemini if key is provided
        if self.gemini_key and len(self.gemini_key) > 10:
            try:
                return self._call_gemini(question, history=history)
            except Exception as e:
                logger.error(f"Gemini call failed: {e}; falling back.")
                demo_text = self._match_demo_response(question)
                return f"{demo_text}\n\n[Note: Temporary Gemini API error: {e}]", "demo"

        # Try OpenAI if configured
        if self.openai_client:
            try:
                return self._call_openai(question, history=history)
            except Exception as e:
                logger.error(f"OpenAI call failed ({e}); falling back to demo mode.")
                demo_text = self._match_demo_response(question)
                return f"{demo_text}\n\n[Note: Temporary OpenAI API error: {e}]", "demo"

        # Demo mode fallback
        demo_text = self._match_demo_response(question)
        return demo_text, "demo"

    def _call_gemini(self, question, history=None):
        """Execute request via Google Generative Language REST API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"

        contents = []

        # Multi-turn history formatting for Gemini
        if history and isinstance(history, list):
            for turn in history:
                role = "user" if turn.get("role") == "user" else "model"
                content = turn.get("content", "")
                if content:
                    contents.append({"role": role, "parts": [{"text": content}]})

        # Append current user prompt
        contents.append({"role": "user", "parts": [{"text": question}]})

        payload = {
            "system_instruction": {
                "parts": [{"text": HISTORICAL_GUIDE_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 450
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=18.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        candidates = data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip(), "live"

        raise RuntimeError("Empty response received from Gemini API.")

    def _call_openai(self, question, history=None):
        """Execute request via the OpenAI SDK."""
        messages = [{"role": "system", "content": HISTORICAL_GUIDE_PROMPT}]

        if history and isinstance(history, list):
            for turn in history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": question})

        response = self.openai_client.chat.completions.create(
            model=self.openai_model,
            messages=messages,
            temperature=0.7,
            max_tokens=450
        )

        answer = response.choices[0].message.content.strip()
        return answer, "live"

    def _match_demo_response(self, question):
        """
        Match question against bundled historical knowledge base.
        """
        q_lower = question.lower()

        if any(w in q_lower for w in ["hampi", "vijayanagar", "tungabhadra", "vittala"]):
            return DEMO_RESPONSES["hampi"]
        elif any(w in q_lower for w in ["daulatabad", "devagiri", "yadava", "tughlaq", "andhari"]):
            return DEMO_RESPONSES["daulatabad"]
        elif any(w in q_lower for w in ["indus", "harappa", "mohenjo", "lothal", "bronze age"]):
            return DEMO_RESPONSES["indus"]
        elif any(w in q_lower for w in ["mughal", "babur", "akbar", "shah jahan", "taj mahal", "aurangzeb"]):
            return DEMO_RESPONSES["mughal"]
        elif any(w in q_lower for w in ["maurya", "gupta", "ashoka", "chanakya", "chandragupta", "aryabhata"]):
            return DEMO_RESPONSES["maurya"]
        elif any(w in q_lower for w in ["ajanta", "ellora", "kailasa", "fresco"]):
            return DEMO_RESPONSES["ajanta"]
        elif any(w in q_lower for w in ["konark", "sun temple", "narasimhadeva"]):
            return DEMO_RESPONSES["konark"]
        elif any(w in q_lower for w in ["nalanda", "university", "library", "dharmaganja"]):
            return DEMO_RESPONSES["nalanda"]
        else:
            return (
                "Greetings, time traveler! I am your TimeTravel Voice Companion operating in Historical Demo Mode. "
                f"You asked: \"{question}\".\n\n"
                "In this offline demonstration, I am equipped with detailed chronicles for landmark topics such as "
                "the Vijayanagara capital at Hampi, Daulatabad Fort's defenses, the Indus Valley Civilization, "
                "the Mughal Empire, and comparisons between the Maurya and Gupta dynasties."
            )
