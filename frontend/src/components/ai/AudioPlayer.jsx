import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";

export const AudioPlayer = ({ text = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  const isCancelledRef = useRef(false);

  // Initialize SpeechSynthesis and load browser voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices() || [];
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          const defaultVoice =
            availableVoices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
            availableVoices.find((v) => v.lang.startsWith("en")) ||
            availableVoices[0];
          setSelectedVoice(defaultVoice);
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        isCancelledRef.current = true;
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoice]);

  // Clean raw markdown, code fences, equations, and URLs for natural speaking
  const cleanSpeechText = (raw) => {
    return raw
      .replace(/```[\s\S]*?```/g, "Code example omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/#+\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\$\$[\s\S]*?\$\$/g, "Formula omitted.")
      .replace(/\$[^$]+\$/g, "Formula.")
      .replace(/\|.*?\|/g, " ")
      .replace(/---/g, " ")
      .trim();
  };

  // Chunk text into sentence-sized blocks (max 160 chars) to prevent Chrome's 15-second speech cutoff bug
  const splitIntoChunks = (cleanedText) => {
    const rawSentences = cleanedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanedText];
    const chunks = [];

    for (const sentence of rawSentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 160) {
        chunks.push(trimmed);
      } else {
        // Sub-split very long sentences by comma or spaces
        const words = trimmed.split(" ");
        let currentSub = "";
        for (const w of words) {
          if ((currentSub + " " + w).length > 160) {
            if (currentSub.trim()) chunks.push(currentSub.trim());
            currentSub = w;
          } else {
            currentSub = currentSub ? `${currentSub} ${w}` : w;
          }
        }
        if (currentSub.trim()) chunks.push(currentSub.trim());
      }
    }

    return chunks;
  };

  const speakChunk = useCallback(
    (index) => {
      if (isCancelledRef.current || index >= chunksRef.current.length) {
        setIsPlaying(false);
        setIsPaused(false);
        currentChunkIndexRef.current = 0;
        return;
      }

      currentChunkIndexRef.current = index;
      const chunkText = chunksRef.current[index];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = rate;
      utterance.pitch = 1.0;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        if (!isCancelledRef.current) {
          speakChunk(index + 1);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [rate, selectedVoice]
  );

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    isCancelledRef.current = false;

    const cleaned = cleanSpeechText(text);
    if (!cleaned) return;

    const chunks = splitIntoChunks(cleaned);
    if (chunks.length === 0) return;

    chunksRef.current = chunks;
    currentChunkIndexRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(0);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    currentChunkIndexRef.current = 0;
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setRate(newRate);
    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  if (!isSupported || !text || !text.trim()) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E7EAF0] dark:border-slate-800 text-[#667085] dark:text-slate-300 text-[11px] font-sans">
      {!isPlaying && !isPaused ? (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
          title="Read Aloud Answer"
        >
          <Volume2 size={13} />
          <span>Read Aloud</span>
        </button>
      ) : isPaused ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePlay}
            className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:brightness-110 cursor-pointer font-medium"
            title="Resume Reading"
          >
            <Play size={12} className="fill-current" />
            <span>Resume</span>
          </button>
          <button
            onClick={handleStop}
            className="hover:text-rose-500 cursor-pointer p-0.5 rounded"
            title="Stop Reading"
          >
            <VolumeX size={12} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePause}
            className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer p-0.5 rounded"
            title="Pause Reading"
          >
            <Pause size={12} className="fill-current" />
          </button>
          <button
            onClick={handleStop}
            className="hover:text-rose-500 cursor-pointer p-0.5 rounded"
            title="Stop Reading"
          >
            <VolumeX size={12} />
          </button>
          {/* Animated sound wave bars */}
          <div className="flex items-center gap-0.5 px-1">
            <span className="w-1 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="w-1 h-3.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-2.0 rounded-full bg-cyan-500 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Speed Control Button */}
      <button
        onClick={cycleRate}
        className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white cursor-pointer ml-0.5 bg-white dark:bg-slate-800 border border-[#E7EAF0] dark:border-slate-700"
        title="Adjust Audio Speed"
      >
        {rate}x
      </button>

      {/* Voice selection dropdown where available */}
      {voices.length > 1 && (
        <select
          value={selectedVoice?.name || ""}
          onChange={(e) => {
            const chosen = voices.find((v) => v.name === e.target.value);
            if (chosen) setSelectedVoice(chosen);
          }}
          className="text-[9px] bg-transparent text-[#667085] dark:text-slate-400 border-none focus:outline-hidden max-w-[70px] truncate cursor-pointer"
          title="Select Audio Voice"
        >
          {voices
            .filter((v) => v.lang.startsWith("en"))
            .slice(0, 5)
            .map((v) => (
              <option key={v.name} value={v.name} className="dark:bg-slate-900 text-xs">
                {v.name.slice(0, 16)}
              </option>
            ))}
        </select>
      )}
    </div>
  );
};

export default AudioPlayer;
