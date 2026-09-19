export interface SchemaOrgAnswers {
  contextMeaning: string;
  typeMeaning: string;
  hierarchy: string;
  datePublishedType: string;
  publisherType: string;
}

export const emptySchemaOrgAnswers: SchemaOrgAnswers = {
  contextMeaning: '',
  typeMeaning: '',
  hierarchy: '',
  datePublishedType: '',
  publisherType: '',
};

export function validateSchemaOrgAnswers(answers: SchemaOrgAnswers) {
  if (answers.contextMeaning !== 'vocabulary') {
    return '@context določa uporabljeni besednjak in preslikavo kratkih izrazov v njihove polne URI-je.';
  }
  if (answers.typeMeaning !== 'instance-class') {
    return '@type pove, kateremu razredu pripada opisani primerek. V tem zapisu je to NewsArticle.';
  }
  if (answers.hierarchy !== 'thing-creativework-article-newsarticle') {
    return 'Na strani NewsArticle sledite hierarhiji od splošnega razreda Thing do razreda NewsArticle.';
  }
  if (answers.datePublishedType !== 'date-datetime') {
    return 'Lastnost datePublished po schema.org pričakuje vrednost tipa Date ali DateTime.';
  }
  if (answers.publisherType !== 'organization-person') {
    return 'Lastnost publisher po schema.org pričakuje Organization ali Person.';
  }
  return '';
}
