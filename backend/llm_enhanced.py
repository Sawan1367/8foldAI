"""
Enhanced LLM Module - Conversation-aware, persona-adaptive AI responses
"""
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from config import GEMINI_API_KEY, PERPLEXITY_API_KEY
from search import extract_info
from conversation_manager import ConversationManager
from input_validator import InputValidator
from error_handler import ErrorHandler, with_retry, safe_api_call

def get_llm():
    """Get configured LLM instance"""
    # Priority 1: Explicit Perplexity Key
    if PERPLEXITY_API_KEY:
         return ChatOpenAI(
            model="sonar",
            api_key=PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai",
            temperature=0.7
        )
    
    # Priority 2: Gemini Key (check if it's actually a Perplexity key)
    if GEMINI_API_KEY:
        if GEMINI_API_KEY.startswith("pplx-"):
            return ChatOpenAI(
                model="sonar",
                api_key=GEMINI_API_KEY,
                base_url="https://api.perplexity.ai",
                temperature=0.7
            )
        # Priority 3: Actual Gemini Key
        return ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=GEMINI_API_KEY, temperature=0.7)

    raise ValueError("No valid API key found (GEMINI_API_KEY or PERPLEXITY_API_KEY)")


def get_persona_instructions(persona: str) -> str:
    """Get response style instructions based on user persona"""
    
    instructions = {
        ConversationManager.PERSONA_CONFUSED: (
            "The user seems CONFUSED or UNCERTAIN. Adapt your response style:\n"
            "- Ask clarifying questions to understand their needs\n"
            "- Provide step-by-step guidance\n"
            "- Offer specific examples of what you can do\n"
            "- Be patient and encouraging\n"
            "- Break down complex information into simple steps\n"
            "- Use phrases like 'Let me help you with that' or 'Here's what I can do'\n"
        ),
        ConversationManager.PERSONA_EFFICIENT: (
            "The user is EFFICIENT and wants QUICK RESULTS. Adapt your response style:\n"
            "- Be extremely concise (1 sentence max)\n"
            "- Get straight to the point\n"
            "- No unnecessary explanations\n"
            "- Focus on action and results\n"
            "- Use phrases like 'Done' or 'Researched X' or 'Updated'\n"
        ),
        ConversationManager.PERSONA_CHATTY: (
            "The user is CHATTY and conversational. Adapt your response style:\n"
            "- Engage naturally but stay focused on the task\n"
            "- Acknowledge their conversational tone\n"
            "- Gently guide back to research objectives\n"
            "- Be friendly but professional\n"
            "- Use phrases like 'Great question!' or 'I'd be happy to help with that'\n"
        ),
        ConversationManager.PERSONA_EDGE_CASE: (
            "The user may be providing EDGE CASE inputs. Adapt your response style:\n"
            "- Politely point out any issues with their request\n"
            "- Explain what you CAN do instead\n"
            "- Provide helpful alternatives\n"
            "- Be clear about your capabilities and limitations\n"
        )
    }
    
    return instructions.get(persona, "")


def get_intent_instructions(intent: str) -> str:
    """Get instructions based on detected intent"""
    
    instructions = {
        ConversationManager.INTENT_HELP: (
            "The user is asking for HELP or wants to know your capabilities.\n"
            "Provide a clear, concise overview of what you can do with specific examples."
        ),
        ConversationManager.INTENT_CLARIFY: (
            "The user is asking for CLARIFICATION.\n"
            "Provide a clear explanation and check if they need more details."
        ),
        ConversationManager.INTENT_OFF_TOPIC: (
            "The user's message is OFF-TOPIC.\n"
            "Politely acknowledge their message and gently redirect to your core capabilities."
        ),
        ConversationManager.INTENT_CHAT: (
            "The user is making casual CONVERSATION.\n"
            "Respond briefly and naturally, then offer to help with research tasks."
        )
    }
    
    return instructions.get(intent, "")


@safe_api_call(fallback_response={"reply": "I encountered an error. Please try again.", "company": {}, "suggestions": []})
def process_with_llm_enhanced(
    prompt: str,
    session_id: str,
    companies_list=None,
    user_preferences=None
):
    """
    Enhanced LLM processing with conversation context and persona adaptation
    
    Args:
        prompt: User's input
        session_id: Session identifier for conversation tracking
        companies_list: List of companies in current session
        user_preferences: User preference settings
    
    Returns:
        dict with reply, company data, and suggestions
    """
    # Initialize managers
    conv_manager = ConversationManager()
    validator = InputValidator()
    
    if companies_list is None:
        companies_list = []
    
    if user_preferences is None:
        user_preferences = {"verbosity": "balanced"}
    
    # Sanitize input
    prompt = validator.sanitize_input(prompt)
    
    # Validate input
    is_valid, validation_message, suggestions = validator.validate_prompt(prompt)
    if not is_valid:
        return {
            "reply": validation_message,
            "company": {},
            "suggestions": suggestions or [],
            "needs_clarification": True
        }
    
    # Get conversation history
    history = conv_manager.get_conversation_history(session_id, limit=10)
    
    # Resolve references (it, that company, etc.)
    resolved_prompt = conv_manager.resolve_references(prompt, history)
    
    # Detect persona and intent
    persona = conv_manager.detect_user_persona(history)
    intent = conv_manager.classify_intent(resolved_prompt, history)
    
    # Save user message
    conv_manager.save_conversation_turn(
        session_id=session_id,
        role="user",
        content=prompt,
        intent=intent,
        persona=persona
    )
    
    # Handle help intent specially
    if intent == ConversationManager.INTENT_HELP:
        help_response = generate_help_response(persona)
        conv_manager.save_conversation_turn(
            session_id=session_id,
            role="assistant",
            content=help_response["reply"],
            intent=intent
        )
        return help_response
    
    # Handle off-topic specially
    if intent == ConversationManager.INTENT_OFF_TOPIC:
        off_topic_response = generate_off_topic_response(resolved_prompt, persona)
        conv_manager.save_conversation_turn(
            session_id=session_id,
            role="assistant",
            content=off_topic_response["reply"],
            intent=intent
        )
        return off_topic_response
    
    # Get LLM
    llm = get_llm()
    
    # Extract company name if research intent
    company_name = "NONE"
    research_context = ""
    
    if intent == ConversationManager.INTENT_RESEARCH:
        # Try to extract company name
        extracted_name = validator.extract_company_name_from_prompt(resolved_prompt)
        
        if extracted_name:
            # Validate company name
            is_valid_company, company_msg, company_suggestions = validator.validate_company_name(extracted_name)
            
            if not is_valid_company:
                return {
                    "reply": company_msg,
                    "company": {},
                    "suggestions": company_suggestions,
                    "needs_clarification": True
                }
            
            company_name = extracted_name
        else:
            # Use LLM to extract
            @with_retry(max_retries=2)
            def extract_company():
                extraction_prompt = (
                    "Extract the company name from this prompt. "
                    "Return ONLY the company name, or 'NONE' if no company is mentioned.\n"
                    f"Prompt: {resolved_prompt}"
                )
                extract_msg = [HumanMessage(content=extraction_prompt)]
                extract_res = llm.invoke(extract_msg)
                return extract_res.content.strip().replace('"', '').replace("'", "").replace(".", "")
            
            try:
                company_name = extract_company()
            except Exception as e:
                ErrorHandler.log_error(e, "Company extraction")
    
    # Perform research if needed
    if company_name and company_name != "NONE" and company_name.lower() != "none":
        try:
            search_data = extract_info(company_name)
            research_context = f"REAL-TIME RESEARCH DATA FOR {company_name}:\n{json.dumps(search_data)}\n\n"
        except Exception as e:
            ErrorHandler.log_error(e, "Research")
            research_context = f"Note: Could not fetch real-time data for {company_name}. Use general knowledge.\n\n"
    
    # Build conversation context
    conversation_context = ""
    if history:
        recent_messages = history[-6:]  # Last 3 exchanges
        conversation_context = "RECENT CONVERSATION:\n"
        for msg in recent_messages:
            role = msg["role"].upper()
            content = msg["content"][:200]  # Limit length
            conversation_context += f"{role}: {content}\n"
        conversation_context += "\n"
    
    # Build companies context
    companies_context = ""
    if companies_list:
        companies_context = f"EXISTING COMPANIES IN SESSION:\n{json.dumps(companies_list, indent=2)}\n\n"
    
    # Get persona and intent instructions
    persona_instructions = get_persona_instructions(persona)
    intent_instructions = get_intent_instructions(intent)
    
    # Build system prompt
    system_prompt = f"""You are a sophisticated Company Research Assistant.
Your goal is to help users research companies and generate account plans.

{persona_instructions}
{intent_instructions}

{conversation_context}
{research_context}
{companies_context}

RESPONSE FORMAT:
You must respond with a JSON object containing:
1. 'reply': Your conversational response (adapt length based on persona)
2. 'company': Structured account plan data (if applicable)
3. 'suggestions': Array of 2-3 helpful next-step suggestions

REPLY GUIDELINES based on user verbosity preference ({user_preferences.get('verbosity', 'balanced')}):
- concise: 1 sentence max
- balanced: 1-2 sentences
- detailed: 2-3 sentences with more context

The 'company' object should have these fields (if creating/updating):
- id (string): unique identifier
- name (string): company name
- industry (string): industry sector
- tagline (string): company tagline or mission
- revenue (string): e.g., '$50B', '$2.5B'
- employees (string): e.g., '10,000+', '50,000'
- gtm_strategy (string): detailed go-to-market strategy
- sales_strategy (string): detailed sales approach
- funding_history (array): MUST include 3-5 entries with structure [{{"year": "2020", "amount": 100}}, {{"year": "2021", "amount": 250}}, ...]. Use realistic funding amounts in millions.
- revenue_trend (array): MUST include 3-5 entries with structure [{{"year": "2020", "revenue": 1000}}, {{"year": "2021", "revenue": 1500}}, ...]. Use realistic revenue in millions.
- partners (array): MUST include 3-5 entries with structure [{{"name": "AWS", "value": 30}}, {{"name": "Azure", "value": 25}}, ...]. Values should sum to ~100.
- competitors (array): MUST include 3-5 entries with structure [{{"name": "CompanyX", "x": 60, "y": 70}}, ...]. x and y are 0-100 coordinates for positioning.

CRITICAL: When researching a new company, you MUST generate realistic sample data for ALL chart arrays. Do NOT leave them empty.
Example for Google:
- funding_history: [{{"year": "2004", "amount": 1960}}, {{"year": "2005", "amount": 4000}}, {{"year": "2010", "amount": 8000}}]
- revenue_trend: [{{"year": "2020", "revenue": 182000}}, {{"year": "2021", "revenue": 257000}}, {{"year": "2022", "revenue": 283000}}, {{"year": "2023", "revenue": 307000}}]
- partners: [{{"name": "Android OEMs", "value": 35}}, {{"name": "Cloud Partners", "value": 30}}, {{"name": "Ad Networks", "value": 20}}, {{"name": "Hardware", "value": 15}}]
- competitors: [{{"name": "Microsoft", "x": 75, "y": 80}}, {{"name": "Amazon", "x": 70, "y": 75}}, {{"name": "Meta", "x": 60, "y": 65}}, {{"name": "Apple", "x": 85, "y": 90}}]

SUGGESTIONS should be contextual next steps like:
- "Compare with another company"
- "Update the revenue information"
- "Generate best plan from all companies"

Ensure valid JSON output."""
    
    # Generate response
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=resolved_prompt)
    ]
    
    @with_retry(max_retries=3)
    def generate_response():
        response = llm.invoke(messages)
        content = response.content
        
        # Cleanup markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        return json.loads(content.strip())
    
    try:
        result = generate_response()
        
        # Ensure suggestions exist
        if "suggestions" not in result:
            result["suggestions"] = generate_contextual_suggestions(intent, companies_list, persona)
        
        # Save assistant response
        metadata = {}
        if result.get("company") and result["company"].get("name"):
            metadata["company_name"] = result["company"]["name"]
            metadata["action"] = "research" if intent == ConversationManager.INTENT_RESEARCH else "update"
        
        conv_manager.save_conversation_turn(
            session_id=session_id,
            role="assistant",
            content=result["reply"],
            intent=intent,
            persona=persona,
            metadata=metadata
        )
        
        return result
        
    except Exception as e:
        ErrorHandler.log_error(e, "LLM Response Generation")
        error_msg = ErrorHandler.get_user_friendly_error_message(e)
        
        conv_manager.save_conversation_turn(
            session_id=session_id,
            role="assistant",
            content=error_msg,
            intent="error"
        )
        
        return {
            "reply": error_msg,
            "company": {},
            "suggestions": ["Try rephrasing your request", "Check your API configuration"]
        }


def generate_help_response(persona: str) -> dict:
    """Generate help response based on persona"""
    
    if persona == ConversationManager.PERSONA_CONFUSED:
        reply = (
            "I'm here to help you research companies! Here's what I can do:\n\n"
            "1. Research any company - Just say 'Research Google' or 'Tell me about Microsoft'\n"
            "2. Update information - Say 'Update revenue to $280B'\n"
            "3. Compare companies - Research multiple companies and I'll help you compare\n\n"
            "What would you like to start with?"
        )
        suggestions = [
            "Research a company (e.g., 'Research Apple')",
            "See an example account plan",
            "Learn about comparing companies"
        ]
    elif persona == ConversationManager.PERSONA_EFFICIENT:
        reply = "I research companies, generate account plans, and compare options. What company?"
        suggestions = ["Research [company name]", "Compare companies", "Generate best plan"]
    else:
        reply = (
            "I can help you research companies and create account plans. "
            "Just tell me which company you'd like to research, or ask me to compare multiple companies!"
        )
        suggestions = [
            "Research a specific company",
            "Compare multiple companies",
            "Update existing information"
        ]
    
    return {
        "reply": reply,
        "company": {},
        "suggestions": suggestions
    }


def generate_off_topic_response(prompt: str, persona: str) -> dict:
    """Generate response for off-topic conversations"""
    
    if persona == ConversationManager.PERSONA_CHATTY:
        reply = (
            "That's an interesting topic! While I'd love to chat about that, "
            "I'm specifically designed to help with company research and account planning. "
            "Is there a company you'd like me to research?"
        )
    else:
        reply = (
            "I'm focused on helping with company research and account planning. "
            "Would you like me to research a company for you?"
        )
    
    return {
        "reply": reply,
        "company": {},
        "suggestions": [
            "Research a company",
            "See what I can do",
            "Generate an account plan"
        ]
    }


def generate_contextual_suggestions(intent: str, companies_list: list, persona: str) -> list:
    """Generate contextual next-step suggestions"""
    
    suggestions = []
    
    # Based on intent
    if intent == ConversationManager.INTENT_RESEARCH:
        suggestions.append("Update specific information")
        if len(companies_list) >= 1:
            suggestions.append("Research another company to compare")
    elif intent == ConversationManager.INTENT_UPDATE:
        suggestions.append("Research another company")
        suggestions.append("View current account plan")
    
    # Based on companies count
    if len(companies_list) >= 2:
        suggestions.append("Generate best plan from all companies")
    elif len(companies_list) == 1:
        suggestions.append("Research a competitor")
    else:
        suggestions.append("Research your first company")
    
    # Limit to 3 suggestions
    return suggestions[:3]


# Keep original function for backward compatibility
def process_with_llm(prompt, companies_list=None):
    """Original function - delegates to enhanced version with default session"""
    import uuid
    session_id = str(uuid.uuid4())
    result = process_with_llm_enhanced(prompt, session_id, companies_list)
    return {
        "reply": result.get("reply", ""),
        "company": result.get("company", {})
    }


@safe_api_call(fallback_response={"reply": "Error generating best plan", "bestPlan": {}})
def generate_best_plan(companies_list):
    """Analyze multiple companies and generate the best account plan"""
    llm = get_llm()
    
    system_prompt = (
        "You are a strategic account planning expert. Analyze the provided companies and create "
        "a SINGLE 'best account plan' representing the most promising opportunity based on:\n"
        "- Market position and growth potential\n"
        "- Funding and financial health\n"
        "- GTM strategy alignment\n"
        "- Competitive landscape\n"
        "- Partnership opportunities\n\n"
        "Respond with JSON containing:\n"
        "1. 'reply': Detailed explanation (2-3 paragraphs) of why this is the best opportunity\n"
        "2. 'bestPlan': Complete company object representing the optimal target\n\n"
        "The bestPlan should be one of the researched companies (if clearly superior) "
        "or a synthesized plan combining best elements.\n"
        "Set name to 'Best Opportunity: [Company Name]' or 'Synthesized Account Plan'.\n"
        "Ensure valid JSON."
    )
    
    companies_data = json.dumps(companies_list, indent=2)
    user_prompt = f"Companies to analyze:\n\n{companies_data}\n\nGenerate the best account plan."
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    @with_retry(max_retries=3)
    def generate():
        response = llm.invoke(messages)
        content = response.content
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        return json.loads(content.strip())
    
    return generate()
