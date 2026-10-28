"""
TimeTravel Voice Companion - Configuration Module
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the application
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file if it exists
load_dotenv(BASE_DIR / ".env")


class Config:
    """Base application configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "timetravel-heritage-dev-key-default-2026")
    
    # Instance directory for SQLite database
    INSTANCE_PATH = BASE_DIR / "instance"
    INSTANCE_PATH.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = INSTANCE_PATH / "timetravel.db"

    # AI Provider Configuration (Google Gemini and/or OpenAI)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # Server settings
    FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT = int(os.getenv("FLASK_PORT", "5050"))
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

    # Safety limits
    MAX_CONTENT_LENGTH = 16 * 1024  # 16 KB request limit
    MAX_QUESTION_LENGTH = 1000
    MIN_QUESTION_LENGTH = 2
    HISTORY_CONTEXT_TURNS = 4  # Send up to 4 recent message turns for context
