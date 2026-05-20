import React, { useMemo } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useBookmarkStore, type Bookmark } from '../../stores/bookmarkStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   BookmarkPanel Props
   --------------------------------------------------------------------------- */
interface BookmarkPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/* ---------------------------------------------------------------------------
   Helper: format timestamp to a human-readable string
   --------------------------------------------------------------------------- */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/* ---------------------------------------------------------------------------
   BookmarkPanel Component
   Slide-in side panel showing bookmarks for the current book.
   Allows adding/removing bookmarks and clicking to jump to a bookmarked page.
   --------------------------------------------------------------------------- */
const BookmarkPanel: React.FC<BookmarkPanelProps> = ({ isOpen, onClose }) => {
  const { currentPage, totalPages, goToPage } = useBookStore();
  const { nightMode } = useSettingsStore();
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const { addBookmark, removeBookmark } = useBookmarkStore();

  const bookId = useBookStore((state) => state.currentBook?.id);

  /* ---- Filter bookmarks for current book and sort by page number ---- */
  const bookBookmarks = useMemo(() => {
    if (!bookId) return [];
    return bookmarks
      .filter((b) => b.bookId === bookId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [bookmarks, bookId]);

  /* ---- Check if current page is bookmarked ---- */
  const isCurrentPageBookmarked = useMemo(() => {
    if (!bookId) return false;
    return bookmarks.some(
      (b) => b.bookId === bookId && b.pageNumber === currentPage,
    );
  }, [bookmarks, bookId, currentPage]);

  /* ---- Add bookmark for current page ---- */
  const handleAddBookmark = () => {
    if (!bookId) return;
    addBookmark({
      bookId,
      pageNumber: currentPage,
      title: `Page ${currentPage + 1}`,
    });
  };

  /* ---- Remove a bookmark ---- */
  const handleRemoveBookmark = (bookmarkId: string) => {
    removeBookmark(bookmarkId);
  };

  /* ---- Jump to bookmarked page ---- */
  const handleBookmarkClick = (bookmark: Bookmark) => {
    goToPage(bookmark.pageNumber);
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
  const btnBgClass = nightMode ? 'bg-neutral-700' : 'bg-gray-100';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Bookmarks"
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
            书签
            {bookBookmarks.length > 0 && (
              <span className={cn('ml-2 text-sm font-normal', textMutedClass)}>
                ({bookBookmarks.length})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
            )}
            title="Close bookmarks"
            aria-label="Close bookmarks"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Add bookmark button ---- */}
        {bookId && (
          <div className={cn('px-5 py-3 border-b', borderClass)}>
            <button
              onClick={isCurrentPageBookmarked ? undefined : handleAddBookmark}
              disabled={isCurrentPageBookmarked}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isCurrentPageBookmarked
                  ? cn('opacity-50 cursor-not-allowed', btnBgClass, textMutedClass)
                  : cn('bg-amber-600 text-white hover:bg-amber-700'),
              )}
              title={isCurrentPageBookmarked ? '当前页已添加书签' : '添加书签到当前页'}
            >
              <svg
                className="w-4 h-4"
                fill={isCurrentPageBookmarked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isCurrentPageBookmarked
                ? `已添加书签 (第 ${currentPage + 1} 页)`
                : `添加书签 (第 ${currentPage + 1} 页)`}
            </button>
          </div>
        )}

        {/* ---- Bookmark list ---- */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!bookId ? (
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <p className={cn('text-sm', textMutedClass)}>
                请先打开一本书来添加书签
              </p>
            </div>
          ) : bookBookmarks.length === 0 ? (
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <p className={cn('text-sm', textMutedClass)}>
                暂无书签，点击上方按钮添加
              </p>
            </div>
          ) : (
            <ul className="py-1" role="listbox" aria-label="Bookmarks">
              {bookBookmarks.map((bookmark) => {
                const isCurrent = bookmark.pageNumber === currentPage;
                return (
                  <li key={bookmark.id} role="option" aria-selected={isCurrent}>
                    <div
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 transition-colors',
                        hoverClass,
                        isCurrent && (nightMode ? 'bg-amber-900/20' : 'bg-amber-50'),
                      )}
                    >
                      {/* Bookmark icon */}
                      <div className="shrink-0">
                        <svg
                          className={cn('w-5 h-5', isCurrent ? 'text-amber-500' : textMutedClass)}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>

                      {/* Bookmark info (clickable) */}
                      <button
                        onClick={() => handleBookmarkClick(bookmark)}
                        className="flex-1 text-left min-w-0"
                      >
                        <span
                          className={cn(
                            'block text-sm font-medium truncate',
                            isCurrent ? 'text-amber-600' : textClass,
                          )}
                        >
                          {bookmark.title}
                        </span>
                        <span className={cn('block text-xs mt-0.5', textMutedClass)}>
                          {formatDate(bookmark.createdAt)}
                        </span>
                      </button>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                        className={cn(
                          'shrink-0 p-1.5 rounded-lg transition-colors',
                          nightMode ? 'hover:bg-neutral-700 text-neutral-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500',
                        )}
                        title="Remove bookmark"
                        aria-label={`Remove bookmark: ${bookmark.title}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---- Footer: page indicator ---- */}
        {bookId && totalPages > 0 && (
          <div className={cn('px-5 py-3 border-t text-center shrink-0', borderClass)}>
            <span className={cn('text-xs', textMutedClass)}>
              当前第 {currentPage + 1} 页，共 {totalPages} 页
            </span>
          </div>
        )}
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

export default BookmarkPanel;
