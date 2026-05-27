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
import { usePageSize } from './hooks/usePageSize';
import { useBookStore } from './stores/bookStore';
import { useSettingsStore } from './stores/settingsStore';
import { loadBookFile, getFileStats } from './lib/fileStorage';
import { getCache, setCache, hashPageConfig } from './lib/bookCache';

/* ---------------------------------------------------------------------------
   App - Main application shell for SetsunaRead.

   ## Multi-column 分页方案

   数据流：
   1. useBookParser.loadFile() 解析文件，返回测量结果
   2. App 调用 setBookData() 存储完整内容和分页信息
   3. Page 组件用 Multi-column 渲染，transform 控制显示哪页

   管理两个顶层视图：
     1. Bookshelf      - 无书籍时显示（浏览和导入书籍）
     2. Reading view   - 有书籍时显示（阅读模式 + 工具栏 + 面板）
   --------------------------------------------------------------------------- */
function App() {
  /* ---- Reading mode ---- */
  const [readingMode, setReadingMode] = useState<ReadingMode>('dual');

  /* ---- Panel visibility ---- */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterListOpen, setChapterListOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);

  /* ---- Bookshelf importing UI ---- */
  const [importingTitle, setImportingTitle] = useState('');

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
  const { book, chapters, loadFile, loading, progress, cancel } = useBookParser();
  const {
    addBook,
    openBook,
    closeBook,
    setBookData,
  } = useBookStore();
  const currentBook = useBookStore((s) => s.currentBook);
  const { fontSize, lineHeight, nightMode } = useSettingsStore();
  const pageSize = usePageSize();

  /* ---- Shared theme ---- */
  const pageConfig = useMemo(
    () => ({
      width: pageSize.width,
      height: pageSize.height,
      fontSize,
      fontFamily: 'serif',
      lineHeight,
      /* 与 CSS 保持一致：page-pad(3rem=48px) + header(1.5rem=24px) + body(0.75rem*2=24px) + footer(1.5rem+0.5rem=32px) */
      padding: { top: 48, bottom: 48, left: 48, right: 48 },
    }),
    [pageSize.width, pageSize.height, fontSize, lineHeight],
  );

  /* ---- Sync book metadata to Zustand store ---- */
  useEffect(() => {
    if (book) {
      addBook(book);
      openBook(book);
    }
  }, [book, addBook, openBook]);

  /* ---- Shared theme ---- */
  const theme = nightMode ? 'dark' : 'light';

  /* ================================================================
     BOOKSHELF (no book loaded)
     ================================================================ */
  if (!currentBook) {
    const handleOpenBook = async (bookId: string) => {
      const found = useBookStore.getState().books.find((b) => b.id === bookId);
      if (found) {
        setImportingTitle(found.title);

        // ---- 缓存检查 ----
        const fileStats = await getFileStats(found.filePath);
        const configHash = hashPageConfig(pageConfig);

        if (fileStats) {
          const cached = await getCache(bookId, fileStats.size, fileStats.mtime, configHash);
          if (cached) {
            // 缓存命中，直接使用，跳过 Worker + 分页
            setBookData(cached);
            // 必须调用 openBook 设置 currentBook 并恢复阅读进度
            openBook({ ...found, content: cached.content });
            return;
          }
        }

        // ---- 缓存未命中，走原有管线 ----
        const buffer = await loadBookFile(found.filePath);
        if (buffer) {
          const result = await loadFile(buffer, `${found.title}.txt`, found.filePath, pageConfig);
          if (result) {
            setBookData(result);
            // 写入缓存（静默失败不影响正常流程）
            if (fileStats) {
              setCache(bookId, fileStats.size, fileStats.mtime, configHash, {
                content: result.content,
                chapters: result.chapters,
                pages: result.pages,
                chapterPageMap: result.chapterPageMap,
                totalPages: result.totalPages,
              });
            }
          }
        } else {
          alert('无法读取书籍文件，请确认文件是否存在，或重新导入。');
        }
      }
    };

    const handleImportBook = async (buffer: ArrayBuffer, fileName: string, filePath: string) => {
      if (!fileName.endsWith('.txt')) {
        alert('仅支持 .txt 文件格式。');
        return;
      }

      setImportingTitle(fileName.replace(/\.txt$/i, ''));
      const result = await loadFile(buffer, fileName, filePath, pageConfig);
      if (result) {
        setBookData(result);
        // 首次导入也写入缓存，下次打开秒开
        const fileStats = await getFileStats(filePath);
        if (fileStats && result.book) {
          const configHash = hashPageConfig(pageConfig);
          setCache(result.book.id, fileStats.size, fileStats.mtime, configHash, {
            content: result.content,
            chapters: result.chapters,
            pages: result.pages,
            chapterPageMap: result.chapterPageMap,
            totalPages: result.totalPages,
          });
        }
      }
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
      {/* ---- 阅读区域 ---- */}
      <div className="flex-1 relative overflow-hidden">
        {/* 返回书架按钮 */}
        <button
          onClick={() => closeBook()}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(212,197,169,0.6)',
            backdropFilter: 'blur(8px)',
          }}
          title="返回书架"
          aria-label="返回书架"
        >
          <svg
            className="w-[18px] h-[18px]"
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
        onOpenBookmarkPanel={() => setBookmarkPanelOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* ---- Overlay panels ---- */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ChapterList isOpen={chapterListOpen} onClose={() => setChapterListOpen(false)} chapters={chapters} />
      <BookmarkPanel isOpen={bookmarkPanelOpen} onClose={() => setBookmarkPanelOpen(false)} readingMode={readingMode} />
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

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
