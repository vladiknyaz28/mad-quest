import { useEffect, useId } from 'react';
import type { AnswerStatus, QuestCard, QuestQuestion } from './questTypes';
import { getCharacter } from './data/characters';
import { CharacterPortrait } from './CharacterPortrait';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import { promptClipKey, storyClipKey } from '../../shared/audio/audioManifest';
import styles from './MapPointModal.module.css';

interface MapPointModalProps {
  open: boolean;
  card: QuestCard | null;
  pointNumber: number;
  currentQuestion: QuestQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  status: AnswerStatus;
  wrongPick: boolean;
  pointComplete: boolean;
  isReviewMode: boolean;
  onSelect: (option: string, answerIndex: number) => void;
  onClose: () => void;
}

/** Модальное окно с заданием точки на карте. */
export function MapPointModal({
  open,
  card,
  pointNumber,
  currentQuestion,
  questionIndex,
  totalQuestions,
  status,
  wrongPick,
  pointComplete,
  isReviewMode,
  onSelect,
  onClose,
}: MapPointModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pointComplete) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, pointComplete]);

  if (!open || !card || !currentQuestion) return null;

  const speaker = getCharacter(card.characterId);

  const playStory = () => {
    void audioPlayer.playClip({ key: storyClipKey(card.id), ttsText: card.story });
  };

  const playQuestion = () => {
    if (!currentQuestion) return;
    void audioPlayer.playClip({
      key: promptClipKey(card.id),
      ttsText: currentQuestion.prompt,
    });
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={pointComplete ? undefined : onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.eyebrow}>Задание</p>
        <h2 id={titleId} className={styles.title}>
          Точка {pointNumber}: {card.title}
        </h2>

        {questionIndex === 0 && (
          <div className={styles.storyBlock}>
            {speaker && (
              <div className={styles.speaker}>
                <CharacterPortrait characterId={speaker.id} size="md" />
                <p className={styles.speakerName}>{speaker.name}</p>
              </div>
            )}
            <p className={styles.story}>{card.story}</p>
            <button type="button" className={styles.voiceBtn} onClick={playStory}>
              🔊 Слушать историю
            </button>
          </div>
        )}

        <div className={styles.metaRow}>
          <span className={styles.topicBadge}>{currentQuestion.topicLabel}</span>
          <span className={styles.progress}>
            Вопрос {questionIndex + 1} из {totalQuestions}
          </span>
        </div>

        {currentQuestion.puzzleExtra && (
          <pre className={styles.puzzleExtra}>{currentQuestion.puzzleExtra}</pre>
        )}

        <div className={styles.questionRow}>
          <p className={styles.question}>{currentQuestion.prompt}</p>
          <button type="button" className={styles.voiceBtnSmall} onClick={playQuestion} aria-label="Озвучить вопрос">
            🔊
          </button>
        </div>

        {isReviewMode && !pointComplete && (
          <p className={styles.reviewNote}>Повторное прохождение — прогресс не изменится</p>
        )}

        {pointComplete && (
          <p className={styles.correctMsg} role="status">
            {isReviewMode ? 'Отлично! Точка пройдена.' : 'Все загадки решены! Артефакт найден…'}
          </p>
        )}

        {wrongPick && status === 'wrong' && (
          <p className={styles.wrongMsg} role="status">
            Неверно, попробуй ещё!
          </p>
        )}

        {!pointComplete && (
          <div className={styles.answers}>
            {currentQuestion.options.map((option, index) => (
              <button
                key={`${currentQuestion.id}-${option}`}
                type="button"
                className={styles.answerBtn}
                onClick={() => onSelect(option, index)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {!pointComplete && (
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Закрыть
          </button>
        )}
      </div>
    </div>
  );
}
