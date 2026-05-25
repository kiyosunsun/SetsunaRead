import React from 'react';
import {
  useSettingsStore,
  PAPER_COLORS,
  type PaperBackground,
  type FlipAnimation,
} from '../../stores/settingsStore';

/* ---------------------------------------------------------------------------
   设置面板 Props
   --------------------------------------------------------------------------- */
interface SettingsPanelProps {
  /** 面板是否可见 */
  isOpen: boolean;
  /** 关闭面板回调 */
  onClose: () => void;
}

/* ---------------------------------------------------------------------------
   纸张背景选项
   将设计需求（纯白、米黄、护眼绿、牛皮纸）映射到 store 值。
   --------------------------------------------------------------------------- */
const PAPER_OPTIONS: { value: PaperBackground; label: string }[] = [
  { value: 'default', label: '纯白' },
  { value: 'sepia', label: '米黄' },
  { value: 'green', label: '护眼绿' },
  { value: 'kraft', label: '牛皮纸' },
];

/* ---------------------------------------------------------------------------
   翻页动画选项
   --------------------------------------------------------------------------- */
const FLIP_OPTIONS: { value: FlipAnimation; label: string }[] = [
  { value: 'flip', label: '翻页' },
  { value: 'slide', label: '滑动' },
  { value: 'fade', label: '淡入' },
];

/* ---------------------------------------------------------------------------
   设置面板组件
   模态覆盖层，用于自定义阅读体验：纸张背景、字体大小、行间距、
   夜间模式和翻页动画。
   设计：深色半透明毛玻璃 + 铜金色点缀。
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="阅读设置"
    >
      {/* ---- 背景遮罩 ---- */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---- 面板 ---- */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden mx-4"
        style={{
          background: 'linear-gradient(180deg, rgba(40,32,22,0.98) 0%, rgba(30,24,16,0.99) 100%)',
          borderColor: 'rgba(184,134,11,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* ---- 标题栏 ---- */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: '"Noto Serif SC", serif',
              color: '#d4c5a9',
              letterSpacing: '2px',
            }}
          >
            阅读设置
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ background: 'transparent', color: 'rgba(212,197,169,0.4)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(212,197,169,0.4)';
            }}
            title="关闭设置"
            aria-label="关闭设置"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- 内容区 ---- */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ---- 纸张背景 ---- */}
          <section>
            <label
              className="block text-sm font-medium mb-3"
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: 'rgba(212,197,169,0.5)',
                letterSpacing: '2px',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              纸张背景
            </label>
            <div className="flex gap-2.5">
              {PAPER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('paperBackground', option.value)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: paperBackground === option.value
                      ? 'rgba(184,134,11,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${paperBackground === option.value ? 'rgba(184,134,11,0.4)' : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (paperBackground !== option.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (paperBackground !== option.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  title={option.label}
                  aria-label={`纸张背景: ${option.label}`}
                  aria-pressed={paperBackground === option.value}
                >
                  <div
                    className="w-7 h-7 rounded-full"
                    style={{
                      backgroundColor: PAPER_COLORS[option.value],
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'rgba(212,197,169,0.6)',
                      letterSpacing: '1px',
                      fontFamily: '"Noto Sans SC", sans-serif',
                    }}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ---- 字体大小 ---- */}
          <section>
            <div
              className="flex items-center justify-between mb-2 px-1"
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: 'rgba(212,197,169,0.7)',
                fontSize: '13px',
              }}
            >
              <label>字体大小</label>
              <span style={{ fontFamily: 'monospace', color: 'rgba(212,197,169,0.4)', fontSize: '12px' }}>
                {fontSize}px
              </span>
            </div>
            <div
              className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={fontSize}
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  accentColor: '#b8860b',
                }}
                aria-label="字体大小"
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: 'rgba(212,197,169,0.4)' }}
              >
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>
          </section>

          {/* ---- 行间距 ---- */}
          <section>
            <div
              className="flex items-center justify-between mb-2 px-1"
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: 'rgba(212,197,169,0.7)',
                fontSize: '13px',
              }}
            >
              <label>行间距</label>
              <span style={{ fontFamily: 'monospace', color: 'rgba(212,197,169,0.4)', fontSize: '12px' }}>
                {lineHeight.toFixed(1)}
              </span>
            </div>
            <div
              className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <input
                type="range"
                min={1.5}
                max={3.0}
                step={0.1}
                value={lineHeight}
                onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  accentColor: '#b8860b',
                }}
                aria-label="行间距"
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: 'rgba(212,197,169,0.4)' }}
              >
                <span>1.5</span>
                <span>3.0</span>
              </div>
            </div>
          </section>

          {/* ---- 夜间模式 ---- */}
          <section
            className="flex items-center justify-between px-3 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <label
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: 'rgba(212,197,169,0.7)',
                fontSize: '13px',
              }}
            >
              夜间模式
            </label>
            <button
              onClick={toggleNightMode}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{
                background: nightMode ? '#b8860b' : 'rgba(255,255,255,0.12)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
              role="switch"
              aria-checked={nightMode}
              aria-label="夜间模式"
            >
              <span
                className="inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform duration-200"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transform: nightMode ? 'translateX(24px)' : 'translateX(3px)',
                }}
              />
            </button>
          </section>

          {/* ---- 翻页动画 ---- */}
          <section>
            <label
              className="block text-sm font-medium mb-2"
              style={{
                fontFamily: '"Noto Sans SC", sans-serif',
                color: 'rgba(212,197,169,0.5)',
                letterSpacing: '2px',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              翻页动画
            </label>
            <div className="flex gap-2">
              {FLIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('flipAnimation', option.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: '"Noto Sans SC", sans-serif',
                    background: flipAnimation === option.value
                      ? 'rgba(184,134,11,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${flipAnimation === option.value ? 'rgba(184,134,11,0.4)' : 'transparent'}`,
                    color: flipAnimation === option.value ? '#c4982f' : 'rgba(212,197,169,0.6)',
                    letterSpacing: '1px',
                  }}
                  onMouseEnter={(e) => {
                    if (flipAnimation !== option.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (flipAnimation !== option.value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  aria-label={`翻页动画: ${option.label}`}
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
