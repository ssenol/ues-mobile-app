// HTML tag'lerini temizleyip düz metin döndürür
export const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// Skor eşiklerine göre renk seçimi (0-100 ölçek, mainScore ve criteria skorları için ortak)
export const getScoreColor = (colors, score) => {
  if (score >= 70) return colors.goalGreen;
  if (score >= 50) return colors.goalOrange;
  return colors.goalRed;
};

export const getScoreBackgroundColor = (colors, score) => {
  if (score >= 70) return colors.goalBackgroundGreen;
  if (score >= 50) return colors.goalBackgroundOrange;
  return colors.goalBackgroundRed;
};

export const getScoreIcon = (score) => {
  if (score >= 70) return 'goalGreen';
  if (score >= 50) return 'goalOrange';
  return 'goalRed';
};

// pronunciation/fluency gibi acoustic kriterler ses kaydı olmadığında 0 döner — bu "başarısız" değil "ölçülemedi" demektir
export const isUnmeasuredCriterion = (criterion) => {
  return criterion?.source === 'acoustic' && !criterion?.score;
};

// acoustic kriterlerin (pronunciation/fluency) explanation'ı her zaman boş gelir;
// bu durumlarda görev tipine göre sabit kısa bir açıklama (tagline) gösterilir
const CRITERION_TAGLINES = {
  speech_on_scenario: {
    pronunciation: 'Intelligibility',
    fluency: 'Keeping the conversation going',
  },
  speech_on_topic: {
    pronunciation: 'Clarity under load',
    fluency: 'Sustaining speech and linking ideas',
  },
  read_aloud: {
    pronunciation: 'Clarity under load',
    fluency: 'Sustaining speech and linking ideas',
  },
};

export const getCriterionTagline = (subType, criterionKey) => {
  return CRITERION_TAGLINES[subType]?.[criterionKey] || null;
};

// mistake.exampleOfUsage içindeki <strong>...</strong> parçalarını ayrıştırır (kalın gösterim için)
const STRONG_SEGMENT_REGEX = /(<strong>.*?<\/strong>)/gi;

export const getExampleSegments = (text) => {
  if (!text) return [];

  return text
    .split(STRONG_SEGMENT_REGEX)
    .filter(Boolean)
    .map((segment) => {
      const isStrong = /<strong>.*<\/strong>/i.test(segment);
      return {
        text: segment.replace(/<\/?strong>/gi, ''),
        isStrong,
      };
    });
};
