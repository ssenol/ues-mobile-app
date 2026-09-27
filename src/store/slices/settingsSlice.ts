import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

const SPEED_MAP = ['slow', 'natural', 'fast'] as const;

export type TtsSpeed = typeof SPEED_MAP[number];

export interface SettingsState {
  ttsSpeed: TtsSpeed;
}

const initialState: SettingsState = {
  ttsSpeed: 'natural', // slow | natural | fast
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTtsSpeed: (state, action: PayloadAction<TtsSpeed>) => {
      state.ttsSpeed = action.payload;
    },
  },
});

export const { setTtsSpeed } = settingsSlice.actions;

// Selectors
export const selectTtsSpeed = (state: RootState) => state.settings.ttsSpeed;

// Slider index (0,1,2) → string dönüşüm yardımcıları
export const speedIndexToValue = (index: number): TtsSpeed => SPEED_MAP[index] || 'natural';
export const speedValueToIndex = (value: TtsSpeed): number => {
  const idx = SPEED_MAP.indexOf(value);
  return idx >= 0 ? idx : 1;
};

export default settingsSlice.reducer;
