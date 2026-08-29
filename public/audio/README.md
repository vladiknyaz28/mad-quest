# Аудио квеста «Мэд и Фантомас»

Положите сюда файлы с префиксом `mad_` (старые пиратские `card1_story.webm` и т.п. здесь не используются):

| Ключ | Файл |
|------|------|
| `card:card1:story` | `mad_card1_story.mp3` |
| `card:card1:prompt` | `mad_card1_prompt.mp3` |
| `system:ok` | `mad_system_ok.mp3` |
| `system:wrong` | `mad_system_wrong.mp3` |

Также принимаются `.webm`, `.ogg`, `.m4a`, `.wav`.

После добавления файлов:

```bash
npm run build
```

Файлы попадут в `dist/audio/` и будут доступны на GitHub Pages.

Если файла нет — приложение читает текст карточки через TTS (уже тексты Мэда, не Флинта).

Запись: «Студия голоса Мэда» на главной → ZIP `mad-quest-audio.zip` → распаковать сюда.
