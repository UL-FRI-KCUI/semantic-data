import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useRef, useState } from 'react';
import GraphView from './GraphView';
import { emptyConceptAnswers, validateConceptAnswers, type ConceptAnswers } from '../lib/concepts';
import { exerciseById, municipalitiesTsv, type LessonId } from '../lib/exercises';
import { clearProgress, readProgress, writeProgress } from '../lib/progress';
import { validateTurtle } from '../lib/rdf';
import { emptySchemaOrgAnswers, validateSchemaOrgAnswers, type SchemaOrgAnswers } from '../lib/schemaorg';
import type { SparqlRow } from '../lib/sparql';

export default function Exercise({ lessonId }: { lessonId: LessonId }) {
  const exercise = exerciseById[lessonId];
  const [code, setCode] = useState(exercise.starter);
  const [answers, setAnswers] = useState<ConceptAnswers>(emptyConceptAnswers);
  const [schemaOrgAnswers, setSchemaOrgAnswers] = useState<SchemaOrgAnswers>(emptySchemaOrgAnswers);
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
    if (saved?.schemaOrgAnswers) setSchemaOrgAnswers({ ...emptySchemaOrgAnswers, ...saved.schemaOrgAnswers } as SchemaOrgAnswers);
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
      schemaOrgAnswers,
      hintShown,
      solutionShown,
    });
  }, [answers, code, completed, hintShown, lessonId, schemaOrgAnswers, solutionShown]);

  async function checkAnswer() {
    setChecking(true);
    setRows([]);
    let result: { ok: boolean; message: string; rows?: SparqlRow[] };

    if (exercise.mode === 'schemaorg') {
      const message = validateSchemaOrgAnswers(schemaOrgAnswers);
      result = message ? { ok: false, message } : { ok: true, message: 'Pravilno — JSON-LD poveže spletni članek z razredom in lastnostmi besednjaka schema.org.' };
    } else if (exercise.mode === 'concepts') {
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
    setSchemaOrgAnswers(emptySchemaOrgAnswers);
    setHintShown(false);
    setSolutionShown(false);
    setCompleted(false);
    setFeedback(null);
    setRows([]);
  }

  function setConcept<K extends keyof ConceptAnswers>(key: K, value: ConceptAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function setSchemaOrg<K extends keyof SchemaOrgAnswers>(key: K, value: SchemaOrgAnswers[K]) {
    setSchemaOrgAnswers((current) => ({ ...current, [key]: value }));
  }

  const source = exercise.source ?? {
    label: 'Podatkovni izsek · SURS 2025',
    detail: '4 od 212 občin',
    content: municipalitiesTsv,
    ariaLabel: 'Izsek podatkov TSV',
    format: 'tsv' as const,
  };

  return (
    <div className="exercise-shell" data-lesson-id={lessonId}>
      <div className="source-strip">
        <span>{source.label}</span>
        <span>{source.detail}</span>
      </div>
      <pre className={`source-sample ${source.format}-sample`} aria-label={source.ariaLabel}>{source.content}</pre>

      {exercise.mode === 'schemaorg' ? (
        <fieldset className="concept-form" data-testid="schemaorg-form">
          <legend>Razložite zapis in preverite uporabljene pojme</legend>
          <div className="form-grid">
            <label>
              <span>Kaj določa <code>@context</code>?</span>
              <select data-testid="context-meaning" value={schemaOrgAnswers.contextMeaning} onChange={(event) => setSchemaOrg('contextMeaning', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="vocabulary">Uporabljeni besednjak in preslikavo izrazov</option>
                <option value="page-language">Jezik besedila na spletni strani</option>
                <option value="validation-service">Storitev za preverjanje zapisa</option>
              </select>
            </label>
            <label>
              <span>Kaj pomeni <code>@type: NewsArticle</code>?</span>
              <select data-testid="type-meaning" value={schemaOrgAnswers.typeMeaning} onChange={(event) => setSchemaOrg('typeMeaning', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="instance-class">Opisani primerek pripada razredu NewsArticle</option>
                <option value="file-format">Datoteka je zapisana v formatu NewsArticle</option>
                <option value="publisher-role">Izdajatelj članka ima vlogo NewsArticle</option>
              </select>
            </label>
            <label className="field-wide">
              <span>Katera je hierarhija razreda <code>NewsArticle</code>?</span>
              <select data-testid="hierarchy" value={schemaOrgAnswers.hierarchy} onChange={(event) => setSchemaOrg('hierarchy', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="thing-creativework-article-newsarticle">Thing &gt; CreativeWork &gt; Article &gt; NewsArticle</option>
                <option value="thing-organization-newsarticle">Thing &gt; Organization &gt; NewsArticle</option>
                <option value="creativework-webpage-newsarticle">CreativeWork &gt; WebPage &gt; NewsArticle</option>
              </select>
            </label>
            <label>
              <span>Kateri tip pričakuje <code>datePublished</code>?</span>
              <select data-testid="date-type" value={schemaOrgAnswers.datePublishedType} onChange={(event) => setSchemaOrg('datePublishedType', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="date-datetime">Date ali DateTime</option>
                <option value="text">Samo Text</option>
                <option value="integer">Integer</option>
              </select>
            </label>
            <label>
              <span>Kateri tip pričakuje <code>publisher</code>?</span>
              <select data-testid="publisher-type" value={schemaOrgAnswers.publisherType} onChange={(event) => setSchemaOrg('publisherType', event.target.value)}>
                <option value="">Izberite …</option>
                <option value="organization-person">Organization ali Person</option>
                <option value="text">Samo Text</option>
                <option value="webpage">Samo WebPage</option>
              </select>
            </label>
          </div>
        </fieldset>
      ) : exercise.mode === 'concepts' ? (
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
