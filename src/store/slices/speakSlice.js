import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Speech değerlendirme sonuçları
  evaluationResult: null,
  topicScoreResult: null,
  aiEvaluationResult: null,
  speakResults: null,

  // Quiz ve soru detayları
  assignedQuizzes: [],
  totalQuizCount: 0,
  currentQuiz: null,
  quizSettings: null,

  // Durum bilgileri
  loading: false,
  error: null,
};

const speakSlice = createSlice({
  name: "speak",
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
      state.speakResults = action.payload;
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
} = speakSlice.actions;

// Selectors
// export const selectAssignedQuizzes = (state) => state.speak?.assignedQuizzes || [];
// export const selectTotalQuizCount = (state) => state.speak?.totalQuizCount || 0;
// export const selectCurrentQuiz = (state) => state.speak?.currentQuiz;
// export const selectQuizSettings = (state) => state.speak?.quizSettings;
// export const selectSpeechResults = (state) => state.speak?.speakResults;
// export const selectEvaluationResult = (state) => state.speak?.evaluationResult;
// export const selectTopicScoreResult = (state) => state.speak?.topicScoreResult;
// export const selectAiEvaluationResult = (state) => state.speak?.aiEvaluationResult;
// export const selectLoading = (state) => state.speak?.loading;
// export const selectError = (state) => state.speak?.error;

export default speakSlice.reducer;
