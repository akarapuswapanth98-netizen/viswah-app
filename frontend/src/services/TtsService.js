let ttsQueue = [];
let isSpeaking = false;

export const speakUtterance = (text, onEndCallback) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEndCallback) onEndCallback();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.onend = () => {
    if (onEndCallback) onEndCallback();
  };
  utterance.onerror = () => {
    if (onEndCallback) onEndCallback();
  };
  window.speechSynthesis.speak(utterance);
};

export const speakSequence = (texts, onAllDone) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onAllDone) onAllDone();
    return;
  }
  window.speechSynthesis.cancel();
  ttsQueue = [...texts];
  isSpeaking = true;

  const speakNext = () => {
    if (ttsQueue.length === 0) {
      isSpeaking = false;
      if (onAllDone) onAllDone();
      return;
    }
    const text = ttsQueue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => speakNext();
    utterance.onerror = () => speakNext();
    window.speechSynthesis.speak(utterance);
  };

  speakNext();
};

export const stopSpeaking = () => {
  ttsQueue = [];
  isSpeaking = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
