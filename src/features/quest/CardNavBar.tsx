import { useEffect, useRef, useState } from 'react';
import type { QuestCard } from './questTypes';
import styles from './CardNavBar.module.css';

interface CardNavBarProps {
  cards: QuestCard[];
  cardIndex: number;
  totalCards: number;
  currentTitle: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export function CardNavBar({
  cards,
  cardIndex,
  totalCards,
  currentTitle,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onGoTo,
}: CardNavBarProps) {
  const [listOpen, setListOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setListOpen(false);
  }, [cardIndex]);

  useEffect(() => {
    if (!listOpen) return;

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setListOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setListOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [listOpen]);

  return (
    <nav className={styles.nav} ref={rootRef} aria-label="Навигация по карточкам">
      <div className={styles.meta}>
        <p className={styles.counter}>
          Точка {cardIndex + 1} из {totalCards}
        </p>
        <p className={styles.title}>{currentTitle}</p>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Предыдущая карточка"
        >
          ◀
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${listOpen ? styles.listToggleOpen : ''}`}
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          aria-haspopup="listbox"
        >
          Список
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Следующая карточка"
        >
          ▶
        </button>
      </div>

      {listOpen && (
        <ul className={styles.list} role="listbox" aria-label="Все карточки">
          {cards.map((card, index) => {
            const active = index === cardIndex;
            return (
              <li key={card.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`${styles.listItem} ${active ? styles.listItemActive : ''}`}
                  onClick={() => {
                    onGoTo(index);
                    setListOpen(false);
                  }}
                >
                  <span className={styles.listNum}>{index + 1}</span>
                  <span className={styles.listName}>{card.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
