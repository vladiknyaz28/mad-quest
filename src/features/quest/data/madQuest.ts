import { buildQuest } from './questBuilder';
import { scenario1Questions } from './scenario1';
import { scenario2Questions } from './scenario2';
import { scenario3Questions } from './scenario3';
import { scenario4Questions } from './scenario4';
import type { Quest } from '../questTypes';

export const availableQuests: Quest[] = [
  buildQuest(
    'mad-quest-1',
    'Сценарий 1 — Яйцо Фабerже',
    'Злодеи похитили яйцо Фабerже! Пройди 7 точек на карте — на каждой пять загадок: шифр, астрономия, математика, логика и сюжет.',
    scenario1Questions,
  ),
  buildQuest(
    'mad-quest-2',
    'Сценарий 2 — Сосуд с жидкостью',
    'Пропал древний сосуд! Следуй уликам через город, решай загадки и верни артефакт до финала на башне.',
    scenario2Questions,
  ),
  buildQuest(
    'mad-quest-3',
    'Сценарий 3 — Карта сокровищ',
    'Карта сокровищ исчезла из архива. Расшифруй коды злодеев и собери все части маршрута.',
    scenario3Questions,
  ),
  buildQuest(
    'mad-quest-4',
    'Сценарий 4 — Финальная охота',
    'Последняя охота на Фантомаса! Самые сложные загадки — многошаговая математика и хитрые шифры.',
    scenario4Questions,
  ),
];

/** Первый сценарий по умолчанию (обратная совместимость). */
export const madQuest = availableQuests[0]!;
