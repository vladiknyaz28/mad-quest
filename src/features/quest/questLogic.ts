import type { Quest, QuestCard } from './questTypes';

/** Нормализация ответа: нижний регистр, trim, ё→е. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

export function checkAnswer(userInput: string, expected: string): boolean {
  return normalizeAnswer(userInput) === normalizeAnswer(expected);
}

export function getCardById(quest: Quest, cardId: string): QuestCard | undefined {
  return quest.cards.find((card) => card.id === cardId);
}

export function getFirstCard(quest: Quest): QuestCard | undefined {
  return quest.cards[0];
}

export function getNextCard(quest: Quest, current: QuestCard): QuestCard | undefined {
  if (!current.nextCardId) return undefined;
  return getCardById(quest, current.nextCardId);
}

export function isLastCard(card: QuestCard): boolean {
  return !card.nextCardId;
}

export function indexOfCard(cards: QuestCard[], cardId: string | undefined): number {
  if (!cardId) return 0;
  const idx = cards.findIndex((c) => c.id === cardId);
  return idx >= 0 ? idx : 0;
}
