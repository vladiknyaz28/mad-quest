import { useEffect, useMemo, useState } from 'react';
import { resolveBundledAudioUrl } from '../../shared/audio/audioManifest';
import { listQuestAudioSlots } from '../../shared/audio/audioSlots';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import { voiceRecorder } from '../../shared/audio/recorder';
import { useVoiceRecorder } from '../../shared/audio/useVoiceRecorder';
import type { Quest } from './questTypes';
import styles from './AudioLibraryPanel.module.css';

interface AudioLibraryPanelProps {
  quest: Quest;
}

type SourceBadge = 'local' | 'bundled' | 'tts';

export function AudioLibraryPanel({ quest }: AudioLibraryPanelProps) {
  const recorder = useVoiceRecorder();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [bundled, setBundled] = useState<Record<string, boolean>>({});

  const slots = useMemo(() => listQuestAudioSlots(quest), [quest]);

  void recorder.clipsVersion;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const map: Record<string, boolean> = {};
      for (const slot of slots) {
        map[slot.key] = Boolean(await resolveBundledAudioUrl(slot.key));
      }
      if (!cancelled) setBundled(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, slots, recorder.clipsVersion]);

  const badgeFor = (key: string): SourceBadge => {
    if (voiceRecorder.hasRecording(key)) return 'local';
    if (bundled[key]) return 'bundled';
    return 'tts';
  };

  const localCount = voiceRecorder.recordingCount();
  const total = slots.length;

  const start = async (key: string) => {
    setError(null);
    setBusy(true);
    try {
      audioPlayer.stop();
      await voiceRecorder.startRecording(key);
    } catch {
      setError('Нет доступа к микрофону.');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      await voiceRecorder.stopRecording({ download: false });
      setInfo('Сохранено на этом устройстве. Для всех устройств — «Скачать ZIP для деплоя».');
    } finally {
      setBusy(false);
    }
  };

  const play = (key: string, ttsText: string) => {
    void audioPlayer.playClip({ key, ttsText });
  };

  const exportZip = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await voiceRecorder.exportAllForDeploy();
      setInfo(
        `Скачан ${result.filename} (${result.count} файлов). Распакуй в public/audio/ → npm run deploy.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать ZIP');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Студия голоса Мэда
        <span className={styles.count}>
          {localCount}/{total}
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <p className={styles.help}>
            <strong>Как сделать голос для всех устройств:</strong>
            <br />
            1) Запиши фразы здесь (хранятся на этом устройстве).
            <br />
            2) Нажми <em>Скачать ZIP для деплоя</em>.
            <br />
            3) Распакуй файлы в <code>public/audio/</code> (имена вида{' '}
            <code>mad_card1_story.webm</code>), сделай commit и{' '}
            <code>npm run deploy</code>.
            <br />
            4) На телефоне у игрока заиграют эти файлы. Старые пиратские{' '}
            <code>card1_story.webm</code> без префикса <code>mad_</code> не
            используются.
          </p>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => void exportZip()}
            disabled={busy || localCount === 0}
          >
            Скачать ZIP для деплоя ({localCount})
          </button>

          {info && <p className={styles.info}>{info}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.list}>
            {slots.map((slot) => {
              const badge = badgeFor(slot.key);
              const isRec = recorder.recordingKey === slot.key;
              return (
                <div key={slot.key} className={styles.row}>
                  <div className={styles.rowTop}>
                    <span className={styles.label}>{slot.label}</span>
                    <span
                      className={`${styles.badge} ${
                        badge === 'local'
                          ? styles.badgeLocal
                          : badge === 'bundled'
                            ? styles.badgeBundled
                            : styles.badgeTts
                      }`}
                    >
                      {badge === 'local'
                        ? 'на устройстве'
                        : badge === 'bundled'
                          ? 'в деплое'
                          : 'TTS'}
                    </span>
                  </div>
                  <p className={styles.file}>{slot.filename}</p>
                  <div className={styles.btns}>
                    {isRec ? (
                      <button
                        type="button"
                        className={styles.stopBtn}
                        onClick={() => void stop()}
                        disabled={busy}
                      >
                        ■ Стоп
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.recBtn}
                        onClick={() => void start(slot.key)}
                        disabled={busy || Boolean(recorder.recordingKey)}
                      >
                        ● Записать
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.playBtn}
                      onClick={() => play(slot.key, slot.ttsText)}
                      disabled={isRec}
                    >
                      ▶
                    </button>
                    {voiceRecorder.hasRecording(slot.key) && (
                      <button
                        type="button"
                        className={styles.delBtn}
                        onClick={() => void voiceRecorder.deleteRecording(slot.key)}
                        disabled={isRec}
                        title="Удалить локальную запись (останется деплой/TTS)"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
