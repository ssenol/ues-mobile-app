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
      state.quizSettings = null;
      return;
    },

    // Değerlendirme sonuçları işlemleri
    setSpeechResults: (state, action) => {
      state.speechResults = action.payload;
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
  // setSpeechResults,
  // setAssignedQuizzes,
  setCurrentQuiz,
  // setLoading,
  // setError,
  // clearSpeechState,
} = speechSlice.actions;

// Selectors
// export const selectAssignedQuizzes = (state) => state.speech?.assignedQuizzes || [];
// export const selectTotalQuizCount = (state) => state.speech?.totalQuizCount || 0;
// export const selectCurrentQuiz = (state) => state.speech?.currentQuiz;
// export const selectQuizSettings = (state) => state.speech?.quizSettings;
// export const selectSpeechResults = (state) => state.speech?.speechResults;
// export const selectEvaluationResult = (state) => state.speech?.evaluationResult;
// export const selectTopicScoreResult = (state) => state.speech?.topicScoreResult;
// export const selectAiEvaluationResult = (state) => state.speech?.aiEvaluationResult;
// export const selectLoading = (state) => state.speech?.loading;
// export const selectError = (state) => state.speech?.error;

export default speechSlice.reducer;
