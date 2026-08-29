import { useEffect, useState } from 'react';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import { promptClipKey, storyClipKey } from '../../shared/audio/recorder';
import { useAudioPlayer } from '../../shared/audio/useAudioPlayer';
import type { QuestCard } from './questTypes';
import { getCardQuestions } from './questMapLogic';
import { QuestAnswerModal } from './QuestAnswerModal';
import { VoiceRecordPanel } from './VoiceRecordPanel';
import styles from './QuestCardView.module.css';

interface QuestCardViewProps {
  card: QuestCard;
  status: 'idle' | 'correct' | 'wrong';
  showHint: boolean;
  completed: boolean;
  hasNextAfterCorrect: boolean;
  onSubmit: (selected: string) => boolean;
  onContinueAfterCorrect: () => void;
  onToggleHint: () => void;
  onResetCard: () => void;
  onRestartQuest: () => void;
}

export function QuestCardView({
  card,
  status,
  showHint,
  completed,
  hasNextAfterCorrect,
  onSubmit,
  onContinueAfterCorrect,
  onToggleHint,
  onResetCard,
  onRestartQuest,
}: QuestCardViewProps) {
  const player = useAudioPlayer();
  const questions = getCardQuestions(card);
  const mainQuestion = questions[0];
  const [showSecretAnswer, setShowSecretAnswer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalWrong, setModalWrong] = useState(false);

  useEffect(() => {
    setShowSecretAnswer(false);
    setModalOpen(false);
    setModalWrong(false);
  }, [card.id]);

  const playStory = () => {
    void audioPlayer.playClip({
      key: storyClipKey(card.id),
      ttsText: card.story,
    });
  };

  const playQuestion = () => {
    void audioPlayer.playClip({
      key: promptClipKey(card.id),
      ttsText: mainQuestion?.prompt ?? card.prompt ?? '',
    });
  };

  const openModal = () => {
    setModalWrong(false);
    setModalOpen(true);
  };

  const handleSelect = (option: string) => {
    const ok = onSubmit(option);
    if (ok) {
      setModalOpen(false);
      setModalWrong(false);
    } else {
      setModalWrong(true);
    }
  };

  if (completed) {
    return (
      <article className={styles.parchment}>
        <p className={styles.eyebrow}>Полицейский Мэд</p>
        <h2 className={styles.title}>Квест завершён!</h2>
        <p className={styles.story}>
          Отлично! Ты помог Мэду поймать Фантомаса и прошёл все станции городского
          квеста по ПДД. Главное правило осталось с тобой: уважать других и соблюдать
          правила дорожного движения.
        </p>
        <button type="button" className={styles.primaryBtn} onClick={onRestartQuest}>
          Пройти снова
        </button>
      </article>
    );
  }

  return (
    <article className={styles.parchment}>
      <p className={styles.eyebrow}>Карточка квеста</p>
      <h2 className={styles.title}>{card.title}</h2>
      <p className={styles.story}>{card.story}</p>

      <div className={styles.player}>
        <button type="button" className={styles.playerBtn} onClick={playStory}>
          ▶ История
        </button>
        <button type="button" className={styles.playerBtn} onClick={playQuestion}>
          ▶ Вопрос
        </button>
        <button
          type="button"
          className={styles.playerBtn}
          onClick={() => audioPlayer.pause()}
          disabled={player.status !== 'playing'}
        >
          ⏸ Пауза
        </button>
        <button
          type="button"
          className={styles.playerBtn}
          onClick={() => audioPlayer.resume()}
          disabled={player.status !== 'paused'}
        >
          ▶ Продолжить
        </button>
        <button
          type="button"
          className={styles.playerBtn}
          onClick={() => audioPlayer.restart()}
          disabled={!player.currentKey}
        >
          ⏮ С начала
        </button>
      </div>

      <section className={styles.puzzle}>
        <h3 className={styles.puzzleTitle}>Загадка</h3>
        <p className={styles.prompt}>{mainQuestion?.prompt ?? card.prompt}</p>

        <button
          type="button"
          className={`${styles.secretDots} ${showSecretAnswer ? styles.secretDotsRevealed : ''}`}
          onClick={() => setShowSecretAnswer((v) => !v)}
          aria-label="Секрет"
        >
          {showSecretAnswer ? (mainQuestion?.answer ?? card.answer) : '...'}
        </button>

        {status === 'correct' && (
          <div className={styles.correctBlock} role="status">
            <p className={`${styles.feedback} ${styles.ok}`}>Верно!</p>
            <button
              type="button"
              className={styles.continueBtn}
              onClick={onContinueAfterCorrect}
            >
              {hasNextAfterCorrect ? 'Далее →' : 'Завершить'}
            </button>
          </div>
        )}

        {status === 'wrong' && !modalOpen && (
          <p className={`${styles.feedback} ${styles.bad}`} role="status">
            неверно, попробуй ещё
          </p>
        )}

        {showHint && card.hint && status !== 'correct' && (
          <p className={styles.hint}>Подсказка: {card.hint}</p>
        )}

        {status !== 'correct' && (
          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={openModal}>
              Ответить
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={onToggleHint}>
              Подсказка
            </button>
            <button type="button" className={styles.ghostBtn} onClick={onResetCard}>
              С начала карточки
            </button>
          </div>
        )}
      </section>

      <VoiceRecordPanel cardId={card.id} />

      <QuestAnswerModal
        open={modalOpen}
        options={mainQuestion?.options ?? card.options ?? []}
        wrongPick={modalWrong}
        onSelect={handleSelect}
        onClose={() => {
          setModalOpen(false);
          setModalWrong(false);
        }}
        onRetry={() => setModalWrong(false)}
      />
    </article>
  );
}
