import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Speech değerlendirme sonuçları
  evaluationResult: null,
  topicScoreResult: null,
  aiEvaluationResult: null,
  speechResults: null,

  // Quiz ve soru detayları
  assignedQuizzes: [],
  totalQuizCount: 0,
  currentQuiz: null,
  quizSettings: null,
  quizDetails: null,
  questionSubDetails: null,
  speechCards: null,

  // Durum bilgileri
  loading: false,
  error: null,
};

const speechSlice = createSlice({
  name: "speech",
  initialState,
  reducers: {
    // Görev listesi işlemleri
    setAssignedQuizzes: (state, action) => {
      if (Array.isArray(action.payload)) {
        // Eski format: doğrudan dizi
        state.assignedQuizzes = action.payload;
        state.totalQuizCount = action.payload.length;
      } else {
        // Yeni format: {quizzes, totalCount} nesnesi
        state.assignedQuizzes = action.payload.quizzes || [];
        state.totalQuizCount = action.payload.totalCount || 0;
      }
      state.error = null;
    },

    // Mevcut görev işlemleri
    setCurrentQuiz: (state, action) => {
      const { payload } = action;
      state.currentQuiz = payload;

      if (!payload?.question) {
        state.quizSettings = null;
        state.quizDetails = null;
        state.questionSubDetails = null;
        state.speechCards = null;
        return;
      }

      try {
        const { questionAnswersData, questionSubDetails } = payload.question;
        const speechCard = questionAnswersData.speechCards[0];

        // quizSettings yalnızca type_name "speaking-topic" ise atanır
        state.quizSettings =
          speechCard.type_name === "speaking-topic"
            ? {
                duration: speechCard.settings.duration,
                wordCount: speechCard.settings.wordCount,
                sentenceCount: speechCard.settings.sentenceCount,
              }
            : null;

        // quizDetails yalnızca type_name "read-aloud" ise atanır
        state.quizDetails =
          speechCard.type_name === "read-aloud"
            ? {
                eduLevelType: questionSubDetails.eduLevelType,
                speechRubricType: questionSubDetails.speechRubricType,
                cefrLevel: questionSubDetails.cefrLevel,
              }
            : null;

        state.questionSubDetails = questionSubDetails;
        state.speechCards = questionAnswersData.speechCards;
      } catch (error) {
        console.error("Görev detayları çıkarılırken hata oluştu:", error);
        state.quizSettings = null;
        state.quizDetails = null;
        state.questionSubDetails = null;
        state.speechCards = null;
      }
    },

    // Değerlendirme sonuçları işlemleri
    setSpeechResults: (state, action) => {
      state.speechResults = action.payload;
    },

    // Soru detayları işlemleri
    setQuestionDetails: (state, action) => {
      const { questionSubDetails, speechCards } = action.payload;
      state.questionSubDetails = questionSubDetails;
      state.speechCards = speechCards;
      state.error = null;
    },

    // Durum işlemleri
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Temizleme işlemi
    clearSpeechState: (state) => {
      return initialState;
    },
  },
});

export const {
  setSpeechResults,
  setAssignedQuizzes,
  setCurrentQuiz,
  setQuestionDetails,
  setLoading,
  setError,
  clearSpeechState,
} = speechSlice.actions;

// Selectors
export const selectAssignedQuizzes = (state) =>
  state.speech?.assignedQuizzes || [];
export const selectTotalQuizCount = (state) =>
  state.speech?.totalQuizCount || 0;
export const selectCurrentQuiz = (state) => state.speech?.currentQuiz;
export const selectQuizSettings = (state) => state.speech?.quizSettings;
export const selectQuizDetails = (state) => state.speech?.quizDetails;
export const selectSpeechResults = (state) => state.speech?.speechResults;
export const selectEvaluationResult = (state) => state.speech?.evaluationResult;
export const selectTopicScoreResult = (state) => state.speech?.topicScoreResult;
export const selectAiEvaluationResult = (state) =>
  state.speech?.aiEvaluationResult;
export const selectLoading = (state) => state.speech?.loading;
export const selectError = (state) => state.speech?.error;

export default speechSlice.reducer;
