import React, { useEffect, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   SinglePage Component
   Displays one page centered on screen, with keyboard navigation and a
   subtle drop shadow for depth. Designed as a simpler reading mode.
   --------------------------------------------------------------------------- */
const SinglePage: React.FC = () => {
  const { pages, currentPage, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  const pageData = pages[currentPage] ?? null;

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
      }
    },
    [nextPage, prevPage],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ---- Empty state ---- */
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-400 select-none">
        No pages loaded. Open a book to start reading.
      </div>
    );
  }

  return (
    <div className="reader-desk flex items-center justify-center w-full h-full select-none">
      {/* Centered page with drop shadow */}
      <div
        className="reader-book relative overflow-hidden"
        style={{
          width: '480px',
          height: '660px',
          borderRadius: '6px',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {pageData ? (
          <Page
            className="reader-paper"
            content={pageData.content}
            pageNumber={pageData.pageNumber}
            isLeft={false}
          />
        ) : (
          <div className="w-full h-full bg-transparent" />
        )}
      </div>

      {/* Page indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-wide select-none"
        style={{
          color: nightMode ? 'rgba(212,197,169,0.45)' : 'rgba(0,0,0,0.45)',
        }}
      >
        {pageData?.pageNumber ?? '?'}  {pages.length}
      </div>
    </div>
  );
};

export default SinglePage;
