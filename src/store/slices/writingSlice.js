import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  assignedQuizzes: [],
  currentQuiz: null,
  totalCount: 0,
  page: 1,
  perPage: 20,
};

const writingSlice = createSlice({
  name: "writing",
  initialState,
  reducers: {
    setAssignedWritingQuizzes(state, action) {
      state.assignedQuizzes = action.payload;
    },
    setCurrentWritingQuiz(state, action) {
      state.currentQuiz = action.payload;
    },
    setWritingTotalCount(state, action) {
      state.totalCount = action.payload;
    },
    setWritingPage(state, action) {
      state.page = action.payload;
    },
    setWritingPerPage(state, action) {
      state.perPage = action.payload;
    },
    resetWritingState(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setAssignedWritingQuizzes,
  setCurrentWritingQuiz,
  setWritingTotalCount,
  setWritingPage,
  setWritingPerPage,
  resetWritingState,
} = writingSlice.actions;

export default writingSlice.reducer;
