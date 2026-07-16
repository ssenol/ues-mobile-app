// boostifywrite/src/screens/AnalyticsPanel.tsx'teki yardımcı fonksiyonların
// /student/get-self-analytics (type:'speaking') gerçek cevap şekline uyarlanmış hali

// scoreTrend[].subType / criteriaWeights anahtarları -> kısa/uzun görünen ad
export const SUBTYPE_SHORT_LABELS = {
  read_aloud: 'Read aloud',
  speech_on_topic: 'Topic',
  speech_on_scenario: 'Scenario',
};

export const SUBTYPE_LABELS = {
  read_aloud: 'Read Aloud',
  speech_on_topic: 'Speech on Topic',
  speech_on_scenario: 'Speech on Scenario',
};

// 2013 -> "33m 33s", 3725 -> "1h 2m"
export const formatDuration = (totalSeconds) => {
  const seconds = Math.round(totalSeconds || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${secs}s`;
};

// "grammar-error" -> "Grammar Error"
export const titleCase = (str) => (str || '')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (c) => c.toUpperCase());

// "grammar-error" -> "Grammar", "language-mixing-error" -> "Language Mixing"
export const formatErrorTypeLabel = (type) => titleCase((type || '').replace(/-error$/, ''));
