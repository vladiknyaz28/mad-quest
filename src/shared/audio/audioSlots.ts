import type { Quest } from '../../features/quest/questTypes';
import { getCardQuestions } from '../../features/quest/questMapLogic';
import {
  promptClipKey,
  storyClipKey,
  suggestedDownloadName,
  SYSTEM_OK_KEY,
  SYSTEM_WRONG_KEY,
  type ClipKey,
} from './audioManifest';

export interface AudioSlot {
  key: ClipKey;
  label: string;
  filename: string;
  /** Текст для TTS-превью. */
  ttsText: string;
  group: string;
}

/** Все голосовые слоты квеста: истории, вопросы, системные фразы. */
export function listQuestAudioSlots(quest: Quest): AudioSlot[] {
  const slots: AudioSlot[] = [
    {
      key: SYSTEM_OK_KEY,
      label: 'Верный ответ',
      filename: suggestedDownloadName(SYSTEM_OK_KEY),
      ttsText: 'Верно! Мэд доволен.',
      group: 'Системные',
    },
    {
      key: SYSTEM_WRONG_KEY,
      label: 'Неверный ответ',
      filename: suggestedDownloadName(SYSTEM_WRONG_KEY),
      ttsText: 'Не то. Подумай ещё — Фантомас хитрый.',
      group: 'Системные',
    },
  ];

  for (const card of quest.cards) {
    const firstQuestion = getCardQuestions(card)[0];
    slots.push(
      {
        key: storyClipKey(card.id),
        label: `История — ${card.title}`,
        filename: suggestedDownloadName(storyClipKey(card.id)),
        ttsText: card.story,
        group: card.title,
      },
      {
        key: promptClipKey(card.id),
        label: `Вопрос — ${card.title}`,
        filename: suggestedDownloadName(promptClipKey(card.id)),
        ttsText: firstQuestion?.prompt ?? card.prompt ?? card.title,
        group: card.title,
      },
    );
  }

  return slots;
}
