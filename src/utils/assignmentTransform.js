const TASK_PRESENTATIONS = {
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
    image: require('../../assets/images/speech-task.png'),
  },
};

export const DEFAULT_ACTIVITY_TYPES = Object.keys(TASK_PRESENTATIONS);

const DEFAULT_ASSIGNMENT_IMAGE = TASK_PRESENTATIONS.speech_on_topic.image;

const START_DATE_FALLBACK_KEYS = ['startDate', 'speechAssignedDate', 'dueDate'];

const STRIP_HTML_REGEX = /<[^>]*>/g;

const stripHtml = (html) => {
  if (!html) return '';
  return String(html).replace(STRIP_HTML_REGEX, '').replace(/\s+/g, ' ').trim();
};

const toNumberOrZero = (value) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const pickStartDate = (task) => {
  for (const key of START_DATE_FALLBACK_KEYS) {
    const candidate = task?.[key];
    if (candidate) {
      return candidate;
    }
  }
  return '';
};

const buildMetadata = (task) => {
  const metadata = [];
  const { speechTaskType } = task || {};
  const taskData = task?.task?.data;
  const taskSetting = task?.task?.setting;

  if (speechTaskType === 'speech_on_topic' && taskData?.topic) {
    if (taskData?.minSentencesCount) {
      metadata.push({ icon: 'sentences', label: `${taskData.minSentencesCount} Sentences` });
    }
    if (taskData?.minWordCount) {
      metadata.push({ icon: 'words', label: `${taskData.minWordCount} Words` });
    }
  }

  if (speechTaskType === 'read_aloud' && taskData?.readingText) {
    if (taskSetting?.cefrLevel) {
      metadata.push({ icon: 'cefr', label: taskSetting.cefrLevel });
    }
    if (taskData?.aiReadingMetaData?.subject) {
      metadata.push({ icon: 'topic', label: taskData.aiReadingMetaData.subject });
    }
  }

  return metadata;
};

const buildDescription = (task) => {
  const { speechTaskType } = task || {};
  const taskData = task?.task?.data;

  if (speechTaskType === 'speech_on_topic' && taskData?.topic) {
    return taskData.topic;
  }

  if (speechTaskType === 'read_aloud' && taskData?.readingText) {
    return stripHtml(taskData.readingText);
  }

  if (speechTaskType === 'speech_on_scenario' && taskData?.scenarioTitle) {
    return taskData.scenarioTitle;
  }

  return '';
};

export const transformTaskToAssignment = (task) => {
  if (!task) return null;

  const presentation = TASK_PRESENTATIONS[task.speechTaskType] || {
    type: 'assignment',
    title: task?.task?.title || 'Assignment',
    image: DEFAULT_ASSIGNMENT_IMAGE,
  };

  const startDate = pickStartDate(task);

  return {
    id: task.assignedTaskId || task.speechTaskId || task.id || `${task.speechTaskType || 'task'}-${task.taskId || 'unknown'}`,
    type: presentation.type,
    title: presentation.title,
    description: buildDescription(task),
    image: presentation.image || DEFAULT_ASSIGNMENT_IMAGE,
    metadata: buildMetadata(task),
    date: formatDate(startDate),
    startDate,
    isSolved: task?.prevSolvedTask?.totalSolvedTaskCount > 0,
    assignedTaskId: task?.assignedTaskId ?? null,
    speechTaskId: task?.speechTaskId ?? null,
    originalTask: task,
  };
};

export const parseAssignedTasksResponse = (response) => {
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

export const buildAssignedSpeechTaskParams = (user, overrides = {}) => {
  if (!user) {
    return { params: null, missingFields: ['user'] };
  }

  const userId = user?.id ?? user?._id ?? user?.userId ?? null;
  const institutionId = user?.institution_id ?? user?.institutionId ?? user?.schoolId ?? null;
  const institutionSubSchoolId = user?.sub_school_id ?? user?.institutionSubSchoolId ?? user?.campusId ?? null;
  const className = user?.classInfo?.[0] ?? user?.class_name ?? user?.className ?? '';

  const missingFields = [];

  if (!userId) missingFields.push('userId');
  if (!institutionId) missingFields.push('institutionId');
  if (!institutionSubSchoolId) missingFields.push('institutionSubSchoolId');

  if (missingFields.length > 0) {
    return { params: null, missingFields };
  }

  const params = {
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
