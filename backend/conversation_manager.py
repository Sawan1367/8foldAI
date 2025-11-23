"""
Conversation Manager - Handles conversation history, context, and user persona detection
"""
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from database import get_db

class ConversationManager:
    """Manages conversation state, history, and user persona detection"""
    
    # User personas
    PERSONA_CONFUSED = "confused"
    PERSONA_EFFICIENT = "efficient"
    PERSONA_CHATTY = "chatty"
    PERSONA_EDGE_CASE = "edge_case"
    PERSONA_UNKNOWN = "unknown"
    
    # Intent types
    INTENT_RESEARCH = "research"
    INTENT_UPDATE = "update"
    INTENT_CLARIFY = "clarify"
    INTENT_CHAT = "chat"
    INTENT_OFF_TOPIC = "off_topic"
    INTENT_HELP = "help"
    
    def __init__(self):
        # Don't initialize tables here - wait until first use
        self._tables_initialized = False
    
    def _ensure_tables(self):
        """Create conversation tables if they don't exist"""
        if self._tables_initialized:
            return
        
        db = get_db()
        
        # Conversations table
        db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                intent TEXT,
                persona TEXT,
                metadata TEXT
            )
        """)
        
        # User sessions table
        db.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id TEXT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
                interaction_count INTEGER DEFAULT 0,
                detected_persona TEXT,
                preferences TEXT
            )
        """)
        
        db.commit()
        self._tables_initialized = True
    
    def save_conversation_turn(
        self, 
        session_id: str, 
        role: str, 
        content: str, 
        intent: Optional[str] = None,
        persona: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Save a conversation turn to the database"""
        self._ensure_tables()
        db = get_db()
        
        metadata_json = json.dumps(metadata) if metadata else None
        
        db.execute("""
            INSERT INTO conversations (session_id, role, content, intent, persona, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, role, content, intent, persona, metadata_json))
        
        # Update session
        db.execute("""
            INSERT INTO user_sessions (session_id, interaction_count, detected_persona)
            VALUES (?, 1, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                last_active = CURRENT_TIMESTAMP,
                interaction_count = interaction_count + 1,
                detected_persona = COALESCE(?, detected_persona)
        """, (session_id, persona, persona))
        
        db.commit()
    
    def get_conversation_history(
        self, 
        session_id: str, 
        limit: int = 10
    ) -> List[Dict]:
        """Retrieve conversation history for a session"""
        self._ensure_tables()
        db = get_db()
        
        cursor = db.execute("""
            SELECT role, content, intent, persona, timestamp, metadata
            FROM conversations
            WHERE session_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (session_id, limit))
        
        rows = cursor.fetchall()
        
        # Reverse to get chronological order
        history = []
        for row in reversed(rows):
            metadata = json.loads(row[5]) if row[5] else {}
            history.append({
                "role": row[0],
                "content": row[1],
                "intent": row[2],
                "persona": row[3],
                "timestamp": row[4],
                "metadata": metadata
            })
        
        return history
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """Get session metadata"""
        self._ensure_tables()
        db = get_db()
        
        cursor = db.execute("""
            SELECT created_at, last_active, interaction_count, detected_persona, preferences
            FROM user_sessions
            WHERE session_id = ?
        """, (session_id,))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        preferences = json.loads(row[4]) if row[4] else {}
        
        return {
            "session_id": session_id,
            "created_at": row[0],
            "last_active": row[1],
            "interaction_count": row[2],
            "detected_persona": row[3],
            "preferences": preferences
        }
    
    def update_session_preferences(self, session_id: str, preferences: Dict):
        """Update user preferences for a session"""
        self._ensure_tables()
        db = get_db()
        
        db.execute("""
            UPDATE user_sessions
            SET preferences = ?
            WHERE session_id = ?
        """, (json.dumps(preferences), session_id))
        
        db.commit()
    
    def detect_user_persona(self, history: List[Dict]) -> str:
        """
        Detect user persona based on conversation history
        
        Heuristics:
        - Confused: Asks many questions, vague queries, needs guidance
        - Efficient: Direct commands, minimal chat, quick interactions
        - Chatty: Long messages, off-topic, conversational
        - Edge Case: Invalid inputs, rapid topic switching, unusual requests
        """
        if not history:
            return self.PERSONA_UNKNOWN
        
        user_messages = [msg for msg in history if msg["role"] == "user"]
        
        if len(user_messages) < 2:
            return self.PERSONA_UNKNOWN
        
        # Calculate metrics
        avg_length = sum(len(msg["content"]) for msg in user_messages) / len(user_messages)
        question_count = sum(1 for msg in user_messages if "?" in msg["content"])
        question_ratio = question_count / len(user_messages)
        
        # Count vague terms
        vague_terms = ["help", "something", "maybe", "not sure", "don't know", "what can", "how do"]
        vague_count = sum(
            1 for msg in user_messages 
            for term in vague_terms 
            if term in msg["content"].lower()
        )
        
        # Count off-topic indicators
        off_topic_terms = ["by the way", "anyway", "also", "oh", "hmm", "interesting"]
        off_topic_count = sum(
            1 for msg in user_messages 
            for term in off_topic_terms 
            if term in msg["content"].lower()
        )
        
        # Count direct commands
        direct_commands = ["research", "update", "change", "generate", "find", "show"]
        direct_count = sum(
            1 for msg in user_messages 
            for cmd in direct_commands 
            if msg["content"].lower().startswith(cmd)
        )
        
        # Persona detection logic
        if vague_count >= 2 or question_ratio > 0.6:
            return self.PERSONA_CONFUSED
        elif avg_length < 30 and direct_count >= len(user_messages) * 0.7:
            return self.PERSONA_EFFICIENT
        elif avg_length > 100 or off_topic_count >= 2:
            return self.PERSONA_CHATTY
        elif len(user_messages) > 5 and question_ratio > 0.8:
            return self.PERSONA_CONFUSED
        
        return self.PERSONA_UNKNOWN
    
    def classify_intent(self, prompt: str, history: List[Dict]) -> str:
        """
        Classify user intent from the prompt
        
        Returns: One of INTENT_* constants
        """
        prompt_lower = prompt.lower().strip()
        
        # Help/capability queries
        help_keywords = ["what can you", "how do i", "help", "capabilities", "what do you do"]
        if any(keyword in prompt_lower for keyword in help_keywords):
            return self.INTENT_HELP
        
        # Research intent
        research_keywords = ["research", "find information", "look up", "tell me about", "analyze"]
        if any(keyword in prompt_lower for keyword in research_keywords):
            return self.INTENT_RESEARCH
        
        # Update intent
        update_keywords = ["update", "change", "modify", "edit", "set", "fix"]
        if any(keyword in prompt_lower for keyword in update_keywords):
            return self.INTENT_UPDATE
        
        # Clarification
        clarify_keywords = ["what do you mean", "can you explain", "i don't understand", "clarify"]
        if any(keyword in prompt_lower for keyword in clarify_keywords):
            return self.INTENT_CLARIFY
        
        # Off-topic detection
        off_topic_keywords = ["weather", "news", "joke", "story", "how are you"]
        if any(keyword in prompt_lower for keyword in off_topic_keywords):
            return self.INTENT_OFF_TOPIC
        
        # Default to chat if unclear
        if len(prompt) < 20 and "?" in prompt:
            return self.INTENT_CHAT
        
        # If we have context, check if it's a follow-up
        if history and len(history) > 0:
            last_assistant_msg = next(
                (msg for msg in reversed(history) if msg["role"] == "assistant"), 
                None
            )
            if last_assistant_msg and "?" in last_assistant_msg["content"]:
                return self.INTENT_CLARIFY
        
        return self.INTENT_RESEARCH
    
    def resolve_references(self, prompt: str, history: List[Dict]) -> str:
        """
        Resolve pronouns and references to previous context
        
        Examples:
        - "it" -> "Google"
        - "that company" -> "Microsoft"
        - "the previous one" -> "Apple"
        """
        if not history:
            return prompt
        
        # Find the last mentioned company
        last_company = None
        for msg in reversed(history):
            if msg["role"] == "assistant" and msg.get("metadata"):
                metadata = msg["metadata"]
                if "company_name" in metadata:
                    last_company = metadata["company_name"]
                    break
        
        if not last_company:
            return prompt
        
        # Replace references
        prompt_lower = prompt.lower()
        references = ["it", "that company", "this company", "the company", "them", "that one", "this one"]
        
        for ref in references:
            if ref in prompt_lower:
                # Replace while preserving case
                prompt = prompt.replace(ref, last_company)
                prompt = prompt.replace(ref.capitalize(), last_company)
        
        return prompt
    
    def get_conversation_summary(self, session_id: str) -> str:
        """Generate a summary of the conversation"""
        history = self.get_conversation_history(session_id, limit=20)
        
        if not history:
            return "No conversation history."
        
        # Extract key information
        companies_mentioned = set()
        actions_taken = []
        
        for msg in history:
            if msg["role"] == "assistant" and msg.get("metadata"):
                metadata = msg["metadata"]
                if "company_name" in metadata:
                    companies_mentioned.add(metadata["company_name"])
                if "action" in metadata:
                    actions_taken.append(metadata["action"])
        
        summary_parts = []
        
        if companies_mentioned:
            summary_parts.append(f"Companies researched: {', '.join(companies_mentioned)}")
        
        if actions_taken:
            summary_parts.append(f"Actions: {', '.join(actions_taken)}")
        
        summary_parts.append(f"Total interactions: {len(history)}")
        
        return " | ".join(summary_parts)
    
    def clear_conversation(self, session_id: str):
        """Clear conversation history for a session"""
        self._ensure_tables()
        db = get_db()
        
        db.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
        db.execute("DELETE FROM user_sessions WHERE session_id = ?", (session_id,))
        
        db.commit()
