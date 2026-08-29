import { useState } from 'react';
import styles from './HowToPlayPanel.module.css';

/** Сворачиваемая инструкция для игроков и взрослых. */
export function HowToPlayPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Как играть</span>
        <span className={styles.chevron} aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Сценарии</h3>
            <p>
              На главной выбери один из <strong>4 сценариев</strong> — у каждого
              свои вопросы и свой прогресс. Можно проходить по очереди или
              вернуться к любому позже.
            </p>
          </div>

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Уровни на карте</h3>
            <ul className={styles.legend}>
              <li>
                <span className={`${styles.dot} ${styles.dotActive}`} />{' '}
                <strong>Синяя</strong> — текущая цель, нажми и решай 5 загадок
              </li>
              <li>
                <span className={`${styles.dot} ${styles.dotDone}`} />{' '}
                <strong>Зелёная</strong> — уже пройдена, можно вернуться и
                перечитать
              </li>
              <li>
                <span className={`${styles.dot} ${styles.dotLocked}`} />{' '}
                <strong>Серая</strong> — ещё закрыта, сначала пройди предыдущие
              </li>
            </ul>
            <p className={styles.tip}>
              Вверху карты — панель <strong>◀ Список ▶</strong>: листай точки
              стрелками или выбирай из списка.
            </p>
          </div>

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Голос Мэда</h3>
            <p>
              В заданиях текст озвучивается автоматически. Чтобы сменить голос
              на этом устройстве — открой блок <strong>«Голос Мэда»</strong>{' '}
              ниже и нажми ▶ у нужной фразы.
            </p>
            <p className={styles.tip}>
              Для записи своего голоса (взрослым): «Студия записи» в том же
              блоке → запиши фразы → «Скачать ZIP» → положи в проект и задеплой.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
