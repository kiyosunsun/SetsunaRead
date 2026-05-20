import React from 'react';
import { useSettingsStore, PAPER_COLORS, type PaperBackground, type FlipAnimation } from '../../stores/settingsStore';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   Settings Panel Props
   --------------------------------------------------------------------------- */
interface SettingsPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/* ---------------------------------------------------------------------------
   Paper Background Options
   Maps task requirements (yellow, white, green, brown) to store values.
   --------------------------------------------------------------------------- */
const PAPER_OPTIONS: { value: PaperBackground; label: string }[] = [
  { value: 'default', label: '纯白' },
  { value: 'sepia', label: '米黄' },
  { value: 'green', label: '护眼绿' },
  { value: 'pink', label: '牛皮纸' },
];

/* ---------------------------------------------------------------------------
   Flip Animation Options
   --------------------------------------------------------------------------- */
const FLIP_OPTIONS: { value: FlipAnimation; label: string }[] = [
  { value: 'flip', label: '翻页' },
  { value: 'slide', label: '滑动' },
  { value: 'fade', label: '淡入' },
];

/* ---------------------------------------------------------------------------
   Settings Panel Component
   Modal overlay for customizing reading experience: paper background,
   font size, line height, night mode, and flip animation.
   --------------------------------------------------------------------------- */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    paperBackground,
    fontSize,
    lineHeight,
    nightMode,
    flipAnimation,
    updateSetting,
    toggleNightMode,
  } = useSettingsStore();

  /* Don't render when closed */
  if (!isOpen) return null;

  /* Style helpers */
  const bgClass = nightMode ? 'bg-neutral-900' : 'bg-white';
  const borderClass = nightMode ? 'border-neutral-700' : 'border-gray-200';
  const textClass = nightMode ? 'text-neutral-200' : 'text-gray-800';
  const textMutedClass = nightMode ? 'text-neutral-400' : 'text-gray-500';
  const sectionBgClass = nightMode ? 'bg-neutral-800' : 'bg-gray-50';
  const inputBgClass = nightMode ? 'bg-neutral-700' : 'bg-gray-100';
  const inputBorderClass = nightMode ? 'border-neutral-600' : 'border-gray-300';
  const activeBorderClass = nightMode ? 'border-amber-500' : 'border-amber-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Reading settings"
    >
      {/* ---- Backdrop ---- */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---- Panel ---- */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden mx-4',
          bgClass,
          borderClass,
        )}
      >
        {/* ---- Header ---- */}
        <div className={cn('flex items-center justify-between px-5 py-4 border-b', borderClass)}>
          <h2 className={cn('text-lg font-semibold', textClass)}>阅读设置</h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
            )}
            title="Close settings"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ---- Paper Background ---- */}
          <section>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              纸张背景
            </label>
            <div className="flex gap-2">
              {PAPER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('paperBackground', option.value)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium transition-all border-2',
                    paperBackground === option.value
                      ? activeBorderClass
                      : 'border-transparent',
                    textClass,
                  )}
                  title={option.label}
                  aria-label={`Paper background: ${option.label}`}
                  aria-pressed={paperBackground === option.value}
                >
                  <span
                    className="block w-6 h-6 rounded-full mx-auto mb-1 border border-gray-300"
                    style={{ backgroundColor: PAPER_COLORS[option.value] }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* ---- Font Size ---- */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className={cn('text-sm font-medium', textClass)}>字体大小</label>
              <span className={cn('text-sm font-mono', textMutedClass)}>{fontSize}px</span>
            </div>
            <div className={cn('px-3 py-2 rounded-lg', sectionBgClass)}>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={fontSize}
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                className={cn(
                  'w-full h-1.5 rounded-full appearance-none cursor-pointer',
                  nightMode ? 'bg-neutral-600 accent-amber-500' : 'bg-gray-300 accent-amber-600',
                )}
                aria-label="Font size"
              />
              <div className={cn('flex justify-between text-xs mt-1', textMutedClass)}>
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>
          </section>

          {/* ---- Line Height ---- */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className={cn('text-sm font-medium', textClass)}>行间距</label>
              <span className={cn('text-sm font-mono', textMutedClass)}>{lineHeight.toFixed(1)}</span>
            </div>
            <div className={cn('px-3 py-2 rounded-lg', sectionBgClass)}>
              <input
                type="range"
                min={1.5}
                max={3.0}
                step={0.1}
                value={lineHeight}
                onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
                className={cn(
                  'w-full h-1.5 rounded-full appearance-none cursor-pointer',
                  nightMode ? 'bg-neutral-600 accent-amber-500' : 'bg-gray-300 accent-amber-600',
                )}
                aria-label="Line height"
              />
              <div className={cn('flex justify-between text-xs mt-1', textMutedClass)}>
                <span>1.5</span>
                <span>3.0</span>
              </div>
            </div>
          </section>

          {/* ---- Night Mode ---- */}
          <section className="flex items-center justify-between">
            <label className={cn('text-sm font-medium', textClass)}>夜间模式</label>
            <button
              onClick={toggleNightMode}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                nightMode ? 'bg-amber-600' : 'bg-gray-300',
              )}
              role="switch"
              aria-checked={nightMode}
              aria-label="Night mode"
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  nightMode ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </section>

          {/* ---- Flip Animation ---- */}
          <section>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              翻页动画
            </label>
            <div className="flex gap-2">
              {FLIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('flipAnimation', option.value)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2',
                    flipAnimation === option.value
                      ? activeBorderClass
                      : cn('border-transparent', inputBgClass),
                    textClass,
                  )}
                  aria-label={`Flip animation: ${option.label}`}
                  aria-pressed={flipAnimation === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
