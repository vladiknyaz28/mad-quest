import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { voiceRecorder } from './shared/audio/recorder';
import './styles/global.css';

declare global {
  interface Window {
    __MQ_BOOT?: { done?: boolean };
  }
}

function markBootDone(): void {
  if (window.__MQ_BOOT) window.__MQ_BOOT.done = true;
}

function showFatalError(message: string): void {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#0b1c24;color:#e8dfd0;font-family:system-ui,sans-serif;text-align:center">
      <div style="max-width:22rem">
        <h1 style="margin:0 0 .75rem;font-size:1.25rem;color:#f0e2c4">Не удалось запустить квест</h1>
        <p style="margin:0 0 1rem;line-height:1.5;opacity:.9">${message}</p>
        <button type="button" onclick="location.reload()" style="padding:.65rem 1.25rem;border:none;border-radius:.5rem;background:#7ec8b8;color:#0b1c24;font-weight:600;cursor:pointer">Обновить</button>
      </div>
    </div>`;
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

void voiceRecorder.init().catch(() => {});

try {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  markBootDone();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
  showFatalError(message);
  markBootDone();
}
