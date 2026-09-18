export interface ConceptAnswers {
  idType: string;
  populationType: string;
  identifierScope: boolean;
  entityKind: boolean;
  measurementContext: boolean;
}

export const emptyConceptAnswers: ConceptAnswers = {
  idType: '',
  populationType: '',
  identifierScope: false,
  entityKind: false,
  measurementContext: false,
};

export function validateConceptAnswers(answers: ConceptAnswers) {
  if (answers.idType !== 'string') return 'Stolpec ob_id obravnavajte kot besedilo: vodilne ničle so del identifikatorja.';
  if (answers.populationType !== 'integer') return 'tot_p je celo število, namenjeno primerjavam in računanju.';
  if (!answers.identifierScope) return 'Označite, da tabela ne pove področja veljavnosti identifikatorja ob_id.';
  if (!answers.entityKind) return 'Označite, da iz imena ni razvidno, ali gre za občino, naselje ali drugo enoto.';
  if (!answers.measurementContext) return 'Označite, da manjkata leto in metodologija meritve tot_p.';
  return '';
}
