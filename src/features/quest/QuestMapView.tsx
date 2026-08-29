import type { AnswerStatus, QuestCard, QuestQuestion } from './questTypes';
import { canOpenPoint, countArtifacts, getPointStatus } from './questMapLogic';
import { CardNavBar } from './CardNavBar';
import { MapPointModal } from './MapPointModal';
import styles from './QuestMapView.module.css';

interface QuestMapViewProps {
  scenarioName: string;
  cards: QuestCard[];
  bgUrl: string | null;
  viewIndex: number;
  progressIndex: number;
  questCompleted: boolean;
  openPointIndex: number | null;
  currentQuestion: QuestQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  status: AnswerStatus;
  wrongPick: boolean;
  pointComplete: boolean;
  isReviewMode: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPointClick: (index: number) => void;
  onNavPrev: () => void;
  onNavNext: () => void;
  onNavGoTo: (index: number) => void;
  onAnswer: (option: string, answerIndex: number) => void;
  onCloseModal: () => void;
  onBack: () => void;
}

/** Экран карты с точками, навигацией и модалкой задания. */
export function QuestMapView({
  scenarioName,
  cards,
  bgUrl,
  viewIndex,
  progressIndex,
  questCompleted,
  openPointIndex,
  currentQuestion,
  questionIndex,
  totalQuestions,
  status,
  wrongPick,
  pointComplete,
  isReviewMode,
  canGoPrev,
  canGoNext,
  onPointClick,
  onNavPrev,
  onNavNext,
  onNavGoTo,
  onAnswer,
  onCloseModal,
  onBack,
}: QuestMapViewProps) {
  const artifactsFound = countArtifacts(progressIndex, questCompleted);
  const openCard = openPointIndex !== null ? cards[openPointIndex] ?? null : null;
  const currentTitle = cards[viewIndex]?.title ?? '';
  const nextPoint = cards[progressIndex];
  const hintText = questCompleted
    ? 'Все точки пройдены — нажми зелёный маркер, чтобы перечитать.'
    : nextPoint
      ? `Нажми синий маркер «${nextPoint.title}» или ◀ Список ▶ вверху.`
      : 'Нажми маркер на карте, чтобы начать задание.';

  return (
    <div className={styles.mapScreen}>
      <div className={styles.statusBar} role="status">
        <span className={styles.statusScenario}>{scenarioName}</span>
        <span className={styles.statusArtifacts}>
          Артефакты: {artifactsFound} / {cards.length}
        </span>
      </div>
      <p className={styles.mapHint}>{hintText}</p>

      <div className={styles.mapViewport}>
        <div className={styles.mapStage}>
          {!bgUrl && <div className={styles.mapFallback} aria-hidden />}
          {bgUrl && (
            <img className={styles.mapImage} src={bgUrl} alt="Карта квеста" draggable={false} />
          )}

          {cards.map((card, index) => {
            const map = card.map;
            if (!map) return null;

            const pointStatus = getPointStatus(index, progressIndex, questCompleted);
            const clickable = canOpenPoint(index, progressIndex, questCompleted);
            const isViewTarget = index === viewIndex;

            return (
              <button
                key={card.id}
                type="button"
                className={`${styles.marker} ${
                  pointStatus === 'completed'
                    ? styles.markerCompleted
                    : pointStatus === 'active'
                      ? styles.markerActive
                      : styles.markerLocked
                } ${isViewTarget && pointStatus !== 'locked' ? styles.markerReview : ''}`}
                style={{
                  left: `${map.coordX}%`,
                  top: `${map.coordY}%`,
                  outline: isViewTarget ? '3px solid rgba(255, 255, 255, 0.95)' : undefined,
                }}
                disabled={!clickable}
                aria-label={`Точка ${index + 1}: ${card.title}`}
                aria-current={isViewTarget ? 'true' : undefined}
                onClick={() => onPointClick(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className={styles.navWrap}>
          <CardNavBar
            cards={cards}
            cardIndex={viewIndex}
            totalCards={cards.length}
            progressIndex={progressIndex}
            questCompleted={questCompleted}
            currentTitle={currentTitle}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={onNavPrev}
            onNext={onNavNext}
            onGoTo={onNavGoTo}
          />
        </div>

        {questCompleted && (
          <div className={styles.completeBanner} role="status">
            Все артефакты найдены! Герои победили!
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← На главную
        </button>
      </div>

      <MapPointModal
        open={openPointIndex !== null}
        card={openCard}
        pointNumber={(openPointIndex ?? 0) + 1}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        status={status}
        wrongPick={wrongPick}
        pointComplete={pointComplete}
        isReviewMode={isReviewMode}
        onSelect={onAnswer}
        onClose={onCloseModal}
      />
    </div>
  );
}
