/**
 * Пиратский эффект при проигрывании: ниже тембр + шум моря.
 * Запись не меняется — эффект только на playback через Web Audio API.
 */

export type EffectsPlayerStatus = 'idle' | 'playing' | 'paused';

export interface EffectsPlayOptions {
  /** Скорость (0.9 ≈ чуть ниже тон). */
  playbackRate?: number;
  /** Громкость голоса 0..1. */
  voiceGain?: number;
  /** Громкость моря 0..1. */
  seaGain?: number;
  onEnded?: () => void;
  onStatus?: (status: EffectsPlayerStatus) => void;
}

class EffectsPlayer {
  private ctx: AudioContext | null = null;
  private voiceSource: AudioBufferSourceNode | null = null;
  private seaSource: AudioBufferSourceNode | null = null;
  private voiceGainNode: GainNode | null = null;
  private seaGainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private buffer: AudioBuffer | null = null;
  private seaBuffer: AudioBuffer | null = null;
  private startedAt = 0;
  private pauseOffset = 0;
  private rate = 0.9;
  private voiceGainValue = 1;
  private seaGainValue = 0.1;
  private status: EffectsPlayerStatus = 'idle';
  private onEnded: (() => void) | null = null;
  private onStatus: ((s: EffectsPlayerStatus) => void) | null = null;
  private seaLoopPromise: Promise<AudioBuffer> | null = null;
  private intentionalStop = false;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  getStatus(): EffectsPlayerStatus {
    return this.status;
  }

  private setStatus(status: EffectsPlayerStatus): void {
    this.status = status;
    this.onStatus?.(status);
  }

  /** Декодировать Blob/ArrayBuffer в AudioBuffer. */
  async decode(source: Blob | ArrayBuffer | string): Promise<AudioBuffer> {
    const ctx = this.ensureCtx();
    let data: ArrayBuffer;
    if (typeof source === 'string') {
      const res = await fetch(source);
      data = await res.arrayBuffer();
    } else if (source instanceof Blob) {
      data = await source.arrayBuffer();
    } else {
      data = source;
    }
    return ctx.decodeAudioData(data.slice(0));
  }

  /**
   * Фоновый шум (синтетика; опционально /audio/ambient-loop.mp3).
   */
  private async getSeaBuffer(): Promise<AudioBuffer> {
    if (this.seaBuffer) return this.seaBuffer;
    if (this.seaLoopPromise) return this.seaLoopPromise;

    this.seaLoopPromise = (async () => {
      const ctx = this.ensureCtx();
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}audio/ambient-loop.mp3`);
        if (res.ok) {
          const data = await res.arrayBuffer();
          this.seaBuffer = await ctx.decodeAudioData(data.slice(0));
          return this.seaBuffer;
        }
      } catch {
        // нет файла — генерируем шум
      }
      this.seaBuffer = this.createSeaNoise(ctx, 8);
      return this.seaBuffer;
    })();

    return this.seaLoopPromise;
  }

  /** Простой фоновый шум: white noise → lowpass. */
  private createSeaNoise(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      // лёгкий brown-ish noise
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  async play(source: Blob | ArrayBuffer | string, options: EffectsPlayOptions = {}): Promise<void> {
    this.stopInternal(false);

    this.rate = options.playbackRate ?? 0.9;
    this.voiceGainValue = options.voiceGain ?? 1;
    this.seaGainValue = options.seaGain ?? 0.1;
    this.onEnded = options.onEnded ?? null;
    this.onStatus = options.onStatus ?? null;
    this.pauseOffset = 0;

    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    this.buffer = await this.decode(source);
    await this.startFromOffset(0);
  }

  private async startFromOffset(offsetSec: number): Promise<void> {
    if (!this.buffer) return;
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = this.voiceGainValue;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2800;
    filter.Q.value = 0.7;

    const voice = ctx.createBufferSource();
    voice.buffer = this.buffer;
    voice.playbackRate.value = this.rate;

    voice.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(ctx.destination);

    const seaBuffer = await this.getSeaBuffer();
    const seaGain = ctx.createGain();
    seaGain.gain.value = this.seaGainValue;

    const seaFilter = ctx.createBiquadFilter();
    seaFilter.type = 'lowpass';
    seaFilter.frequency.value = 600;

    const sea = ctx.createBufferSource();
    sea.buffer = seaBuffer;
    sea.loop = true;
    sea.connect(seaFilter);
    seaFilter.connect(seaGain);
    seaGain.connect(ctx.destination);

    voice.onended = () => {
      if (this.intentionalStop) return;
      if (this.voiceSource !== voice) return;
      this.stopInternal(false);
      this.setStatus('idle');
      this.onEnded?.();
    };

    this.voiceSource = voice;
    this.seaSource = sea;
    this.voiceGainNode = voiceGain;
    this.seaGainNode = seaGain;
    this.filterNode = filter;
    this.startedAt = ctx.currentTime - offsetSec / this.rate;
    this.intentionalStop = false;

    voice.start(0, offsetSec);
    sea.start(0);
    this.setStatus('playing');
  }

  pause(): void {
    if (this.status !== 'playing' || !this.ctx || !this.buffer) return;
    const elapsed = (this.ctx.currentTime - this.startedAt) * this.rate;
    this.pauseOffset = Math.min(Math.max(elapsed, 0), this.buffer.duration - 0.01);
    this.intentionalStop = true;
    this.stopInternal(false);
    this.setStatus('paused');
  }

  async resume(): Promise<void> {
    if (this.status !== 'paused' || !this.buffer) return;
    await this.startFromOffset(this.pauseOffset);
  }

  restart(): void {
    if (!this.buffer) return;
    this.intentionalStop = true;
    this.stopInternal(false);
    void this.startFromOffset(0);
  }

  stop(): void {
    this.intentionalStop = true;
    this.stopInternal(false);
    this.pauseOffset = 0;
    this.buffer = null;
    this.setStatus('idle');
  }

  private stopInternal(_clearBuffer: boolean): void {
    try {
      this.voiceSource?.stop();
    } catch {
      /* already stopped */
    }
    try {
      this.seaSource?.stop();
    } catch {
      /* already stopped */
    }
    this.voiceSource?.disconnect();
    this.seaSource?.disconnect();
    this.voiceGainNode?.disconnect();
    this.seaGainNode?.disconnect();
    this.filterNode?.disconnect();
    this.voiceSource = null;
    this.seaSource = null;
    this.voiceGainNode = null;
    this.seaGainNode = null;
    this.filterNode = null;
  }
}

export const effectsPlayer = new EffectsPlayer();
