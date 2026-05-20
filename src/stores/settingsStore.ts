import { create } from 'zustand';

export const PAPER_COLORS = {
  default: '#f5f1eb',
  sepia: '#f4ecd8',
  green: '#c8e6c9',
  pink: '#f8bbd0',
  blue: '#bbdefb',
  dark: '#263238',
} as const;

export type PaperBackground = keyof typeof PAPER_COLORS;

export type FlipAnimation = 'fade' | 'slide' | 'flip';

interface SettingsState {
  paperBackground: PaperBackground;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  nightMode: boolean;
  flipAnimation: FlipAnimation;

  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => void;
  toggleNightMode: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  paperBackground: 'default',
  fontSize: 18,
  fontFamily: 'serif',
  lineHeight: 1.8,
  nightMode: false,
  flipAnimation: 'flip',

  updateSetting: (key, value) => {
    set({ [key]: value });
  },

  toggleNightMode: () => {
    set((state) => ({ nightMode: !state.nightMode }));
  },
}));
