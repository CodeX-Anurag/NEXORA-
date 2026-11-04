import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Check, X, AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import aiService from "../../services/ai.service";
import Button from "../common/Button";

export const VoiceInputModal = ({ isOpen, onClose, onTranscriptReady, accessToken }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const speechRecognizerRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = !!(navigator?.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsSupported(hasMedia || hasSpeech);
    }
  }, []);

  // Cleanup on modal close or unmount
  const cleanupAll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.abort();
      } catch {
        // ignore abort errors
      }
      speechRecognizerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setIsTranscribing(false);
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupAll();
      setDuration(0);
      setTranscript("");
      setError("");
    }
  }, [isOpen]);

  const startRecording = async () => {
    setError("");
    setTranscript("");
    setDuration(0);
    audioChunksRef.current = [];

    if (!isSupported) {
      setError("Voice recording is not supported by your current browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      // 1. Request microphone permission explicitly only on click
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup MediaRecorder for backend audio backup
      if (typeof window.MediaRecorder !== "undefined") {
        try {
          const mediaRecorder = new window.MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          mediaRecorder.start(250);
          mediaRecorderRef.current = mediaRecorder;
        } catch (recErr) {
          console.warn("[VoiceInput] MediaRecorder init warning:", recErr.message);
        }
      }

      // 3. Setup Web Speech Recognition for real-time live preview
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let combined = "";
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript + " ";
            }
            if (combined.trim()) {
              setTranscript(combined.trim());
            }
          };

          recognition.onerror = (recErr) => {
            console.warn("[VoiceInput] Speech recognition warning:", recErr.error);
            if (recErr.error === "not-allowed") {
              setError("Microphone permission was denied in your browser settings.");
            }
          };

          recognition.start();
          speechRecognizerRef.current = recognition;
        } catch (recInitErr) {
          console.warn("[VoiceInput] Speech recognition start error:", recInitErr.message);
        }
      }

      setIsRecording(true);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[VoiceInput] Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No microphone found on your system. Please connect an audio input device.");
      } else {
        setError(`Unable to access microphone: ${err.message || "Unknown error"}`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);

    // If live transcript is still empty and audio was captured, attempt backend transcription
    if (!transcript.trim() && audioChunksRef.current.length > 0 && accessToken) {
      setIsTranscribing(true);
      setError("");
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const res = await aiService.transcribeAudio(accessToken, { audioBlob });
        if (res && res.text && res.text.trim()) {
          setTranscript(res.text.trim());
        } else {
          setError("No audible speech could be recognized. Please speak clearly into your microphone.");
        }
      } catch (err) {
        setError(err.message || "Could not transcribe audio. Please try speaking again or type your question.");
      } finally {
        setIsTranscribing(false);
      }
    } else if (!transcript.trim()) {
      setError("No speech was detected during the recording. Please click record and speak clearly.");
    }
  };

  const handleApply = () => {
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim());
      onClose();
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] rounded-3xl p-6 shadow-2xl space-y-5 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center">
              <Mic size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] dark:text-white font-display">
                Voice Input &amp; Speech-to-Text
              </h3>
              <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                Multimodal Spoken Query Assistant
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Main Recording Interface */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="relative">
            {/* Glowing pulse rings during active recording */}
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping" />
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-lg cursor-pointer ${
                isRecording
                  ? "bg-rose-600 text-white shadow-rose-500/40 animate-pulse"
                  : "bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-violet-500/30 hover:brightness-110"
              }`}
            >
              {isRecording ? <Square size={24} className="fill-current" /> : <Mic size={28} />}
            </button>
          </div>

          <div className="text-center space-y-1">
            <span className="text-sm font-bold font-mono text-[#172033] dark:text-white block">
              {isRecording ? formatSeconds(duration) : duration > 0 ? `Recorded: ${formatSeconds(duration)}` : "Ready to record"}
            </span>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              {isRecording
                ? "Listening... Speak your academic question clearly into your mic."
                : "Click the microphone button to start speaking."}
            </p>
          </div>

          {/* Sound wave visualizer while recording */}
          {isRecording && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="w-1 h-6 rounded-full bg-rose-500 animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-8 rounded-full bg-rose-500 animate-pulse [animation-delay:300ms]" />
              <span className="w-1 h-5 rounded-full bg-rose-500 animate-pulse [animation-delay:450ms]" />
              <span className="w-1 h-3 rounded-full bg-rose-500 animate-pulse [animation-delay:200ms]" />
            </div>
          )}
        </div>

        {/* Live / Transcribed Text Review */}
        {(transcript || isTranscribing) && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Volume2 size={12} className="text-violet-600 dark:text-violet-400" />
                <span>Transcript (Editable)</span>
              </span>
              {isTranscribing && (
                <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" />
                  <span>Transcribing with AI...</span>
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken question will appear here. You can edit it before inserting..."
              className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 rounded-2xl p-3 text-xs text-[#172033] dark:text-slate-100 placeholder-[#98A2B3] focus:outline-hidden focus:border-violet-500 leading-relaxed shadow-xs"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F4F9] dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!transcript.trim() || isRecording || isTranscribing}
            onClick={handleApply}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white shadow-violet-500/25"
          >
            <Check size={14} />
            <span>Insert Question</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputModal;
