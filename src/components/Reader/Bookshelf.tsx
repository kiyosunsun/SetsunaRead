import React, { useRef, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   Bookshelf Props
   --------------------------------------------------------------------------- */
interface BookshelfProps {
  /** Callback when a book is selected to open */
  onOpenBook: (bookId: string) => void;
  /** Callback to import a new book */
  onImportBook: (file: File) => void;
}

/* ---------------------------------------------------------------------------
   Helper: Format file size
   --------------------------------------------------------------------------- */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------------------------------------------------------------------------
   Helper: Format last read date
   --------------------------------------------------------------------------- */
function formatLastRead(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString();
}

/* ---------------------------------------------------------------------------
   Bookshelf Component
   Grid display of books with management controls.
   --------------------------------------------------------------------------- */
const Bookshelf: React.FC<BookshelfProps> = ({ onOpenBook, onImportBook }) => {
  const books = useBookStore((s) => s.books);
  const removeBook = useBookStore((s) => s.removeBook);
  const { nightMode } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Style helpers ---- */
  const bgClass = nightMode ? 'bg-neutral-950' : 'bg-neutral-50';
  const cardBgClass = nightMode ? 'bg-neutral-800' : 'bg-white';
  const cardBorderClass = nightMode ? 'border-neutral-700' : 'border-gray-200';
  const cardHoverClass = nightMode ? 'hover:bg-neutral-700' : 'hover:bg-gray-50';
  const textClass = nightMode ? 'text-neutral-200' : 'text-gray-800';
  const textMutedClass = nightMode ? 'text-neutral-400' : 'text-gray-500';
  const textMuted2Class = nightMode ? 'text-neutral-500' : 'text-gray-400';
  const btnPrimaryClass = nightMode
    ? 'bg-amber-600 hover:bg-amber-500 text-white'
    : 'bg-amber-700 hover:bg-amber-600 text-white';
  const deleteBtnClass = nightMode
    ? 'text-neutral-500 hover:text-red-400 hover:bg-neutral-700'
    : 'text-gray-400 hover:text-red-500 hover:bg-gray-100';
  const emptyIconColor = nightMode ? 'rgba(212,197,169,0.2)' : 'rgba(0,0,0,0.15)';
  const emptyTextColor = nightMode ? 'rgba(212,197,169,0.5)' : 'rgba(0,0,0,0.4)';

  /* ---- File import handler ---- */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImportBook(file);
      }
      e.target.value = '';
    },
    [onImportBook],
  );

  /* ---- Delete handler with confirmation ---- */
  const handleDelete = useCallback(
    (e: React.MouseEvent, bookId: string, bookTitle: string) => {
      e.stopPropagation();
      if (window.confirm(`确定删除"${bookTitle}"吗？`)) {
        removeBook(bookId);
      }
    },
    [removeBook],
  );

  /* ================================================================
     EMPTY STATE
     ================================================================ */
  if (books.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bgClass} select-none`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Import book file"
        />

        <div className="text-center max-w-md mx-4">
          {/* Empty bookshelf icon */}
          <svg
            className="w-20 h-20 mx-auto mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            style={{ color: emptyIconColor }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>

          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: emptyTextColor }}
          >
            书架空空如也
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: emptyTextColor }}
          >
            导入 .txt 文件开始阅读
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'px-6 py-3 rounded-xl font-medium text-sm transition-colors',
              btnPrimaryClass,
            )}
          >
            导入书籍
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================
     BOOK GRID
     ================================================================ */
  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Import book file"
      />

      {/* ---- Header ---- */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 border-b"
        style={{
          backgroundColor: nightMode ? 'rgba(23,23,23,0.9)' : 'rgba(249,250,251,0.9)',
          borderColor: nightMode ? 'rgba(64,64,64,0.5)' : 'rgba(229,229,229,0.5)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                color: nightMode
                  ? 'rgba(212,197,169,0.9)'
                  : 'rgba(0,0,0,0.85)',
              }}
            >
              我的书架
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: textMuted2Class }}
            >
              {books.length} 本书
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors',
              btnPrimaryClass,
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            导入
          </button>
        </div>
      </div>

      {/* ---- Book Grid ---- */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => onOpenBook(book.id)}
              className={cn(
                'group relative rounded-xl border p-4 cursor-pointer transition-all duration-200',
                'hover:shadow-lg hover:-translate-y-0.5',
                cardBgClass,
                cardBorderClass,
                cardHoverClass,
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenBook(book.id);
                }
              }}
              aria-label={`Open book: ${book.title}`}
            >
              {/* ---- Delete button ---- */}
              <button
                onClick={(e) => handleDelete(e, book.id, book.title)}
                className={cn(
                  'absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
                  deleteBtnClass,
                )}
                title="Delete book"
                aria-label={`Delete book: ${book.title}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              {/* ---- Book icon ---- */}
              <div className="mb-3">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  style={{
                    color: nightMode
                      ? 'rgba(212,197,169,0.4)'
                      : 'rgba(180,130,60,0.5)',
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>

              {/* ---- Book title ---- */}
              <h3
                className={cn(
                  'font-medium text-sm leading-tight mb-2 line-clamp-2',
                  textClass,
                )}
                title={book.title}
              >
                {book.title}
              </h3>

              {/* ---- Book metadata ---- */}
              <div className="space-y-1">
                <p
                  className="text-xs"
                  style={{ color: textMuted2Class }}
                >
                  {formatSize(book.size)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: textMuted2Class }}
                >
                  {formatLastRead(book.lastRead)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bookshelf;
