import { create } from 'zustand';

export const PAPER_COLORS = {
  default: '#f8f2e6',
  sepia: '#f4ead5',
  green: '#e8f0e0',
  kraft: '#d4c4a8',
  dark: '#1e1a14',
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
