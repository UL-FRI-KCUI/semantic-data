import { Parser, type Quad } from 'n3';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const OWL = 'http://www.w3.org/2002/07/owl#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const SHEMA = 'https://onto.mdp.gov.si/shema/';
const OBCINA = 'https://onto.mdp.gov.si/obcina/';
const CRP = 'https://pzsi.sigov.si/datamodel/ns/crp#';
const WD = 'https://www.wikidata.org/entity/';

export type CapstoneStep = 1 | 2 | 3 | 4;

export interface CapstoneConceptAnswers {
  municipalityUri: string;
  identifierType: string;
  measurementModel: string;
}

export interface CapstoneProgress {
  currentStep: CapstoneStep;
  completedSteps: CapstoneStep[];
  conceptAnswers: CapstoneConceptAnswers;
  aboxDraft: string;
  tboxDraft: string;
  linksDraft: string;
  identityRelation: string;
  hintsShown: CapstoneStep[];
  solutionsShown: CapstoneStep[];
}

export const capstoneAboxStarter = `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix shema: <https://onto.mdp.gov.si/shema/> .
@prefix obcina: <https://onto.mdp.gov.si/obcina/> .

# Zapišite občino Kranj in njeno meritev prebivalstva za leto 2025.`;

export const capstoneAboxSolution = `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix shema: <https://onto.mdp.gov.si/shema/> .
@prefix obcina: <https://onto.mdp.gov.si/obcina/> .

obcina:kranj a shema:Obcina ;
  shema:idObcinaSurs "052" ;
  shema:naziv "Kranj"@sl ;
  shema:imaMeritevPrebivalcev obcina:kranj-stevilo-prebivalcev-2025 .

obcina:kranj-stevilo-prebivalcev-2025 a shema:MeritevPrebivalcev ;
  shema:leto "2025"^^xsd:gYear ;
  shema:vrednost 57384 .`;

export const capstoneTboxStarter = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix shema: <https://onto.mdp.gov.si/shema/> .

shema:Obcina a owl:Class .
shema:MeritevPrebivalcev a owl:Class .

# Dopolnite naziv, povezavo do meritve in vrednost meritve.`;

export const capstoneTboxSolution = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix shema: <https://onto.mdp.gov.si/shema/> .

shema:Obcina a owl:Class .
shema:MeritevPrebivalcev a owl:Class .

shema:naziv a owl:DatatypeProperty ;
  rdfs:domain shema:Obcina ;
  rdfs:range rdf:langString .

shema:imaMeritevPrebivalcev a owl:ObjectProperty ;
  rdfs:domain shema:Obcina ;
  rdfs:range shema:MeritevPrebivalcev .

shema:vrednost a owl:DatatypeProperty ;
  rdfs:domain shema:MeritevPrebivalcev ;
  rdfs:range xsd:integer .`;

export const capstoneLinksStarter = `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix crp: <https://pzsi.sigov.si/datamodel/ns/crp#> .
@prefix sursTBox: <https://onto.mdp.gov.si/shema/> .
@prefix sursABox: <https://onto.mdp.gov.si/obcina/> .
@prefix wd: <https://www.wikidata.org/entity/> .

# Povežite razreda ter tri URI-je, ki predstavljajo občino Kranj.`;

export const capstoneLinksSolution = `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix crp: <https://pzsi.sigov.si/datamodel/ns/crp#> .
@prefix sursTBox: <https://onto.mdp.gov.si/shema/> .
@prefix sursABox: <https://onto.mdp.gov.si/obcina/> .
@prefix wd: <https://www.wikidata.org/entity/> .

sursTBox:Obcina rdfs:subClassOf crp:Obcina .
crp:Obcina_52 owl:sameAs sursABox:kranj .
crp:Obcina_52 owl:sameAs wd:Q3441893 .`;

export const capstoneSteps = [
  {
    number: 1 as const,
    title: 'Razumevanje podatkov',
    hint: 'Oznaka 052 ni namenjena računanju. URI naj poimenuje občino, meritev pa potrebuje svoje leto in svoj primerek.',
    solution: 'URI občine: https://onto.mdp.gov.si/obcina/kranj\nOznaka 052: besedilo\nModel meritve: ločen primerek z letom 2025',
  },
  {
    number: 2 as const,
    title: 'ABox v Turtle',
    hint: 'Občina in meritev sta dva primerka. Povežite ju z imaMeritevPrebivalcev, leto zapišite kot xsd:gYear in vrednost kot celo število.',
    solution: capstoneAboxSolution,
  },
  {
    number: 3 as const,
    title: 'TBox',
    hint: 'Naziv in vrednost sta podatkovni lastnosti. Povezava med občino in meritvijo je objektna lastnost.',
    solution: capstoneTboxSolution,
  },
  {
    number: 4 as const,
    title: 'Povezani podatki',
    hint: 'Razreda povežite z rdfs:subClassOf. URI-ji CRP, SURS in Wikidata opisujejo isti primerek, zato uporabite owl:sameAs.',
    solution: `${capstoneLinksSolution}\n\n# owl:sameAs povezuje URI-je istega primerka.\n# owl:equivalentClass povezuje enakovredne razrede.`,
  },
];

export function createEmptyCapstoneProgress(): CapstoneProgress {
  return {
    currentStep: 1,
    completedSteps: [],
    conceptAnswers: { municipalityUri: '', identifierType: '', measurementModel: '' },
    aboxDraft: capstoneAboxStarter,
    tboxDraft: capstoneTboxStarter,
    linksDraft: capstoneLinksStarter,
    identityRelation: '',
    hintsShown: [],
    solutionsShown: [],
  };
}

function isStep(value: unknown): value is CapstoneStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function normalizeCapstoneProgress(value?: Partial<CapstoneProgress>): CapstoneProgress {
  const empty = createEmptyCapstoneProgress();
  if (!value) return empty;
  return {
    currentStep: isStep(value.currentStep) ? value.currentStep : 1,
    completedSteps: Array.isArray(value.completedSteps) ? value.completedSteps.filter(isStep) : [],
    conceptAnswers: { ...empty.conceptAnswers, ...value.conceptAnswers },
    aboxDraft: typeof value.aboxDraft === 'string' ? value.aboxDraft : empty.aboxDraft,
    tboxDraft: typeof value.tboxDraft === 'string' ? value.tboxDraft : empty.tboxDraft,
    linksDraft: typeof value.linksDraft === 'string' ? value.linksDraft : empty.linksDraft,
    identityRelation: typeof value.identityRelation === 'string' ? value.identityRelation : '',
    hintsShown: Array.isArray(value.hintsShown) ? value.hintsShown.filter(isStep) : [],
    solutionsShown: Array.isArray(value.solutionsShown) ? value.solutionsShown.filter(isStep) : [],
  };
}

export function invalidateCapstoneFrom(progress: CapstoneProgress, step: CapstoneStep): CapstoneProgress {
  return {
    ...progress,
    currentStep: step,
    completedSteps: progress.completedSteps.filter((completedStep) => completedStep < step),
  };
}

export function validateCapstoneConcepts(answers: CapstoneConceptAnswers) {
  if (answers.municipalityUri !== 'obcina-kranj') return 'Izberite URI, ki enolično poimenuje občino Kranj v imenskem prostoru SURS.';
  if (answers.identifierType !== 'string') return 'Oznaka 052 mora ostati besedilo, sicer izgubimo vodilno ničlo.';
  if (answers.measurementModel !== 'separate-resource') return 'Meritev modelirajte kot ločen primerek, da ji lahko pripišemo leto in pozneje dodamo nove meritve.';
  return '';
}

function parseOrMessage(code: string): Quad[] | string {
  try {
    return new Parser().parse(code);
  } catch (error) {
    return `Turtle ni veljaven: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function has(quads: Quad[], subject: string, predicate: string, object: string, language?: string, datatype?: string) {
  return quads.some((quad) => {
    if (quad.subject.value !== subject || quad.predicate.value !== predicate || quad.object.value !== object) return false;
    if (language !== undefined && (quad.object.termType !== 'Literal' || quad.object.language !== language)) return false;
    if (datatype !== undefined && (quad.object.termType !== 'Literal' || quad.object.datatype.value !== datatype)) return false;
    return true;
  });
}

function hasSymmetric(quads: Quad[], left: string, predicate: string, right: string) {
  return has(quads, left, predicate, right) || has(quads, right, predicate, left);
}

export function validateCapstoneAbox(code: string) {
  const parsed = parseOrMessage(code);
  if (typeof parsed === 'string') return parsed;
  const municipality = `${OBCINA}kranj`;
  const measurement = `${OBCINA}kranj-stevilo-prebivalcev-2025`;
  if (!has(parsed, municipality, `${RDF}type`, `${SHEMA}Obcina`)) return 'Kranj mora biti primerek razreda shema:Obcina.';
  if (!has(parsed, municipality, `${SHEMA}idObcinaSurs`, '052', '', `${XSD}string`)) return 'Oznako SURS zapišite kot besedilo »052« z vodilno ničlo.';
  if (!has(parsed, municipality, `${SHEMA}naziv`, 'Kranj', 'sl')) return 'Naziv Kranj potrebuje slovensko jezikovno oznako @sl.';
  if (!has(parsed, municipality, `${SHEMA}imaMeritevPrebivalcev`, measurement)) return 'Občino povežite z meritvijo prek shema:imaMeritevPrebivalcev.';
  if (!has(parsed, measurement, `${RDF}type`, `${SHEMA}MeritevPrebivalcev`)) return 'Meritev mora biti primerek razreda shema:MeritevPrebivalcev.';
  if (!has(parsed, measurement, `${SHEMA}leto`, '2025', '', `${XSD}gYear`)) return 'Leto meritve zapišite kot literal »2025« tipa xsd:gYear.';
  if (!has(parsed, measurement, `${SHEMA}vrednost`, '57384', '', `${XSD}integer`)) return 'Vrednost meritve mora biti celo število 57384.';
  return '';
}

export function validateCapstoneTbox(code: string) {
  const parsed = parseOrMessage(code);
  if (typeof parsed === 'string') return parsed;
  if (!has(parsed, `${SHEMA}Obcina`, `${RDF}type`, `${OWL}Class`)) return 'shema:Obcina mora ostati opredeljena kot owl:Class.';
  if (!has(parsed, `${SHEMA}MeritevPrebivalcev`, `${RDF}type`, `${OWL}Class`)) return 'shema:MeritevPrebivalcev mora ostati opredeljena kot owl:Class.';

  const properties = [
    [`${SHEMA}naziv`, `${OWL}DatatypeProperty`, `${SHEMA}Obcina`, `${RDF}langString`, 'shema:naziv'],
    [`${SHEMA}imaMeritevPrebivalcev`, `${OWL}ObjectProperty`, `${SHEMA}Obcina`, `${SHEMA}MeritevPrebivalcev`, 'shema:imaMeritevPrebivalcev'],
    [`${SHEMA}vrednost`, `${OWL}DatatypeProperty`, `${SHEMA}MeritevPrebivalcev`, `${XSD}integer`, 'shema:vrednost'],
  ] as const;

  for (const [property, type, domain, range, label] of properties) {
    if (!has(parsed, property, `${RDF}type`, type)) return `${label} nima pravilnega tipa lastnosti.`;
    if (!has(parsed, property, `${RDFS}domain`, domain)) return `${label} nima pravilne domene.`;
    if (!has(parsed, property, `${RDFS}range`, range)) return `${label} nima pravilnega obsega.`;
  }
  return '';
}

export function validateCapstoneLinks(code: string, identityRelation: string) {
  const parsed = parseOrMessage(code);
  if (typeof parsed === 'string') return parsed;
  if (!has(parsed, `${SHEMA}Obcina`, `${RDFS}subClassOf`, `${CRP}Obcina`)) {
    return 'Razred SURS Obcina povežite kot podrazred razreda CRP Obcina.';
  }
  if (!hasSymmetric(parsed, `${CRP}Obcina_52`, `${OWL}sameAs`, `${OBCINA}kranj`)) {
    return 'Manjka povezava owl:sameAs med primerkoma Kranja v CRP in SURS.';
  }
  if (!hasSymmetric(parsed, `${CRP}Obcina_52`, `${OWL}sameAs`, `${WD}Q3441893`)) {
    return 'Manjka povezava owl:sameAs med Kranjem v CRP in Wikidata Q3441893.';
  }
  if (identityRelation !== 'same-as-instances') {
    return 'owl:sameAs povezuje URI-je istega primerka; owl:equivalentClass pa enakovredne razrede.';
  }
  return '';
}

export function capstoneGraphTurtle(progress: CapstoneProgress) {
  return [progress.tboxDraft, progress.aboxDraft, progress.linksDraft].join('\n\n');
}
