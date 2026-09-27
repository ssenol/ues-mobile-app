import type { ImageSourcePropType } from 'react-native';
import { getOptimizedImageUrl } from './helpers';
import type { AuthUser } from '../types/api';
import type {
  Assignment,
  AssignmentMetadataItem,
  AssignmentType,
  RawSpeechTask,
  SpeechTaskType,
} from '../types/assignment';

interface TaskPresentation {
  type: AssignmentType;
  title?: string;
  image?: ImageSourcePropType;
}

const TASK_PRESENTATIONS: Record<SpeechTaskType, TaskPresentation> = {
  speech_on_topic: {
    type: 'speechOnTopic',
    title: 'Speech On Topic',
    image: require('../../assets/images/speech-task.png'),
  },
  read_aloud: {
    type: 'readAloud',
    title: 'Read Aloud',
    image: require('../../assets/images/read-aloud.png'),
  },
  speech_on_scenario: {
    type: 'speechOnScenario',
    title: 'Speech On Scenario',
  },
};

export const DEFAULT_ACTIVITY_TYPES = Object.keys(TASK_PRESENTATIONS) as SpeechTaskType[];

const DEFAULT_ASSIGNMENT_IMAGE = TASK_PRESENTATIONS.speech_on_topic.image!;

const START_DATE_FALLBACK_KEYS = ['startDate', 'speechAssignedDate', 'dueDate'] as const;

const stripHtml = (html: unknown): string => {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const toNumberOrZero = (value: unknown): number => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const pickStartDate = (task: RawSpeechTask): string => {
  for (const key of START_DATE_FALLBACK_KEYS) {
    const candidate = task?.[key];
    if (candidate) {
      return candidate;
    }
  }
  return '';
};

const buildMetadata = (task: RawSpeechTask): AssignmentMetadataItem[] => {
  const metadata: AssignmentMetadataItem[] = [];
  const { speechTaskType } = task || {};
  const taskData = task?.task?.data;
  const taskSetting = task?.task?.setting;

  if (speechTaskType === 'speech_on_topic') {
    if (taskData?.minSentencesCount) {
      metadata.push({ icon: 'sentences', label: `${taskData.minSentencesCount} Sentences` });
    }
    if (taskData?.minWordCount) {
      metadata.push({ icon: 'words', label: `${taskData.minWordCount} Words` });
    }
  }

  if (speechTaskType === 'read_aloud') {
    if (taskSetting?.cefrLevel) {
      metadata.push({ icon: 'cefr', label: taskSetting.cefrLevel });
    }
  }

  if (speechTaskType === 'speech_on_scenario') {
    if (taskSetting?.cefrLevel) {
      metadata.push({ icon: 'cefr', label: taskSetting.cefrLevel });
    }
  }

  return metadata;
};

const buildDescription = (task: RawSpeechTask): string => {
  const { speechTaskType } = task || {};
  const taskData = task?.task?.data;
  const taskSetting = task?.task?.setting;

  if (speechTaskType === 'speech_on_topic' && taskData?.topic) {
    return taskData.topic;
  }

  if (speechTaskType === 'read_aloud' && taskData?.readingText) {
    return stripHtml(taskData.readingText);
  }

  if (speechTaskType === 'speech_on_scenario' && taskSetting?.selectedConcept) {
    return taskSetting.selectedConcept.concept.scenario;
  }

  return '';
};

export const transformTaskToAssignment = (task: RawSpeechTask | null | undefined): Assignment | null => {
  if (!task) return null;

  const presentation: TaskPresentation = TASK_PRESENTATIONS[task.speechTaskType as SpeechTaskType] || {
    type: 'assignment',
    // title: task?.task?.title || 'Assignment',
    image: DEFAULT_ASSIGNMENT_IMAGE,
  };

  const startDate = pickStartDate(task);

  return {
    id: task.assignedTaskId || task.speechTaskId || task.id || `${task.speechTaskType || 'task'}-${task.taskId || 'unknown'}`,
    type: presentation.type,
    title: stripHtml(task.speechName), //presentation.title,
    description: buildDescription(task),
    image: task?.task?.data?.coverImage
        ? { uri: getOptimizedImageUrl(task.task.data.coverImage) }
        : presentation.image,
    metadata: buildMetadata(task),
    date: formatDate(startDate),
    startDate,
    dueDate: task.dueDate || '',
    isSolved: (task?.prevSolvedTask?.totalSolvedTaskCount ?? 0) > 0,
    assignedTaskId: task?.assignedTaskId ?? null,
    speechTaskId: task?.speechTaskId ?? null,
    originalTask: task,
  };
};

// get-assigned-speech-tasks yanıtının bu fonksiyonun okuduğu alanları
interface AssignedTasksPayload {
  assigned_tasks?: RawSpeechTask[];
  assigned_all_task_count?: number | string;
  assigned_tasks_active_total_count?: number | string;
}

export interface AssignedTasksResponse extends AssignedTasksPayload {
  success?: boolean;
  status_code?: number;
  data?: AssignedTasksPayload;
}

export interface ParsedAssignedTasks {
  success: boolean;
  tasks: RawSpeechTask[];
  totals: {
    totalAssigned: number;
    activeAssignments: number;
    completedAssignments: number;
  };
}

// Tarih string'ini zamana çevirir; boş veya geçersizse null
const toTime = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

// Önbellekten gelen eski kart objelerinde dueDate alanı yok; o durumda ham görevdeki değer kullanılır
const getDueTime = (assignment: Assignment) =>
  toTime(assignment.dueDate || assignment.originalTask?.dueDate);

// Görev sıralaması: teslim tarihi en yakın olan önce; teslim tarihi olmayanlar sonda,
// kendi aralarında başlangıç tarihi en yeni olan önce
export const compareAssignmentsByDueDate = (a: Assignment, b: Assignment): number => {
  const dueA = getDueTime(a);
  const dueB = getDueTime(b);

  if (dueA !== null && dueB !== null) return dueA - dueB;
  if (dueA !== null) return -1;
  if (dueB !== null) return 1;

  return (toTime(b.startDate) ?? 0) - (toTime(a.startDate) ?? 0);
};

export const parseAssignedTasksResponse = (
  response: AssignedTasksResponse | null | undefined
): ParsedAssignedTasks => {
  const data = response?.data ?? response;
  const success = response?.success === true || response?.status_code === 200;

  const tasksFromData = Array.isArray(data?.assigned_tasks) ? data.assigned_tasks : [];
  const tasksFromRoot = Array.isArray(response?.assigned_tasks) ? response.assigned_tasks : [];
  const tasks = tasksFromData.length > 0 ? tasksFromData : tasksFromRoot;

  const totalAssigned = toNumberOrZero(data?.assigned_all_task_count);
  const activeAssignments = toNumberOrZero(data?.assigned_tasks_active_total_count);
  const completedAssignments = Math.max(totalAssigned - activeAssignments, 0);

  return {
    success,
    tasks,
    totals: {
      totalAssigned,
      activeAssignments,
      completedAssignments,
    },
  };
};

export interface AssignedSpeechTaskParams {
  userId: unknown;
  institutionId: unknown;
  institutionSubSchoolId: unknown;
  className: unknown;
  activityType: SpeechTaskType[];
  perPageCount: number;
  paginationIndex: number;
  [key: string]: unknown;
}

export const buildAssignedSpeechTaskParams = (
  user: AuthUser | null | undefined,
  overrides: Record<string, unknown> = {}
): { params: AssignedSpeechTaskParams | null; missingFields: string[] } => {
  if (!user) {
    return { params: null, missingFields: ['user'] };
  }

  const userId = user?.id ?? user?._id ?? user?.userId ?? null;
  const institutionId = user?.institution_id ?? user?.institutionId ?? user?.schoolId ?? null;
  const institutionSubSchoolId = user?.sub_school_id ?? user?.institutionSubSchoolId ?? user?.campusId ?? null;
  const className = user?.classInfo?.[0] ?? user?.class_name ?? user?.className ?? '';

  const missingFields: string[] = [];

  if (!userId) missingFields.push('userId');
  if (!institutionId) missingFields.push('institutionId');
  if (!institutionSubSchoolId) missingFields.push('institutionSubSchoolId');

  if (missingFields.length > 0) {
    return { params: null, missingFields };
  }

  const params: AssignedSpeechTaskParams = {
    userId,
    institutionId,
    institutionSubSchoolId,
    className,
    activityType: DEFAULT_ACTIVITY_TYPES,
    perPageCount: 100,
    paginationIndex: 1,
    ...overrides,
  };

  return { params, missingFields: [] };
};
