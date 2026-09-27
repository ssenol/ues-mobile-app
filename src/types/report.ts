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
  // Senaryo raporunda hatanın ait olduğu mesajın sırası (ScenarioReportScreen ekler)
  __messageIndex?: number;
  [key: string]: unknown;
}

// Metin üzerinde vurgulanan, türüne göre normalize edilmiş hata (getHighlightIssues çıktısı).
// Kopya obje olduğu için listedeki asıl hatayı bulmak `source` referansıyla yapılır.
export type AnnotatedIssue =
  | (ReportMistake & { kind: 'error'; source: ReportMistake })
  | (VoiceError & { kind: 'pronunciation'; source: VoiceError });

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

// Read Aloud / Speech on Topic değerlendirmesi (reportData.result[0].result)
export interface SpeechResultDetail {
  criteria?: ReportCriterion[];
  feedback?: ReportFeedback;
  mistakes?: ReportMistake[];
  voiceErrors?: VoiceError[];
  transcription?: string;
  voiceResult?: VoiceResult & {
    prosody?: number;
    pronunciation?: number;
    fluency?: number;
  };
  durationAsSeconds?: number;
  scoreBreakdown?: ScoreBreakdown;
  [key: string]: unknown;
}

// Speech on Scenario sohbet mesajı
export interface ScenarioMessage {
  role: 'user' | 'assistant' | string;
  content?: string;
  // Eski kayıtlarda hazır HTML düzeltme
  correction?: string;
  speechScore?: { voiceErrors?: VoiceError[]; [key: string]: unknown };
  [key: string]: unknown;
}

// reportData.result[0]: görev tipine göre alanların yeri değişir
export interface ReportResult {
  status?: string;
  // Read Aloud / Speech on Topic
  result?: SpeechResultDetail;
  durationAsSeconds?: number;
  audioUrl?: string;
  // Speech on Scenario
  criteria?: ReportCriterion[];
  feedback?: ReportFeedback;
  mistakes?: ReportMistake[];
  messages?: ScenarioMessage[];
  scoreBreakdown?: ScoreBreakdown;
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
