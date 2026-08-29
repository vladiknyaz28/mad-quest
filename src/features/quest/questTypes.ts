/** Координаты точки на карте (в % от ширины/высоты). */
export interface MapPoint {
  coordX: number;
  coordY: number;
}

/** ID персонажа — см. data/characters.ts */
export type CharacterId =
  | 'ladybug'
  | 'inspector'
  | 'cat-noir'
  | 'fox'
  | 'turtle'
  | 'mouse-matt'
  | 'fantomas'
  | 'brazhnik'
  | 'crimson-lob'
  | 'crimson-lord';

/** Состояние маркера на карте. */
export type PointStatus = 'locked' | 'active' | 'completed';

/** Тема вопроса на точке. */
export type QuestionTopic = 'cipher' | 'astronomy' | 'math' | 'logic' | 'story';

export interface QuestQuestion {
  id: string;
  topic: QuestionTopic;
  /** Подпись темы для UI, напр. «Шифр». */
  topicLabel: string;
  prompt: string;
  answer: string;
  options: string[];
  hint?: string;
  puzzleExtra?: string;
}

export interface QuestCard {
  id: string;
  title: string;
  story: string;
  /** Набор вопросов по всем темам (шифр, астрономия, математика, логика, сюжет). */
  questions?: QuestQuestion[];
  nextCardId?: string;
  map?: MapPoint;
  /** Персонаж, который «говорит» на точке. */
  characterId?: CharacterId;
  /** @deprecated Оставлено для совместимости со старыми карточками. */
  prompt?: string;
  answer?: string;
  options?: string[];
  hint?: string;
  puzzleExtra?: string;
}

export interface Quest {
  id: string;
  name: string;
  description?: string;
  background?: string;
  cards: QuestCard[];
}

export type AnswerStatus = 'idle' | 'correct' | 'wrong';

export interface QuestProgress {
  questId: string;
  currentCardId: string;
  completed: boolean;
}

/** @deprecated Используйте QuestCard — оставлено для ясности импортов. */
export type Card = QuestCard;
