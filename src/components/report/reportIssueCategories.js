// Dil kuralı hata kategorileri — renk kodları boostifywrite/src/screens/ReportWriting.tsx'ten alındı
export const CATEGORY_DEFS = [
  { id: 'all', key: 'all', label: 'All', bg: '#E7E9FF', color: '#929DFF', border: '#ABB3FF' },
  { id: 'grammar', key: 'grammar-error', label: 'Grammar', bg: '#d5d5d5', color: '#4A4A4A', border: '#808080' },
  { id: 'spelling', key: 'spelling-error', label: 'Spelling', bg: '#FFF8C4', color: '#BAAD23', border: '#DACD38' },
  { id: 'punctuation', key: 'punctuation-error', label: 'Punctuation', bg: '#DCFFD6', color: '#65C653', border: '#84E473' },
  { id: 'capitalization', key: 'capitalization-error', label: 'Capitalization', bg: '#FEEDFF', color: '#BE59C2', border: '#FDBCFF' },
  { id: 'wordchoice', key: 'word-choice-error', label: 'Word Choice', bg: '#FFF2DE', color: '#CF9842', border: '#EAC790' },
  { id: 'wordform', key: 'word-form-error', label: 'Word Form', bg: '#EFFFF3', color: '#40C862', border: '#8AF2A5' },
  { id: 'redundancy', key: 'redundancy-error', label: 'Redundancy', bg: '#FFFAEB', color: '#B89A30', border: '#E6D78C' },
  { id: 'inappropriate', key: 'inappropriate-language', label: 'Inappropriate Language', bg: '#FFE5D9', color: '#D2691E', border: '#FFCBA4' },
  { id: 'mixing', key: 'language-mixing-error', label: 'Language Mixing', bg: '#E7D9FF', color: '#A785E1', border: '#C3ABEC' },
];

export const LOGIC_DEF = { id: 'logic', key: 'logic-error', label: 'Logic', bg: '#FFE3E3', color: '#C04A4A', border: '#F2A8A8' };

export const PRONUNCIATION_DEF = { id: 'pronunciation', key: 'pronunciation-error', label: 'Pronunciation', bg: '#E7E9FF', color: '#3E4EF0', border: '#ABB3FF' };

export function catForType(type) {
  if (type === 'logic-error') return LOGIC_DEF;
  return CATEGORY_DEFS.find((c) => c.key === type) || CATEGORY_DEFS[0];
}

export function formatSubType(s) {
  if (!s) return '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Metinde hangi hataların vurgulanacağını, alttaki panonun aktif sekmesine (ve
// Language Convention'daki kategori filtresine) göre belirler — aynı anda sadece
// bir kategori vurgulanır, boostifywrite/src/screens/ReportWriting.tsx'teki
// highlightIssues mantığıyla aynı
export function getHighlightIssues(activeIssueTab, lcFilter, { pronunciationIssues = [], lcIssues = [], logicIssues = [] } = {}) {
  if (activeIssueTab === 'Pronunciation') {
    return pronunciationIssues.map((i) => ({ ...i, kind: 'pronunciation' }));
  }
  if (activeIssueTab === 'Logic') {
    return logicIssues.map((i) => ({ ...i, kind: 'error' }));
  }
  const filtered = lcFilter === 'all' ? lcIssues : lcIssues.filter((i) => i.type === lcFilter);
  return filtered.map((i) => ({ ...i, kind: 'error' }));
}
