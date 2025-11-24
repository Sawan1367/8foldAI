import React, { useState, useEffect } from "react";
import CenterControl from "./components/CenterControl.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import AccountPlanPanel from "./components/AccountPlanPanel.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";
import OnboardingFlow from "./components/OnboardingFlow.jsx";
import useTTS from "./hooks/useTTS.js";

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [isGeneratingBestPlan, setIsGeneratingBestPlan] = useState(false);
  const { speak, cancel, isSpeaking } = useTTS();

  // New state for enhanced features
  const [sessionId, setSessionId] = useState(generateSessionId());
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("onboarding_completed");
  });
  const [userPreferences, setUserPreferences] = useState(() => {
    const saved = localStorage.getItem("user_preferences");
    return saved
      ? JSON.parse(saved)
      : {
          verbosity: "balanced",
          voiceEnabled: true,
          showSuggestions: true,
        };
  });
  const [isTyping, setIsTyping] = useState(false);

  const currentCompany = companies[currentCompanyIndex] || null;

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Fetch suggestions when companies change
  useEffect(() => {
    if (userPreferences.showSuggestions && started) {
      fetchSuggestions();
    }
  }, [companies.length, started]);

  async function fetchSuggestions() {
    try {
      const res = await fetch("http://localhost:5000/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          companies: companies,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestedActions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
    }
  }

  async function handleSendPrompt(text) {
    // local echo
    const userMsg = { role: "user", text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setStarted(true);
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          companies: companies,
          session_id: sessionId,
          preferences: userPreferences,
        }),
      });

      if (!res.ok) throw new Error("Server " + res.status);

      const j = await res.json();
      const botMsg = { role: "assistant", text: j.reply, id: Date.now() + 1 };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // Update suggestions if provided
      if (j.suggestions && j.suggestions.length > 0) {
        setSuggestedActions(j.suggestions);
      }

      // Handle company data
      if (j.company && Object.keys(j.company).length > 0) {
        const newCompany = j.company;

        // Check if this company already exists (by name)
        const existingIndex = companies.findIndex(
          (c) => c.name?.toLowerCase() === newCompany.name?.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Update existing company
          setCompanies((prev) => {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...newCompany,
            };
            return updated;
          });
          setCurrentCompanyIndex(existingIndex);
        } else {
          // Add new company
          setCompanies((prev) => [...prev, newCompany]);
          setCurrentCompanyIndex(companies.length);
        }
      }

      // Speak the reply if voice enabled
      if (j.reply && userPreferences.voiceEnabled) {
        speak(j.reply);
      }
    } catch (e) {
      setIsTyping(false);
      const errorMsg = "Error: " + e.message;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: errorMsg, id: Date.now() + 2 },
      ]);
      if (userPreferences.voiceEnabled) {
        speak("I encountered an error. Please try again.");
      }
    }
  }

  async function handleGenerateBestPlan() {
    if (companies.length < 2) {
      alert(
        "Please research at least 2 companies before generating the best plan."
      );
      return;
    }

    setIsGeneratingBestPlan(true);
    const userMsg = {
      role: "user",
      text: "Generate the best account plan from all researched companies",
      id: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("http://localhost:5000/api/generate-best-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: companies,
        }),
      });

      if (!res.ok) throw new Error("Server " + res.status);

      const j = await res.json();
      const botMsg = { role: "assistant", text: j.reply, id: Date.now() + 1 };
      setMessages((prev) => [...prev, botMsg]);

      if (j.bestPlan) {
        // Add the best plan as a new company
        setCompanies((prev) => [...prev, j.bestPlan]);
        setCurrentCompanyIndex(companies.length);
      }

      if (j.reply) {
        speak(j.reply);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error generating best plan: " + e.message,
          id: Date.now() + 2,
        },
      ]);
    } finally {
      setIsGeneratingBestPlan(false);
    }
  }

  function handleCompleteOnboarding() {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  }

  function handleClearConversation() {
    if (window.confirm("Clear conversation history? This cannot be undone.")) {
      setMessages([]);
      setSessionId(generateSessionId());
      setSuggestedActions([]);
    }
  }

  function navigateCompany(direction) {
    if (direction === "next" && currentCompanyIndex < companies.length - 1) {
      setCurrentCompanyIndex((prev) => prev + 1);
    } else if (direction === "prev" && currentCompanyIndex > 0) {
      setCurrentCompanyIndex((prev) => prev - 1);
    }
  }

  return (
    <div className="min-h-screen bg-app p-6 font-sans text-slate-900">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Company Research Assistant
              </h1>
              <div className="text-xs text-slate-500 font-medium">
                Research, synthesize & generate account plans
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {companies.length > 1 && (
              <button
                onClick={handleGenerateBestPlan}
                disabled={isGeneratingBestPlan}
                className="cursor-pointer px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-sm font-medium text-white shadow-sm hover:shadow-md transition disabled:opacity-50"
              >
                {isGeneratingBestPlan ? "Generating..." : "Generate Best Plan"}
              </button>
            )}
            <button
              onClick={() => window.open("/docs.html", "_blank")}
              className="px-4 py-2 cursor-pointer rounded-lg bg-white text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
            >
              Documentation
            </button>
          </div>
        </header>

        <main className="flex-1">
          {/* Start center control */}
          {!started && (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center">
              <CenterControl onSend={handleSendPrompt} />
            </div>
          )}

          {/* Split view after start */}
          {started && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              <div className="lg:col-span-4">
                <ChatPanel
                  messages={messages}
                  onSend={handleSendPrompt}
                  suggestedActions={suggestedActions}
                  isTyping={isTyping}
                  preferences={userPreferences}
                  onPreferencesChange={setUserPreferences}
                  onClearConversation={handleClearConversation}
                />
              </div>
              <div className="lg:col-span-8">
                <AccountPlanPanel
                  data={currentCompany}
                  companies={companies}
                  currentIndex={currentCompanyIndex}
                  onNavigate={navigateCompany}
                  onSelectCompany={setCurrentCompanyIndex}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleCompleteOnboarding}
          onSkip={handleCompleteOnboarding}
        />
      )}

      {/* Persistent Voice Assistant */}
      {userPreferences.voiceEnabled && (
        <VoiceAssistant
          onSend={handleSendPrompt}
          isSpeaking={isSpeaking}
          onStopSpeaking={cancel}
        />
      )}
    </div>
  );
}
