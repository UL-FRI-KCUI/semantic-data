import { describe, expect, it } from 'vitest';
import { emptyConceptAnswers, validateConceptAnswers } from './concepts';
import { exerciseById } from './exercises';
import { clearProgress, progressKey, readProgress, writeProgress } from './progress';
import { parseTurtle, validateTurtle } from './rdf';
import { runSparql, validateSparql } from './sparql';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

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
    expect(progressKey('tsv-v-rdf')).toBe('semantic-data:vaje:v2:tsv-v-rdf');
    expect(progressKey('popravi-turtle')).toBe('semantic-data:vaje:v2:popravi-turtle');
    expect(progressKey('povezi-vira')).toBe('semantic-data:vaje:v2:povezi-vira');
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
});
