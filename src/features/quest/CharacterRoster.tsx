import { rosterHeroes, villainCharacters } from './data/characters';
import { CharacterPortrait } from './CharacterPortrait';
import styles from './CharacterRoster.module.css';

/** Галерея героев и злодеев на главном экране. */
export function CharacterRoster() {
  return (
    <section className={styles.roster} aria-label="Участники квеста">
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Герои</h3>
        <div className={styles.grid}>
          {rosterHeroes.map((hero) => (
            <div key={hero.id} className={styles.card}>
              <CharacterPortrait characterId={hero.id} size="sm" />
              <p className={styles.name}>{hero.name}</p>
              {hero.role && <p className={styles.role}>{hero.role}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={`${styles.groupTitle} ${styles.villainTitle}`}>Злодеи</h3>
        <div className={styles.grid}>
          {villainCharacters.map((villain) => (
            <div key={villain.id} className={`${styles.card} ${styles.villainCard}`}>
              <CharacterPortrait characterId={villain.id} size="sm" />
              <p className={styles.name}>{villain.name}</p>
              {villain.role && <p className={styles.role}>{villain.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
