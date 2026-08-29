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
type PanelMode = 'listen' | 'record';

export function AudioLibraryPanel({ quest }: AudioLibraryPanelProps) {
  const recorder = useVoiceRecorder();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>('listen');
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
      setInfo('Запись сохранена на этом устройстве.');
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
        `Скачан ${result.filename} (${result.count} файлов). Распакуй в public/audio/ и задеплой сайт.`,
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
        🔊 Голос Мэда
        <span className={styles.count}>
          {localCount}/{total}
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.modeTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'listen'}
              className={`${styles.modeTab} ${mode === 'listen' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('listen')}
            >
              Прослушать
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'record'}
              className={`${styles.modeTab} ${mode === 'record' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('record')}
            >
              Запись (взрослым)
            </button>
          </div>

          {mode === 'listen' ? (
            <>
              <p className={styles.help}>
                Нажми ▶, чтобы услышать фразу. В игре голос включается сам в
                заданиях. Если записи нет — зачитается роботом (TTS).
              </p>
              <div className={styles.list}>
                {slots.map((slot) => {
                  const badge = badgeFor(slot.key);
                  return (
                    <div key={slot.key} className={styles.rowCompact}>
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
                            ? 'ваша'
                            : badge === 'bundled'
                              ? 'сайт'
                              : 'TTS'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.playBtnWide}
                        onClick={() => play(slot.key, slot.ttsText)}
                      >
                        ▶ Слушать
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className={styles.help}>
                Запиши голос на этом устройстве, затем скачай ZIP и положи
                файлы в <code>public/audio/</code> перед деплоем — тогда голос
                будет у всех игроков.
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
                            title="Удалить локальную запись"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
