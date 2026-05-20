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

  const bgClass = nightMode ? 'bg-neutral-950' : 'bg-neutral-800';

  return (
    <div
      className={`flex items-center justify-center w-full h-full select-none ${bgClass}`}
    >
      {/* Centered page with drop shadow */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '480px',
          height: '660px',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {pageData ? (
          <Page
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
          color: nightMode ? 'rgba(212,197,169,0.45)' : 'rgba(255,255,255,0.45)',
        }}
      >
        {pageData?.pageNumber ?? '?'} &ndash; {pages.length}
      </div>
    </div>
  );
};

export default SinglePage;
