import api from "../config/api";

const WRITING_TASKS_URL = "https://test-dot-uesquizmaker-api.ey.r.appspot.com/api/v0.0.1/quiz/get-writing-quizzes-to-mobile-app";

const fetchWritingTasks = async (params, accessToken) => {
  const response = await api.post(
    WRITING_TASKS_URL,
    params,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data?.data;
};

export default {
  fetchWritingTasks,
};
