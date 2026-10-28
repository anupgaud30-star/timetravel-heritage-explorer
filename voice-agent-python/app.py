"""
TimeTravel Voice Companion - Flask Web Application
Main application entry point providing RESTful API endpoints and serving
the historical voice museum frontend.
"""

import os
import uuid
import logging
from flask import Flask, render_template, request, jsonify, g
from config import Config
from database.db import (
    init_db,
    create_conversation,
    get_conversations,
    get_conversation,
    get_conversation_messages,
    get_recent_context,
    save_message,
    delete_conversation,
    delete_all_conversations
)
from services.ai_service import AIService

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s"
)
logger = logging.getLogger("timetravel.app")


def create_app(config_class=Config):
    """Application factory for TimeTravel Voice Companion."""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Initialize SQLite database
    init_db(app)

    # Initialize AI service
    ai_service = AIService(
        gemini_key=app.config.get("GEMINI_API_KEY"),
        gemini_model=app.config.get("GEMINI_MODEL"),
        openai_key=app.config.get("OPENAI_API_KEY"),
        openai_model=app.config.get("OPENAI_MODEL")
    )
    app.extensions["ai_service"] = ai_service

    # Security + CORS headers on every response
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "microphone=(self)"
        # Allow the React dev server (port 8080) to call our API
        origin = request.headers.get("Origin", "")
        if origin in ("http://localhost:8080", "http://127.0.0.1:8080"):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            from flask import make_response
            resp = make_response("", 204)
            origin = request.headers.get("Origin", "")
            if origin in ("http://localhost:8080", "http://127.0.0.1:8080"):
                resp.headers["Access-Control-Allow-Origin"] = origin
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
            return resp

    # -------------------------------------------------------------------------
    # Frontend Routes
    # -------------------------------------------------------------------------

    @app.route("/")
    def index():
        """Render the primary TimeTravel Voice Companion interface."""
        status = ai_service.get_status()
        return render_template(
            "index.html",
            mode=status["mode"],
            model=status["model"],
            ai_configured=status["ai_configured"]
        )

    # -------------------------------------------------------------------------
    # API Endpoints
    # -------------------------------------------------------------------------

    @app.route("/api/health", methods=["GET"])
    def health_check():
        """
        Health endpoint returning backend state, AI provider status, and operational mode.
        Never reveals secret API keys.
        """
        status_info = ai_service.get_status()
        return jsonify({
            "status": "healthy",
            "service": "TimeTravel Voice Companion",
            "version": "1.0.0",
            "ai_configured": status_info["ai_configured"],
            "mode": status_info["mode"],
            "model": status_info["model"],
            "database": "sqlite3",
            "db_path": "instance/timetravel.db"
        }), 200

    @app.route("/api/ai/chat", methods=["POST"])
    def ai_chat():
        """
        Process a user question, query the AI service or demo engine with context,
        and save the turn to SQLite history.
        """
        if not request.is_json:
            return jsonify({
                "error": "Invalid request format. JSON body required.",
                "status": 400
            }), 400

        data = request.get_json(silent=True) or {}
        raw_question = data.get("question")
        conversation_id = data.get("conversation_id")

        # Validate input
        if raw_question is None or not isinstance(raw_question, str):
            return jsonify({
                "error": "Field 'question' is required and must be a string.",
                "status": 400
            }), 400

        question = raw_question.strip()
        min_len = app.config.get("MIN_QUESTION_LENGTH", 2)
        max_len = app.config.get("MAX_QUESTION_LENGTH", 1000)

        if len(question) < min_len:
            return jsonify({
                "error": f"Question is too short (minimum {min_len} characters).",
                "status": 400
            }), 400

        if len(question) > max_len:
            return jsonify({
                "error": f"Question exceeds maximum allowed length of {max_len} characters.",
                "status": 400
            }), 400

        # Validate or generate conversation ID
        if not conversation_id or not isinstance(conversation_id, str):
            conversation_id = str(uuid.uuid4())
        else:
            conversation_id = conversation_id.strip()

        # Retrieve recent conversation context for follow-up questions
        turns_limit = app.config.get("HISTORY_CONTEXT_TURNS", 4)
        history_context = get_recent_context(conversation_id, turns=turns_limit)

        # Generate response
        try:
            response_text, mode_used = ai_service.generate_response(
                question,
                history=history_context
            )
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return jsonify({
                "error": "Failed to process question with AI service.",
                "status": 500
            }), 500

        # Persist conversation turn in SQLite database
        try:
            saved_msg = save_message(
                conv_id=conversation_id,
                question=question,
                response=response_text,
                mode=mode_used
            )
        except Exception as e:
            logger.error(f"Failed to persist message to database: {e}")
            # Still return answer even if DB persistence fails
            return jsonify({
                "conversation_id": conversation_id,
                "question": question,
                "response": response_text,
                "mode": mode_used,
                "message_id": str(uuid.uuid4()),
                "warning": "Conversation not saved to local history."
            }), 200

        return jsonify({
            "conversation_id": conversation_id,
            "message_id": saved_msg["id"],
            "question": saved_msg["question"],
            "response": saved_msg["response"],
            "mode": saved_msg["mode"],
            "created_at": saved_msg["created_at"]
        }), 200

    @app.route("/api/conversations", methods=["GET"])
    def list_conversations():
        """Retrieve recent conversations ordered by last update."""
        limit = request.args.get("limit", default=30, type=int)
        limit = max(1, min(limit, 100))  # Clamp between 1 and 100
        try:
            conversations = get_conversations(limit=limit)
            return jsonify({
                "conversations": conversations,
                "count": len(conversations)
            }), 200
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            return jsonify({"error": "Failed to retrieve conversations.", "status": 500}), 500

    @app.route("/api/conversations", methods=["POST"])
    def new_conversation():
        """Create a new conversation session explicitly."""
        data = request.get_json(silent=True) or {}
        title = data.get("title")
        try:
            conv = create_conversation(title=title)
            return jsonify(conv), 201
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return jsonify({"error": "Failed to create conversation.", "status": 500}), 500

    @app.route("/api/conversations/<conversation_id>", methods=["GET"])
    def get_conversation_detail(conversation_id):
        """Retrieve conversation metadata and all associated messages."""
        conv = get_conversation(conversation_id)
        if not conv:
            return jsonify({
                "error": f"Conversation '{conversation_id}' not found.",
                "status": 404
            }), 404

        messages = get_conversation_messages(conversation_id)
        return jsonify({
            "conversation": conv,
            "messages": messages,
            "message_count": len(messages)
        }), 200

    @app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
    def remove_conversation(conversation_id):
        """Delete a conversation and its messages."""
        success = delete_conversation(conversation_id)
        if not success:
            return jsonify({
                "error": f"Conversation '{conversation_id}' not found.",
                "status": 404
            }), 404

        return jsonify({
            "message": "Conversation successfully deleted.",
            "conversation_id": conversation_id
        }), 200

    @app.route("/api/conversations", methods=["DELETE"])
    def clear_conversations():
        """Delete all conversations and history."""
        delete_all_conversations()
        return jsonify({
            "message": "All conversations have been cleared."
        }), 200

    # -------------------------------------------------------------------------
    # Error Handlers
    # -------------------------------------------------------------------------

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "status": 400}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource Not Found", "status": 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method Not Allowed", "status": 405}), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"error": "Request payload exceeds allowed limit.", "status": 413}), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "An internal server error occurred.", "status": 500}), 500

    return app


# Create standard application instance
app = create_app()

if __name__ == "__main__":
    host = app.config.get("FLASK_HOST", "0.0.0.0")
    port = app.config.get("FLASK_PORT", 5000)
    debug = app.config.get("DEBUG", False)

    print(f"\n=======================================================")
    print(f"  TimeTravel Voice Companion is running")
    print(f"  URL: http://127.0.0.1:{port}")
    print(f"  Mode: {'Live AI' if app.extensions['ai_service'].is_configured else 'Historical Demo'}")
    print(f"=======================================================\n")

    app.run(host=host, port=port, debug=debug)
