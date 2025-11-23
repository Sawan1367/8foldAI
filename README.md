# Company Research Assistant

An intelligent, conversation-aware AI assistant for researching companies and generating strategic account plans. Built with a focus on exceptional conversational quality and adaptive user experiences.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask)

## 🌟 Key Features

### Conversational Intelligence

- **Persona Detection**: Automatically adapts to different user types (Confused, Efficient, Chatty, Edge Cases)
- **Context-Aware Responses**: Maintains conversation history and understands references
- **Intent Classification**: Understands what users want (research, update, clarify, help)
- **Smart Clarification**: Asks helpful questions when requests are ambiguous

### Agentic Behavior

- **Proactive Suggestions**: Recommends next steps based on conversation context
- **Multi-Turn Conversations**: Remembers previous exchanges and builds on them
- **Reference Resolution**: Understands "it", "that company", "the previous one"
- **Goal Tracking**: Helps users complete research objectives

### User Experience

- **Interactive Onboarding**: First-time tutorial explaining capabilities
- **Voice Assistant**: Hands-free interaction with barge-in support
- **Typing Indicators**: Real-time feedback during AI processing
- **Contextual Suggestions**: Smart action recommendations
- **Customizable Preferences**: Adjust verbosity, voice, and suggestions

### Technical Excellence

- **Robust Error Handling**: Retry logic with exponential backoff
- **Input Validation**: Comprehensive edge case handling
- **Session Management**: Persistent conversation tracking
- **Graceful Degradation**: Continues working even when services fail

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Onboarding   │  │ Chat Panel   │  │ Voice        │      │
│  │ Flow         │  │ + Suggestions│  │ Assistant    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Flask + Python)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Conversation │  │ Input        │  │ Error        │      │
│  │ Manager      │  │ Validator    │  │ Handler      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Enhanced LLM (Persona-Adaptive)          │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ SQLite DB    │  │ Search API   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Gemini API key or Perplexity API key

### Installation

1. **Clone and navigate to the project**

   ```bash
   cd s:\CODING\PROJECTS\8foldAI
   ```

2. **Backend Setup**

   ```bash
   cd backend

   # Create virtual environment (if not exists)
   python -m venv EightfoldAI

   # Activate virtual environment
   .\EightfoldAI\Scripts\activate  # Windows
   # source EightfoldAI/bin/activate  # Linux/Mac

   # Install dependencies
   pip install -r requirements.txt

   # Configure API key in .env file
   # Add: GEMINI_API_KEY=your_key_here
   # Or: PERPLEXITY_API_KEY=your_key_here
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the Application**

   Use the provided PowerShell script:

   ```bash
   cd ..
   .\start_app.ps1
   ```

   Or manually:

   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Open browser to `http://localhost:5173`
   - Backend API runs on `http://localhost:5000`

## 📖 Design Decisions

### Why Persona Detection?

Different users have different communication styles. By detecting whether a user is confused, efficient, chatty, or encountering edge cases, we can adapt our responses to provide the best experience for each individual.

**Implementation**: Heuristic-based analysis of conversation history examining:

- Message length and complexity
- Question frequency
- Use of vague terms vs. direct commands
- Off-topic indicators

### Why Conversation Context?

Users naturally refer to previous topics ("update it", "that company"). Without context, the assistant would constantly ask for clarification, creating friction.

**Implementation**: Session-based conversation storage in SQLite with:

- Full conversation history
- Reference resolution for pronouns
- Context window management for LLM calls

### Why Input Validation?

Edge cases and invalid inputs can break the user experience. Proactive validation allows us to provide helpful guidance before wasting API calls.

**Implementation**: Multi-layer validation checking:

- Company name validity
- Request ambiguity
- Capability boundaries
- Malicious input patterns

### Why Retry Logic?

API calls can fail due to network issues, rate limiting, or temporary service outages. Retry logic with exponential backoff ensures reliability without overwhelming services.

**Implementation**: Decorator-based retry system with:

- Configurable max retries
- Exponential backoff
- User-friendly error messages

### Why SQLite?

For this application, SQLite provides the perfect balance of:

- Zero configuration
- Portability
- Built-in Python support
- Sufficient performance for conversation history

**When to upgrade**: If you need multi-user concurrent access or millions of records, consider PostgreSQL or MySQL.

## 🎭 Demo Scenarios

### 1. The Confused User

**Scenario**: User is unsure what to do or how to phrase requests.

**Example Interaction**:

```
User: "I need help with something"
Assistant: "I'd be happy to help! I can research companies and create account plans.
           Would you like to:
           • Research a specific company
           • See what I can do
           • Get help with company research"

User: "that tech company"
Assistant: "I'm not sure which company you're referring to. Could you provide the
           specific company name? For example: 'Research Google' or 'Research Microsoft'"

User: "Research Google"
Assistant: "Great! I've researched Google and added it to your account plans.
           You can see the details in the right panel."
```

**System Behavior**:

- Detects confusion through vague terms
- Provides step-by-step guidance
- Offers specific examples
- Asks clarifying questions
- Encourages with positive reinforcement

### 2. The Efficient User

**Scenario**: User wants quick results with minimal conversation.

**Example Interaction**:

```
User: "Research Microsoft"
Assistant: "Researched Microsoft."

User: "Update revenue to $200B"
Assistant: "Updated."

User: "Research Apple"
Assistant: "Researched Apple."

User: "Generate best plan"
Assistant: "Generated best plan from 2 companies."
```

**System Behavior**:

- Detects efficiency through short, direct commands
- Provides minimal responses (1 sentence max)
- No unnecessary explanations
- Focuses on action confirmation

### 3. The Chatty User

**Scenario**: User likes to engage conversationally and may go off-topic.

**Example Interaction**:

```
User: "Hey! How are you today? I'm thinking about researching some companies"
Assistant: "I'm doing great, thanks for asking! I'd be happy to help you research
           companies. Which company would you like to start with?"

User: "By the way, what do you think about AI in general?"
Assistant: "AI is fascinating! While I'd love to chat about that, I'm specifically
           designed to help with company research. Is there a company you'd like
           me to research for you?"

User: "Sure, let's look up Tesla"
Assistant: "Excellent choice! I've researched Tesla and created an account plan.
           You can see all the details in the panel on the right."
```

**System Behavior**:

- Engages naturally with friendly tone
- Acknowledges conversational elements
- Gently redirects to core capabilities
- Maintains professional but warm demeanor

### 4. The Edge Case User

**Scenario**: User provides invalid inputs, rapid requests, or goes beyond capabilities.

**Example Interaction**:

```
User: "asdfghjkl"
Assistant: "I didn't quite understand that. Could you rephrase your request?
           For example, you can say 'Research Google' or 'Help me get started'."

User: "Predict Tesla's stock price next year"
Assistant: "I can't predict the future, but I can analyze current trends.
           Would you like me to:
           • Research Tesla's current market position
           • Analyze publicly available business data"

User: "XYZ123NonExistentCorp"
Assistant: "This doesn't appear to be a real company name. Could you verify
           the company name? I can help you research any publicly traded or
           well-known private company."
```

**System Behavior**:

- Validates inputs before processing
- Explains capability boundaries clearly
- Suggests valid alternatives
- Provides helpful error messages
- Never crashes or shows technical errors

## 🧪 Testing the Personas

To test persona detection:

1. **Test Confused Persona**: Ask vague questions, use terms like "maybe", "not sure", "help"
2. **Test Efficient Persona**: Use direct commands like "Research X", "Update Y", "Generate Z"
3. **Test Chatty Persona**: Write long messages, add greetings, go off-topic
4. **Test Edge Cases**: Try gibberish, invalid company names, impossible requests

The system will adapt its responses based on your interaction pattern!

## 🛠️ API Endpoints

### POST /api/chat

Enhanced chat with conversation context

```json
{
  "prompt": "Research Google",
  "session_id": "session_123",
  "companies": [],
  "preferences": {
    "verbosity": "balanced",
    "voiceEnabled": true
  }
}
```

### POST /api/suggestions

Get contextual suggestions

```json
{
  "session_id": "session_123",
  "companies": [...]
}
```

### GET /api/conversation/:session_id

Retrieve conversation history

### POST /api/conversation/clear

Clear conversation history

### POST /api/preferences

Update user preferences

### POST /api/validate

Validate input before processing

## 📊 Project Structure

```
8foldAI/
├── backend/
│   ├── app.py                      # Flask application entry
│   ├── routes_enhanced.py          # API endpoints
│   ├── llm_enhanced.py             # Persona-adaptive LLM
│   ├── conversation_manager.py     # Session & context management
│   ├── input_validator.py          # Input validation & edge cases
│   ├── error_handler.py            # Retry logic & error handling
│   ├── database.py                 # SQLite operations
│   ├── search.py                   # Company research
│   └── config.py                   # Configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main application
│   │   ├── components/
│   │   │   ├── OnboardingFlow.jsx  # Tutorial
│   │   │   ├── ChatPanel.jsx       # Enhanced chat UI
│   │   │   ├── VoiceAssistant.jsx  # Voice interaction
│   │   │   └── ...
│   │   └── hooks/
│   │       ├── useTTS.js           # Text-to-speech
│   │       └── useSTT.js           # Speech-to-text
│   └── package.json
└── README.md
```

## 🤝 Contributing

This project was built with a focus on conversational quality and user experience. When contributing:

1. Maintain persona-adaptive behavior
2. Add comprehensive error handling
3. Write user-friendly error messages
4. Test with different user personas
5. Document design decisions

## 📝 License

This project is part of an evaluation submission demonstrating conversational AI best practices.

## 🙏 Acknowledgments

Built to demonstrate excellence in:

- Conversational Quality
- Agentic Behavior
- Technical Implementation
- Intelligence & Adaptability

---

**Version 2.0.0** - Enhanced with conversation intelligence and persona adaptation
