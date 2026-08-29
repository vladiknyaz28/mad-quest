/**
 * Единый аудио-контроллер.
 * Приоритет:
 * 1) локальная перезапись на устройстве (IndexedDB)
 * 2) файлы из public/audio/ (общий деплой на все устройства)
 * 3) TTS
 */

import {
  resolveBundledAudioUrl,
  SYSTEM_OK_KEY,
  SYSTEM_WRONG_KEY,
} from './audioManifest';
import { voiceRecorder } from './recorder';

export type AudioSourceType = 'tts' | 'url';

export type PlayerStatus = 'idle' | 'playing' | 'paused';

export interface AudioClip {
  key: string;
  type: AudioSourceType;
  payload: string;
}

export interface AudioPlayerState {
  status: PlayerStatus;
  currentKey: string | null;
}

type Listener = (state: AudioPlayerState) => void;

const OK_FALLBACK = 'Верно! Мэд доволен.';
const WRONG_FALLBACK = 'Не то. Подумай ещё — Фантомас хитрый.';

class AudioPlayerController {
  private audio = new Audio();
  private clip: AudioClip | null = null;
  private state: AudioPlayerState = { status: 'idle', currentKey: null };
  private listeners = new Set<Listener>();
  private charIndex = 0;
  private fullText = '';
  private mode: 'html' | 'tts' | null = null;
  private ttsTimer: number | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): AudioPlayerState {
    return this.state;
  }

  private setState(partial: Partial<AudioPlayerState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  /**
   * Проиграть клип. TTS всегда доступен как запасной вариант.
   */
  async playClip(options: {
    key: string;
    ttsText?: string;
    url?: string;
  }): Promise<void> {
    try {
      await voiceRecorder.init();
    } catch {
      /* ok */
    }

    // 1) Явный URL (превью)
    if (options.url) {
      this.playUrl(options.key, options.url);
      return;
    }

    // 2) Запись на этом устройстве (IndexedDB)
    if (voiceRecorder.hasRecording(options.key)) {
      const localUrl = voiceRecorder.getRecordingUrl(options.key);
      if (localUrl) {
        this.playUrl(options.key, localUrl);
        return;
      }
    }

    // 3) Файл из public/audio (быстрый таймаут)
    try {
      const bundled = await resolveBundledAudioUrl(options.key);
      if (bundled) {
        this.playUrl(options.key, bundled);
        return;
      }
    } catch {
      /* fall through to TTS */
    }

    // 4) TTS
    if (options.ttsText) {
      this.playTtsClip(options.key, options.ttsText);
    }
  }

  private playUrl(key: string, url: string): void {
    this.stopInternal();
    this.clip = { key, type: 'url', payload: url };
    this.mode = 'html';
    this.setState({ currentKey: key, status: 'idle' });

    this.audio.src = url;
    this.audio.onended = () => this.setState({ status: 'idle' });
    this.audio.onerror = () => {
      // битый файл → если есть текст в fullText не будет; просто idle
      this.setState({ status: 'idle' });
    };

    void this.audio
      .play()
      .then(() => this.setState({ status: 'playing' }))
      .catch(() => this.setState({ status: 'idle' }));
  }

  private playTtsClip(key: string, text: string): void {
    this.stopInternal();
    this.clip = { key, type: 'tts', payload: text };
    this.fullText = text;
    this.charIndex = 0;
    this.mode = 'tts';
    this.setState({ currentKey: key, status: 'idle' });
    this.playTts(text);
  }

  setCurrentClip(key: string, payload: string, type: AudioSourceType = 'tts'): void {
    if (type === 'url') {
      this.playUrl(key, payload);
      return;
    }
    this.playTtsClip(key, payload);
  }

  play(): void {
    if (!this.clip) return;

    if (this.clip.type === 'tts') {
      this.playTts(this.clip.payload);
      return;
    }

    this.mode = 'html';
    void this.audio
      .play()
      .then(() => this.setState({ status: 'playing' }))
      .catch(() => this.setState({ status: 'idle' }));
    this.audio.onended = () => this.setState({ status: 'idle' });
  }

  pause(): void {
    if (this.state.status !== 'playing') return;

    if (this.mode === 'tts' || this.clip?.type === 'tts') {
      window.speechSynthesis.pause();
      this.setState({ status: 'paused' });
      return;
    }

    this.audio.pause();
    this.setState({ status: 'paused' });
  }

  resume(): void {
    if (this.state.status !== 'paused' || !this.clip) return;

    if (this.mode === 'tts' || this.clip.type === 'tts') {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.setState({ status: 'playing' });
      } else {
        const rest = this.fullText.slice(this.charIndex);
        this.playTts(rest || this.fullText);
      }
      return;
    }

    void this.audio
      .play()
      .then(() => this.setState({ status: 'playing' }))
      .catch(() => this.setState({ status: 'idle' }));
  }

  restart(): void {
    if (!this.clip) return;

    if (this.clip.type === 'tts') {
      this.charIndex = 0;
      this.playTts(this.clip.payload);
      return;
    }

    this.audio.currentTime = 0;
    void this.audio
      .play()
      .then(() => this.setState({ status: 'playing' }))
      .catch(() => this.setState({ status: 'idle' }));
  }

  stop(): void {
    this.stopInternal();
    this.setState({ status: 'idle', currentKey: this.clip?.key ?? null });
  }

  playOkAnswer(): void {
    void this.playClip({ key: SYSTEM_OK_KEY, ttsText: OK_FALLBACK });
  }

  playWrongAnswer(): void {
    void this.playClip({ key: SYSTEM_WRONG_KEY, ttsText: WRONG_FALLBACK });
  }

  private stopInternal(): void {
    if (this.ttsTimer !== null) {
      window.clearTimeout(this.ttsTimer);
      this.ttsTimer = null;
    }
    window.speechSynthesis.cancel();
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.mode = null;
  }

  private playTts(text: string): void {
    if (this.ttsTimer !== null) {
      window.clearTimeout(this.ttsTimer);
      this.ttsTimer = null;
    }

    window.speechSynthesis.cancel();

    // Chrome иногда глотает speak() сразу после cancel — небольшая пауза
    this.ttsTimer = window.setTimeout(() => {
      this.ttsTimer = null;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const ruVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ??
        voices.find((v) => v.lang.toLowerCase().includes('ru'));
      if (ruVoice) utterance.voice = ruVoice;

      utterance.onboundary = (event) => {
        if (typeof event.charIndex === 'number') {
          this.charIndex = event.charIndex;
        }
      };

      utterance.onstart = () => this.setState({ status: 'playing' });
      utterance.onend = () => {
        this.charIndex = 0;
        this.setState({ status: 'idle' });
      };
      utterance.onerror = () => this.setState({ status: 'idle' });

      window.speechSynthesis.speak(utterance);
    }, 60);
  }
}

export const audioPlayer = new AudioPlayerController();

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
