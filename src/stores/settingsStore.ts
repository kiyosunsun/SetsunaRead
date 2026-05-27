import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const PAPER_COLORS = {
  default: '#f8f2e6',
  sepia: '#f4ead5',
  green: '#e8f0e0',
  kraft: '#d4c4a8',
  dark: '#1e1a14',
} as const;

export type PaperBackground = keyof typeof PAPER_COLORS;

export type FlipAnimation = 'fade' | 'slide' | 'flip';

/** 可选字体列表 */
export const FONT_OPTIONS = [
  { value: '"Noto Serif SC", serif', label: '思源宋体', category: 'serif' },
  { value: '"Noto Sans SC", sans-serif', label: '思源黑体', category: 'sans-serif' },
  { value: 'serif', label: '系统宋体', category: 'serif' },
  { value: 'sans-serif', label: '系统黑体', category: 'sans-serif' },
  { value: 'monospace', label: '等宽字体', category: 'monospace' },
] as const;

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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'setsuna-settings-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        paperBackground: state.paperBackground,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        lineHeight: state.lineHeight,
        nightMode: state.nightMode,
        flipAnimation: state.flipAnimation,
      }),
    },
  ),
);
