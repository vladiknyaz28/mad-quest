import type { CharacterId } from '../questTypes';

export type CharacterSide = 'hero' | 'villain';

export type HeroSprite = 'ladybug' | 'inspector' | 'cat-noir' | 'fox' | 'turtle';
export type VillainSprite = 'crimson-lob' | 'fantomas' | 'crimson-lord' | 'brazhnik';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  side: CharacterSide;
  /** Спрайт из heroes.png. */
  sprite?: HeroSprite;
  /** Спрайт из villains.png. */
  villainSprite?: VillainSprite;
  /** Цвет заглушки, если нет спрайта. */
  accent?: string;
  role?: string;
}

const base = import.meta.env.BASE_URL;

export const HEROES_SHEET = `${base}characters/heroes.png`;
export const VILLAINS_SHEET = `${base}characters/villains.png`;

/** Позиции спрайтов на листе героев (background-position %). */
export const HERO_SPRITE_POS: Record<HeroSprite, { x: number; y: number }> = {
  ladybug: { x: 8, y: 6 },
  inspector: { x: 50, y: 6 },
  'cat-noir': { x: 92, y: 6 },
  fox: { x: 28, y: 88 },
  turtle: { x: 78, y: 88 },
};

/** Позиции злодеев на листе villains.png (4 персонажа в ряд). */
export const VILLAIN_SPRITE_POS: Record<VillainSprite, { x: number; y: number }> = {
  'crimson-lob': { x: 12, y: 50 },
  fantomas: { x: 37, y: 50 },
  'crimson-lord': { x: 63, y: 50 },
  brazhnik: { x: 88, y: 50 },
};

export const characters: CharacterDef[] = [
  {
    id: 'ladybug',
    name: 'Леди Баг',
    side: 'hero',
    sprite: 'ladybug',
    role: 'Лидер команды',
  },
  {
    id: 'inspector',
    name: 'Главный инспектор',
    side: 'hero',
    sprite: 'inspector',
    role: 'Штаб у кафе',
  },
  {
    id: 'cat-noir',
    name: 'Супер-Кот',
    side: 'hero',
    sprite: 'cat-noir',
    role: 'Разведка',
  },
  {
    id: 'fox',
    name: 'Лиса',
    side: 'hero',
    sprite: 'fox',
    role: 'Хитрость и ловушки',
  },
  {
    id: 'turtle',
    name: 'Черепаха',
    side: 'hero',
    sprite: 'turtle',
    role: 'Защита и сила',
  },
  {
    id: 'mouse-matt',
    name: 'Мышь Мэт',
    side: 'hero',
    sprite: 'inspector',
    role: 'Мелкие улики',
  },
  {
    id: 'fantomas',
    name: 'Фантомас',
    side: 'villain',
    villainSprite: 'fantomas',
    accent: '#5c2d82',
    role: 'Главный противник',
  },
  {
    id: 'brazhnik',
    name: 'Бражник / Мотылёк',
    side: 'villain',
    villainSprite: 'brazhnik',
    accent: '#8b2942',
    role: 'Логические ловушки',
  },
  {
    id: 'crimson-lob',
    name: 'Багровый лоб',
    side: 'villain',
    villainSprite: 'crimson-lob',
    accent: '#9b1c1c',
    role: 'Загадки в театре',
  },
  {
    id: 'crimson-lord',
    name: 'Багровый Лорд',
    side: 'villain',
    villainSprite: 'crimson-lord',
    accent: '#4a0e0e',
    role: 'Финальный босс',
  },
];

export function getCharacter(id: CharacterId | undefined): CharacterDef | undefined {
  if (!id) return undefined;
  return characters.find((c) => c.id === id);
}

export const heroCharacters = characters.filter((c) => c.side === 'hero' && c.sprite);
export const villainCharacters = characters.filter((c) => c.side === 'villain');

/** Герои для галереи (без дубля Мыши Мэт — у неё тот же спрайт). */
export const rosterHeroes = characters.filter(
  (c) => c.side === 'hero' && c.id !== 'mouse-matt',
);
