import React, { useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useSettingsStore } from '../../stores/settingsStore';

/* ---------------------------------------------------------------------------
   阅读模式类型
   --------------------------------------------------------------------------- */
export type ReadingMode = 'dual' | 'single' | 'scroll';

/* ---------------------------------------------------------------------------
   工具栏 Props
   --------------------------------------------------------------------------- */
interface ToolbarProps {
  /** 当前阅读模式 */
  readingMode: ReadingMode;
  /** 阅读模式变更回调 */
  onReadingModeChange: (mode: ReadingMode) => void;
  /** 打开章节目录面板回调 */
  onOpenChapterList: () => void;
  /** 打开搜索面板回调 */
  onOpenSearch: () => void;
  /** 打开书签面板回调 */
  onOpenBookmarkPanel: () => void;
  /** 打开设置面板回调 */
  onOpenSettings: () => void;
}

/* ---------------------------------------------------------------------------
   阅读模式选项
   --------------------------------------------------------------------------- */
const READING_MODES: { value: ReadingMode; label: string; icon: string }[] = [
  { value: 'dual', label: '双页', icon: '📚' },
  { value: 'single', label: '单页', icon: '📄' },
  { value: 'scroll', label: '滚动', icon: '📜' },
];

/* ---------------------------------------------------------------------------
   工具栏组件
   底部工具栏，包含导航、书签、搜索、阅读模式选择器和设置。
   设计：深色毛玻璃 + 铜金色点缀。
   --------------------------------------------------------------------------- */
const Toolbar: React.FC<ToolbarProps> = ({
  readingMode,
  onReadingModeChange,
  onOpenChapterList,
  onOpenSearch,
  onOpenBookmarkPanel,
  onOpenSettings,
}) => {
  const { currentPage, totalPages, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  /* 双页模式一次跳 2 页，单页/滚动跳 1 页 */
  const pageStep = readingMode === 'dual' ? 2 : 1;

  const [showModeSelector, setShowModeSelector] = useState(false);

  /* 检查当前页是否已添加书签 */
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookId = useBookStore((state) => state.currentBook?.id);
  const isBookmarked = bookmarks.some(
    (b) => b.bookId === bookId && b.pageNumber === currentPage,
  );

  /* 计算进度百分比（currentPage 从 0 开始，显示时 +1） */
  const progress = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-2.5 border-t"
      style={{
        background: 'linear-gradient(180deg, rgba(30,24,16,0.98) 0%, rgba(20,16,10,0.99) 100%)',
        borderColor: 'rgba(184,134,11,0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ---- 左侧：导航 ---- */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => prevPage(pageStep)}
          disabled={currentPage <= 0}
          className="p-2 rounded-lg transition-all duration-200"
          style={{
            background: 'transparent',
            color: nightMode ? 'rgba(212,197,169,0.5)' : 'rgba(212,197,169,0.5)',
            opacity: currentPage <= 0 ? 0.3 : 1,
            cursor: currentPage <= 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (currentPage > 0) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
          }}
          title="上一页"
          aria-label="上一页"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => nextPage(pageStep)}
          disabled={currentPage + pageStep >= totalPages}
          className="p-2 rounded-lg transition-all duration-200"
          style={{
            background: 'transparent',
            color: 'rgba(212,197,169,0.5)',
            opacity: currentPage + pageStep >= totalPages ? 0.3 : 1,
            cursor: currentPage + pageStep >= totalPages ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (currentPage + pageStep < totalPages) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
          }}
          title="下一页"
          aria-label="下一页"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ---- 分隔线 ---- */}
      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />

      {/* ---- 章节目录按钮 ---- */}
      <button
        onClick={onOpenChapterList}
        className="p-2 rounded-lg transition-all duration-200"
        style={{ background: 'transparent', color: 'rgba(212,197,169,0.5)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
        }}
        title="章节目录"
        aria-label="章节目录"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ---- 书签按钮（打开书签面板） ---- */}
      <button
        onClick={onOpenBookmarkPanel}
        disabled={!bookId}
        className="p-2 rounded-lg transition-all duration-200"
        style={{
          background: isBookmarked ? 'rgba(184,134,11,0.1)' : 'transparent',
          color: isBookmarked ? '#b8860b' : 'rgba(212,197,169,0.5)',
          opacity: !bookId ? 0.3 : 1,
          cursor: !bookId ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (bookId) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = isBookmarked ? '#d4a843' : 'rgba(212,197,169,0.8)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isBookmarked ? 'rgba(184,134,11,0.1)' : 'transparent';
          e.currentTarget.style.color = isBookmarked ? '#b8860b' : 'rgba(212,197,169,0.5)';
        }}
        title="书签"
        aria-label="书签"
      >
        <svg
          className="w-5 h-5"
          fill={isBookmarked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      {/* ---- 搜索按钮 ---- */}
      <button
        onClick={onOpenSearch}
        className="p-2 rounded-lg transition-all duration-200"
        style={{ background: 'transparent', color: 'rgba(212,197,169,0.5)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
        }}
        title="搜索"
        aria-label="搜索"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* ---- 中间：进度条 ---- */}
      <div className="flex-1 flex items-center gap-3 mx-4">
        <div
          className="flex-1 h-[3px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #b8860b, #d4a843)',
            }}
          />
        </div>
        <span
          className="text-xs whitespace-nowrap"
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            color: 'rgba(212,197,169,0.35)',
            letterSpacing: '1px',
          }}
        >
          {currentPage + 1} / {totalPages} · {progress}%
        </span>
      </div>

      {/* ---- 右侧：阅读模式选择器 ---- */}
      <div className="relative">
        <button
          onClick={() => setShowModeSelector(!showModeSelector)}
          className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap"
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(212,197,169,0.5)',
            letterSpacing: '1px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
          }}
          title="阅读模式"
          aria-label="阅读模式"
          aria-expanded={showModeSelector}
        >
          {READING_MODES.find((m) => m.value === readingMode)?.icon}{' '}
          {READING_MODES.find((m) => m.value === readingMode)?.label}
        </button>

        {showModeSelector && (
          <div
            className="absolute bottom-full right-0 mb-2 rounded-lg py-1 z-50"
            style={{
              background: 'rgba(30,24,16,0.98)',
              border: '1px solid rgba(184,134,11,0.12)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {READING_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  onReadingModeChange(mode.value);
                  setShowModeSelector(false);
                }}
                className="w-full px-4 py-2 text-left text-sm transition-all duration-200 whitespace-nowrap"
                style={{
                  fontFamily: '"Noto Sans SC", sans-serif',
                  color: readingMode === mode.value ? '#c4982f' : 'rgba(212,197,169,0.6)',
                  fontWeight: readingMode === mode.value ? 500 : 400,
                  background: readingMode === mode.value ? 'rgba(184,134,11,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (readingMode !== mode.value) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (readingMode !== mode.value) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(212,197,169,0.6)';
                  }
                }}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- 设置按钮 ---- */}
      <button
        onClick={onOpenSettings}
        className="p-2 rounded-lg transition-all duration-200"
        style={{ background: 'transparent', color: 'rgba(212,197,169,0.5)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(212,197,169,0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(212,197,169,0.5)';
        }}
        title="设置"
        aria-label="设置"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
};

export default Toolbar;
