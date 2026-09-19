import { describe, expect, it } from 'vitest';
import { emptyConceptAnswers, validateConceptAnswers } from './concepts';
import { exerciseById } from './exercises';
import { clearProgress, progressKey, readProgress, writeProgress } from './progress';
import { parseTurtle, validateTurtle } from './rdf';
import { runSparql, validateSparql } from './sparql';
import { emptySchemaOrgAnswers, validateSchemaOrgAnswers } from './schemaorg';
import {
  capstoneAboxSolution,
  capstoneLinksSolution,
  capstoneTboxSolution,
  createEmptyCapstoneProgress,
  invalidateCapstoneFrom,
  normalizeCapstoneProgress,
  validateCapstoneAbox,
  validateCapstoneConcepts,
  validateCapstoneLinks,
  validateCapstoneTbox,
} from './capstone';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('JSON-LD in schema.org', () => {
  const correct = {
    contextMeaning: 'vocabulary',
    typeMeaning: 'instance-class',
    hierarchy: 'thing-creativework-article-newsarticle',
    datePublishedType: 'date-datetime',
    publisherType: 'organization-person',
  };

  it('sprejme vseh pet pravilnih odgovorov', () => {
    expect(validateSchemaOrgAnswers(correct)).toBe('');
  });

  it('vrne ciljno povratno informacijo za vsak napačen odgovor', () => {
    expect(validateSchemaOrgAnswers(emptySchemaOrgAnswers)).toContain('@context');
    expect(validateSchemaOrgAnswers({ ...correct, typeMeaning: 'file-format' })).toContain('@type');
    expect(validateSchemaOrgAnswers({ ...correct, hierarchy: 'thing-organization-newsarticle' })).toContain('hierarhiji');
    expect(validateSchemaOrgAnswers({ ...correct, datePublishedType: 'text' })).toContain('datePublished');
    expect(validateSchemaOrgAnswers({ ...correct, publisherType: 'text' })).toContain('publisher');
  });
});

describe('pomenska vaja', () => {
  it('zahteva pravilna tipa in vse tri manjkajoče pomenske razsežnosti', () => {
    expect(validateConceptAnswers(emptyConceptAnswers)).toContain('ob_id');
    expect(validateConceptAnswers({
      idType: 'string',
      populationType: 'integer',
      identifierScope: true,
      entityKind: true,
      measurementContext: true,
    })).toBe('');
  });
});

describe('Turtle in RDF preverjanja', () => {
  it('parser zavrne sintaktično pokvarjen Turtle', () => {
    expect(() => parseTurtle('@prefix ex: <https://example.org/> ex:a ex:b ex:c .')).toThrow();
  });

  it('preveri štiri RDF-trojčke za Ajdovščino', () => {
    const result = validateTurtle('tsv-v-rdf', exerciseById['tsv-v-rdf'].solution);
    expect(result.ok).toBe(true);
    expect(result.quads).toHaveLength(4);
  });

  it('v drugi vaji zahteva ime idObcinaSurs in sprejme naziv z jezikovno oznako ali brez nje', () => {
    const solution = exerciseById['tsv-v-rdf'].solution;
    expect(validateTurtle('tsv-v-rdf', solution.replace('/idObcinaSurs>', '/identifikator>')).ok).toBe(false);
    expect(validateTurtle('tsv-v-rdf', solution.replace('"Ajdovščina" .', '"Ajdovščina"@sl .')).ok).toBe(true);
    expect(validateTurtle('tsv-v-rdf', solution.replace('"Ajdovščina" .', '"Ajdovščina"@si .')).ok).toBe(false);
  });

  it('v tretji vaji še vedno zahteva pravilno jezikovno oznako', () => {
    const solution = exerciseById['popravi-turtle'].solution;
    expect(validateTurtle('popravi-turtle', solution).ok).toBe(true);
    expect(validateTurtle('popravi-turtle', solution.replace('"Ajdovščina"@sl', '"Ajdovščina"@si')).ok).toBe(false);
  });

  it('preveri razrede, večjezične oznake, domene in obsege ontologije', () => {
    const result = validateTurtle('formaliziraj-obcino', exerciseById['formaliziraj-obcino'].solution);
    expect(result.ok).toBe(true);
    expect(result.quads?.length).toBeGreaterThanOrEqual(13);
  });

  it('preveri povezavo razredov in štiri pare občin', () => {
    const solution = exerciseById['povezi-vira'].solution;
    const result = validateTurtle('povezi-vira', solution);
    expect(result.ok).toBe(true);
    expect(result.quads).toHaveLength(5);
    expect(validateTurtle('povezi-vira', solution.replace('sursTBox:Obcina rdfs:subClassOf crp:Obcina', 'crp:Obcina rdfs:subClassOf sursTBox:Obcina')).ok).toBe(false);
    expect(validateTurtle('povezi-vira', solution.replace('crp:Obcina_70 owl:sameAs sursABox:maribor .', '')).ok).toBe(false);
  });
});

describe('zaključna vaja od podatkov do povezanega grafa', () => {
  const correctConcepts = {
    municipalityUri: 'obcina-kranj',
    identifierType: 'string',
    measurementModel: 'separate-resource',
  };

  it('preveri vse tri modelirne odločitve po vrstnem redu', () => {
    expect(validateCapstoneConcepts(correctConcepts)).toBe('');
    expect(validateCapstoneConcepts({ ...correctConcepts, municipalityUri: 'literal-kranj' })).toContain('URI');
    expect(validateCapstoneConcepts({ ...correctConcepts, identifierType: 'integer' })).toContain('052');
    expect(validateCapstoneConcepts({ ...correctConcepts, measurementModel: 'direct-value' })).toContain('ločen primerek');
  });

  it('pomensko preveri ABox za Kranj in meritev leta 2025', () => {
    expect(validateCapstoneAbox(capstoneAboxSolution)).toBe('');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('a shema:Obcina', 'a shema:MeritevPrebivalcev'))).toContain('shema:Obcina');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('"052"', '52'))).toContain('052');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('"Kranj"@sl', '"Kranj"'))).toContain('@sl');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('shema:imaMeritevPrebivalcev', 'shema:imaDrugoMeritev'))).toContain('imaMeritevPrebivalcev');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('a shema:MeritevPrebivalcev ;', 'a shema:Obcina ;'))).toContain('MeritevPrebivalcev');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace('"2025"^^xsd:gYear', '"2025"'))).toContain('xsd:gYear');
    expect(validateCapstoneAbox(capstoneAboxSolution.replace(';\n  shema:vrednost 57384 .', '.'))).toContain('57384');
  });

  it('pomensko preveri tipe, domene in obsege treh lastnosti TBox', () => {
    expect(validateCapstoneTbox(capstoneTboxSolution)).toBe('');
    expect(validateCapstoneTbox(capstoneTboxSolution.replace('shema:naziv a owl:DatatypeProperty', 'shema:naziv a owl:ObjectProperty'))).toContain('tipa');
    expect(validateCapstoneTbox(capstoneTboxSolution.replace('rdfs:domain shema:Obcina', 'rdfs:domain shema:MeritevPrebivalcev'))).toContain('domen');
    expect(validateCapstoneTbox(capstoneTboxSolution.replace('rdfs:range xsd:integer', 'rdfs:range xsd:string'))).toContain('obsega');
  });

  it('zahteva podrazred, obe povezavi identitete in pravilno razlago owl:sameAs', () => {
    expect(validateCapstoneLinks(capstoneLinksSolution, 'same-as-instances')).toBe('');
    expect(validateCapstoneLinks(capstoneLinksSolution.replace('rdfs:subClassOf', 'owl:equivalentClass'), 'same-as-instances')).toContain('podrazred');
    expect(validateCapstoneLinks(capstoneLinksSolution.replace('crp:Obcina_52 owl:sameAs sursABox:kranj .', ''), 'same-as-instances')).toContain('CRP in SURS');
    expect(validateCapstoneLinks(capstoneLinksSolution.replace('crp:Obcina_52 owl:sameAs wd:Q3441893 .', ''), 'same-as-instances')).toContain('Wikidata');
    expect(validateCapstoneLinks(capstoneLinksSolution, 'equivalent-classes')).toContain('equivalentClass');
  });

  it('sprejme obratno smer simetričnih povezav owl:sameAs', () => {
    const reversed = capstoneLinksSolution
      .replace('crp:Obcina_52 owl:sameAs sursABox:kranj .', 'sursABox:kranj owl:sameAs crp:Obcina_52 .')
      .replace('crp:Obcina_52 owl:sameAs wd:Q3441893 .', 'wd:Q3441893 owl:sameAs crp:Obcina_52 .');
    expect(validateCapstoneLinks(reversed, 'same-as-instances')).toBe('');
  });

  it('normalizira shranjeno stanje in ob spremembi razveljavi ta ter poznejše korake', () => {
    const progress = normalizeCapstoneProgress({ currentStep: 4, completedSteps: [1, 2, 3, 4] });
    expect(progress.aboxDraft).toContain('Zapišite občino Kranj');
    const invalidated = invalidateCapstoneFrom(progress, 2);
    expect(invalidated.currentStep).toBe(2);
    expect(invalidated.completedSteps).toEqual([1]);
  });
});

describe('SPARQL', () => {
  it('vrne Ljubljano in Maribor v padajočem vrstnem redu', async () => {
    const rows = await runSparql(exerciseById['sparql-nad-grafom'].solution);
    expect(rows.map((row) => row.naziv)).toEqual(['Ljubljana', 'Maribor']);
    expect((await validateSparql(exerciseById['sparql-nad-grafom'].solution)).ok).toBe(true);
  });
});

describe('lokalni napredek', () => {
  it('uporablja različico ključa, shrani zaključek in ga ponastavi', () => {
    const storage = new MemoryStorage();
    expect(progressKey('pomen-tsv')).toBe('semantic-data:vaje:v1:pomen-tsv');
    expect(progressKey('kaj-pove-json-ld')).toBe('semantic-data:vaje:v1:kaj-pove-json-ld');
    expect(progressKey('tsv-v-rdf')).toBe('semantic-data:vaje:v2:tsv-v-rdf');
    expect(progressKey('popravi-turtle')).toBe('semantic-data:vaje:v2:popravi-turtle');
    expect(progressKey('povezi-vira')).toBe('semantic-data:vaje:v2:povezi-vira');
    expect(progressKey('od-podatkov-do-povezanega-grafa')).toBe('semantic-data:vaje:v1:od-podatkov-do-povezanega-grafa');
    writeProgress(storage, 'pomen-tsv', {
      completed: true,
      hintShown: true,
      solutionShown: false,
      conceptAnswers: { idType: 'string' },
    });
    expect(readProgress(storage, 'pomen-tsv')?.completed).toBe(true);
    clearProgress(storage, 'pomen-tsv');
    expect(readProgress(storage, 'pomen-tsv')).toBeNull();
  });

  it('shrani in obnovi odgovore vaje schema.org', () => {
    const storage = new MemoryStorage();
    const schemaOrgAnswers = {
      contextMeaning: 'vocabulary',
      typeMeaning: 'instance-class',
      hierarchy: 'thing-creativework-article-newsarticle',
      datePublishedType: 'date-datetime',
      publisherType: 'organization-person',
    };
    writeProgress(storage, 'kaj-pove-json-ld', {
      completed: true,
      hintShown: false,
      solutionShown: false,
      schemaOrgAnswers,
    });
    expect(readProgress(storage, 'kaj-pove-json-ld')?.schemaOrgAnswers).toEqual(schemaOrgAnswers);
    clearProgress(storage, 'kaj-pove-json-ld');
    expect(readProgress(storage, 'kaj-pove-json-ld')).toBeNull();
  });

  it('shrani, obnovi in ponastavi napredek zaključne vaje', () => {
    const storage = new MemoryStorage();
    const capstoneProgress = createEmptyCapstoneProgress();
    capstoneProgress.currentStep = 3;
    capstoneProgress.completedSteps = [1, 2];
    writeProgress(storage, 'od-podatkov-do-povezanega-grafa', {
      completed: false,
      hintShown: true,
      solutionShown: false,
      capstoneProgress,
    });
    expect(readProgress(storage, 'od-podatkov-do-povezanega-grafa')?.capstoneProgress?.completedSteps).toEqual([1, 2]);
    clearProgress(storage, 'od-podatkov-do-povezanega-grafa');
    expect(readProgress(storage, 'od-podatkov-do-povezanega-grafa')).toBeNull();
  });
});
