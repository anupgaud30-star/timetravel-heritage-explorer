"""
SQLite Database Access Layer for TimeTravel Voice Companion.
Handles persistent conversation sessions and message history using parameterized SQL queries.
"""

import sqlite3
import uuid
from datetime import datetime
from flask import current_app, g


def get_db():
    """Obtain or reuse SQLite database connection for the active request context."""
    if "db" not in g:
        db_path = current_app.config["DATABASE_PATH"]
        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES,
            timeout=10.0
        )
        g.db.row_factory = sqlite3.Row
        # Enforce foreign key constraints in SQLite
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db


def close_db(e=None):
    """Close the database connection when request context ends."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    """Create tables and indexes if they do not exist."""
    app.teardown_appcontext(close_db)
    with app.app_context():
        db = get_db()
        with db:
            db.executescript(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    question TEXT NOT NULL,
                    response TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
                    ON messages(conversation_id);
                CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
                    ON conversations(updated_at DESC);
                """
            )


def create_conversation(title=None):
    """
    Create a new conversation session.
    Returns the created conversation dictionary.
    """
    db = get_db()
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    conv_title = (title.strip() if title else "New Exploration")[:80]

    with db:
        db.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (conv_id, conv_title, now, now)
        )

    return {
        "id": conv_id,
        "title": conv_title,
        "created_at": now,
        "updated_at": now,
        "message_count": 0
    }


def get_conversations(limit=50):
    """
    Retrieve recent conversations ordered by last update with message counts.
    """
    db = get_db()
    cursor = db.execute(
        """
        SELECT 
            c.id, 
            c.title, 
            c.created_at, 
            c.updated_at,
            COUNT(m.id) as message_count,
            (SELECT question FROM messages WHERE conversation_id = c.id ORDER BY created_at ASC LIMIT 1) as first_question
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT ?
        """,
        (limit,)
    )
    rows = cursor.fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "message_count": row["message_count"],
            "first_question": row["first_question"]
        }
        for row in rows
    ]


def get_conversation(conv_id):
    """Fetch single conversation metadata by id."""
    db = get_db()
    cursor = db.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
        (conv_id,)
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "title": row["title"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }


def get_conversation_messages(conv_id):
    """Retrieve chronological messages for a given conversation."""
    db = get_db()
    cursor = db.execute(
        """
        SELECT id, conversation_id, question, response, mode, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        """,
        (conv_id,)
    )
    rows = cursor.fetchall()
    return [
        {
            "id": row["id"],
            "conversation_id": row["conversation_id"],
            "question": row["question"],
            "response": row["response"],
            "mode": row["mode"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]


def get_recent_context(conv_id, turns=4):
    """
    Retrieve the last N turns from a conversation for AI prompt context.
    Returns list of dicts: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    """
    db = get_db()
    cursor = db.execute(
        """
        SELECT question, response
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (conv_id, turns)
    )
    rows = cursor.fetchall()
    # Reverse to restore chronological order
    rows.reverse()
    context = []
    for row in rows:
        context.append({"role": "user", "content": row["question"]})
        context.append({"role": "assistant", "content": row["response"]})
    return context


def save_message(conv_id, question, response, mode="demo"):
    """
    Store user question and assistant response in a transaction,
    updating the conversation timestamp and auto-generating title if needed.
    """
    db = get_db()
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    with db:
        # Check if conversation exists; create if missing
        conv = get_conversation(conv_id)
        if not conv:
            title = question.strip()[:40] + ("..." if len(question.strip()) > 40 else "")
            db.execute(
                """
                INSERT INTO conversations (id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (conv_id, title, now, now)
            )
        else:
            # If current title is default "New Exploration", rename to user's first question
            if conv["title"] == "New Exploration":
                new_title = question.strip()[:40] + ("..." if len(question.strip()) > 40 else "")
                db.execute(
                    "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
                    (new_title, now, conv_id)
                )
            else:
                db.execute(
                    "UPDATE conversations SET updated_at = ? WHERE id = ?",
                    (now, conv_id)
                )

        # Insert message record
        db.execute(
            """
            INSERT INTO messages (id, conversation_id, question, response, mode, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (msg_id, conv_id, question, response, mode, now)
        )

    return {
        "id": msg_id,
        "conversation_id": conv_id,
        "question": question,
        "response": response,
        "mode": mode,
        "created_at": now
    }


def delete_conversation(conv_id):
    """Delete a conversation and its messages."""
    db = get_db()
    with db:
        # SQLite with PRAGMA foreign_keys ON cascades, but we also do explicit delete
        cursor = db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        return cursor.rowcount > 0


def delete_all_conversations():
    """Clear all conversations and messages."""
    db = get_db()
    with db:
        db.execute("DELETE FROM messages")
        db.execute("DELETE FROM conversations")
    return True
