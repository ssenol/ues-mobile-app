// /student/get-self-analytics (type: 'speaking') yanıtının uygulamanın okuduğu kısmı

export interface SpeakingKpis {
  submissions: number;
  avgScore: number;
  bestScore: number;
  totalMistakes: number;
  totalSeconds: number;
}

export interface ScoreTrendPoint {
  score: number;
  subType?: string;
}

export interface SubTypeBreakdownItem {
  subType: string;
  count: number;
  avgScore: number;
}

export interface CriterionAverage {
  key: string;
  label: string;
  avgScore: number;
}

export interface ErrorBreakdownItem {
  type: string;
  count: number;
}

export interface VoiceErrorWord {
  word: string;
  count: number;
  avgAccuracy: number;
}

export interface SpeakingAnalytics {
  kpis?: SpeakingKpis;
  voiceProfile?: Record<string, number>;
  scoreTrend?: ScoreTrendPoint[];
  subTypeBreakdown?: SubTypeBreakdownItem[];
  criteria?: CriterionAverage[];
  // alt tip (read_aloud vb.) -> kriter anahtarı -> ağırlık yüzdesi
  criteriaWeights?: Record<string, Record<string, number>>;
  errorBreakdown?: ErrorBreakdownItem[];
  voiceErrorTotal?: number;
  voiceErrorWords?: VoiceErrorWord[];
}

export interface SelfAnalyticsResponseData {
  speaking?: SpeakingAnalytics | null;
}
