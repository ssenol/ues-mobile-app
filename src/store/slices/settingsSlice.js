import { createSlice } from "@reduxjs/toolkit";

const SPEED_MAP = ['slow', 'natural', 'fast'];

const initialState = {
  ttsSpeed: 'natural', // slow | natural | fast
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTtsSpeed: (state, action) => {
      state.ttsSpeed = action.payload;
    },
  },
});

export const { setTtsSpeed } = settingsSlice.actions;

// Selectors
export const selectTtsSpeed = (state) => state.settings.ttsSpeed;

// Slider index (0,1,2) → string dönüşüm yardımcıları
export const speedIndexToValue = (index) => SPEED_MAP[index] || 'natural';
export const speedValueToIndex = (value) => {
  const idx = SPEED_MAP.indexOf(value);
  return idx >= 0 ? idx : 1;
};

export default settingsSlice.reducer;
