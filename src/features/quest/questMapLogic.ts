import type { PointStatus, QuestCard, QuestQuestion } from './questTypes';
import { checkAnswer } from './questLogic';

/** Все вопросы точки (новый формат или legacy-поля). */
export function getCardQuestions(card: QuestCard): QuestQuestion[] {
  if (card.questions?.length) return card.questions;
  if (card.prompt && card.answer && card.options) {
    return [
      {
        id: `${card.id}-legacy`,
        topic: 'story',
        topicLabel: 'Загадка',
        prompt: card.prompt,
        answer: card.answer,
        options: card.options,
        hint: card.hint,
        puzzleExtra: card.puzzleExtra,
      },
    ];
  }
  return [];
}

/** Статус маркера: пройдена / текущая / ещё закрыта. */
export function getPointStatus(
  pointIndex: number,
  progressIndex: number,
  questCompleted: boolean,
): PointStatus {
  if (questCompleted || pointIndex < progressIndex) return 'completed';
  if (pointIndex === progressIndex) return 'active';
  return 'locked';
}

/** Можно открыть точку (текущую и все уже пройденные). */
export function canOpenPoint(
  pointIndex: number,
  progressIndex: number,
  questCompleted: boolean,
): boolean {
  if (questCompleted) return true;
  return pointIndex <= progressIndex;
}

/** Количество найденных артефактов. */
export function countArtifacts(progressIndex: number, questCompleted: boolean): number {
  if (questCompleted) return progressIndex + 1;
  return progressIndex;
}

/** Индекс правильного ответа. */
export function getCorrectAnswerIndex(question: QuestQuestion): number {
  const idx = question.options.findIndex((opt) => checkAnswer(opt, question.answer));
  return idx >= 0 ? idx : 0;
}

/** Проверка ответа игрока. */
export function handleAnswer(question: QuestQuestion, answerIndex: number): boolean {
  return answerIndex === getCorrectAnswerIndex(question);
}
