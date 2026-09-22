import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../utils/audio';

interface UseSpeechRecognitionOptions {
  onSendCommand: (command: string) => void;
  isLoading?: boolean;
}

export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  handsFree: boolean;
  setHandsFree: (enabled: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useSpeechRecognition({
  onSendCommand,
  isLoading = false,
}: UseSpeechRecognitionOptions): SpeechRecognitionState {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const onSendCommandRef = useRef(onSendCommand);
  const isLoadingRef = useRef(isLoading);
  const handsFreeRef = useRef(handsFree);
  const isListeningRef = useRef(isListening);
  const shouldRestartHandsFreeRef = useRef<boolean>(false);
  const lastDispatchedRef = useRef<string>('');

  // Keep refs synchronized
  useEffect(() => {
    onSendCommandRef.current = onSendCommand;
  }, [onSendCommand]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const createRecognition = useCallback(() => {
    const SpeechRecognitionClass =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = handsFreeRef.current;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      sound.playMicOpen();
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalSpeech += text;
        } else {
          currentInterim += text;
        }
      }

      const activeInterim = currentInterim.trim();
      setInterimTranscript(activeInterim);

      const finalized = finalSpeech.trim();
      if (finalized.length > 0) {
        setTranscript(finalized);
        setInterimTranscript('');

        // Avoid firing duplicate identical transcripts in immediate succession
        if (finalized !== lastDispatchedRef.current || !isLoadingRef.current) {
          lastDispatchedRef.current = finalized;

          // Automatically trigger handleSendCommand!
          sound.playCommsChirp(720);
          onSendCommandRef.current(finalized);
        }

        // If not hands-free mode, stop listening after utterance
        if (!handsFreeRef.current) {
          try {
            recognition.stop();
          } catch {
            // Ignore
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === 'no-speech') {
        // Normal silence timeout; if hands-free, we allow it to cycle smoothly
        if (!handsFreeRef.current) {
          setError('No speech detected. Comm link timed out.');
        }
      } else if (err === 'not-allowed' || err === 'service-not-allowed') {
        setError('Microphone access blocked. Please allow microphone permission in your browser.');
        setIsListening(false);
      } else if (err === 'audio-capture') {
        setError('No microphone hardware detected.');
        setIsListening(false);
      } else if (err === 'aborted') {
        // User stopped or aborted manually, no error notice needed
      } else {
        setError(`Voice comms error: ${err}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      sound.playMicClose();

      // If hands-free is enabled and we didn't deliberately stop, re-arm recognition
      if (handsFreeRef.current && shouldRestartHandsFreeRef.current) {
        setTimeout(() => {
          if (handsFreeRef.current && shouldRestartHandsFreeRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        }, 300);
      }
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    lastDispatchedRef.current = '';

    const SpeechRecognitionClass =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionClass) {
      setError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or a compatible browser.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    shouldRestartHandsFreeRef.current = handsFreeRef.current;
    const instance = createRecognition();
    if (!instance) return;

    recognitionRef.current = instance;

    try {
      instance.start();
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        setError('Failed to activate microphone.');
      }
    }
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartHandsFreeRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    handsFree,
    setHandsFree: (enabled: boolean) => {
      setHandsFree(enabled);
      handsFreeRef.current = enabled;
      shouldRestartHandsFreeRef.current = enabled;
      // If currently listening, restart with new continuous setting
      if (isListeningRef.current) {
        stopListening();
        setTimeout(() => {
          startListening();
        }, 150);
      }
    },
    startListening,
    stopListening,
    toggleListening,
  };
}
