import { useState, useEffect, useRef, useCallback } from 'react';

// Declare Web Speech API types for TypeScript safety
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface VoiceChatHook {
  isListening: boolean;
  isSupported: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  voiceAutoPlay: boolean;
  setVoiceAutoPlay: (enabled: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  clearTranscript: () => void;
}

export function useVoiceChat(onFinalTranscript?: (text: string) => void): VoiceChatHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceAutoPlay, setVoiceAutoPlay] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluxo_ai_voice_autoplay');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef<any>(null);

  // Check Web Speech API support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognitionClass);

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'pt-BR';
          recognitionRef.current = recognition;

          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            finalTranscriptRef.current = '';
            setTranscript('');
            setInterimTranscript('');
          };

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                final += res[0].transcript;
              } else {
                interim += res[0].transcript;
              }
            }

            if (final) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final.trim();
              setTranscript(finalTranscriptRef.current);
            }
            setInterimTranscript(interim);

            // Debounce silence to automatically complete if user stopped talking
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (finalTranscriptRef.current.trim().length > 3) {
              silenceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch {}
                }
              }, 1800);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              setError('Permissão de microfone negada. Clique no ícone de cadeado do navegador para permitir.');
            } else if (event.error === 'no-speech') {
              // Harmless timeout, just reset
            } else {
              setError(`Erro de microfone: ${event.error}`);
            }
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
            const completeText = finalTranscriptRef.current.trim();
            if (completeText && onFinalTranscript) {
              onFinalTranscript(completeText);
            }
          };
        } catch (e: any) {
          console.error('Failed to initialize SpeechRecognition:', e);
          setIsSupported(false);
        }
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onFinalTranscript]);

  const startListening = useCallback(() => {
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        // Recognition might already be running
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 150);
        } catch (e) {
          console.warn('Could not restart recognition:', e);
        }
      }
    } else {
      setError('Reconhecimento de voz não suportado neste navegador.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Text-To-Speech using Web Speech API Synthesis
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      // Clean markdown tags or symbols before speaking
      const cleaned = textToSpeak
        .replace(/[*#_`~[\]()]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Prefer a natural pt-BR voice if installed
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.includes('pt-BR') || v.lang.includes('pt') || v.name.includes('Portuguese')
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleSetVoiceAutoPlay = useCallback((enabled: boolean) => {
    setVoiceAutoPlay(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluxo_ai_voice_autoplay', String(enabled));
      if (!enabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  }, []);

  return {
    isListening,
    isSupported,
    isSpeaking,
    transcript,
    interimTranscript,
    error,
    voiceAutoPlay,
    setVoiceAutoPlay: handleSetVoiceAutoPlay,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    clearTranscript,
  };
}
