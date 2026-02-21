import { useCallback, useRef } from 'react';

export const useSpeechSynthesis = () => {
  const isSpeakingRef = useRef(false);

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.1; // Slightly higher pitch (friendly)
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      onStart?.();
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onEnd?.();
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      isSpeakingRef.current = false;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
  }, []);

  const isSpeaking = useCallback(() => isSpeakingRef.current, []);

  return { speak, stop, isSpeaking };
};

export const useTimer = (duration: number, onTimeUp: () => void) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsedRef.current >= duration) {
          stop();
          onTimeUp();
        }
      }
    }, 100);
  }, [duration, onTimeUp]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getElapsed = useCallback(() => elapsedRef.current, []);
  const getRemaining = useCallback(() => Math.max(0, duration - elapsedRef.current), [duration]);

  return { start, stop, getElapsed, getRemaining };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
