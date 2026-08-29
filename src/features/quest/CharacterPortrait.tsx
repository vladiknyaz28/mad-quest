import { getCharacter, HEROES_SHEET, HERO_SPRITE_POS, VILLAINS_SHEET, VILLAIN_SPRITE_POS, type CharacterDef } from './data/characters';
import styles from './CharacterPortrait.module.css';

interface CharacterPortraitProps {
  characterId?: CharacterDef['id'];
  /** Компактный размер для списка. */
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeClass = { sm: styles.sm, md: styles.md, lg: styles.lg } as const;

/** Портрет героя или злодея (спрайт из общего листа). */
export function CharacterPortrait({
  characterId,
  size = 'md',
  showName = false,
  className = '',
}: CharacterPortraitProps) {
  const character = getCharacter(characterId);
  if (!character) return null;

  const isHero = Boolean(character.sprite);
  const isVillain = Boolean(character.villainSprite);

  return (
    <figure className={`${styles.figure} ${sizeClass[size]} ${className}`.trim()}>
      {isHero ? (
        <span
          className={styles.spriteHero}
          style={{
            backgroundImage: `url(${HEROES_SHEET})`,
            backgroundPosition: `${HERO_SPRITE_POS[character.sprite!].x}% ${HERO_SPRITE_POS[character.sprite!].y}%`,
          }}
          role="img"
          aria-label={character.name}
        />
      ) : isVillain ? (
        <span
          className={styles.spriteVillain}
          style={{
            backgroundImage: `url(${VILLAINS_SHEET})`,
            backgroundPosition: `${VILLAIN_SPRITE_POS[character.villainSprite!].x}% ${VILLAIN_SPRITE_POS[character.villainSprite!].y}%`,
          }}
          role="img"
          aria-label={character.name}
        />
      ) : (
        <span
          className={styles.villainStub}
          style={{ background: character.accent ?? '#444' }}
          aria-hidden
        >
          {character.name.charAt(0)}
        </span>
      )}
      {showName && (
        <figcaption className={styles.caption}>{character.name}</figcaption>
      )}
    </figure>
  );
}
