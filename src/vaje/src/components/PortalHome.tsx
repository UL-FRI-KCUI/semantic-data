import { useEffect, useState } from 'react';
import { exercises } from '../lib/exercises';
import { clearProgress, readProgress } from '../lib/progress';

type CardStatus = 'new' | 'started' | 'completed';

export default function PortalHome({ baseUrl }: { baseUrl: string }) {
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});
  const [announcement, setAnnouncement] = useState('');

  function refresh() {
    const next: Record<string, CardStatus> = {};
    for (const exercise of exercises) {
      const progress = readProgress(localStorage, exercise.id);
      next[exercise.id] = progress?.completed ? 'completed' : progress ? 'started' : 'new';
    }
    setStatuses(next);
  }

  useEffect(() => {
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function resetAll() {
    for (const exercise of exercises) clearProgress(localStorage, exercise.id);
    refresh();
    setAnnouncement('Napredek vseh vaj je ponastavljen.');
  }

  const completed = Object.values(statuses).filter((status) => status === 'completed').length;
  const percentage = Math.round((completed / exercises.length) * 100);

  return (
    <>
      <section className="progress-summary" aria-label="Skupni napredek">
        <div>
          <span className="summary-number">{completed}/{exercises.length}</span>
          <span className="summary-label">opravljenih vaj</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={completed} aria-label={`${completed} od ${exercises.length} vaj opravljenih`}>
          <span style={{ width: `${percentage}%` }} />
        </div>
        <button className="reset-all" type="button" onClick={resetAll}>Ponastavi napredek</button>
      </section>
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <section className="exercise-grid" aria-label="Seznam interaktivnih vaj">
        {exercises.map((exercise) => {
          const status = statuses[exercise.id] ?? 'new';
          const statusLabel = status === 'completed' ? 'Opravljeno' : status === 'started' ? 'V teku' : 'Nova vaja';
          return (
            <article className={`exercise-card status-${status}`} key={exercise.id}>
              <div className="card-topline">
                <span className="card-number">{String(exercise.number).padStart(2, '0')}</span>
                <span className="card-status"><span aria-hidden="true">{status === 'completed' ? '✓' : status === 'started' ? '●' : '○'}</span> {statusLabel}</span>
              </div>
              <p className="card-eyebrow">{exercise.eyebrow}</p>
              <h2>{exercise.title}</h2>
              <p>{exercise.description}</p>
              <a className="card-link" href={`${baseUrl}${exercise.href}`}>
                {status === 'new' ? 'Začni' : 'Nadaljuj'} <span aria-hidden="true">→</span>
              </a>
            </article>
          );
        })}
      </section>
    </>
  );
}
