const { LLM_API_KEY } = require("../../config/env");

/**
 * Audio Provider: Handles Speech-to-Text (STT) transcription and Text-to-Speech (TTS)
 */
class AudioProvider {
  constructor(config = {}) {
    this.name = "gemini-audio";
    const rawKey = config.apiKey || LLM_API_KEY || "";
    this.apiKey = rawKey.replace(/^["']|["']$/g, "").trim();
    this.model = config.model || "gemini-flash-lite-latest";
  }

  /**
   * Transcribes spoken audio bytes using Gemini multimodal audio ingestion
   */
  async transcribeAudio({ buffer, mimeType = "audio/webm", language = "auto" }) {
    if (!buffer || buffer.length === 0) {
      throw new Error("Audio buffer is required for transcription.");
    }

    const isMock = !this.apiKey || this.apiKey.startsWith("mock") || this.apiKey === "your-gemini-api-key-here";

    if (!isMock) {
      try {
        const base64Audio = buffer.toString("base64");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const langPrompt = language === "hinglish"
          ? "Transcribe accurately in conversational Hinglish or English as spoken."
          : "Transcribe accurately in English.";

        const payload = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.split(";")[0],
                    data: base64Audio
                  }
                },
                {
                  text: `Please transcribe the spoken audio into clear text. Do not add intro or commentary. Return only the transcribed sentence(s). ${langPrompt}`
                }
              ]
            }
          ]
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const transcript = data.candidates?.[0]?.parts?.[0]?.text?.trim();
          if (transcript) {
            return {
              text: transcript,
              source: "gemini_multimodal"
            };
          }
        }
      } catch (err) {
        console.warn(`[AudioProvider] Gemini transcription error (${err.message}).`);
        throw new Error(`Audio transcription failed: ${err.message}`);
      }
    }

    throw new Error("Unable to transcribe audio. Please ensure your microphone is configured and speak clearly, or use browser speech recognition.");
  }

  /**
   * Synthesizes text into speech configuration metadata
   */
  async synthesizeSpeech({ text, voice = "default", speed = 1.0 }) {
    if (!text || !text.trim()) {
      throw new Error("Text is required for speech synthesis.");
    }

    return {
      success: true,
      text: text.trim(),
      voice,
      speed: Math.max(0.5, Math.min(2.0, speed)),
      format: "browser_speech_synthesis"
    };
  }
}

module.exports = AudioProvider;