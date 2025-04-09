let lastSpokenText = '';
let lastSpeakTime = 0;

export const speakText = (text, force = false) => {
  const now = Date.now();
  if (!force && text === lastSpokenText && now - lastSpeakTime < 1500) return;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
    lastSpokenText = text;
    lastSpeakTime = now;
  }
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
