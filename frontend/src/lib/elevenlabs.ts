const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

export async function textToSpeech(text: string, options: TTSOptions = {}): Promise<ArrayBuffer> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId: options.voiceId,
      stability: options.stability,
      similarityBoost: options.similarityBoost,
      style: options.style,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || 'TTS request failed');
  }

  return response.arrayBuffer();
}

export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || 'STT request failed');
  }

  const result = await response.json();
  return result.text || '';
}

export function playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch(reject);
  });
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  async play(audioBuffer: ArrayBuffer): Promise<void> {
    this.stop();

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    this.currentUrl = URL.createObjectURL(blob);
    this.audio = new Audio(this.currentUrl);

    return new Promise((resolve, reject) => {
      if (!this.audio) return reject(new Error('Audio not initialized'));

      this.audio.onended = () => {
        this.cleanup();
        resolve();
      };

      this.audio.onerror = () => {
        this.cleanup();
        reject(new Error('Audio playback failed'));
      };

      this.audio.play().catch(reject);
    });
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    this.audio = null;
  }

  get isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}
