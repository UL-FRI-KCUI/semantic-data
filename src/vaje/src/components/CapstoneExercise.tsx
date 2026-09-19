import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useRef, useState } from 'react';
import GraphView from './GraphView';
import {
  capstoneGraphTurtle,
  capstoneSteps,
  createEmptyCapstoneProgress,
  invalidateCapstoneFrom,
  normalizeCapstoneProgress,
  validateCapstoneAbox,
  validateCapstoneConcepts,
  validateCapstoneLinks,
  validateCapstoneTbox,
  type CapstoneConceptAnswers,
  type CapstoneProgress,
  type CapstoneStep,
} from '../lib/capstone';
import { clearProgress, readProgress, writeProgress } from '../lib/progress';

const lessonId = 'od-podatkov-do-povezanega-grafa' as const;

export default function CapstoneExercise() {
  const [progress, setProgress] = useState<CapstoneProgress>(createEmptyCapstoneProgress);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const ready = useRef(false);
  const skipNextPersist = useRef(false);

  const step = progress.currentStep;
  const stepDefinition = capstoneSteps[step - 1];
  const completed = progress.completedSteps.includes(4);

  useEffect(() => {
    const saved = readProgress(localStorage, lessonId);
    if (saved?.capstoneProgress) setProgress(normalizeCapstoneProgress(saved.capstoneProgress));
    setHydrated(true);
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    writeProgress(localStorage, lessonId, {
      completed,
      hintShown: progress.hintsShown.length > 0,
      solutionShown: progress.solutionsShown.length > 0,
      capstoneProgress: progress,
    });
  }, [completed, progress]);

  function updateStep(stepToInvalidate: CapstoneStep, update: (current: CapstoneProgress) => CapstoneProgress) {
    setProgress((current) => {
      const base = current.completedSteps.includes(stepToInvalidate)
        ? invalidateCapstoneFrom(current, stepToInvalidate)
        : current;
      return update(base);
    });
    setFeedback(null);
  }

  function setConcept<K extends keyof CapstoneConceptAnswers>(key: K, value: CapstoneConceptAnswers[K]) {
    updateStep(1, (current) => ({
      ...current,
      conceptAnswers: { ...current.conceptAnswers, [key]: value },
    }));
  }

  function setDraft(key: 'aboxDraft' | 'tboxDraft' | 'linksDraft', value: string, editedStep: CapstoneStep) {
    updateStep(editedStep, (current) => ({ ...current, [key]: value }));
  }

  function showHint() {
    setProgress((current) => ({
      ...current,
      hintsShown: current.hintsShown.includes(step) ? current.hintsShown : [...current.hintsShown, step],
    }));
  }

  function showSolution() {
    setProgress((current) => ({
      ...current,
      solutionsShown: current.solutionsShown.includes(step) ? current.solutionsShown : [...current.solutionsShown, step],
    }));
  }

  function checkStep() {
    let message = '';
    if (step === 1) message = validateCapstoneConcepts(progress.conceptAnswers);
    if (step === 2) message = validateCapstoneAbox(progress.aboxDraft);
    if (step === 3) message = validateCapstoneTbox(progress.tboxDraft);
    if (step === 4) message = validateCapstoneLinks(progress.linksDraft, progress.identityRelation);

    if (message) {
      setFeedback({ ok: false, message });
      return;
    }

    setProgress((current) => {
      const completedSteps = current.completedSteps.includes(step)
        ? current.completedSteps
        : [...current.completedSteps, step].sort() as CapstoneStep[];
      return {
        ...current,
        completedSteps,
        currentStep: step < 4 ? (step + 1) as CapstoneStep : 4,
      };
    });
    setFeedback({
      ok: true,
      message: step < 4
        ? `Korak ${step} je pravilen. Odklenjen je naslednji korak.`
        : 'Povezani graf je popoln. Uspešno ste povezali podatke, model in zunanje vire.',
    });
  }

  function reset() {
    skipNextPersist.current = true;
    clearProgress(localStorage, lessonId);
    setProgress(createEmptyCapstoneProgress());
    setFeedback(null);
  }

  function selectStep(selectedStep: CapstoneStep) {
    const unlocked = selectedStep === 1 || progress.completedSteps.includes((selectedStep - 1) as CapstoneStep);
    if (!unlocked) return;
    setProgress((current) => ({ ...current, currentStep: selectedStep }));
    setFeedback(null);
  }

  return (
    <div className="exercise-shell capstone-shell" data-lesson-id={lessonId}>
      <div className="source-strip">
        <span>Podatkovni izsek · SURS 2025</span>
        <span>Občina Kranj</span>
      </div>
      <pre className="source-sample tsv-sample" aria-label="Podatkovna vrstica SURS za Kranj">ob_id{`\t`}ob_ime{`\t`}tot_p{`\n`}052{`\t`}Kranj{`\t`}57384</pre>

      <div className="capstone-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Korak ${step} od 4`}>
        <span>Korak {step} od 4</span>
        <span>{progress.completedSteps.length}/4 opravljenih</span>
      </div>

      <nav className="capstone-stepper" aria-label="Koraki zaključne vaje">
        {capstoneSteps.map((item) => {
          const unlocked = item.number === 1 || progress.completedSteps.includes((item.number - 1) as CapstoneStep);
          const done = progress.completedSteps.includes(item.number);
          return (
            <button
              className={`${item.number === step ? 'is-active' : ''} ${done ? 'is-complete' : ''}`}
              data-testid={`capstone-step-${item.number}`}
              type="button"
              disabled={!unlocked}
              aria-current={item.number === step ? 'step' : undefined}
              onClick={() => selectStep(item.number)}
              key={item.number}
            >
              <span>{done ? '✓' : item.number}</span>
              {item.title}
            </button>
          );
        })}
      </nav>

      <section className="capstone-panel" aria-labelledby={`capstone-heading-${step}`}>
        <div className="panel-heading">
          <span id={`capstone-heading-${step}`}>{step}. {stepDefinition.title}</span>
          <span className="panel-kicker">Vodena zaključna vaja</span>
        </div>

        {step === 1 ? (
          <fieldset className="concept-form" data-testid="capstone-concepts">
            <legend>Iz podatkovne vrstice določite tri modelirne odločitve</legend>
            <div className="form-grid">
              <label>
                <span>Kateri URI naj predstavlja občino?</span>
                <select data-testid="capstone-uri" value={progress.conceptAnswers.municipalityUri} onChange={(event) => setConcept('municipalityUri', event.target.value)}>
                  <option value="">Izberite …</option>
                  <option value="obcina-kranj">https://onto.mdp.gov.si/obcina/kranj</option>
                  <option value="literal-kranj">Besedilo »Kranj« brez URI-ja</option>
                  <option value="measurement-kranj">https://onto.mdp.gov.si/meritev/kranj</option>
                </select>
              </label>
              <label>
                <span>Kako ohranimo oznako <code>052</code>?</span>
                <select data-testid="capstone-id-type" value={progress.conceptAnswers.identifierType} onChange={(event) => setConcept('identifierType', event.target.value)}>
                  <option value="">Izberite …</option>
                  <option value="string">Kot besedilo »052«</option>
                  <option value="integer">Kot celo število 52</option>
                  <option value="uri">Kot samostojen URI</option>
                </select>
              </label>
              <label className="field-wide">
                <span>Kako zapišemo število prebivalcev, če želimo dodajati meritve za različna leta?</span>
                <select data-testid="capstone-measurement-model" value={progress.conceptAnswers.measurementModel} onChange={(event) => setConcept('measurementModel', event.target.value)}>
                  <option value="">Izberite …</option>
                  <option value="separate-resource">Kot ločen primerek meritve z letom in vrednostjo</option>
                  <option value="direct-value">Kot neposredno vrednost občine brez leta</option>
                  <option value="class">Kot nov razred za vsako leto</option>
                </select>
              </label>
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <div className="capstone-editor-wrap">
            <p>Zapišite primerka občine in meritve. Uporabite podatek <code>57384</code> za leto <code>2025</code>.</p>
            <Editor value={progress.aboxDraft} onChange={(value) => setDraft('aboxDraft', value, 2)} hydrated={hydrated} label="Urejevalnik ABox zapisa Turtle" testId="capstone-abox-editor" />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="capstone-editor-wrap">
            <p>Dopolnite tri lastnosti z njihovim tipom, domeno in obsegom. Razreda sta že pripravljena.</p>
            <Editor value={progress.tboxDraft} onChange={(value) => setDraft('tboxDraft', value, 3)} hydrated={hydrated} label="Urejevalnik TBox zapisa Turtle" testId="capstone-tbox-editor" />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="capstone-editor-wrap">
            <p>
              CRP opisuje Kranj kot <code>crp:Obcina_52</code>, SURS kot <code>sursABox:kranj</code>, Wikidata pa kot{' '}
              <a href="https://www.wikidata.org/wiki/Q3441893" target="_blank" rel="noopener">wd:Q3441893</a>.
            </p>
            <Editor value={progress.linksDraft} onChange={(value) => setDraft('linksDraft', value, 4)} hydrated={hydrated} label="Urejevalnik povezav Turtle" testId="capstone-links-editor" />
            <label className="capstone-final-question">
              <span>Zakaj uporabimo <code>owl:sameAs</code> in ne <code>owl:equivalentClass</code>?</span>
              <select
                data-testid="capstone-identity-relation"
                value={progress.identityRelation}
                onChange={(event) => updateStep(4, (current) => ({ ...current, identityRelation: event.target.value }))}
              >
                <option value="">Izberite …</option>
                <option value="same-as-instances">Ker povezujemo URI-je istega primerka občine</option>
                <option value="equivalent-classes">Ker povezujemo tri enakovredne razrede občin</option>
                <option value="same-properties">Ker imajo vsi viri enake lastnosti</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>

      <div className="exercise-actions" aria-label="Dejanja trenutnega koraka">
        <button className="button button-primary" data-testid="check" type="button" onClick={checkStep} disabled={!hydrated}>
          {step < 4 ? 'Preveri in nadaljuj' : 'Zaključi vajo'}
        </button>
        <button className="button button-secondary" data-testid="hint" type="button" onClick={showHint} disabled={!hydrated}>Namig</button>
        <button className="button button-secondary" data-testid="show-solution" type="button" onClick={showSolution} disabled={!hydrated}>Pokaži rešitev</button>
        <button className="button button-quiet" data-testid="reset" type="button" onClick={reset} disabled={!hydrated}>Ponastavi</button>
        {completed ? <span className="completion-badge" data-testid="completed">✓ Vaja opravljena</span> : null}
      </div>

      {progress.hintsShown.includes(step) ? <aside className="feedback feedback-hint" data-testid="hint-text"><strong>Namig:</strong> {stepDefinition.hint}</aside> : null}
      {progress.solutionsShown.includes(step) ? (
        <aside className="solution-panel" data-testid="solution-panel">
          <div className="panel-heading"><span>Primer rešitve za {step}. korak</span><span className="panel-kicker">Rešitev še ne zaključi koraka</span></div>
          <pre data-testid="solution">{stepDefinition.solution}</pre>
        </aside>
      ) : null}
      {feedback ? (
        <div className={`feedback ${feedback.ok ? 'feedback-success' : 'feedback-error'}`} role="status" aria-live="polite" data-testid="feedback">
          <strong aria-hidden="true">{feedback.ok ? '✓' : '!'}</strong> {feedback.message}
        </div>
      ) : null}

      {completed ? <GraphView turtle={capstoneGraphTurtle(progress)} /> : null}
    </div>
  );
}

function Editor({ value, onChange, hydrated, label, testId }: { value: string; onChange: (value: string) => void; hydrated: boolean; label: string; testId: string }) {
  return (
    <section className="editor-panel" aria-label={label}>
      <div className="panel-heading"><span>Zapis Turtle</span><span className="panel-kicker">CodeMirror</span></div>
      <div data-testid={testId}>
        {hydrated ? (
          <CodeMirror
            value={value}
            height="410px"
            theme="dark"
            onChange={onChange}
            basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: false }}
            aria-label={label}
          />
        ) : (
          <div className="editor-loading" style={{ height: '410px' }} aria-hidden="true">Nalagam urejevalnik …</div>
        )}
      </div>
    </section>
  );
}
