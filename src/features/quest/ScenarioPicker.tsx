import type { Quest } from './questTypes';
import { indexOfCard } from './questLogic';
import { loadProgress } from '../../shared/storage/localStore';
import styles from './ScenarioPicker.module.css';

interface ScenarioPickerProps {
  quests: Quest[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function getScenarioSubtitle(name: string): string {
  const dash = name.indexOf('—');
  return dash >= 0 ? name.slice(dash + 1).trim() : name;
}

function getProgressLabel(quest: Quest): { text: string; state: 'new' | 'active' | 'done' } {
  const saved = loadProgress(quest.id);
  if (!saved) return { text: 'Не начат', state: 'new' };
  if (saved.completed) return { text: 'Пройден ✓', state: 'done' };
  const idx = indexOfCard(quest.cards, saved.currentCardId);
  const point = idx >= 0 ? idx + 1 : 1;
  return { text: `Точка ${point} из ${quest.cards.length}`, state: 'active' };
}

/** Карточки выбора сценария с прогрессом. */
export function ScenarioPicker({ quests, selectedIndex, onSelect }: ScenarioPickerProps) {
  return (
    <div className={styles.picker}>
      <p className={styles.label}>Выбери сценарий</p>
      <div className={styles.list} role="listbox" aria-label="Сценарии квеста">
        {quests.map((q, index) => {
          const progress = getProgressLabel(q);
          const active = index === selectedIndex;
          return (
            <button
              key={q.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`${styles.card} ${active ? styles.cardActive : ''}`}
              onClick={() => onSelect(index)}
            >
              <span className={styles.num}>{index + 1}</span>
              <span className={styles.body}>
                <span className={styles.title}>{getScenarioSubtitle(q.name)}</span>
                <span className={`${styles.progress} ${styles[`progress_${progress.state}`]}`}>
                  {progress.text}
                </span>
              </span>
              {active && <span className={styles.check} aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
