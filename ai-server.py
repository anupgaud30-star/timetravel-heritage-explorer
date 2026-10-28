#!/usr/bin/env python3
"""
TimeTravel AI Server — Minimal standalone AI backend.
Uses only Python stdlib (no Flask needed). Calls Google Gemini API.
Run:  python3 ai-server.py
"""

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Configuration ─────────────────────────────────────────────────────────────

PORT = 5050
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL   = os.environ.get("GEMINI_MODEL",   "gemini-3.5-flash-lite").strip()

# Try to load from .env in same dir or voice-agent-python/.env
def _load_dotenv(path):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except FileNotFoundError:
        pass

_script_dir = os.path.dirname(os.path.abspath(__file__))
_load_dotenv(os.path.join(_script_dir, ".env"))
_load_dotenv(os.path.join(_script_dir, "voice-agent-python", ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL   = os.environ.get("GEMINI_MODEL",   "gemini-3.5-flash-lite").strip()

SYSTEM_PROMPT = (
    "You are the TimeTravel Voice Companion & Heritage Guide, an engaging, knowledgeable, and articulate historical guide. "
    "When asked about any place, city, temple, monument, landmark, or historical event (such as Mumbai, Ram Mandir Ayodhya, "
    "Delhi, Varanasi, Taj Mahal, Konark, Hampi, or any other location worldwide), provide clear, captivating, and accurate "
    "information covering its history, architectural wonder, cultural significance, and key highlights. "
    "Deliver crisp, fluent responses (1 to 2 short paragraphs, ~80-120 words) perfectly suited for spoken voice delivery. "
    "Do not use bullet points, asterisks, markdown symbols, or URLs. Speak naturally and warmly."
)

DEMO_ANSWERS = {
    "ram mandir":  "The Ram Mandir in Ayodhya is a monumental Hindu temple complex consecrated in January 2024 at the birthplace of Lord Rama along the sacred Sarayu River in Uttar Pradesh. Designed in the classical Nagara architectural style by the Sompura family of temple architects, it is constructed from carved pink Bansi Paharpur sandstone without structural steel. The temple features three stories, five magnificent mandapas, and intricately carved spires.",
    "ayodhya":     "Ayodhya is an ancient sacred city in Uttar Pradesh along the Sarayu River, revered as the historic capital of the Ikshvaku dynasty and the birthplace of Lord Rama. Celebrated in the epic Ramayana, the city is a timeless pilgrimage destination home to ancient ghats, Hanuman Garhi, and the grand Ram Janmabhoomi temple.",
    "mumbai":      "Mumbai, the capital of Maharashtra and India's financial powerhouse, evolved from seven coastal fishing islands of the Koli community. Across centuries under Portuguese and British rule, the islands were merged through landmark land reclamation into a sprawling metropolis. Today Mumbai is world-renowned for its Victorian Gothic and Art Deco heritage, the Gateway of India, bustling bazaars, Marine Drive, and the vibrant Indian film industry.",
    "hampi":       "Hampi was the ceremonial and commercial heart of the Vijayanagara Empire, flourishing between the 14th and 16th centuries along the Tungabhadra River in Karnataka. Under rulers like Krishnadevaraya it became one of the wealthiest cities of the medieval world. The city was sacked after the Battle of Talikota in 1565 and is today a UNESCO World Heritage Site.",
    "daulatabad":  "Daulatabad Fort, originally called Devagiri, was built by the Yadava dynasty in the 12th century. It sits atop a 200-metre conical rock in Maharashtra and features deep moats, a pitch-dark labyrinth, and clever defensive architecture. Sultan Muhammad bin Tughluq famously tried to move his capital here from Delhi in 1327.",
    "indus":       "The Indus Valley Civilisation thrived between roughly 2600 and 1900 BCE across what is now Pakistan and northwest India. Cities like Harappa, Mohenjo-daro, and Dholavira featured advanced urban planning with covered drains, granaries, and standardised bricks. Their water harvesting systems remain an engineering marvel.",
    "mughal":      "The Mughal Empire shaped South Asia from Babur's victory at Panipat in 1526 until the 19th century. It reached its cultural peak under Akbar, Shah Jahan, and Aurangzeb, producing monuments like the Taj Mahal, Red Fort, and Fatehpur Sikri, blending Persian, Central Asian, and Indian architectural traditions.",
    "maurya":      "The Maurya Empire (c. 322–185 BCE) was unified by Chandragupta Maurya and his strategist Chanakya. Emperor Ashoka later spread Buddhism and ethical rock edicts across the subcontinent. The later Gupta Empire is remembered as a golden age of mathematics, astronomy, and classical Sanskrit arts.",
    "varanasi":    "Varanasi, also known as Kashi or Banaras, is one of the oldest continuously inhabited cities on Earth, situated along the sacred Ganges River in Uttar Pradesh. Renowned for its ancient river ghats, morning aarti rituals, and Kashi Vishwanath Temple, it represents the spiritual epicenter of Indian philosophy and music.",
    "somnath":     "The Somnath Temple in Prabhas Patan, Gujarat, is the first among the twelve sacred Jyotirlinga shrines of Lord Shiva. Standing proudly on the coast of the Arabian Sea, it has been rebuilt several times through history, with the present magnificent temple constructed in the Chalukya architectural style in 1951.",
}

def demo_answer(query: str) -> str:
    q = query.lower()
    for key, ans in DEMO_ANSWERS.items():
        if key in q:
            return ans
    return (f"{query.capitalize()} is an important historical and cultural site in India. "
            "You can explore its full history, architecture, and significance using our voice guide.")


def call_gemini(query: str) -> str:
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}")
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": query}]}],
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 200
        },
    }
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(url, data=data,
                                  headers={"Content-Type": "application/json"},
                                  method="POST")
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())
    text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
    return text


def call_gemini_audio(audio_b64: str, mime_type: str = "audio/webm") -> dict:
    clean_mime = mime_type.split(";")[0].strip() or "audio/webm"
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}")
    payload = {
        "system_instruction": {
            "parts": [{
                "text": (
                    "You are the TimeTravel Voice Companion & Heritage Guide. "
                    "Listen to the user's spoken voice. First transcribe what the user asked. "
                    "Then answer their question clearly, accurately and warmly in 1 to 2 spoken paragraphs (~80-120 words). "
                    "Do not use markdown symbols, bullet points, asterisks, or URLs. "
                    "Format your response exactly as: Question: <transcription>\n\nAnswer: <your answer>"
                )
            }]
        },
        "contents": [{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": clean_mime, "data": audio_b64}},
                {"text": "Please transcribe what I spoke and provide your guide answer."}
            ]
        }],
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 280,
        },
    }
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(url, data=data,
                                  headers={"Content-Type": "application/json"},
                                  method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    raw_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()

    if "Question:" in raw_text and "Answer:" in raw_text:
        parts = raw_text.split("Answer:", 1)
        q = parts[0].replace("Question:", "").strip()
        ans = parts[1].strip()
        return {"question": q, "answer": ans}
    return {"question": "Your spoken question", "answer": raw_text}


ALLOWED_ORIGINS = {"http://localhost:8080", "http://127.0.0.1:8080"}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[AI Server] {fmt % args}")

    def _cors(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin if origin else "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            body = json.dumps({
                "status": "healthy",
                "service": "TimeTravel AI Server",
                "ai_configured": bool(GEMINI_API_KEY),
                "mode": "live" if GEMINI_API_KEY else "demo",
                "model": GEMINI_MODEL,
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/api/ai/chat":
            self.send_response(404)
            self.end_headers()
            return

        length  = int(self.headers.get("Content-Length", 0))
        raw     = self.rfile.read(length)
        try:
            body = json.loads(raw)
        except Exception:
            body = {}

        audio_b64 = body.get("audio")
        mime_type = body.get("mimeType") or "audio/webm"
        query = (body.get("message") or body.get("question") or "").strip()

        # Handle voice audio payload
        if audio_b64:
            if not GEMINI_API_KEY:
                answer = demo_answer("Tell me about Indian heritage")
                self._json(200, {
                    "question": "Spoken question",
                    "answer": answer,
                    "response": answer,
                    "mode": "demo",
                    "sources": [{"title": "Archaeological Survey of India", "url": "https://asi.nic.in"}]
                })
                return
            try:
                res = call_gemini_audio(audio_b64, mime_type)
                self._json(200, {
                    "question": res.get("question", "Spoken inquiry"),
                    "answer": res.get("answer", ""),
                    "response": res.get("answer", ""),
                    "mode": "backend",
                    "sources": [{"title": "Archaeological Survey of India", "url": "https://asi.nic.in"},
                                {"title": "UNESCO World Heritage Centre", "url": "https://whc.unesco.org"}]
                })
                return
            except Exception as exc:
                print(f"[AI Server] Gemini audio error: {exc}")
                fallback_ans = "I received your voice recording! Feel free to ask about any Indian monument, temple, or historic city."
                self._json(200, {
                    "question": "Spoken question",
                    "answer": fallback_ans,
                    "response": fallback_ans,
                    "mode": "backend",
                    "sources": [{"title": "Archaeological Survey of India", "url": "https://asi.nic.in"}]
                })
                return

        if not query:
            self._json(400, {"error": "message, question, or audio field is required"})
            return
        if len(query) > 2000:
            self._json(400, {"error": "Question too long (max 2000 characters)"})
            return

        if not GEMINI_API_KEY:
            answer = demo_answer(query)
            self._json(200, {"question": query, "answer": answer, "response": answer, "mode": "demo",
                             "sources": [{"title": "Archaeological Survey of India",
                                          "url": "https://asi.nic.in"}]})
            return

        try:
            answer = call_gemini(query)
            self._json(200, {"question": query, "answer": answer, "response": answer, "mode": "backend",
                             "sources": [{"title": "Archaeological Survey of India",
                                          "url": "https://asi.nic.in"},
                                         {"title": "UNESCO World Heritage Centre",
                                          "url": "https://whc.unesco.org"}]})
        except Exception as exc:
            print(f"[AI Server] Gemini error: {exc}")
            answer = demo_answer(query)
            self._json(200, {"question": query, "answer": answer, "response": answer, "mode": "demo",
                             "sources": [{"title": "Archaeological Survey of India",
                                          "url": "https://asi.nic.in"}]})

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    key_status = "CONFIGURED ✓" if GEMINI_API_KEY else "NOT SET — demo mode"
    print(f"")
    print(f"  ✦  TimeTravel AI Server")
    print(f"  ✦  http://localhost:{PORT}")
    print(f"  ✦  Model : {GEMINI_MODEL}")
    print(f"  ✦  Key   : {key_status}")
    print(f"")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[AI Server] Stopped.")
        sys.exit(0)
