import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Assignment } from "../../types/assignment";
import type { RootState } from "../index";

// Cache süresi (milisaniye cinsinden)
export const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 saat

export interface AssignmentState {
  cachedAssignments: Assignment[];
  cacheTimestamp: number | null;
  totalAssignments: number;
  completedAssignments: number;
  loading: boolean;
  error: unknown;
}

export interface SetCachedAssignmentsPayload {
  assignments?: Assignment[] | null;
  totalAssignments?: number;
  completedAssignments?: number;
}

const initialState: AssignmentState = {
  // Cache edilen assignment verileri
  cachedAssignments: [],
  
  // Cache timestamp'i - data ne zaman çekildi
  cacheTimestamp: null,
  
  // İstatistikler
  totalAssignments: 0,
  completedAssignments: 0,
  
  // Durum
  loading: false,
  error: null,
};

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    // Cache'i güncelle
    setCachedAssignments: (state, action: PayloadAction<SetCachedAssignmentsPayload>) => {
      const { assignments, totalAssignments, completedAssignments } = action.payload;
      // Deep copy ile array'i kaydet - mutation hatasını önlemek için
      state.cachedAssignments = assignments ? JSON.parse(JSON.stringify(assignments)) : [];
      state.totalAssignments = totalAssignments || 0;
      state.completedAssignments = completedAssignments || 0;
      state.cacheTimestamp = Date.now();
      state.error = null;
    },

    // Cache'i temizle
    clearCache: (state) => {
      state.cachedAssignments = [];
      state.cacheTimestamp = null;
      state.totalAssignments = 0;
      state.completedAssignments = 0;
    },

    // Loading durumu
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Error durumu
    setError: (state, action: PayloadAction<unknown>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Tüm state'i temizle (logout için)
    clearAssignmentState: () => {
      return initialState;
    },
  },
});

export const {
  setCachedAssignments,
  clearCache,
  setLoading,
  setError,
  clearAssignmentState,
} = assignmentSlice.actions;

// Selectors
export const selectCachedAssignments = (state: RootState): Assignment[] => {
  const cached = state.assignment?.cachedAssignments || [];
  // Deep copy ile döndür - mutation hatasını önlemek için
  return cached.length > 0 ? JSON.parse(JSON.stringify(cached)) : [];
};
export const selectCacheTimestamp = (state: RootState) => state.assignment?.cacheTimestamp;
export const selectTotalAssignments = (state: RootState) => state.assignment?.totalAssignments || 0;
export const selectCompletedAssignments = (state: RootState) => state.assignment?.completedAssignments || 0;
export const selectAssignmentLoading = (state: RootState) => state.assignment?.loading || false;
export const selectAssignmentError = (state: RootState) => state.assignment?.error;

// Cache geçerli mi kontrol et
export const selectIsCacheValid = (state: RootState, cacheDuration: number = CACHE_DURATION_MS): boolean => {
  const timestamp = selectCacheTimestamp(state);
  if (!timestamp) return false;
  
  const now = Date.now();
  const elapsed = now - timestamp;
  return elapsed < cacheDuration;
};

export default assignmentSlice.reducer;
