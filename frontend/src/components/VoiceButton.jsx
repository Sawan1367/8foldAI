import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceButton({ onSend }) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setRecording(false);
      onSend(transcript);
    };

    rec.onerror = (err) => {
      console.error("Recognition Error:", err);
      setRecording(false);
    };

    rec.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = rec;
    return rec;
  }

  function toggleRecording() {
    const rec = initRecognition();
    if (!rec) return;

    if (recording) {
      rec.stop();
      setRecording(false);
    } else {
      rec.start();
      setRecording(true);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleRecording();
      }}
      type="button"
      aria-label="Start voice input"
      className={`
        relative w-12 h-12 flex items-center justify-center
        rounded-full shadow bg-white border transition-all duration-200
        ${recording ? "border-red-500 text-red-500" : "border-slate-300 text-slate-600"}
        hover:bg-slate-50
      `}
    >
      {recording ? <MicOff size={20} /> : <Mic size={20} />}
      
      {recording && (
        <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
      )}
    </button>
  );
}
