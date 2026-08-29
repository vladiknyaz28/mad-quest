import type { CharacterId } from '../questTypes';
import type { Quest, QuestCard, QuestQuestion } from '../questTypes';

/** Стандартный порядок тем на каждой точке. */
const TOPICS: Pick<QuestQuestion, 'topic' | 'topicLabel'>[] = [
  { topic: 'cipher', topicLabel: 'Шифр' },
  { topic: 'astronomy', topicLabel: 'Астрономия' },
  { topic: 'math', topicLabel: 'Математика' },
  { topic: 'logic', topicLabel: 'Логика' },
  { topic: 'story', topicLabel: 'Сюжет' },
];

export type PointQuestions = Omit<QuestQuestion, 'id' | 'topic' | 'topicLabel'>[];

export interface PointTemplate {
  id: string;
  title: string;
  story: string;
  map: { coordX: number; coordY: number };
  characterId: CharacterId;
  nextCardId?: string;
}

export const POINT_TEMPLATES: PointTemplate[] = [
  {
    id: 'point1',
    title: 'Кафе «У Мэда»',
    story:
      'Леди Баг нашла на столике шифровку Фантомаса. Инспектор Мэд собрал команду в кафе — это главный штаб.',
    map: { coordX: 15, coordY: 35 },
    characterId: 'ladybug',
    nextCardId: 'point2',
  },
  {
    id: 'point2',
    title: 'Площадь героев',
    story:
      'Супер-Кот заметил на мостовой звёздную схему. Натали принесла новую записку от злодеев.',
    map: { coordX: 50, coordY: 50 },
    characterId: 'cat-noir',
    nextCardId: 'point3',
  },
  {
    id: 'point3',
    title: 'Старый музей',
    story: 'Черепаха нашла в музее счётную книгу злодеев. Каждый зал хранит часть кода.',
    map: { coordX: 85, coordY: 43 },
    characterId: 'turtle',
    nextCardId: 'point4',
  },
  {
    id: 'point4',
    title: 'Парк аттракционов',
    story: 'Лиса перехватила сообщение Бражника-Мотылька среди каруселей.',
    map: { coordX: 50, coordY: 23 },
    characterId: 'fox',
    nextCardId: 'point5',
  },
  {
    id: 'point5',
    title: 'Набережная реки',
    story: 'Мышь Мэт обнаружила на набережной сложный шифр у воды.',
    map: { coordX: 88, coordY: 82 },
    characterId: 'mouse-matt',
    nextCardId: 'point6',
  },
  {
    id: 'point6',
    title: 'Заброшенный театр',
    story: 'Багровый лоб устроил на сцене лабиринт загадок.',
    map: { coordX: 80, coordY: 68 },
    characterId: 'crimson-lob',
    nextCardId: 'point7',
  },
  {
    id: 'point7',
    title: 'Башня часов',
    story: 'Финал! Фантомас, Бражник и Багровый Лорд спрятали артефакты на башне.',
    map: { coordX: 73, coordY: 20 },
    characterId: 'fantomas',
  },
];

function qs(pointId: string, items: PointQuestions): QuestQuestion[] {
  return items.map((item, i) => ({
    id: `${pointId}-q${i + 1}`,
    topic: TOPICS[i]!.topic,
    topicLabel: TOPICS[i]!.topicLabel,
    ...item,
  }));
}

/** Собирает квест из шаблонов точек и набора вопросов (7 × 5). */
export function buildQuest(
  id: string,
  name: string,
  description: string,
  allPointQuestions: PointQuestions[],
): Quest {
  const cards: QuestCard[] = POINT_TEMPLATES.map((pt, index) => ({
    ...pt,
    questions: qs(pt.id, allPointQuestions[index]!),
  }));
  return {
    id,
    name,
    description,
    background: 'backgrounds/map-quest.png',
    cards,
  };
}
