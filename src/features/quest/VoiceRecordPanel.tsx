import { useState } from 'react';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import {
  promptClipKey,
  storyClipKey,
  suggestedDownloadName,
  SYSTEM_OK_KEY,
  SYSTEM_WRONG_KEY,
  voiceRecorder,
} from '../../shared/audio/recorder';
import { useVoiceRecorder } from '../../shared/audio/useVoiceRecorder';
import styles from './VoiceRecordPanel.module.css';

interface VoiceRecordPanelProps {
  cardId: string;
}

interface ClipRowProps {
  label: string;
  clipKey: string;
  filename: string;
  recordingKey: string | null;
  hasClip: boolean;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onPlay: () => void;
  onDelete: () => void;
}

function ClipRow({
  label,
  clipKey,
  filename,
  recordingKey,
  hasClip,
  busy,
  onStart,
  onStop,
  onPlay,
  onDelete,
}: ClipRowProps) {
  const isRecordingThis = recordingKey === clipKey;

  return (
    <div className={styles.row}>
      <p className={styles.rowLabel}>
        {label}
        <span className={styles.fileHint}>{filename}</span>
        {hasClip ? <span className={styles.badge}>на устройстве</span> : null}
      </p>
      <div className={styles.rowBtns}>
        {isRecordingThis ? (
          <button type="button" className={styles.stopBtn} onClick={onStop} disabled={busy}>
            ■ Стоп
          </button>
        ) : (
          <button
            type="button"
            className={styles.recBtn}
            onClick={onStart}
            disabled={busy || Boolean(recordingKey)}
          >
            ● Записать
          </button>
        )}
        <button
          type="button"
          className={styles.playBtn}
          onClick={onPlay}
          disabled={!hasClip || isRecordingThis}
        >
          ▶
        </button>
        <button
          type="button"
          className={styles.delBtn}
          onClick={onDelete}
          disabled={!hasClip || isRecordingThis}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Быстрая запись для текущей карточки. Полный набор — на главной в «Студии голоса». */
export function VoiceRecordPanel({ cardId }: VoiceRecordPanelProps) {
  const recorder = useVoiceRecorder();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  void recorder.clipsVersion;

  const storyKey = storyClipKey(cardId);
  const promptKey = promptClipKey(cardId);

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
    } finally {
      setBusy(false);
    }
  };

  const play = (key: string) => {
    const url = voiceRecorder.getRecordingUrl(key);
    void audioPlayer.playClip({ key, url: url ?? undefined });
  };

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
        onClick={() => setEnabled((v) => !v)}
        aria-pressed={enabled}
      >
        Перезаписать голос: {enabled ? 'ВКЛ' : 'ВЫКЛ'}
      </button>

      {enabled && (
        <div className={styles.body}>
          <p className={styles.hint}>
            Локальная перезапись только на этом устройстве. Общий голос для всех —
            через «Студию голоса» на главной → ZIP → <code>public/audio/</code> →
            deploy.
          </p>

          <ClipRow
            label="История"
            clipKey={storyKey}
            filename={suggestedDownloadName(storyKey)}
            recordingKey={recorder.recordingKey}
            hasClip={voiceRecorder.hasRecording(storyKey)}
            busy={busy}
            onStart={() => void start(storyKey)}
            onStop={() => void stop()}
            onPlay={() => play(storyKey)}
            onDelete={() => void voiceRecorder.deleteRecording(storyKey)}
          />

          <ClipRow
            label="Вопрос"
            clipKey={promptKey}
            filename={suggestedDownloadName(promptKey)}
            recordingKey={recorder.recordingKey}
            hasClip={voiceRecorder.hasRecording(promptKey)}
            busy={busy}
            onStart={() => void start(promptKey)}
            onStop={() => void stop()}
            onPlay={() => play(promptKey)}
            onDelete={() => void voiceRecorder.deleteRecording(promptKey)}
          />

          <ClipRow
            label="Верно"
            clipKey={SYSTEM_OK_KEY}
            filename={suggestedDownloadName(SYSTEM_OK_KEY)}
            recordingKey={recorder.recordingKey}
            hasClip={voiceRecorder.hasRecording(SYSTEM_OK_KEY)}
            busy={busy}
            onStart={() => void start(SYSTEM_OK_KEY)}
            onStop={() => void stop()}
            onPlay={() => play(SYSTEM_OK_KEY)}
            onDelete={() => void voiceRecorder.deleteRecording(SYSTEM_OK_KEY)}
          />

          <ClipRow
            label="Неверно"
            clipKey={SYSTEM_WRONG_KEY}
            filename={suggestedDownloadName(SYSTEM_WRONG_KEY)}
            recordingKey={recorder.recordingKey}
            hasClip={voiceRecorder.hasRecording(SYSTEM_WRONG_KEY)}
            busy={busy}
            onStart={() => void start(SYSTEM_WRONG_KEY)}
            onStop={() => void stop()}
            onPlay={() => play(SYSTEM_WRONG_KEY)}
            onDelete={() => void voiceRecorder.deleteRecording(SYSTEM_WRONG_KEY)}
          />

          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </section>
  );
}
