"use client";

class VoiceCoachEngine {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    const loadVoices = () => {
      const voices = this.synth?.getVoices() || [];
      // Try to find a professional sounding English voice (Google US English or similar)
      this.voice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female")) || voices[0];
    };

    loadVoices();
    if (this.synth?.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text: string) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    utterance.volume = 1;
    
    this.synth.speak(utterance);
  }

  stop() {
    this.synth?.cancel();
  }

  getMotivation() {
    const quotes = [
      "Keep pushing forward! Every concept you master today brings you closer to your dream rank.",
      "Consistency is the key. You've been doing great, let's tackle one more topic!",
      "Don't worry about mistakes. They are just stepping stones to your success. Review your Flashcard Forge!",
      "Focus is your superpower. Put away distractions and let's win this study session together."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  getAdvice(topic: string, performance: string) {
    if (performance === "weak") {
      return `I noticed you're finding ${topic} a bit challenging. Why don't we try the Smart Notes for it first, then attempt 5 easy MCQs?`;
    }
    return `You're absolutely crushing ${topic}! Let's move to the next level in your Study Roadmap.`;
  }
}

export const voiceCoach = new VoiceCoachEngine();
