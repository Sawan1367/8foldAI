import React, { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import VoiceButton from "./VoiceButton.jsx";
import {
  Send,
  Sparkles,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function ChatPanel({
  messages = [],
  onSend,
  suggestedActions = [],
  isTyping = false,
  preferences = {},
  onPreferencesChange,
  onClearConversation,
}) {
  const ref = useRef();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // Handle send
  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const handleSuggestionClick = (suggestion) => {
    onSend(suggestion);
  };

  const handleVerbosityChange = (level) => {
    onPreferencesChange({ ...preferences, verbosity: level });
    setShowSettings(false);
  };

  const toggleVoice = () => {
    onPreferencesChange({
      ...preferences,
      voiceEnabled: !preferences.voiceEnabled,
    });
  };

  const toggleSuggestions = () => {
    onPreferencesChange({
      ...preferences,
      showSuggestions: !preferences.showSuggestions,
    });
  };

  return (
    <div className="card h-[calc(100vh-140px)] flex flex-col overflow-hidden border-slate-200/60 shadow-sm">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Research Assistant</h3>
            <p className="text-xs text-slate-500">AI-powered insights</p>
          </div>
        </div>

        {/* Settings button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition ${
              preferences.voiceEnabled
                ? "bg-blue-50 text-blue-600"
                : "bg-slate-100 text-slate-400"
            }`}
            title={
              preferences.voiceEnabled ? "Voice enabled" : "Voice disabled"
            }
          >
            {preferences.voiceEnabled ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} />
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Preferences
          </h4>

          <div className="space-y-3">
            {/* Verbosity setting */}
            <div>
              <label className="text-xs text-slate-600 mb-2 block">
                Response Length
              </label>
              <div className="flex gap-2">
                {["concise", "balanced", "detailed"].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleVerbosityChange(level)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      preferences.verbosity === level
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Show Suggestions</span>
              <button
                onClick={toggleSuggestions}
                className={`w-12 h-6 rounded-full transition ${
                  preferences.showSuggestions ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    preferences.showSuggestions
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Clear conversation */}
            <button
              onClick={onClearConversation}
              className="w-full px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Clear Conversation
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div
        ref={ref}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <Sparkles size={48} className="mb-4 text-slate-300" />
            <p className="font-medium">No messages yet.</p>
            <p>Ask a question to start researching.</p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUGGESTED ACTIONS */}
      {preferences.showSuggestions && suggestedActions.length > 0 && (
        <div className="px-6 py-3 bg-blue-50/50 border-t border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-2">
            Suggested Actions:
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#93c5fd #dbeafe",
            }}
          >
            {suggestedActions.map((action, index) => (
              <button
                key={index}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition shadow-sm flex-shrink-0"
                onClick={() => handleSuggestionClick(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            onClick={() => onSend("Summarize this company.")}
          >
            Summarize
          </button>

          <button
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            onClick={() => onSend("Identify key stakeholders.")}
          >
            Find Stakeholders
          </button>

          <button
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            onClick={() => onSend("Find GTM signals.")}
          >
            Find GTM Signals
          </button>
        </div>

        {/* INPUT BAR */}
        <div className="flex gap-2 relative">
          <input
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          {/* <VoiceButton
            onSend={(text) => {
              setInput(text);
              onSend(text);
            }}
          /> */}
          <button
            className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
