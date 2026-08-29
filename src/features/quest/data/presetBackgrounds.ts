/** Встроенные фоны (лежат в public/backgrounds/). */
export interface PresetBackground {
  id: string;
  name: string;
  /** Путь относительно base URL, например backgrounds/island-day.svg */
  file: string;
}

export const presetBackgrounds: PresetBackground[] = [
  {
    id: 'map-quest',
    name: 'Карта квеста',
    file: 'backgrounds/map-quest.png',
  },
  {
    id: 'mad-cafe-1',
    name: 'Двор у кафе',
    file: 'backgrounds/map-mad-1.png',
  },
  {
    id: 'monte-cristo-1',
    name: 'Карта Монте-Кристо',
    file: 'backgrounds/map-monte-cristo-1.jpg',
  },
];

export function presetUrl(file: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${file.replace(/^\//, '')}`;
}
