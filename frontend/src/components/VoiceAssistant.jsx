import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function VoiceAssistant({
  onSend,
  isSpeaking = false,
  onStopSpeaking,
}) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Stop listening when TTS starts speaking
  useEffect(() => {
    if (isSpeaking && isListening) {
      stopListening();
    }
  }, [isSpeaking]);

  // Monitor for user speech during TTS (barge-in)
  useEffect(() => {
    if (!isSpeaking || !isActive) return;

    // Start a temporary recognition to detect if user starts speaking
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const bargeInRecognition = new SpeechRecognition();
    bargeInRecognition.lang = "en-US";
    bargeInRecognition.continuous = false;
    bargeInRecognition.interimResults = true;

    bargeInRecognition.onresult = (event) => {
      // If user starts speaking, stop TTS immediately
      if (event.results.length > 0) {
        console.log("User started speaking - stopping TTS");
        if (onStopSpeaking) {
          onStopSpeaking();
        }
      }
    };

    bargeInRecognition.onerror = (err) => {
      // Ignore errors during barge-in detection
      console.log("Barge-in detection error:", err.error);
    };

    try {
      bargeInRecognition.start();
    } catch (e) {
      console.log("Could not start barge-in detection");
    }

    return () => {
      try {
        bargeInRecognition.stop();
      } catch (e) {
        // Ignore
      }
    };
  }, [isSpeaking, isActive, onStopSpeaking]);

  // Auto-restart recognition when active and not speaking
  useEffect(() => {
    if (isActive && !isListening && !isSpeaking) {
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, isListening, isSpeaking]);

  function initRecognition() {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Use Chrome browser.");
      return null;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true; // Continuous listening
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        setTranscript(final);
        setInterimTranscript("");

        // Send to parent
        if (onSend && final.trim()) {
          onSend(final.trim());
        }
      }
    };

    rec.onerror = (err) => {
      console.error("Recognition Error:", err);
      if (err.error === "no-speech") {
        // Ignore no-speech errors, will auto-restart
      } else {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = rec;
    return rec;
  }

  function startListening() {
    if (isSpeaking) return; // Don't start if speaking

    const rec = initRecognition();
    if (!rec) return;

    try {
      rec.start();
      setIsListening(true);
    } catch (e) {
      console.log("Recognition already started");
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition already stopped");
      }
      setIsListening(false);
    }
  }

  function toggleVoiceAssistant() {
    if (isActive) {
      // Deactivate
      setIsActive(false);
      stopListening();
      setTranscript("");
      setInterimTranscript("");
    } else {
      // Activate
      setIsActive(true);
    }
  }

  function handleStopSpeaking() {
    if (onStopSpeaking) {
      onStopSpeaking();
    }
  }

  // Determine current state
  const getState = () => {
    if (!isActive) return "inactive";
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    return "idle";
  };

  const state = getState();

  // State colors and icons
  const stateConfig = {
    inactive: {
      color: "bg-slate-400",
      ringColor: "ring-slate-400/20",
      icon: MicOff,
      text: "Voice Inactive",
      subtext: "Click to activate",
    },
    idle: {
      color: "bg-blue-500",
      ringColor: "ring-blue-500/20",
      icon: Mic,
      text: "Voice Ready",
      subtext: "Waiting to listen...",
    },
    listening: {
      color: "bg-green-500",
      ringColor: "ring-green-500/30",
      icon: Mic,
      text: "Listening",
      subtext: "Speak now...",
    },
    speaking: {
      color: "bg-purple-500",
      ringColor: "ring-purple-500/30",
      icon: Volume2,
      text: "Speaking",
      subtext: "Assistant is responding...",
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Message Bubble */}
      {isActive && !isMinimized && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-80 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${config.color} ${
                  isListening ? "animate-pulse" : ""
                }`}
              ></div>
              <span className="text-sm font-semibold text-slate-800">
                {config.text}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Minimize"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Status */}
          <p className="text-xs text-slate-500 mb-3">{config.subtext}</p>

          {/* Transcript Display */}
          <div className="bg-slate-50 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-y-auto mb-3">
            {transcript || interimTranscript ? (
              <p className="text-sm text-slate-700">
                {transcript}
                {interimTranscript && (
                  <span className="text-slate-400 italic">
                    {" "}
                    {interimTranscript}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isActive
                  ? "Your speech will appear here..."
                  : "Activate voice to start"}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {isSpeaking ? (
              <button
                onClick={handleStopSpeaking}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <VolumeX size={16} />
                Stop Speaking
              </button>
            ) : (
              <button
                onClick={toggleVoiceAssistant}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isActive ? "Stop Voice" : "Start Voice"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          if (isSpeaking) {
            // Stop speaking if currently speaking
            handleStopSpeaking();
          } else if (isMinimized) {
            setIsMinimized(false);
          } else if (!isActive) {
            toggleVoiceAssistant();
          }
        }}
        className={`
          relative w-16 h-16 rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 transform hover:scale-110
          ${config.color} text-white
          ${isListening ? "animate-pulse" : ""}
        `}
        aria-label="Voice Assistant"
        title={isSpeaking ? "Click to stop speaking" : "Voice Assistant"}
      >
        <Icon size={28} />

        {/* Animated Ring */}
        {isListening && (
          <span
            className={`absolute inset-0 rounded-full ${config.color} opacity-75 animate-ping`}
          ></span>
        )}

        {/* Active Indicator */}
        {isActive && !isSpeaking && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          </span>
        )}

        {/* Speaking Indicator - Shows X to stop */}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
            <VolumeX size={14} className="text-white" />
          </span>
        )}

        {/* Minimized Indicator */}
        {isMinimized && isActive && !isSpeaking && (
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-lg">
            <Maximize2 size={12} className="text-slate-600" />
          </span>
        )}
      </button>
    </div>
  );
}
