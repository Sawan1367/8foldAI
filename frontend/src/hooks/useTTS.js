import { useState, useCallback } from 'react';

export default function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking };
}
