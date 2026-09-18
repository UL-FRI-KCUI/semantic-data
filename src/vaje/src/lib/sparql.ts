import { QueryEngine } from '@comunica/query-sparql';
import { Store } from 'n3';
import { linkedGraphTurtle } from './exercises';
import { parseTurtle, type ValidationResult } from './rdf';

export interface SparqlRow {
  crp: string;
  obcina: string;
  naziv: string;
  prebivalci: number;
}

export async function runSparql(query: string): Promise<SparqlRow[]> {
  const store = new Store(parseTurtle(linkedGraphTurtle));
  const engine = new QueryEngine();
  const bindingsStream = await engine.queryBindings(query, { sources: [store] });
  const bindings = await bindingsStream.toArray();

  return bindings.map((binding) => ({
    crp: binding.get('crp')?.value ?? '',
    obcina: binding.get('obcina')?.value ?? '',
    naziv: binding.get('naziv')?.value ?? '',
    prebivalci: Number(binding.get('prebivalci')?.value ?? Number.NaN),
  }));
}

export async function validateSparql(query: string): Promise<ValidationResult & { rows?: SparqlRow[] }> {
  if (!/owl:sameAs/i.test(query)) return { ok: false, message: 'Poizvedba mora identiteti virov povezati z owl:sameAs.' };
  if (!/filter\s*\([^)]*>\s*50000\s*\)/i.test(query)) return { ok: false, message: 'Dodajte FILTER, ki obdrži občine z več kot 50.000 prebivalci.' };
  if (!/order\s+by\s+desc\s*\(\s*\?prebivalci\s*\)/i.test(query)) return { ok: false, message: 'Rezultate uredite z ORDER BY DESC(?prebivalci).' };

  try {
    const rows = await runSparql(query);
    const names = rows.map((row) => row.naziv);
    if (rows.length !== 2 || names[0] !== 'Ljubljana' || names[1] !== 'Maribor') {
      return { ok: false, message: `Poizvedba se izvede, vendar pričakujemo dve vrstici v vrstnem redu Ljubljana, Maribor. Trenutni rezultat: ${names.join(', ') || 'brez vrstic'}.`, rows };
    }
    if (rows.some((row) => !row.crp || !row.obcina || !Number.isFinite(row.prebivalci))) {
      return { ok: false, message: 'V rezultatu morajo biti vezane spremenljivke ?crp, ?obcina, ?naziv in ?prebivalci.', rows };
    }
    return { ok: true, message: 'Pravilno — povezani graf vrne Ljubljano in Maribor, urejeni padajoče po številu prebivalcev.', rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `SPARQL poizvedbe ni mogoče izvesti: ${message}` };
  }
}
