import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Loader2, Square, Radio } from 'lucide-react';
import { api } from '../api';

// Global playback singleton so only one article or advisor talks at once
let currentGlobalAudio: HTMLAudioElement | null = null;
let currentStopCallback: (() => void) | null = null;

export function stopAllPlayback() {
  if (currentGlobalAudio) {
    try {
      currentGlobalAudio.pause();
      currentGlobalAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentGlobalAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentStopCallback) {
    currentStopCallback();
    currentStopCallback = null;
  }
}

interface AudioPlayButtonProps {
  text: string;
  role?: 'advisor' | 'news' | 'political_advisor' | 'political_news';
  publisher?: 'gloomberg' | 'doll_street' | 'gotham' | 'cashington' | 'capital_gazette';
  label?: string;
  compact?: boolean;
  className?: string;
  voice?: string;
}

export const AudioPlayButton: React.FC<AudioPlayButtonProps> = ({
  text,
  role = 'news',
  publisher,
  label,
  compact = false,
  className = '',
  voice
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStop = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
    if (currentStopCallback === handleStop) {
      currentStopCallback = null;
    }
  };

  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      handleStop();
      return;
    }

    if (!text || !text.trim()) return;

    // Stop any other sound currently playing
    stopAllPlayback();

    setIsLoading(true);
    currentStopCallback = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    try {
      const res = await api.synthesizeTts({
        text,
        role,
        publisher,
        voice
      });

      // If server returned audio base64 from Gemini 3.8 Flash TTS or Google Cloud TTS
      if (res.audio_base64) {
        const mime = res.mime_type || 'audio/wav';
        const audioSrc = `data:${mime};base64,${res.audio_base64}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        currentGlobalAudio = audio;

        audio.onended = () => {
          setIsPlaying(false);
          if (currentGlobalAudio === audio) currentGlobalAudio = null;
        };

        audio.onerror = () => {
          console.warn('Audio element error, falling back to Web Speech synthesis');
          playNativeSpeech(res.text || text);
        };

        await audio.play();
        setIsLoading(false);
        setIsPlaying(true);
        return;
      }

      // If server instructed fallback (e.g., no API key configured or connection issue)
      playNativeSpeech(res.text || text);
    } catch (err: any) {
      console.warn('TTS request error, using Web Speech fallback:', err);
      playNativeSpeech(text);
    }
  };

  const playNativeSpeech = (speechText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    // Strip markdown & think tags in case raw text was passed
    const sanitized = speechText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`|]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(sanitized);

    // Adaptive voice pitch & rate for persona feel
    if (role === 'advisor' || role === 'political_advisor') {
      utterance.rate = 0.98;
      utterance.pitch = 0.95;
    } else if (publisher === 'gloomberg') {
      utterance.rate = 1.04;
      utterance.pitch = 0.9;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    setIsLoading(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  if (compact) {
    return (
      <button
        onClick={handleTogglePlay}
        disabled={isLoading}
        title={isPlaying ? "Stop Voice Narration" : "Listen to Voice Narration"}
        aria-label={isPlaying ? "Stop Voice Narration" : "Listen to Voice Narration"}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 animate-pulse'
            : isLoading
            ? 'bg-slate-800 text-amber-400'
            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleTogglePlay}
      disabled={isLoading}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
        isPlaying
          ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
          : isLoading
          ? 'bg-slate-800 text-amber-400 border border-slate-700'
          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span className="text-[11px]">Synthesizing...</span>
        </>
      ) : isPlaying ? (
        <>
          <Square className="w-3 h-3 fill-current" />
          <span className="text-[11px]">Stop Audio</span>
          <span className="flex items-center gap-0.5 ml-1">
            <span className="w-1 h-2.5 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-3.5 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-2 bg-slate-950 rounded-full animate-bounce"></span>
          </span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px]">{label || 'Listen'}</span>
        </>
      )}
    </button>
  );
};
