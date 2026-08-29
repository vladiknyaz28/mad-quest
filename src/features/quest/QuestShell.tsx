import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AudioLibraryPanel } from './AudioLibraryPanel';
import { CharacterRoster } from './CharacterRoster';
import { HowToPlayPanel } from './HowToPlayPanel';
import { QuestMapView } from './QuestMapView';
import { ScenarioPicker } from './ScenarioPicker';
import { availableQuests } from './data/madQuest';
import {
  presetBackgrounds,
  presetUrl,
  type PresetBackground,
} from './data/presetBackgrounds';
import { useQuestEngine } from './QuestEngine';
import { canOpenPoint } from './questMapLogic';
import { audioPlayer } from '../../shared/audio/audioPlayer';
import { storyClipKey } from '../../shared/audio/audioManifest';
import {
  clearBackground,
  getBackgroundMeta,
  loadBackgroundUrl,
  saveBackgroundFile,
  saveBackgroundPreset,
} from '../../shared/storage/localStore';
import styles from './QuestShell.module.css';

type Screen = 'home' | 'play';

function revokeIfBlob(url: string | null): void {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function QuestShell() {
  const [screen, setScreen] = useState<Screen>('home');
  const [questIndex, setQuestIndex] = useState(0);
  const quest = availableQuests[questIndex]!;
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgName, setBgName] = useState<string | null>(null);
  const [choosingBg, setChoosingBg] = useState(true);
  const [openPointIndex, setOpenPointIndex] = useState<number | null>(null);
  const [wrongPick, setWrongPick] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const session = useQuestEngine(quest);

  useEffect(() => {
    let loaded: string | null = null;
    void (async () => {
      const url = await loadBackgroundUrl();
      if (url) {
        loaded = url;
        setBgUrl(url);
        setBgName(getBackgroundMeta()?.name ?? null);
        setChoosingBg(false);
        return;
      }
      // Первый запуск: фон из данных квеста (сад у кафе).
      if (quest.background) {
        const defaultPreset =
          presetBackgrounds.find((p) => p.file === quest.background) ??
          presetBackgrounds[0];
        if (defaultPreset) {
          const applied = await saveBackgroundPreset(defaultPreset.name, defaultPreset.file);
          loaded = applied;
          setBgUrl(applied);
          setBgName(defaultPreset.name);
          setChoosingBg(false);
        }
      }
    })();
    return () => {
      revokeIfBlob(loaded);
    };
  }, [quest.background]);

  const applyBackground = (url: string, name: string) => {
    revokeIfBlob(bgUrl);
    setBgUrl(url);
    setBgName(name);
    setChoosingBg(false);
  };

  const handlePresetSelect = async (preset: PresetBackground) => {
    const url = await saveBackgroundPreset(preset.name, preset.file);
    applyBackground(url, preset.name);
  };

  const handleBgChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await saveBackgroundFile(file);
    applyBackground(url, file.name);
  };

  const handleClearBg = async () => {
    revokeIfBlob(bgUrl);
    await clearBackground();
    setBgUrl(null);
    setBgName(null);
    setChoosingBg(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const showPicker = choosingBg || !bgUrl;

  // Авто-переход к следующей точке через 1 сек после правильного ответа
  useEffect(() => {
    if (!session.pointComplete || openPointIndex === null) return;

    const timer = window.setTimeout(() => {
      session.continueAfterCorrect();
      setOpenPointIndex(null);
      setWrongPick(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [session.pointComplete, openPointIndex, session.continueAfterCorrect]);

  const handlePointClick = (index: number) => {
    if (!canOpenPoint(index, session.progressIndex, session.completed)) return;
    setWrongPick(false);
    session.beginPointSession(index);
    setOpenPointIndex(index);
    const card = quest.cards[index];
    if (card) {
      void audioPlayer.playClip({ key: storyClipKey(card.id), ttsText: card.story });
    }
  };

  const handleNavGoTo = (index: number) => {
    if (!canOpenPoint(index, session.progressIndex, session.completed)) return;
    session.goToCard(index);
    setOpenPointIndex(null);
    setWrongPick(false);
  };

  const handleAnswer = (_option: string, answerIndex: number) => {
    const ok = session.submitAnswerByIndex(answerIndex);
    if (ok) setWrongPick(false);
    else setWrongPick(true);
  };

  const handleCloseModal = () => {
    if (session.pointComplete) return;
    session.endPointSession();
    setOpenPointIndex(null);
    setWrongPick(false);
  };

  const handleBackHome = () => {
    session.endPointSession();
    setOpenPointIndex(null);
    setWrongPick(false);
    setScreen('home');
  };

  const progress = session.completed
    ? 'Квест завершён'
    : `Точка ${session.progressIndex + 1} из ${session.totalCards}`;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Mad&amp;Fantomas — Квест</h1>
      </header>

      <main className={`${styles.main} ${screen === 'play' ? styles.mainPlay : ''}`}>
        {screen === 'home' && (
          <>
            <div
              className={`${styles.home} ${bgUrl && !showPicker ? styles.homeWithBg : ''}`}
              style={bgUrl && !showPicker ? { backgroundImage: `url(${bgUrl})` } : undefined}
            >
              {showPicker ? (
                <section className={styles.block}>
                  <h2 className={styles.blockTitle}>Фон</h2>
                  <p className={styles.blockText}>
                    Выбери готовый фон или загрузи свою карту с компьютера.
                  </p>

                  <div className={styles.presetGrid}>
                    {presetBackgrounds.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={styles.presetCard}
                        onClick={() => void handlePresetSelect(preset)}
                      >
                        <span
                          className={styles.presetThumb}
                          style={{ backgroundImage: `url(${presetUrl(preset.file)})` }}
                        />
                        <span className={styles.presetName}>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleBgChange}
                    id="bg-upload"
                  />
                  <label htmlFor="bg-upload" className={styles.fileLabel}>
                    Загрузить с ПК
                  </label>

                  {bgUrl && (
                    <button
                      type="button"
                      className={styles.cancelPickBtn}
                      onClick={() => setChoosingBg(false)}
                    >
                      Отмена
                    </button>
                  )}
                </section>
              ) : (
                <div className={styles.homeGlass}>
                  <p className={styles.questDesc}>{quest.description}</p>

                  <ScenarioPicker
                    key={`${session.progressIndex}-${session.completed}`}
                    quests={availableQuests}
                    selectedIndex={questIndex}
                    onSelect={setQuestIndex}
                  />

                  <p className={styles.progress}>Прогресс: {progress}</p>
                  <button
                    type="button"
                    className={styles.startBtn}
                    onClick={() => setScreen('play')}
                  >
                    {session.progressIndex > 0 && !session.completed
                      ? 'Продолжить'
                      : session.completed
                        ? 'Смотреть результат'
                        : 'Начать'}
                  </button>
                  <div className={styles.homeBgActions}>
                    <button
                      type="button"
                      className={styles.changeBgLink}
                      onClick={() => setChoosingBg(true)}
                    >
                      Сменить фон
                    </button>
                    <button type="button" className={styles.linkBtn} onClick={handleClearBg}>
                      сбросить
                    </button>
                  </div>
                  {bgName && <p className={styles.meta}>{bgName}</p>}
                </div>
              )}
            </div>

            <div className={styles.homeStudio}>
              <HowToPlayPanel />
              <CharacterRoster />
              <AudioLibraryPanel quest={quest} />
            </div>
          </>
        )}

        {screen === 'play' && (
          <QuestMapView
            key={quest.id}
            scenarioName={quest.name}
            cards={session.cards}
            bgUrl={bgUrl}
            viewIndex={session.cardIndex}
            progressIndex={session.progressIndex}
            questCompleted={session.completed}
            openPointIndex={openPointIndex}
            currentQuestion={session.currentQuestion}
            questionIndex={session.questionIndex}
            totalQuestions={session.totalQuestions}
            status={session.status}
            wrongPick={wrongPick}
            pointComplete={session.pointComplete}
            isReviewMode={session.isReviewMode}
            canGoPrev={session.canGoPrev}
            canGoNext={session.canGoNext}
            onPointClick={handlePointClick}
            onNavPrev={session.goPrevCard}
            onNavNext={session.goNextCard}
            onNavGoTo={handleNavGoTo}
            onAnswer={handleAnswer}
            onCloseModal={handleCloseModal}
            onBack={handleBackHome}
          />
        )}
      </main>
    </div>
  );
}
