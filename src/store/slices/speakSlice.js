import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Speech değerlendirme sonuçları
  evaluationResult: null,
  topicScoreResult: null,
  aiEvaluationResult: null,
  speakResults: null,

  // Assignment ve soru detayları
  assignedAssignments: [],
  totalAssignmentCount: 0,
  currentAssignment: null,
  assignmentSettings: null,

  // Durum bilgileri
  loading: false,
  error: null,
};

const speakSlice = createSlice({
  name: "speak",
  initialState,
  reducers: {
    // Görev listesi işlemleri
    setAssignedAssignments: (state, action) => {
      if (Array.isArray(action.payload)) {
        // Eski format: doğrudan dizi
        state.assignedAssignments = action.payload;
        state.totalAssignmentCount = action.payload.length;
      } else {
        // Yeni format: {assignments, totalCount} nesnesi
        state.assignedAssignments = action.payload.assignments || [];
        state.totalAssignmentCount = action.payload.totalCount || 0;
      }
      state.error = null;
    },

    // Mevcut görev işlemleri
    setCurrentAssignment: (state, action) => {
      const { payload } = action;
      state.currentAssignment = payload;
      state.assignmentSettings = null;
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
  setSpeechResults,
  setAssignedAssignments,
  setCurrentAssignment,
  setLoading,
  setError,
  clearSpeechState,
} = speakSlice.actions;

// Selectors
// export const selectAssignedAssignments = (state) => state.speak?.assignedAssignments || [];
// export const selectTotalAssignmentCount = (state) => state.speak?.totalAssignmentCount || 0;
// export const selectCurrentAssignment = (state) => state.speak?.currentAssignment;
// export const selectAssignmentSettings = (state) => state.speak?.assignmentSettings;
// export const selectSpeechResults = (state) => state.speak?.speakResults;
// export const selectEvaluationResult = (state) => state.speak?.evaluationResult;
// export const selectTopicScoreResult = (state) => state.speak?.topicScoreResult;
// export const selectAiEvaluationResult = (state) => state.speak?.aiEvaluationResult;
// export const selectLoading = (state) => state.speak?.loading;
// export const selectError = (state) => state.speak?.error;

export default speakSlice.reducer;
