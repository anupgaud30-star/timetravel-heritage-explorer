# TimeTravel Voice Companion — AI-Powered Historical Assistant

> *Explore forgotten realms. Speak with history. Uncover ancient civilizations.*

**TimeTravel Voice Companion** is a lightweight, responsive voice-interactive AI assistant built for the **TimeTravel Heritage Explorer** project. Users can speak or type historical queries, receive rich, spoken-friendly AI-generated historical explanations, and listen to the answers through speech synthesis.

The project is designed to run smoothly on standard laptops (e.g., Intel Core i5, 16 GB RAM, Windows 64-bit) without downloading heavy local AI models or unnecessary virtualization software.

---

## 🌟 Key Features

- **Voice In & Voice Out:** Built with the browser's native **Web Speech Recognition API** and **Speech Synthesis API**. No paid third-party speech API subscriptions required.
- **Museum Aesthetic UI:**
  - Dark obsidian and charcoal canvas (`#0c0d12`)
  - Radiant antique gold accents and borders (`#d4af37`)
  - Classic serif museum typography (`Cinzel` and `Cormorant Garamond`)
  - Interactive multi-ring **Animated AI Orb** with real-time state visualization (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `ERROR`)
  - Audio soundwave resonance visualizer
  - Suggested inquiry chips for Hampi, Daulatabad Fort, Indus Valley Civilization, Mughal Empire, and Maurya vs. Gupta dynasties.
- **Dual Operating Modes:**
  - **Live AI Mode:** Uses OpenAI's official Python SDK (`gpt-4o-mini` by default) with conversational context memory.
  - **Historical Demo Mode:** Built-in curated historical knowledge base for key heritage questions, ready to run offline without an API key.
- **Persistent Session Memory:** Local **SQLite database** stored in `instance/timetravel.db`, keeping conversation history, timestamps, and message records without needing a separate database server.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask 3.x |
| **Frontend** | HTML5, CSS3, Modern Vanilla JavaScript |
| **Database** | SQLite 3 (stored locally in `instance/timetravel.db`) |
| **AI Integration** | Official OpenAI Python SDK (`openai>=1.12.0`) with context memory |
| **Speech Engine** | Browser Web Speech API (`SpeechRecognition` & `speechSynthesis`) |

---

## 🗂️ Project Structure

```text
time-travel-voice-agent/
├── app.py                  # Primary Flask application and REST API endpoints
├── config.py               # Environment configuration and app settings
├── requirements.txt        # Lightweight Python dependencies
├── .env.example            # Template for environment variables
├── .env                    # Local environment secrets (excluded from git)
├── .gitignore              # Git ignore rules for venv, secrets, and SQLite DB
├── README.md               # Setup and development documentation
├── database/
│   ├── __init__.py
│   └── db.py               # SQLite connection, schema initialization, and queries
├── services/
│   ├── __init__.py
│   └── ai_service.py       # OpenAI SDK integration and offline Demo Mode knowledge
├── templates/
│   └── index.html          # TimeTravel Voice Companion museum interface
├── static/
│   ├── css/
│   │   └── style.css       # Dark charcoal, antique gold, and orb animations
│   └── js/
│       └── app.js          # Speech recognition, audio synthesis, and API sync
└── instance/
    └── timetravel.db       # Auto-created SQLite database file
```

---

## 💻 Windows Setup Guide (PowerShell)

Follow these simple steps in **Windows PowerShell**:

### 1. Verify Python Installation
Ensure Python 3.9 or newer is installed and added to your `PATH`:
```powershell
python --version
```
*(If `python` is not recognized, install Python 3.10+ from python.org and check "Add Python to PATH" during installation).*

### 2. Navigate to Project Directory
```powershell
cd time-travel-voice-agent
```

### 3. Create a Virtual Environment
```powershell
python -m venv venv
```

### 4. Activate the Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```
> *Note: If PowerShell shows an Execution Policy error, run this once: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`*

### 5. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 6. Configure Environment Variables
Copy the example configuration to create your `.env` file:
```powershell
copy .env.example .env
```

### 7. Start the Server (Demo Mode)
Run the application immediately:
```powershell
python app.py
```

### 8. Open the Application
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```
- The backend status pill in the top-right will indicate **DEMO**.
- Click **Start Listening** (or click any of the suggested question chips) to ask:
  - *"Tell me the history of Hampi."*
  - *"Why was Daulatabad Fort important?"*
  - *"Explain the Indus Valley Civilization."*
  - *"What happened during the Mughal Empire?"*
  - *"Compare the Maurya and Gupta empires."*

---

## 🔑 Activating Live AI Mode (OpenAI API)

To enable live AI generation:

1. Open your `.env` file in any text editor:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```
2. Restart the Flask application (`python app.py`).
3. Reload your browser at `http://127.0.0.1:5000`. The badge in the header will now show **LIVE AI**.

---

## 📡 REST API Documentation

### `GET /api/health`
Returns backend health and AI configuration status. Never reveals secrets.
```json
{
  "status": "healthy",
  "service": "TimeTravel Voice Companion",
  "ai_configured": true,
  "mode": "live",
  "model": "gpt-4o-mini",
  "database": "sqlite3",
  "db_path": "instance/timetravel.db"
}
```

### `POST /api/ai/chat`
Processes historical questions with context memory and saves to SQLite.
**Request Body:**
```json
{
  "question": "Tell me about Hampi",
  "conversation_id": null
}
```
**Response (200 OK):**
```json
{
  "conversation_id": "3b2e5a40-e298-42f0-a352-871d87f74815",
  "message_id": "a9844e1e-2895-467f-94ad-73778a6ff607",
  "question": "Tell me about Hampi",
  "response": "Hampi, located along the Tungabhadra River in Karnataka...",
  "mode": "live",
  "created_at": "2026-10-27T15:30:00Z"
}
```

### `GET /api/conversations`
Returns recent conversations with message counts and timestamps.

### `GET /api/conversations/<conversation_id>`
Returns complete dialogue transcript for the selected conversation.

### `DELETE /api/conversations/<conversation_id>`
Archives and deletes a conversation and its messages.

### `DELETE /api/conversations`
Clears all saved history.

---

## 🛡️ Reliability & Security Measures

- **No Stored Audio:** Audio is processed client-side via the Web Speech API and never streamed to or recorded on disk. Only the text transcript is stored in the database.
- **Secrets Protection:** Secret keys are strictly loaded through `.env` and kept on the server. `.gitignore` blocks `.env` and `*.db` files.
- **Input Validation:** Server enforces minimum (2 chars) and maximum (1,000 chars) string length limits.
- **SQL Injection Prevention:** 100% parameterized SQL queries (`?`) using SQLite's native driver.
- **Network Resilience:** Graceful timeout handling (18s) and automatic fallback to curated historical knowledge if live AI encounters rate limits or connectivity loss.
