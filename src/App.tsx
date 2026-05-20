import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import DualPage from './components/BookView/DualPage';
import SinglePage from './components/BookView/SinglePage';
import ScrollView from './components/BookView/ScrollView';
import Toolbar, { type ReadingMode } from './components/Reader/Toolbar';
import SettingsPanel from './components/Reader/SettingsPanel';
import ChapterList from './components/Reader/ChapterList';
import BookmarkPanel from './components/Reader/BookmarkPanel';
import SearchPanel from './components/Reader/SearchPanel';
import { useBookParser } from './hooks/useBookParser';
import usePagination from './hooks/usePagination';
import { useBookStore } from './stores/bookStore';
import { useSettingsStore } from './stores/settingsStore';

/* ---------------------------------------------------------------------------
   App - Main application shell for SetsunaRead.
   Manages two top-level screens:
     1. Import screen  - shown when no book is loaded (file drop / browse)
     2. Reading view   - shown when a book is loaded (reading mode + toolbar + panels)
   --------------------------------------------------------------------------- */
function App() {
  /* ---- Reading mode ---- */
  const [readingMode, setReadingMode] = useState<ReadingMode>('dual');

  /* ---- Panel visibility ---- */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterListOpen, setChapterListOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);

  /* ---- Core hooks ---- */
  const { book, chapters, loading, loadFile } = useBookParser();
  const {
    addBook,
    openBook,
    closeBook,
    setPages: storeSetPages,
  } = useBookStore();
  const currentBook = useBookStore((s) => s.currentBook);
  const { fontSize, lineHeight, nightMode } = useSettingsStore();

  /* ---- Page config derived from current settings ---- */
  const pageConfig = useMemo(
    () => ({
      width: 480,
      height: 660,
      fontSize,
      fontFamily: 'serif',
      lineHeight,
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
    }),
    [fontSize, lineHeight],
  );

  /* ---- DOM-measurement pagination ---- */
  const { pages: paginatedPages } = usePagination(
    book?.content ?? '',
    pageConfig,
  );

  /* ---- Sync book metadata to Zustand store ---- */
  useEffect(() => {
    if (book) {
      addBook(book);
      openBook(book);
    }
  }, [book]);

  /* ---- Sync paginated pages to store (keeps reading components fed) ---- */
  useEffect(() => {
    if (paginatedPages.length > 0) {
      storeSetPages(paginatedPages);

      // Clamp currentPage when re-pagination reduces total page count
      const state = useBookStore.getState();
      if (
        state.currentPage >= paginatedPages.length &&
        paginatedPages.length > 0
      ) {
        useBookStore.setState({ currentPage: paginatedPages.length - 1 });
      }
    }
  }, [paginatedPages]);

  /* ================================================================
     FILE IMPORT
     ================================================================ */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.txt')) {
        alert('Only .txt files are supported.');
        return;
      }
      const buffer = await file.arrayBuffer();
      await loadFile(buffer, file.name, '', pageConfig);
    },
    [loadFile, pageConfig],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile],
  );

  /* ---- Shared background class ---- */
  const bgClass = nightMode ? 'bg-neutral-950' : 'bg-neutral-900';

  /* ================================================================
     IMPORT SCREEN (no book loaded)
     ================================================================ */
  if (!currentBook) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${bgClass} select-none`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Import book file"
        />

        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              color: nightMode
                ? 'rgba(212,197,169,0.9)'
                : 'rgba(255,255,255,0.9)',
            }}
          >
            SetsunaRead
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              color: nightMode
                ? 'rgba(212,197,169,0.4)'
                : 'rgba(255,255,255,0.4)',
            }}
          >
            Your personal book reader
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={[
            'relative w-full max-w-md mx-4 rounded-2xl border-2 border-dashed',
            'transition-all duration-200 cursor-pointer',
            isDragOver
              ? 'border-amber-500 bg-amber-500/10'
              : nightMode
                ? 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
                : 'border-neutral-600 hover:border-neutral-400 bg-neutral-800/50',
          ].join(' ')}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Drop a .txt file here or click to browse"
        >
          <div className="flex flex-col items-center justify-center py-16 px-6">
            {loading ? (
              <>
                <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p
                  className="text-sm"
                  style={{
                    color: nightMode
                      ? 'rgba(212,197,169,0.6)'
                      : 'rgba(255,255,255,0.6)',
                  }}
                >
                  Loading book...
                </p>
              </>
            ) : (
              <>
                {/* Book import icon */}
                <svg
                  className="w-12 h-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{
                    color: isDragOver
                      ? '#f59e0b'
                      : nightMode
                        ? 'rgba(212,197,169,0.3)'
                        : 'rgba(255,255,255,0.3)',
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
                <p
                  className="text-sm font-medium mb-1"
                  style={{
                    color: nightMode
                      ? 'rgba(212,197,169,0.7)'
                      : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {isDragOver
                    ? 'Drop your book here'
                    : 'Drop a .txt file here'}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: nightMode
                      ? 'rgba(212,197,169,0.35)'
                      : 'rgba(255,255,255,0.35)',
                  }}
                >
                  or click to browse
                </p>
              </>
            )}
          </div>
        </div>

        {/* Hint */}
        <p
          className="mt-6 text-xs"
          style={{
            color: nightMode
              ? 'rgba(212,197,169,0.2)'
              : 'rgba(255,255,255,0.2)',
          }}
        >
          Supports TXT files with automatic encoding detection
        </p>
      </div>
    );
  }

  /* ================================================================
     READING VIEW (book loaded)
     ================================================================ */
  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${bgClass}`}>
      {/* ---- Reading area ---- */}
      <div className="flex-1 relative overflow-hidden">
        {readingMode === 'dual' && <DualPage />}
        {readingMode === 'single' && <SinglePage />}
        {readingMode === 'scroll' && <ScrollView />}
      </div>

      {/* ---- Bottom toolbar ---- */}
      <Toolbar
        readingMode={readingMode}
        onReadingModeChange={setReadingMode}
        onOpenChapterList={() => setChapterListOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* ---- Overlay panels ---- */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ChapterList
        isOpen={chapterListOpen}
        onClose={() => setChapterListOpen(false)}
        chapters={chapters}
      />
      <BookmarkPanel
        isOpen={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
      />
      <SearchPanel
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

export default App;
