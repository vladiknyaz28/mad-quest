# Квест Мэд и Фантомас

Городской квест по ПДД: полицейский Мэд против Фантомаса. Локальное React-приложение без бэкенда: данные квеста в коде, фон — в IndexedDB/presets, голос — файлы в `public/audio/` с префиксом `mad_`.

## Стек

- React 19 + TypeScript + Vite
- CSS Modules
- Аудиофайлы из `public/audio/` (+ TTS fallback по текстам карточек Мэда)
- MediaRecorder для записи → ZIP / файлы в проект

## Быстрый старт

```bash
npm install
npm run dev
```

Открой URL из терминала. Для микрофона нужен **localhost** или HTTPS.

## Сборка и превью

```bash
npm run build
npm run preview
```

Сборка кладёт статику в `dist/` (включая `dist/audio/`).

## Структура

```
src/
  features/quest/
    data/madQuest.ts
    data/flintQuest.ts      # архив старого сценария
    data/presetBackgrounds.ts
    QuestEngine.tsx
    QuestCardView.tsx
    QuestAnswerModal.tsx
  shared/audio/
    audioManifest.ts   # ключ → mad_*.webm/mp3
    audioPlayer.ts     # файл / TTS
    recorder.ts        # запись → download
public/
  audio/               # голос Мэда (mad_card1_story.webm, …)
  backgrounds/
```

## Как добавить голос в проект (деплой)

1. «Студия голоса Мэда» на главной → запиши слоты → **Скачать ZIP для деплоя**.
2. Файлы получат имена с префиксом `mad_`, например `mad_card1_story.webm` / `mad_system_ok.webm`.
3. Распакуй в `public/audio/` (при желании конвертируй в `.mp3`).
4. `npm run build` → задеплой `dist/` на GitHub Pages.
5. Нет файла — TTS читает текст карточки Мэда (не пиратские записи).

Карта ключей:

| Ключ | Файл |
|------|------|
| `card:card1:story` | `audio/mad_card1_story.mp3` |
| `card:card1:prompt` | `audio/mad_card1_prompt.mp3` |
| `system:ok` | `audio/mad_system_ok.mp3` |
| `system:wrong` | `audio/mad_system_wrong.mp3` |

`base` в `vite.config.ts` учитывается (`/mad-quest/audio/...`).

Старые пиратские файлы вида `card1_story.webm` **не** подключаются.

## Как играть

1. Фон «Двор у кафе» подставится сам (или выбери / загрузи свой).
2. **Начать** → слушай / отвечай из 5 вариантов.
3. Подсказка `...` — для взрослого.

## TODO

- [ ] Загрузка квестов из JSON
- [x] Голос как файлы проекта (+ запись с экспортом)
- [ ] PWA
- [ ] GitHub Pages action

## Лицензия

Приватный учебный/семейный проект.
