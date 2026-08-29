import { useEffect, useId } from 'react';
import styles from './QuestAnswerModal.module.css';

interface QuestAnswerModalProps {
  open: boolean;
  options: string[];
  wrongPick: boolean;
  onSelect: (option: string) => void;
  onClose: () => void;
  onRetry: () => void;
}

export function QuestAnswerModal({
  open,
  options,
  wrongPick,
  onSelect,
  onClose,
  onRetry,
}: QuestAnswerModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden />
        <h2 id={titleId} className={styles.title}>
          Выбери правильный ответ
        </h2>
        <p className={styles.subtitle}>Нажми на один из вариантов</p>

        {wrongPick ? (
          <div className={styles.wrongBox}>
            <p className={styles.wrongText}>Неверно, попробуй ещё</p>
            <button type="button" className={styles.retryBtn} onClick={onRetry}>
              Попробовать ещё
            </button>
          </div>
        ) : (
          <div className={styles.options}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.optionBtn}
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
