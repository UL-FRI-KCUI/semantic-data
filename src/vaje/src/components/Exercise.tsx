import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useRef, useState } from 'react';
import GraphView from './GraphView';
import { emptyConceptAnswers, validateConceptAnswers, type ConceptAnswers } from '../lib/concepts';
import { exerciseById, municipalitiesTsv, type LessonId } from '../lib/exercises';
import { clearProgress, readProgress, writeProgress } from '../lib/progress';
import { validateTurtle } from '../lib/rdf';
import type { SparqlRow } from '../lib/sparql';

export default function Exercise({ lessonId }: { lessonId: LessonId }) {
  const exercise = exerciseById[lessonId];
  const [code, setCode] = useState(exercise.starter);
  const [answers, setAnswers] = useState<ConceptAnswers>(emptyConceptAnswers);
  const [hintShown, setHintShown] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [rows, setRows] = useState<SparqlRow[]>([]);
  const [checking, setChecking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const ready = useRef(false);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    setHydrated(true);
    const saved = readProgress(localStorage, lessonId);
    if (saved?.draft !== undefined) setCode(saved.draft);
    if (saved?.conceptAnswers) setAnswers({ ...emptyConceptAnswers, ...saved.conceptAnswers } as ConceptAnswers);
    if (saved) {
      setHintShown(saved.hintShown);
      setSolutionShown(saved.solutionShown);
      setCompleted(saved.completed);
    }
    ready.current = true;
  }, [lessonId]);

  useEffect(() => {
    if (!ready.current) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    writeProgress(localStorage, lessonId, {
      completed,
      draft: code,
      conceptAnswers: answers,
      hintShown,
      solutionShown,
    });
  }, [answers, code, completed, hintShown, lessonId, solutionShown]);

  async function checkAnswer() {
    setChecking(true);
    setRows([]);
    let result: { ok: boolean; message: string; rows?: SparqlRow[] };

    if (exercise.mode === 'concepts') {
      const message = validateConceptAnswers(answers);
      result = message ? { ok: false, message } : { ok: true, message: 'Pravilno — struktura tabele je jasna, njen pomen in kontekst pa nista vgrajena v podatke.' };
    } else if (exercise.mode === 'sparql') {
      const { validateSparql } = await import('../lib/sparql');
      result = await validateSparql(code);
    } else {
      result = validateTurtle(lessonId as 'tsv-v-rdf' | 'popravi-turtle' | 'formaliziraj-obcino' | 'povezi-vira', code);
    }

    setFeedback({ ok: result.ok, message: result.message });
    setRows(result.rows ?? []);
    setCompleted(result.ok);
    setChecking(false);
  }

  function reset() {
    skipNextPersist.current = true;
    clearProgress(localStorage, lessonId);
    setCode(exercise.starter);
    setAnswers(emptyConceptAnswers);
    setHintShown(false);
    setSolutionShown(false);
    setCompleted(false);
    setFeedback(null);
    setRows([]);
  }

  function setConcept<K extends keyof ConceptAnswers>(key: K, value: ConceptAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="exercise-shell" data-lesson-id={lessonId}>
      <div className="source-strip">
        <span>Podatkovni izsek · SURS 2025</span>
        <span>4 od 212 občin</span>
      </div>
      <pre className="tsv-sample" aria-label="Izsek podatkov TSV">{municipalitiesTsv}</pre>

      {exercise.mode === 'concepts' ? (
        <fieldset className="concept-form">
          <legend>Razvrstite podatke in označite manjkajoči kontekst</legend>
          <div className="form-grid">
            <label>
              Podatkovni tip <code>ob_id</code>
              <select data-testid="id-type" value={answers.idType} onChange={(event) => setConcept('idType', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="integer">Celo število</option>
                <option value="string">Besedilo oziroma oznaka</option>
                <option value="boolean">Logična vrednost</option>
              </select>
            </label>
            <label>
              Podatkovni tip <code>tot_p</code>
              <select data-testid="population-type" value={answers.populationType} onChange={(event) => setConcept('populationType', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="string">Besedilo</option>
                <option value="integer">Celo število</option>
                <option value="date">Datum</option>
              </select>
            </label>
          </div>
          <p className="question-label">Kaj iz same datoteke ni formalno razvidno? Označite vse pravilne možnosti.</p>
          <label className="check-row"><input data-testid="scope" type="checkbox" checked={answers.identifierScope} onChange={(event) => setConcept('identifierScope', event.target.checked)} /> Register in področje veljavnosti oznake <code>ob_id</code></label>
          <label className="check-row"><input data-testid="entity" type="checkbox" checked={answers.entityKind} onChange={(event) => setConcept('entityKind', event.target.checked)} /> Ali je ime občina, naselje ali druga prostorska enota</label>
          <label className="check-row"><input data-testid="context" type="checkbox" checked={answers.measurementContext} onChange={(event) => setConcept('measurementContext', event.target.checked)} /> Leto, referenčni datum in metodologija meritve <code>tot_p</code></label>
        </fieldset>
      ) : (
        <section className="editor-panel" aria-labelledby={`${lessonId}-editor-title`}>
          <div className="panel-heading">
            <span id={`${lessonId}-editor-title`}>{exercise.mode === 'sparql' ? 'Poizvedba SPARQL' : 'Zapis Turtle'}</span>
            <span className="panel-kicker">CodeMirror</span>
          </div>
          <div data-testid="editor">
            {hydrated ? (
              <CodeMirror
                value={code}
                height={exercise.showGraph ? '390px' : '340px'}
                theme="dark"
                onChange={setCode}
                basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: false }}
                aria-label={exercise.mode === 'sparql' ? 'Urejevalnik poizvedbe SPARQL' : 'Urejevalnik zapisa Turtle'}
              />
            ) : (
              <div className="editor-loading" style={{ height: exercise.showGraph ? '390px' : '340px' }} aria-hidden="true">Nalagam urejevalnik …</div>
            )}
          </div>
        </section>
      )}

      {exercise.showGraph ? <GraphView turtle={code} /> : null}

      <div className="exercise-actions" aria-label="Dejanja vaje">
        <button className="button button-primary" data-testid="check" type="button" onClick={checkAnswer} disabled={!hydrated || checking}>
          {checking ? 'Preverjam …' : hydrated ? 'Preveri' : 'Nalagam …'}
        </button>
        <button className="button button-secondary" data-testid="hint" type="button" onClick={() => setHintShown(true)} disabled={!hydrated}>Namig</button>
        <button className="button button-secondary" data-testid="show-solution" type="button" onClick={() => setSolutionShown(true)} disabled={!hydrated}>Pokaži rešitev</button>
        <button className="button button-quiet" data-testid="reset" type="button" onClick={reset} disabled={!hydrated}>Ponastavi</button>
        {completed ? <span className="completion-badge" data-testid="completed">✓ Vaja opravljena</span> : null}
      </div>

      {hintShown ? <aside className="feedback feedback-hint" data-testid="hint-text"><strong>Namig:</strong> {exercise.hint}</aside> : null}
      {solutionShown ? (
        <aside className="solution-panel" data-testid="solution-panel">
          <div className="panel-heading"><span>Primer rešitve</span><span className="panel-kicker">Rešitev še ne zaključi vaje</span></div>
          <pre data-testid="solution">{exercise.solution}</pre>
        </aside>
      ) : null}
      {feedback ? (
        <div className={`feedback ${feedback.ok ? 'feedback-success' : 'feedback-error'}`} role="status" aria-live="polite" data-testid="feedback">
          <strong aria-hidden="true">{feedback.ok ? '✓' : '!'}</strong> {feedback.message}
        </div>
      ) : null}

      {rows.length ? (
        <div className="results-wrap" data-testid="results">
          <table>
            <caption>Rezultat poizvedbe</caption>
            <thead><tr><th>CRP</th><th>Občina SURS</th><th>Naziv</th><th>Prebivalci</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.obcina}><td>{row.crp.split('#').at(-1)}</td><td>{row.obcina.split('/').at(-1)}</td><td>{row.naziv}</td><td>{row.prebivalci.toLocaleString('sl-SI')}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
