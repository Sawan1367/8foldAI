"""
Enhanced API Routes - Conversation-aware endpoints
"""
from flask import Blueprint, request, jsonify
import uuid
from database import save_account, load_account
from llm_enhanced import process_with_llm_enhanced, generate_best_plan
from conversation_manager import ConversationManager
from input_validator import InputValidator
from error_handler import ErrorHandler

api_bp = Blueprint('api', __name__)


def get_conversation_manager():
    """Get or create conversation manager instance"""
    if not hasattr(get_conversation_manager, '_instance'):
        get_conversation_manager._instance = ConversationManager()
        get_conversation_manager._instance._ensure_tables()
    return get_conversation_manager._instance


def get_input_validator():
    """Get or create input validator instance"""
    if not hasattr(get_input_validator, '_instance'):
        get_input_validator._instance = InputValidator()
    return get_input_validator._instance


@api_bp.route("/chat", methods=["POST"])
def api_chat():
    """Enhanced chat endpoint with conversation context"""
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    companies = data.get("companies", [])
    session_id = data.get("session_id", str(uuid.uuid4()))
    user_preferences = data.get("preferences", {"verbosity": "balanced"})
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        # Process with enhanced LLM
        result = process_with_llm_enhanced(
            prompt=prompt,
            session_id=session_id,
            companies_list=companies,
            user_preferences=user_preferences
        )
        
        # Save company data if present
        if result.get("company") and result["company"].get("name"):
            comp = result["company"]
            cid = comp.get("id") or str(uuid.uuid4())[:8]
            comp["id"] = cid
            result["company"] = comp
            save_account(cid, comp["name"], comp)
        
        # Add session_id to response
        result["session_id"] = session_id
        
        return jsonify(result)
        
    except Exception as e:
        ErrorHandler.log_error(e, "Chat endpoint")
        error_msg = ErrorHandler.get_user_friendly_error_message(e)
        return jsonify({
            "error": error_msg,
            "reply": error_msg,
            "company": {},
            "suggestions": ["Try again", "Check your connection"]
        }), 500


@api_bp.route("/generate-best-plan", methods=["POST"])
def api_generate_best_plan():
    """Generate best account plan from multiple companies"""
    data = request.get_json() or {}
    companies = data.get("companies", [])
    
    if len(companies) < 2:
        return jsonify({
            "error": "At least 2 companies required",
            "reply": "Please research at least 2 companies before generating the best plan.",
            "suggestions": ["Research another company", "Add more companies to compare"]
        }), 400
    
    try:
        result = generate_best_plan(companies)
        
        # Save the best plan
        if result.get("bestPlan") and result["bestPlan"].get("name"):
            plan = result["bestPlan"]
            cid = plan.get("id") or str(uuid.uuid4())[:8]
            plan["id"] = cid
            result["bestPlan"] = plan
            save_account(cid, plan["name"], plan)
        
        return jsonify(result)
        
    except Exception as e:
        ErrorHandler.log_error(e, "Generate best plan")
        error_msg = ErrorHandler.get_user_friendly_error_message(e)
        return jsonify({
            "error": error_msg,
            "reply": error_msg,
            "bestPlan": companies[0] if companies else {}
        }), 500


@api_bp.route("/conversation/<session_id>", methods=["GET"])
def get_conversation(session_id):
    """Get conversation history for a session"""
    try:
        conv_manager = get_conversation_manager()
        limit = request.args.get("limit", 20, type=int)
        history = conv_manager.get_conversation_history(session_id, limit=limit)
        session_info = conv_manager.get_session_info(session_id)
        
        return jsonify({
            "history": history,
            "session_info": session_info,
            "summary": conv_manager.get_conversation_summary(session_id)
        })
        
    except Exception as e:
        ErrorHandler.log_error(e, "Get conversation")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/conversation/clear", methods=["POST"])
def clear_conversation():
    """Clear conversation history"""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    
    try:
        conv_manager = get_conversation_manager()
        conv_manager.clear_conversation(session_id)
        return jsonify({
            "success": True,
            "message": "Conversation cleared successfully"
        })
        
    except Exception as e:
        ErrorHandler.log_error(e, "Clear conversation")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/suggestions", methods=["POST"])
def get_suggestions():
    """Get contextual suggestions based on current state"""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    companies = data.get("companies", [])
    
    try:
        conv_manager = get_conversation_manager()
        suggestions = []
        
        # Get conversation context
        history = []
        persona = ConversationManager.PERSONA_UNKNOWN
        
        if session_id:
            history = conv_manager.get_conversation_history(session_id, limit=5)
            persona = conv_manager.detect_user_persona(history)
        
        # Generate suggestions based on state
        if len(companies) == 0:
            suggestions = [
                "Research your first company",
                "See what I can do",
                "Get help with company research"
            ]
        elif len(companies) == 1:
            suggestions = [
                "Research a competitor",
                "Update company information",
                "Find key stakeholders"
            ]
        elif len(companies) >= 2:
            suggestions = [
                "Generate best plan from all companies",
                "Compare companies side-by-side",
                "Research another company"
            ]
        
        # Adapt to persona
        if persona == ConversationManager.PERSONA_EFFICIENT:
            suggestions = [s.split("(")[0].strip() for s in suggestions]  # Remove explanations
        
        return jsonify({
            "suggestions": suggestions,
            "persona": persona
        })
        
    except Exception as e:
        ErrorHandler.log_error(e, "Get suggestions")
        return jsonify({
            "suggestions": ["Research a company", "Get help"],
            "persona": "unknown"
        })


@api_bp.route("/preferences", methods=["POST"])
def update_preferences():
    """Update user preferences for a session"""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    preferences = data.get("preferences", {})
    
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400
    
    try:
        conv_manager = get_conversation_manager()
        conv_manager.update_session_preferences(session_id, preferences)
        return jsonify({
            "success": True,
            "message": "Preferences updated successfully"
        })
        
    except Exception as e:
        ErrorHandler.log_error(e, "Update preferences")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/validate", methods=["POST"])
def validate_input():
    """Validate user input before processing"""
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    
    try:
        validator = get_input_validator()
        is_valid, message, suggestions = validator.validate_prompt(prompt)
        
        return jsonify({
            "is_valid": is_valid,
            "message": message,
            "suggestions": suggestions or []
        })
        
    except Exception as e:
        ErrorHandler.log_error(e, "Validate input")
        return jsonify({
            "is_valid": False,
            "message": "Validation error occurred",
            "suggestions": []
        })


@api_bp.route("/account/<id>", methods=["GET"])
def get_account_route(id):
    """Get account by ID"""
    try:
        acc = load_account(id)
        if not acc:
            return jsonify({"error": "Not found"}), 404
        return jsonify(acc)
        
    except Exception as e:
        ErrorHandler.log_error(e, "Get account")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Company Research Assistant API",
        "version": "2.0.0"
    })
