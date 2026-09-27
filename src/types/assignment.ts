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
  task?: {
    speechTaskType?: SpeechTaskType | string;
    data?: {
      coverImage?: string;
      minSentencesCount?: number;
      minWordCount?: number;
      topic?: string;
      readingText?: string;
      [key: string]: unknown;
    };
    setting?: {
      cefrLevel?: string;
      taskName?: string;
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
  isSolved: boolean;
  assignedTaskId: string | null;
  speechTaskId: string | null;
  originalTask: RawSpeechTask;
}

// Completed ekranındaki çözülmüş görev kartı (CompletedScreen'de API yanıtından üretilir)
export interface CompletedAssignment {
  id?: string;
  solvedTaskId?: string;
  status?: 'pending' | string;
  title: string;
  type: string;
  score: number;
  completionDate: string;
}
