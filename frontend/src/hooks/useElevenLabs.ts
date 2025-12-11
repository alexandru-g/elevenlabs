import { useState, useCallback, useRef } from 'react';
import { textToSpeech, speechToText, AudioPlayer, type TTSOptions } from '../lib/elevenlabs';

interface UseElevenLabsReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  transcribe: (audioBlob: Blob) => Promise<string>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isTranscribing: boolean;
  error: string | null;
  isConfigured: boolean;
}

export function useElevenLabs(): UseElevenLabsReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const audioPlayerRef = useRef(new AudioPlayer());

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    try {
      setError(null);
      setIsSpeaking(true);

      const audioBuffer = await textToSpeech(text, options);
      await audioPlayerRef.current.play(audioBuffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech synthesis failed';
      setError(message);

      if (message.includes('API key not configured')) {
        setIsConfigured(false);
      }

      throw err;
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    audioPlayerRef.current.stop();
    setIsSpeaking(false);
  }, []);

  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      setError(null);
      setIsTranscribing(true);

      const text = await speechToText(audioBlob);
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);

      if (message.includes('API key not configured')) {
        setIsConfigured(false);
      }

      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return {
    speak,
    transcribe,
    stopSpeaking,
    isSpeaking,
    isTranscribing,
    error,
    isConfigured,
  };
}
