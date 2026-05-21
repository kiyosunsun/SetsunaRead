import { useState, useEffect, useMemo } from 'react';
import DualPage from './components/BookView/DualPage';
import SinglePage from './components/BookView/SinglePage';
import ScrollView from './components/BookView/ScrollView';
import Toolbar, { type ReadingMode } from './components/Reader/Toolbar';
import SettingsPanel from './components/Reader/SettingsPanel';
import ChapterList from './components/Reader/ChapterList';
import BookmarkPanel from './components/Reader/BookmarkPanel';
import SearchPanel from './components/Reader/SearchPanel';
import Bookshelf from './components/Reader/Bookshelf';
import ImportProgressOverlay from './components/Reader/ImportProgressOverlay';
import OnboardingGuide from './components/Reader/OnboardingGuide';
import { useBookParser } from './hooks/useBookParser';
import { useOnboarding } from './hooks/useOnboarding';
import { useBookStore } from './stores/bookStore';
import { useSettingsStore } from './stores/settingsStore';

/* ---------------------------------------------------------------------------
   App - Main application shell for SetsunaRead.
   Manages two top-level screens:
     1. Bookshelf      - shown when no book is loaded (browse & import books)
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

  /* ---- Onboarding ---- */
  const {
    showGuide,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipGuide,
    completeGuide,
  } = useOnboarding();

  /* ---- Core hooks ---- */
  const { book, chapters, pages, loadFile, loading, progress, cancel } = useBookParser();
  const {
    addBook,
    openBook,
    closeBook,
    setPages: storeSetPages,
  } = useBookStore();
  const currentBook = useBookStore((s) => s.currentBook);
  const { fontSize, lineHeight, nightMode } = useSettingsStore();

  /* ---- Shared theme ---- */
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

  /* ---- Sync book metadata to Zustand store ---- */
  useEffect(() => {
    if (book) {
      addBook(book);
      openBook(book);
    }
  }, [book, addBook, openBook]);


  /* ---- Sync pages from parser result to store ---- */
  useEffect(() => {
    if (book && pages.length > 0) {
      storeSetPages(pages);

      const state = useBookStore.getState();
      if (state.currentPage >= pages.length && pages.length > 0) {
        useBookStore.setState({ currentPage: pages.length - 1 });
      }
    }
  }, [book, pages, storeSetPages]);

  /* ---- Shared theme ---- */
  const theme = nightMode ? 'dark' : 'light';

  /* ================================================================
     BOOKSHELF (no book loaded)
     ================================================================ */
  if (!currentBook) {
    const handleOpenBook = async (bookId: string) => {
      const found = useBookStore.getState().books.find((b) => b.id === bookId);
      if (found) {
        // Re-parse through useBookParser so pagination is correct for this book
        // 书架只持久化元数据；重新打开时提示用户重新导入（后续可改为读取原始文件）。
        alert('该书籍需要重新导入后才能打开（当前仅保存书架信息，不保存正文）。');
      }
    };

    const handleImportBook = async (file: File) => {
      if (!file.name.endsWith('.txt')) {
        alert('仅支持 .txt 文件格式。');
        return;
      }

      setImportingTitle(file.name.replace(/\.txt$/i, ''));

      const buffer = await file.arrayBuffer();
      await loadFile(buffer, file.name, '', pageConfig);
    };

    return (
      <>
        <ImportProgressOverlay
          open={loading && !!progress}
          title={importingTitle}
          progress={progress ?? { stage: 'decoding', percent: 0, message: '准备中…' }}
          onCancel={cancel}
        />
        <Bookshelf onOpenBook={handleOpenBook} onImportBook={handleImportBook} />
        <OnboardingGuide
          isOpen={showGuide}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipGuide}
          onComplete={completeGuide}
        />
      </>
    );
  }

  /* ================================================================
     READING VIEW (book loaded)
     ================================================================ */
  return (
    <div data-theme={theme} className="flex flex-col h-screen w-screen overflow-hidden">
      {/* ---- Reading area ---- */}
      <div className="flex-1 relative overflow-hidden">
        {/* Back to bookshelf button */}
        <button
          onClick={() => closeBook()}
          className="absolute top-4 left-4 z-20 p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: nightMode ? 'rgba(38,38,38,0.8)' : 'rgba(255,255,255,0.8)',
            color: nightMode ? 'rgba(212,197,169,0.7)' : 'rgba(0,0,0,0.6)',
          }}
          title="返回书架"
          aria-label="返回书架"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

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

      {/* ---- Onboarding Guide ---- */}
      <OnboardingGuide
        isOpen={showGuide}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipGuide}
        onComplete={completeGuide}
      />
    </div>
  );
}

export default App;
