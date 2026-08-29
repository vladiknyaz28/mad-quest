/**
 * Карта ключей аудио → файлы в public/audio/ (квест Мэд и Фантомас).
 *
 * Префикс mad_ отделяет голос этого квеста от старых пиратских записей Флинта.
 *
 * card:card1:story  → audio/mad_card1_story.mp3
 * card:card1:prompt → audio/mad_card1_prompt.mp3
 * system:ok         → audio/mad_system_ok.mp3
 * system:wrong      → audio/mad_system_wrong.mp3
 */

export type ClipKey =
  | `card:${string}:story`
  | `card:${string}:prompt`
  | `card:${string}:puzzle`
  | 'system:ok'
  | 'system:wrong'
  | (string & {});

/** Префикс файлов озвучки текущего квеста (не пересекается с Flint). */
export const AUDIO_FILE_PREFIX = 'mad_';

export function storyClipKey(cardId: string): ClipKey {
  return `card:${cardId}:story`;
}

export function promptClipKey(cardId: string): ClipKey {
  return `card:${cardId}:prompt`;
}

/** @deprecated используй promptClipKey */
export function puzzleClipKey(cardId: string): ClipKey {
  return `card:${cardId}:prompt`;
}

export const SYSTEM_OK_KEY: ClipKey = 'system:ok';
export const SYSTEM_WRONG_KEY: ClipKey = 'system:wrong';

const AUDIO_EXTS = ['.mp3', '.webm', '.m4a', '.ogg', '.wav'] as const;

export function audioBaseNameForKey(key: string): string | null {
  if (key === 'system:ok') return `${AUDIO_FILE_PREFIX}system_ok`;
  if (key === 'system:wrong') return `${AUDIO_FILE_PREFIX}system_wrong`;

  const match = /^card:([^:]+):(story|prompt|puzzle)$/.exec(key);
  if (!match) return null;

  const id = match[1]!;
  const kind = match[2] === 'puzzle' ? 'prompt' : match[2]!;
  return `${AUDIO_FILE_PREFIX}${id}_${kind}`;
}

export function suggestedDownloadName(key: string, mimeType?: string): string {
  const base = audioBaseNameForKey(key) ?? 'clip';
  if (mimeType?.includes('webm')) return `${base}.webm`;
  if (mimeType?.includes('ogg')) return `${base}.ogg`;
  if (mimeType?.includes('mp4') || mimeType?.includes('m4a')) return `${base}.m4a`;
  if (mimeType?.includes('wav')) return `${base}.wav`;
  return `${base}.mp3`;
}

export function audioPublicPath(baseName: string, ext: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}audio/${baseName}${ext}`.replace(/([^:]\/)\/+/g, '$1');
}

const existenceCache = new Map<string, boolean>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function urlExists(url: string): Promise<boolean> {
  const cached = existenceCache.get(url);
  if (cached !== undefined) return cached;

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 350);
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1' },
    });
    window.clearTimeout(timer);

    const contentType = res.headers.get('content-type') ?? '';
    // SPA/HTML fallback не считаем аудио
    const isAudio =
      (res.ok || res.status === 206) &&
      !contentType.includes('text/html') &&
      (contentType.startsWith('audio/') ||
        contentType.includes('octet-stream') ||
        contentType === '' ||
        /\.(mp3|webm|ogg|m4a|wav)(\?|$)/i.test(url));

    existenceCache.set(url, isAudio);
    return isAudio;
  } catch {
    existenceCache.set(url, false);
    return false;
  }
}

/**
 * Найти URL файла в public/audio для ключа.
 * Быстрый таймаут — если файла нет, сразу null (TTS).
 */
export async function resolveBundledAudioUrl(key: string): Promise<string | null> {
  const baseName = audioBaseNameForKey(key);
  if (!baseName) return null;

  try {
    return await withTimeout(
      (async () => {
        for (const ext of AUDIO_EXTS) {
          const url = audioPublicPath(baseName, ext);
          if (await urlExists(url)) return url;
        }
        return null;
      })(),
      1200,
    );
  } catch {
    return null;
  }
}

export function clearAudioExistenceCache(): void {
  existenceCache.clear();
}
