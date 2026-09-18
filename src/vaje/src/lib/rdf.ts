import { Parser, type Quad } from 'n3';
import type { LessonId } from './exercises';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const OWL = 'http://www.w3.org/2002/07/owl#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const SHEMA = 'https://onto.mdp.gov.si/shema/';
const OBCINA = 'https://onto.mdp.gov.si/obcina/';
const CRP = 'https://pzsi.sigov.si/datamodel/ns/crp#';

export interface ValidationResult {
  ok: boolean;
  message: string;
  quads?: Quad[];
}

export function parseTurtle(code: string): Quad[] {
  return new Parser().parse(code);
}

function has(quads: Quad[], subject: string, predicate: string, object: string, language?: string, datatype?: string) {
  return quads.some((quad) => {
    if (quad.subject.value !== subject || quad.predicate.value !== predicate || quad.object.value !== object) return false;
    if (language !== undefined && (quad.object.termType !== 'Literal' || quad.object.language !== language)) return false;
    if (datatype !== undefined && quad.object.termType === 'Literal' && quad.object.datatype.value !== datatype) return false;
    return true;
  });
}

function parseOrError(code: string): ValidationResult | Quad[] {
  try {
    return parseTurtle(code);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `Turtle ni veljaven: ${message}` };
  }
}

function missing(message: string): ValidationResult {
  return { ok: false, message };
}

export function validateTurtle(lessonId: Exclude<LessonId, 'pomen-tsv' | 'sparql-nad-grafom'>, code: string): ValidationResult {
  const parsed = parseOrError(code);
  if (!Array.isArray(parsed)) return parsed;
  const quads = parsed;

  if (lessonId === 'tsv-v-rdf' || lessonId === 'popravi-turtle') {
    const subject = `${OBCINA}ajdovscina`;
    if (!has(quads, subject, `${RDF}type`, `${SHEMA}Obcina`)) {
      return missing(lessonId === 'tsv-v-rdf' ? 'Manjka trojček za tip občine z URI-jema, navedenima v navodilu.' : 'Manjka tip občine: rdf:type shema:Obcina.');
    }
    if (!has(quads, subject, `${SHEMA}idObcinaSurs`, '001')) return missing('Manjka lastnost idObcinaSurs z besedilno vrednostjo »001« in vodilnima ničlama.');
    const validName = lessonId === 'popravi-turtle'
      ? has(quads, subject, `${SHEMA}naziv`, 'Ajdovščina', 'sl')
      : has(quads, subject, `${SHEMA}naziv`, 'Ajdovščina', '') || has(quads, subject, `${SHEMA}naziv`, 'Ajdovščina', 'sl');
    if (!validName) {
      return missing(lessonId === 'popravi-turtle' ? 'Naziv mora biti »Ajdovščina« z jezikovno oznako @sl.' : 'Manjka lastnost naziv z vrednostjo »Ajdovščina«.');
    }
    if (!has(quads, subject, `${SHEMA}steviloPrebivalcev`, '19895', undefined, `${XSD}integer`)) {
      return missing(lessonId === 'tsv-v-rdf' ? 'Manjka lastnost steviloPrebivalcev s številom 19895 brez narekovajev.' : 'Število prebivalcev mora biti literal tipa xsd:integer z vrednostjo 19895.');
    }
    return { ok: true, message: `Odlično — zapis je veljaven in vsebuje vse štiri zahtevane trditve (${quads.length} trojčki).`, quads };
  }

  if (lessonId === 'formaliziraj-obcino') {
    if (!has(quads, `${SHEMA}Obcina`, `${RDF}type`, `${OWL}Class`)) return missing('shema:Obcina mora biti opredeljena kot owl:Class.');
    if (!has(quads, `${SHEMA}Obcina`, `${RDFS}label`, 'Občina', 'sl')) return missing('Razredu Obcina dodajte slovensko oznako »Občina«@sl.');
    if (!has(quads, `${SHEMA}Obcina`, `${RDFS}label`, 'Municipality', 'en')) return missing('Razredu Obcina dodajte angleško oznako »Municipality«@en.');
    if (!has(quads, `${SHEMA}MeritevPrebivalcev`, `${RDF}type`, `${OWL}Class`)) return missing('Manjka razred shema:MeritevPrebivalcev.');

    const propertyChecks = [
      [`${SHEMA}naziv`, `${OWL}DatatypeProperty`, `${SHEMA}Obcina`, `${RDF}langString`, 'podatkovna lastnost shema:naziv'],
      [`${SHEMA}steviloPrebivalcev`, `${OWL}DatatypeProperty`, `${SHEMA}MeritevPrebivalcev`, `${XSD}integer`, 'podatkovna lastnost shema:steviloPrebivalcev'],
      [`${SHEMA}imaMeritevPrebivalcev`, `${OWL}ObjectProperty`, `${SHEMA}Obcina`, `${SHEMA}MeritevPrebivalcev`, 'objektna lastnost shema:imaMeritevPrebivalcev'],
    ] as const;

    for (const [property, type, domain, range, label] of propertyChecks) {
      if (!has(quads, property, `${RDF}type`, type)) return missing(`Manjka ${label} oziroma njen ustrezen tip.`);
      if (!has(quads, property, `${RDFS}domain`, domain)) return missing(`${label} nima pravilne rdfs:domain.`);
      if (!has(quads, property, `${RDFS}range`, range)) return missing(`${label} nima pravilne rdfs:range.`);
    }
    return { ok: true, message: `Model je skladen: najdena sta oba razreda in tri pravilno opredeljene lastnosti (${quads.length} trojčkov).`, quads };
  }

  if (lessonId === 'povezi-vira') {
    if (!has(quads, `${SHEMA}Obcina`, `${RDFS}subClassOf`, `${CRP}Obcina`)) return missing('Razred sursTBox:Obcina povežite kot podrazred crp:Obcina z rdfs:subClassOf.');
    const pairs = [
      ['1', 'ajdovscina'],
      ['11', 'celje'],
      ['61', 'ljubljana'],
      ['70', 'maribor'],
    ];
    const absent = pairs.find(([id, slug]) => !has(quads, `${CRP}Obcina_${id}`, `${OWL}sameAs`, `${OBCINA}${slug}`));
    if (absent) return missing(`Manjka povezava owl:sameAs za občino ${absent[1]}.`);
    return { ok: true, message: 'Vira sta povezana na ravni razreda in vseh štirih primerkov občin.', quads };
  }

  return { ok: false, message: 'Za to vajo ni preverjanja Turtle.' };
}
