import type { LessonId } from './exercises';
import type { ConceptAnswers } from './concepts';

export const PROGRESS_PREFIX = 'semantic-data:vaje:v1:';

export interface LessonProgress {
  completed: boolean;
  draft?: string;
  conceptAnswers?: Partial<ConceptAnswers>;
  hintShown: boolean;
  solutionShown: boolean;
  updatedAt: string;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function progressKey(lessonId: LessonId) {
  if (lessonId === 'tsv-v-rdf' || lessonId === 'popravi-turtle' || lessonId === 'povezi-vira') return `semantic-data:vaje:v2:${lessonId}`;
  return `${PROGRESS_PREFIX}${lessonId}`;
}

export function readProgress(storage: StorageLike, lessonId: LessonId): LessonProgress | null {
  const raw = storage.getItem(progressKey(lessonId));
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<LessonProgress>;
    if (typeof value.completed !== 'boolean') return null;
    return {
      completed: value.completed,
      draft: typeof value.draft === 'string' ? value.draft : undefined,
      conceptAnswers: value.conceptAnswers,
      hintShown: Boolean(value.hintShown),
      solutionShown: Boolean(value.solutionShown),
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function writeProgress(storage: StorageLike, lessonId: LessonId, value: Omit<LessonProgress, 'updatedAt'>) {
  const progress: LessonProgress = { ...value, updatedAt: new Date().toISOString() };
  storage.setItem(progressKey(lessonId), JSON.stringify(progress));
  return progress;
}

export function clearProgress(storage: StorageLike, lessonId: LessonId) {
  storage.removeItem(progressKey(lessonId));
}
