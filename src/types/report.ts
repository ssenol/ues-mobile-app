// /student/get-solved-exercise-detail yanıtının rapor ekranlarının okuduğu kısmı.
// Görev tipine göre (read_aloud / speech_on_topic / speech_on_scenario) alanların yeri değiştiği için
// ekranlar bu veriden kriter/feedback/hata listelerini ReportScreenShell'e adapter fonksiyonlarıyla verir.

// Dil/mantık hatası (grammar, word choice, logic-error vb.)
export interface ReportMistake {
  type?: string;
  subType?: string;
  wrongWord?: string;
  wrongContent?: string;
  correctWord?: string;
  correctedContent?: string;
  detailFeedbackWithReason?: string;
  exampleOfUsage?: string;
  errorIndex?: number;
  [key: string]: unknown;
}

// Telaffuz hatası (ses kaydındaki kelime ve zaman aralığı)
export interface VoiceError {
  word?: string;
  accuracy?: number;
  reason?: string;
  startTime?: number;
  endTime?: number;
  [key: string]: unknown;
}

// Metin üzerinde vurgulanan, türüne göre normalize edilmiş hata (getHighlightIssues çıktısı)
export type AnnotatedIssue =
  | (ReportMistake & { kind: 'error' })
  | (VoiceError & { kind: 'pronunciation' });

export interface ReportCriterion {
  key: string;
  name?: string;
  score?: number;
  weight?: number;
  explanation?: string;
  source?: string;
  achievements?: string[];
  issues?: string[];
  summary?: string;
  [key: string]: unknown;
}

export interface ScoreBreakdown {
  completeness?: number;
  completenessApplies?: boolean;
  maxAchievable?: number;
  weightedScore?: number;
  finalScore?: number;
  criteria?: ReportCriterion[];
  [key: string]: unknown;
}

export interface CompletenessInfo {
  label?: string;
  note?: string;
}

export interface FeedbackPoint {
  label?: string;
  detail?: string;
  criterion?: string;
  issue?: string;
  before?: string;
  after?: string;
  tip?: string;
}

export interface ReportFeedback {
  topBread?: { points?: FeedbackPoint[] };
  filling?: { points?: FeedbackPoint[] };
  bottomBread?: { summary?: string; nextSteps?: string[] };
}

export interface VoiceResult {
  completeness?: number;
  accuracy?: number;
  [key: string]: unknown;
}

// reportData.result[0]
export interface ReportResult {
  status?: string;
  [key: string]: unknown;
}

export interface ReportData {
  result?: ReportResult[];
  mainScore?: number;
  cefrLevel?: string;
  solvedDate?: string;
  createdAt?: string;
  taskName?: string;
  subType?: string;
  studentInfo?: { className?: string; studentName?: string };
  [key: string]: unknown;
}
