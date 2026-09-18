// LocalStorage-backed progress: completed lessons, XP, and streak.
const STORAGE_KEY = 'bjTrainer.progress.v1';

function defaultProgress() {
  return {
    completedLessons: [],
    xp: 0,
    streak: 0,
    lastPlayedDate: null,
    bestScores: {}, // lessonId -> { correct, total }
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return { ...defaultProgress(), ...parsed };
  } catch (e) {
    return defaultProgress();
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    // storage unavailable (private mode, etc) - fail silently
  }
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function recordActivityToday(progress) {
  const today = isoDate(new Date());
  if (progress.lastPlayedDate === today) return progress;
  const yesterday = isoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  progress.streak = progress.lastPlayedDate === yesterday ? progress.streak + 1 : 1;
  progress.lastPlayedDate = today;
  return progress;
}

function completeLesson(progress, lessonId, correct, total, xpEarned) {
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }
  const prevBest = progress.bestScores[lessonId];
  if (!prevBest || correct > prevBest.correct) {
    progress.bestScores[lessonId] = { correct, total };
  }
  progress.xp += xpEarned;
  recordActivityToday(progress);
  saveProgress(progress);
  return progress;
}

function isLessonUnlocked(progress, lessonId, allLessons) {
  const idx = allLessons.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return true;
  const prevLesson = allLessons[idx - 1];
  return progress.completedLessons.includes(prevLesson.id);
}

function resetProgress() {
  const fresh = defaultProgress();
  saveProgress(fresh);
  return fresh;
}

window.Storage = {
  loadProgress,
  saveProgress,
  completeLesson,
  isLessonUnlocked,
  resetProgress,
};
