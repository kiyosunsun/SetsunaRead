import React, { useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   Reading Mode Type
   --------------------------------------------------------------------------- */
export type ReadingMode = 'dual' | 'single' | 'scroll';

/* ---------------------------------------------------------------------------
   Toolbar Props
   --------------------------------------------------------------------------- */
interface ToolbarProps {
  /** Current reading mode */
  readingMode: ReadingMode;
  /** Callback when reading mode changes */
  onReadingModeChange: (mode: ReadingMode) => void;
  /** Callback to open chapter list panel */
  onOpenChapterList: () => void;
  /** Callback to open search panel */
  onOpenSearch: () => void;
  /** Callback to open settings panel */
  onOpenSettings: () => void;
}

/* ---------------------------------------------------------------------------
   Reading Mode Options
   --------------------------------------------------------------------------- */
const READING_MODES: { value: ReadingMode; label: string; icon: string }[] = [
  { value: 'dual', label: '双页', icon: '📚' },
  { value: 'single', label: '单页', icon: '📄' },
  { value: 'scroll', label: '滚动', icon: '📜' },
];

/* ---------------------------------------------------------------------------
   Toolbar Component
   Bottom toolbar for the reading view with navigation, bookmarks, search,
   reading mode selector, and settings.
   --------------------------------------------------------------------------- */
const Toolbar: React.FC<ToolbarProps> = ({
  readingMode,
  onReadingModeChange,
  onOpenChapterList,
  onOpenSearch,
  onOpenSettings,
}) => {
  const { currentPage, totalPages, nextPage, prevPage } = useBookStore();
  const { currentBook } = useBookmarkStore((state) => ({
    currentBook: state.getBookmarks(useBookStore.getState().currentBook?.id ?? '').length > 0
      ? state.getBookmarks(useBookStore.getState().currentBook?.id ?? '')
      : [],
  }));
  const { addBookmark, removeBookmark, getBookmarks } = useBookmarkStore();
  const { nightMode } = useSettingsStore();

  const [showModeSelector, setShowModeSelector] = useState(false);

  /* Check if current page is bookmarked */
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookId = useBookStore((state) => state.currentBook?.id);
  const isBookmarked = bookmarks.some(
    (b) => b.bookId === bookId && b.pageNumber === currentPage,
  );

  /* Calculate progress percentage */
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  /* Handle bookmark toggle */
  const handleBookmarkToggle = () => {
    if (!bookId) return;

    if (isBookmarked) {
      const existingBookmark = bookmarks.find(
        (b) => b.bookId === bookId && b.pageNumber === currentPage,
      );
      if (existingBookmark) {
        removeBookmark(existingBookmark.id);
      }
    } else {
      addBookmark({
        bookId,
        pageNumber: currentPage,
        title: `Page ${currentPage + 1}`,
      });
    }
  };

  /* Style helpers */
  const bgClass = nightMode ? 'bg-neutral-900/95' : 'bg-white/95';
  const borderClass = nightMode ? 'border-neutral-700' : 'border-gray-200';
  const textClass = nightMode ? 'text-neutral-300' : 'text-gray-600';
  const textMutedClass = nightMode ? 'text-neutral-500' : 'text-gray-400';
  const hoverClass = nightMode ? 'hover:bg-neutral-700' : 'hover:bg-gray-100';
  const progressBgClass = nightMode ? 'bg-neutral-700' : 'bg-gray-200';
  const progressFillClass = nightMode ? 'bg-amber-600' : 'bg-amber-700';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 border-t backdrop-blur-sm',
        bgClass,
        borderClass,
      )}
    >
      {/* ---- Left: Navigation ---- */}
      <div className="flex items-center gap-1">
        <button
          onClick={prevPage}
          disabled={currentPage <= 0}
          className={cn(
            'p-2 rounded-lg transition-colors',
            hoverClass,
            textClass,
            currentPage <= 0 && 'opacity-40 cursor-not-allowed',
          )}
          title="Previous page"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            hoverClass,
            textClass,
            currentPage >= totalPages - 1 && 'opacity-40 cursor-not-allowed',
          )}
          title="Next page"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ---- Chapter List Button ---- */}
      <button
        onClick={onOpenChapterList}
        className={cn(
          'p-2 rounded-lg transition-colors',
          hoverClass,
          textClass,
        )}
        title="Chapter list"
        aria-label="Chapter list"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ---- Bookmark Button ---- */}
      <button
        onClick={handleBookmarkToggle}
        disabled={!bookId}
        className={cn(
          'p-2 rounded-lg transition-colors',
          hoverClass,
          textClass,
          isBookmarked && 'text-amber-500',
          !bookId && 'opacity-40 cursor-not-allowed',
        )}
        title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
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

      {/* ---- Search Button ---- */}
      <button
        onClick={onOpenSearch}
        className={cn(
          'p-2 rounded-lg transition-colors',
          hoverClass,
          textClass,
        )}
        title="Search"
        aria-label="Search"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* ---- Center: Progress Bar ---- */}
      <div className="flex-1 flex items-center gap-3 mx-4">
        <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', progressBgClass)}>
          <div
            className={cn('h-full rounded-full transition-all duration-300', progressFillClass)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn('text-xs font-mono whitespace-nowrap', textMutedClass)}>
          {currentPage + 1} / {totalPages} ({progress}%)
        </span>
      </div>

      {/* ---- Right: Reading Mode Selector ---- */}
      <div className="relative">
        <button
          onClick={() => setShowModeSelector(!showModeSelector)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            hoverClass,
            textClass,
          )}
          title="Reading mode"
          aria-label="Reading mode"
          aria-expanded={showModeSelector}
        >
          {READING_MODES.find((m) => m.value === readingMode)?.icon}{' '}
          {READING_MODES.find((m) => m.value === readingMode)?.label}
        </button>

        {showModeSelector && (
          <div
            className={cn(
              'absolute bottom-full right-0 mb-2 rounded-lg border shadow-lg py-1 z-50',
              bgClass,
              borderClass,
            )}
          >
            {READING_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  onReadingModeChange(mode.value);
                  setShowModeSelector(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  hoverClass,
                  readingMode === mode.value
                    ? 'text-amber-600 font-medium'
                    : textClass,
                )}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- Settings Button ---- */}
      <button
        onClick={onOpenSettings}
        className={cn(
          'p-2 rounded-lg transition-colors',
          hoverClass,
          textClass,
        )}
        title="Settings"
        aria-label="Settings"
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
