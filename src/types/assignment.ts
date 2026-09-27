import type { ImageSourcePropType } from 'react-native';

export type SpeechTaskType = 'speech_on_topic' | 'read_aloud' | 'speech_on_scenario';

export type AssignmentType = 'speechOnTopic' | 'readAloud' | 'speechOnScenario' | 'assignment';

// Backend'in get-assigned-speech-tasks yanıtındaki tek görev (yalnızca uygulamanın okuduğu alanlar)
export interface RawSpeechTask {
  id?: string;
  taskId?: string;
  assignedTaskId?: string;
  speechTaskId?: string;
  speechTaskType?: SpeechTaskType | string;
  speechName?: string;
  startDate?: string;
  speechAssignedDate?: string;
  dueDate?: string;
  assignmentRepeatCount?: number;
  task?: {
    speechTaskType?: SpeechTaskType | string;
    data?: {
      coverImage?: string;
      minSentencesCount?: number;
      minWordCount?: number;
      topic?: string;
      readingText?: string;
      // Speech on Topic süre aralığı (saniye), ör. "30-50"
      duration?: string;
      aiReadingMetaData?: { subject?: string; [key: string]: unknown };
      [key: string]: unknown;
    };
    setting?: {
      cefrLevel?: string;
      taskName?: string;
      // Speech on Scenario sohbet ayarları
      dialogLanguage?: string;
      userNativeLanguage?: string;
      conversationLevel?: string;
      username?: string;
      selectedConcept?: {
        concept: { scenario: string; concept?: string; title?: string; [key: string]: unknown };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  prevSolvedTask?: {
    totalSolvedTaskCount?: number;
    // Çözülmüş görevin rapor kayıtları; ilk elemanın id'si rapor ekranına reportId olarak gider
    results?: { id?: string; [key: string]: unknown }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AssignmentMetadataItem {
  icon: 'sentences' | 'words' | 'cefr';
  label: string;
}

// Kart ve listelerde kullanılan, transformTaskToAssignment ile üretilen görev
export interface Assignment {
  id: string;
  type: AssignmentType;
  title: string;
  description: string;
  // speech_on_scenario görevlerinde kapak resmi yoksa undefined kalır
  image?: ImageSourcePropType;
  metadata: AssignmentMetadataItem[];
  date: string;
  startDate: string;
  // Teslim tarihi (ham ISO string); yoksa ''
  dueDate: string;
  isSolved: boolean;
  assignedTaskId: string | null;
  speechTaskId: string | null;
  originalTask: RawSpeechTask;
}

// Completed ekranındaki çözülmüş görev kartı (CompletedScreen'de API yanıtından üretilir)
// get-student-completed-exercises yanıtındaki tek egzersiz
export interface CompletedExercise {
  assignedTaskId?: string;
  subTaskType?: SpeechTaskType | string;
  taskName?: string;
  attempts: {
    completionDate?: string;
    mainScore?: number;
    solvedTaskId?: string;
    status?: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export interface CompletedExercisesResponseData {
  exercises?: CompletedExercise[];
  nextCursor?: string | null;
}

export interface CompletedAssignment {
  id?: string;
  solvedTaskId?: string | null;
  rawCompletionDate?: string;
  status?: 'pending' | string;
  title: string;
  type: string;
  score: number;
  completionDate: string;
}
