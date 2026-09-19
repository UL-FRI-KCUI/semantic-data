export type LessonId =
  | 'kaj-pove-json-ld'
  | 'pomen-tsv'
  | 'tsv-v-rdf'
  | 'popravi-turtle'
  | 'formaliziraj-obcino'
  | 'povezi-vira'
  | 'sparql-nad-grafom';

export interface ExerciseDefinition {
  id: LessonId;
  number: number;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  hint: string;
  starter: string;
  solution: string;
  mode: 'schemaorg' | 'concepts' | 'turtle' | 'sparql';
  source?: {
    label: string;
    detail: string;
    content: string;
    ariaLabel: string;
    format: 'jsonld' | 'tsv';
  };
  showGraph?: boolean;
}

const prefixes = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix shema: <https://onto.mdp.gov.si/shema/> .
@prefix obcina: <https://onto.mdp.gov.si/obcina/> .`;

export const exercises: ExerciseDefinition[] = [
  {
    id: 'kaj-pove-json-ld',
    number: 1,
    title: 'Kaj pove JSON-LD?',
    eyebrow: 'JSON-LD + schema.org',
    description: 'Razložite ključne dele zapisa in na schema.org preverite razred ter tipe lastnosti.',
    href: 'semantika-na-spletu/json-ld/kaj-pove-json-ld/',
    hint: 'Na strani NewsArticle najprej poglejte hierarhijo razredov. Pri lastnostih datePublished in publisher nato preverite stolpec »Expected Type«.',
    starter: '',
    solution: `@context: določa uporabljeni besednjak in preslikavo izrazov v URI-je.
@type: opisani primerek pripada razredu NewsArticle.
Hierarhija: Thing > CreativeWork > Article > NewsArticle.
datePublished: pričakovani tip je Date ali DateTime.
publisher: pričakovani tip je Organization ali Person.`,
    mode: 'schemaorg',
    source: {
      label: 'Posnetek JSON-LD · RTV Slovenija',
      detail: 'Didaktično skrajšan zapis',
      ariaLabel: 'Skrajšan posnetek JSON-LD članka RTV Slovenija',
      format: 'jsonld',
      content: `{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "mainEntityOfPage": {
    "@type": "WebPage"
  },
  "headline": "Von der Leyen: Naša pot je jasna ...",
  "datePublished": "2026-09-16 06:53:59",
  "publisher": {
    "@type": "Organization",
    "name": "RTV Slovenija"
  }
}`,
    },
  },
  {
    id: 'pomen-tsv',
    number: 2,
    title: 'Kaj nam TSV ne pove?',
    eyebrow: 'Raven 3 ★',
    description: 'Določite tipe stolpcev in odkrijte kontekst, ki v tabeli manjka.',
    href: 'od-tabele-do-grafa/podatki/kaj-nam-tsv-ne-pove/',
    hint: 'Vrednost 001 ni število za računanje. Razmislite tudi, kje so zapisani leto, metodologija in vrsta prostorske enote.',
    starter: '',
    solution:
      'ob_id je besedilna oznaka, ker so vodilne ničle pomembne; tot_p je celo število. Manjkajo področje veljavnosti identifikatorja, vrsta entitete ter leto in metodologija meritve.',
    mode: 'concepts',
  },
  {
    id: 'tsv-v-rdf',
    number: 3,
    title: 'TSV v RDF-trojčke',
    eyebrow: 'Raven 4 ★',
    description: 'Vrstico za Ajdovščino pretvorite v štiri RDF-trojčke s polnimi URI-ji.',
    href: 'od-tabele-do-grafa/podatki/tsv-v-rdf/',
    hint: 'Vsak trojček ima obliko <subjekt> <povedek> predmet . Oznako "001" ohranite kot besedilo, število prebivalcev 19895 pa zapišite brez narekovajev.',
    starter: `# Dodajte štiri ločene trojčke: tip, oznako SURS, naziv in število prebivalcev.
# Subjekt vsakega trojčka: <https://onto.mdp.gov.si/obcina/ajdovscina>`,
    solution: `<https://onto.mdp.gov.si/obcina/ajdovscina> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://onto.mdp.gov.si/shema/Obcina> .
<https://onto.mdp.gov.si/obcina/ajdovscina> <https://onto.mdp.gov.si/shema/idObcinaSurs> "001" .
<https://onto.mdp.gov.si/obcina/ajdovscina> <https://onto.mdp.gov.si/shema/naziv> "Ajdovščina" .
<https://onto.mdp.gov.si/obcina/ajdovscina> <https://onto.mdp.gov.si/shema/steviloPrebivalcev> 19895 .`,
    mode: 'turtle',
  },
  {
    id: 'popravi-turtle',
    number: 4,
    title: 'Popravi Turtle',
    eyebrow: 'Turtle',
    description: 'Odpravite napake v predponah, ločilih, jeziku in tipu literala.',
    href: 'od-tabele-do-grafa/podatki/popravi-turtle/',
    hint: 'Vsaka predpona se konča s piko. Lastnosti istega subjekta ločimo s podpičji, zadnjo trditev pa s piko.',
    starter: `@prefix shema: <https://onto.mdp.gov.si/shema/>
@prefix obcina: <https://onto.mdp.gov.si/obcina/> .

obcina:ajdovscina a shema:Obcina,
  shema:idObcinaSurs "001"
  shema:naziv "Ajdovščina"@si ;
  shema:steviloPrebivalcev "19895" .`,
    solution: `${prefixes}

obcina:ajdovscina a shema:Obcina ;
  shema:idObcinaSurs "001" ;
  shema:naziv "Ajdovščina"@sl ;
  shema:steviloPrebivalcev "19895"^^xsd:integer .`,
    mode: 'turtle',
  },
  {
    id: 'formaliziraj-obcino',
    number: 5,
    title: 'Formaliziraj občino',
    eyebrow: 'OWL + RDFS',
    description: 'Opredelite razrede ter podatkovne in objektne lastnosti.',
    href: 'model-in-povezave/ontologije/formaliziraj-obcino/',
    hint: 'Za vsako lastnost zapišite rdf:type, rdfs:domain in rdfs:range. Pri nazivu je obseg rdf:langString, pri številu pa xsd:integer.',
    starter: `${prefixes}

shema:Obcina a owl:Class .

# Dodajte oznaki razreda, razred meritve ter tri lastnosti.`,
    solution: `${prefixes}

shema:Obcina a owl:Class ;
  rdfs:label "Občina"@sl, "Municipality"@en .

shema:MeritevPrebivalcev a owl:Class ;
  rdfs:label "Meritev prebivalcev"@sl .

shema:naziv a owl:DatatypeProperty ;
  rdfs:domain shema:Obcina ;
  rdfs:range rdf:langString .

shema:steviloPrebivalcev a owl:DatatypeProperty ;
  rdfs:domain shema:MeritevPrebivalcev ;
  rdfs:range xsd:integer .

shema:imaMeritevPrebivalcev a owl:ObjectProperty ;
  rdfs:domain shema:Obcina ;
  rdfs:range shema:MeritevPrebivalcev .`,
    mode: 'turtle',
    showGraph: true,
  },
  {
    id: 'povezi-vira',
    number: 6,
    title: 'Poveži podatkovna vira',
    eyebrow: 'Raven 5 ★',
    description: 'Povežite razred občine in štiri pare občin v virih CRP in SURS.',
    href: 'model-in-povezave/ontologije/povezi-vira/',
    hint: 'Razred SURS postavite na levo stran rdfs:subClassOf, razred CRP na desno. Pri vsakem owl:sameAs postavite primerek CRP na levo in ustrezni primerek SURS na desno.',
    starter: `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix crp: <https://pzsi.sigov.si/datamodel/ns/crp#> .
@prefix sursTBox: <https://onto.mdp.gov.si/shema/> .
@prefix sursABox: <https://onto.mdp.gov.si/obcina/> .

# Dodajte povezavo med razredoma in štiri povezave med primerki občin.`,
    solution: `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix crp: <https://pzsi.sigov.si/datamodel/ns/crp#> .
@prefix sursTBox: <https://onto.mdp.gov.si/shema/> .
@prefix sursABox: <https://onto.mdp.gov.si/obcina/> .

sursTBox:Obcina rdfs:subClassOf crp:Obcina .

crp:Obcina_1 owl:sameAs sursABox:ajdovscina .
crp:Obcina_11 owl:sameAs sursABox:celje .
crp:Obcina_61 owl:sameAs sursABox:ljubljana .
crp:Obcina_70 owl:sameAs sursABox:maribor .`,
    mode: 'turtle',
  },
  {
    id: 'sparql-nad-grafom',
    number: 7,
    title: 'SPARQL nad povezanim grafom',
    eyebrow: 'SPARQL 1.1',
    description: 'Poiščite večje občine prek povezav identitete CRP ↔ SURS.',
    href: 'poizvedovanje/sparql/sparql-nad-grafom/',
    hint: 'Vzorec naj vsebuje ?crp owl:sameAs ?obcina, filter ?prebivalci > 50000 in ORDER BY DESC(?prebivalci).',
    starter: `PREFIX surs: <https://onto.mdp.gov.si/shema/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT ?crp ?obcina ?naziv ?prebivalci WHERE {
  ?obcina a surs:Obcina ;
    surs:naziv ?naziv ;
    surs:steviloPrebivalcev ?prebivalci .

  # Povežite identiteto CRP in SURS ter dodajte filter.
}
# Dodajte padajoče razvrščanje po številu prebivalcev.`,
    solution: `PREFIX surs: <https://onto.mdp.gov.si/shema/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT ?crp ?obcina ?naziv ?prebivalci WHERE {
  ?obcina a surs:Obcina ;
    surs:naziv ?naziv ;
    surs:steviloPrebivalcev ?prebivalci .
  ?crp owl:sameAs ?obcina .
  FILTER(?prebivalci > 50000)
}
ORDER BY DESC(?prebivalci)`,
    mode: 'sparql',
  },
];

export const exerciseById = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise])) as Record<
  LessonId,
  ExerciseDefinition
>;

export const municipalitiesTsv = `ob_id\tob_ime\ttot_p
001\tAjdovščina\t19895
011\tCelje\t49628
061\tLjubljana\t300354
070\tMaribor\t114301`;

export const linkedGraphTurtle = `${prefixes}
@prefix crp: <https://pzsi.sigov.si/datamodel/ns/crp#> .

obcina:ajdovscina a shema:Obcina ; shema:naziv "Ajdovščina"@sl ; shema:steviloPrebivalcev 19895 .
obcina:celje a shema:Obcina ; shema:naziv "Celje"@sl ; shema:steviloPrebivalcev 49628 .
obcina:ljubljana a shema:Obcina ; shema:naziv "Ljubljana"@sl ; shema:steviloPrebivalcev 300354 .
obcina:maribor a shema:Obcina ; shema:naziv "Maribor"@sl ; shema:steviloPrebivalcev 114301 .

crp:Obcina_1 owl:sameAs obcina:ajdovscina .
crp:Obcina_11 owl:sameAs obcina:celje .
crp:Obcina_61 owl:sameAs obcina:ljubljana .
crp:Obcina_70 owl:sameAs obcina:maribor .`;
