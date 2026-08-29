import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkAnswer,
  getCardById,
  getFirstCard,
  getNextCard,
  indexOfCard,
  isLastCard,
} from './questLogic';
import { getCardQuestions, handleAnswer } from './questMapLogic';
import type { AnswerStatus, Quest, QuestCard, QuestProgress, QuestQuestion } from './questTypes';
import { clearProgress, loadProgress, saveProgress } from '../../shared/storage/localStore';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import { promptClipKey } from '../../shared/audio/audioManifest';

export interface UseQuestEngineResult {
  card: QuestCard | null;
  cards: QuestCard[];
  /** Выбранная на карте точка. */
  cardIndex: number;
  /** Следующая непройденная точка (прогресс). */
  progressIndex: number;
  totalCards: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  hasNextAfterCorrect: boolean;
  status: AnswerStatus;
  showHint: boolean;
  completed: boolean;
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: QuestQuestion | null;
  pointComplete: boolean;
  isReviewMode: boolean;
  submitAnswer: (selected: string) => boolean;
  submitAnswerByIndex: (answerIndex: number) => boolean;
  continueAfterCorrect: () => void;
  toggleHint: () => void;
  resetCard: () => void;
  restartQuest: () => void;
  goPrevCard: () => void;
  goNextCard: () => void;
  goToCard: (index: number) => void;
  beginPointSession: (index: number) => void;
  endPointSession: () => void;
}

/** Движок сессии: свободная навигация по пройденным точкам + линейный прогресс. */
export function useQuestEngine(quest: Quest): UseQuestEngineResult {
  const cards = quest.cards;

  const initial = useMemo(() => {
    const saved = loadProgress(quest.id);
    const first = getFirstCard(quest);
    if (saved) {
      const card = getCardById(quest, saved.currentCardId) ?? first ?? null;
      return { progressIndex: indexOfCard(cards, card?.id), completed: saved.completed };
    }
    return { progressIndex: 0, completed: false };
  }, [quest, cards]);

  const [progressIndex, setProgressIndex] = useState(initial.progressIndex);
  const [viewIndex, setViewIndex] = useState(initial.progressIndex);
  const [playPointIndex, setPlayPointIndex] = useState<number | null>(null);
  const [completed, setCompleted] = useState(initial.completed);
  const [status, setStatus] = useState<AnswerStatus>('idle');
  const [showHint, setShowHint] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  /** Сброс при смене сценария. */
  useEffect(() => {
    const saved = loadProgress(quest.id);
    const first = getFirstCard(quest);
    if (saved) {
      const savedCard = getCardById(quest, saved.currentCardId) ?? first ?? null;
      setProgressIndex(indexOfCard(cards, savedCard?.id));
      setViewIndex(indexOfCard(cards, savedCard?.id));
      setCompleted(saved.completed);
    } else {
      setProgressIndex(0);
      setViewIndex(0);
      setCompleted(false);
    }
    setPlayPointIndex(null);
    setStatus('idle');
    setShowHint(false);
    setQuestionIndex(0);
  }, [quest.id, cards, quest]);

  const card = cards[viewIndex] ?? null;
  const playCard = playPointIndex !== null ? cards[playPointIndex] ?? null : null;
  const cardQuestions = playCard ? getCardQuestions(playCard) : [];
  const currentQuestion = cardQuestions[questionIndex] ?? null;
  const totalQuestions = cardQuestions.length;
  const pointComplete = status === 'correct';
  const isReviewMode =
    playPointIndex !== null && playPointIndex < progressIndex && !completed;
  const totalCards = cards.length;
  const canGoPrev = viewIndex > 0;
  const canGoNext = completed ? viewIndex < totalCards - 1 : viewIndex < progressIndex;
  const hasNextAfterCorrect = Boolean(
    playCard && getNextCard(quest, playCard) && playPointIndex === progressIndex,
  );

  const persist = useCallback((next: QuestProgress) => {
    saveProgress(next);
  }, []);

  useEffect(() => {
    const progressCard = cards[progressIndex];
    if (!progressCard) return;
    persist({ questId: quest.id, currentCardId: progressCard.id, completed });
  }, [progressIndex, completed, persist, quest.id, cards]);

  const beginPointSession = useCallback((index: number) => {
    if (index < 0 || index >= cards.length) return;
    setViewIndex(index);
    setPlayPointIndex(index);
    setStatus('idle');
    setShowHint(false);
    setQuestionIndex(0);
    audioPlayer.stop();
  }, [cards.length]);

  const endPointSession = useCallback(() => {
    setPlayPointIndex(null);
    setStatus('idle');
    setShowHint(false);
    setQuestionIndex(0);
    audioPlayer.stop();
  }, []);

  const goToCard = useCallback(
    (index: number) => {
      if (index < 0 || index >= cards.length) return;
      setViewIndex(index);
      endPointSession();
    },
    [cards.length, endPointSession],
  );

  const goPrevCard = useCallback(() => {
    if (viewIndex <= 0) return;
    goToCard(viewIndex - 1);
  }, [viewIndex, goToCard]);

  const goNextCard = useCallback(() => {
    const maxIndex = completed ? cards.length - 1 : progressIndex;
    if (viewIndex >= maxIndex) return;
    goToCard(viewIndex + 1);
  }, [viewIndex, progressIndex, completed, cards.length, goToCard]);

  const submitAnswerByIndex = useCallback(
    (answerIndex: number): boolean => {
      if (!playCard || !currentQuestion || completed || pointComplete) return false;
      if (playPointIndex !== null && playPointIndex > progressIndex) return false;

      const ok = handleAnswer(currentQuestion, answerIndex);
      if (ok) {
        audioPlayer.playOkAnswer();
        if (questionIndex >= cardQuestions.length - 1) {
          setStatus('correct');
        } else {
          const nextQ = cardQuestions[questionIndex + 1];
          setQuestionIndex((i) => i + 1);
          setStatus('idle');
          if (nextQ && playCard) {
            void audioPlayer.playClip({
              key: promptClipKey(playCard.id),
              ttsText: nextQ.prompt,
            });
          }
        }
        return true;
      }

      setStatus('wrong');
      audioPlayer.playWrongAnswer();
      return false;
    },
    [
      playCard,
      cardQuestions,
      completed,
      currentQuestion,
      playPointIndex,
      pointComplete,
      progressIndex,
      questionIndex,
    ],
  );

  const submitAnswer = useCallback(
    (selected: string): boolean => {
      if (!currentQuestion || completed || pointComplete) return false;
      if (playPointIndex !== null && playPointIndex > progressIndex) return false;

      const ok = checkAnswer(selected, currentQuestion.answer);
      if (ok) {
        audioPlayer.playOkAnswer();
        if (questionIndex >= cardQuestions.length - 1) {
          setStatus('correct');
        } else {
          setQuestionIndex((i) => i + 1);
          setStatus('idle');
        }
        return true;
      }

      setStatus('wrong');
      audioPlayer.playWrongAnswer();
      return false;
    },
    [
      cardQuestions.length,
      completed,
      currentQuestion,
      playPointIndex,
      pointComplete,
      progressIndex,
      questionIndex,
    ],
  );

  const continueAfterCorrect = useCallback(() => {
    if (!playCard || status !== 'correct' || playPointIndex === null) return;

    if (!isReviewMode && playPointIndex === progressIndex) {
      const next = getNextCard(quest, playCard);
      if (next) {
        const nextIdx = indexOfCard(cards, next.id);
        setProgressIndex(nextIdx);
        setViewIndex(nextIdx);
      } else if (isLastCard(playCard)) {
        setCompleted(true);
      }
    }

    endPointSession();
  }, [
    playCard,
    cards,
    endPointSession,
    isReviewMode,
    playPointIndex,
    progressIndex,
    quest,
    status,
  ]);

  const toggleHint = useCallback(() => {
    setShowHint((v) => !v);
  }, []);

  const resetCard = useCallback(() => {
    setStatus('idle');
    setShowHint(false);
    setQuestionIndex(0);
    audioPlayer.stop();
  }, []);

  const restartQuest = useCallback(() => {
    clearProgress(quest.id);
    setProgressIndex(0);
    setViewIndex(0);
    setCompleted(false);
    endPointSession();
  }, [endPointSession, quest.id]);

  return {
    card,
    cards,
    cardIndex: viewIndex,
    progressIndex,
    totalCards,
    canGoPrev,
    canGoNext,
    hasNextAfterCorrect,
    status,
    showHint,
    completed,
    questionIndex,
    totalQuestions,
    currentQuestion,
    pointComplete,
    isReviewMode,
    submitAnswer,
    submitAnswerByIndex,
    continueAfterCorrect,
    toggleHint,
    resetCard,
    restartQuest,
    goPrevCard,
    goNextCard,
    goToCard,
    beginPointSession,
    endPointSession,
  };
}
