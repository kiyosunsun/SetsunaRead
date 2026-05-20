import React, { useMemo } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Chapter } from '../../types/book';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   ChapterList Props
   --------------------------------------------------------------------------- */
interface ChapterListProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Chapters parsed from the current book */
  chapters: Chapter[];
}

/* ---------------------------------------------------------------------------
   Helper: estimate which page a chapter starts on
   Maps chapter startIndex (character offset) to the page number by scanning
   the pages array from the book store.
   --------------------------------------------------------------------------- */
function estimateChapterPage(
  chapterStartIndex: number,
  bookContent: string,
  totalPages: number,
): number {
  if (totalPages === 0 || bookContent.length === 0) return 0;
  const ratio = chapterStartIndex / bookContent.length;
  return Math.min(Math.floor(ratio * totalPages), totalPages - 1);
}

/* ---------------------------------------------------------------------------
   ChapterList Component
   Slide-in side panel showing the list of chapters for the current book.
   Highlights the currently visible chapter and allows clicking to jump.
   --------------------------------------------------------------------------- */
const ChapterList: React.FC<ChapterListProps> = ({ isOpen, onClose, chapters }) => {
  const { currentPage, totalPages, goToPage } = useBookStore();
  const { nightMode } = useSettingsStore();
  const bookContent = useBookStore((state) => state.currentBook?.content ?? '');

  /* ---- Determine which chapter the user is currently reading ---- */
  const currentChapterIdx = useMemo(() => {
    if (chapters.length === 0 || bookContent.length === 0) return -1;

    // Estimate the character offset of the current page
    const charOffset =
      totalPages > 0
        ? Math.floor((currentPage / totalPages) * bookContent.length)
        : 0;

    // Find the last chapter whose startIndex <= charOffset
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].startIndex <= charOffset) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [chapters, currentPage, totalPages, bookContent]);

  /* ---- Handle chapter click ---- */
  const handleChapterClick = (chapter: Chapter, idx: number) => {
    const targetPage = estimateChapterPage(
      chapter.startIndex,
      bookContent,
      totalPages,
    );
    goToPage(targetPage);
    onClose();
  };

  /* Don't render when closed */
  if (!isOpen) return null;

  /* Style helpers */
  const bgClass = nightMode ? 'bg-neutral-900' : 'bg-white';
  const borderClass = nightMode ? 'border-neutral-700' : 'border-gray-200';
  const textClass = nightMode ? 'text-neutral-200' : 'text-gray-800';
  const textMutedClass = nightMode ? 'text-neutral-500' : 'text-gray-400';
  const hoverClass = nightMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50';
  const activeClass = nightMode
    ? 'bg-amber-900/30 text-amber-300 border-l-2 border-amber-500'
    : 'bg-amber-50 text-amber-700 border-l-2 border-amber-600';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Chapter list"
    >
      {/* ---- Backdrop ---- */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---- Panel (slides in from right) ---- */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm h-full border-l shadow-2xl flex flex-col overflow-hidden animate-slide-in-right',
          bgClass,
          borderClass,
        )}
      >
        {/* ---- Header ---- */}
        <div className={cn('flex items-center justify-between px-5 py-4 border-b shrink-0', borderClass)}>
          <h2 className={cn('text-lg font-semibold', textClass)}>
            Chapters
            {chapters.length > 0 && (
              <span className={cn('ml-2 text-sm font-normal', textMutedClass)}>
                ({chapters.length})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
            )}
            title="Close chapter list"
            aria-label="Close chapter list"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Chapter list ---- */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <svg
                className={cn('w-12 h-12 mb-3', textMutedClass)}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <p className={cn('text-sm', textMutedClass)}>
                No chapters detected in this book.
              </p>
            </div>
          ) : (
            <ul className="py-1" role="listbox" aria-label="Chapters">
              {chapters.map((chapter, idx) => {
                const isActive = idx === currentChapterIdx;
                return (
                  <li key={`${chapter.startIndex}-${idx}`} role="option" aria-selected={isActive}>
                    <button
                      onClick={() => handleChapterClick(chapter, idx)}
                      className={cn(
                        'w-full text-left px-5 py-3 text-sm transition-colors border-l-2 border-transparent',
                        hoverClass,
                        textClass,
                        isActive && activeClass,
                      )}
                    >
                      <span className="line-clamp-2">{chapter.title}</span>
                      <span className={cn('block text-xs mt-0.5', textMutedClass)}>
                        {estimateChapterPage(chapter.startIndex, bookContent, totalPages) + 1} / {totalPages}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ---- Inline keyframe for slide-in animation ---- */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChapterList;
