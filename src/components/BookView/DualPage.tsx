import React, { useEffect, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   DualPage Component
   Displays two pages side-by-side like an open physical book.
   Includes keyboard navigation, 3D perspective, book spine, and book edge.
   --------------------------------------------------------------------------- */
const DualPage: React.FC = () => {
  const { pages, currentPage, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  /* ---- Left and right page indices (currentPage is 0-indexed) ---- */
  const leftPageIndex = currentPage;
  const rightPageIndex = currentPage + 1;

  const leftPage = pages[leftPageIndex] ?? null;
  const rightPage = pages[rightPageIndex] ?? null;

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      /* Ignore if the user is typing in an input or textarea */
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

  /* ---- Dark surface behind the book for contrast ---- */
  const bgClass = nightMode
    ? 'bg-neutral-950'
    : 'bg-neutral-800';

  return (
    <div
      className={`flex items-center justify-center w-full h-full select-none ${bgClass}`}
      style={{ perspective: '1800px' }}
    >
      {/* 3D container that gives the open-book illusion */}
      <div
        className="flex items-stretch relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-2deg) rotateX(1deg)',
          transition: 'transform 0.4s ease',
        }}
      >
        {/* ---- Left page ---- */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '480px',
            height: '660px',
            transformStyle: 'preserve-3d',
            transformOrigin: 'right center',
            transform: 'rotateY(3deg)',
            borderRadius: '6px 0 0 6px',
            boxShadow: '-4px 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          {leftPage ? (
            <Page
              content={leftPage.content}
              pageNumber={leftPage.pageNumber}
              isLeft={true}
            />
          ) : (
            <div className="w-full h-full bg-transparent" />
          )}
        </div>

        {/* ---- Book spine (binding gutter) ---- */}
        <div
          className="relative flex-shrink-0"
          style={{
            width: '24px',
            height: '660px',
            background: nightMode
              ? 'linear-gradient(90deg, #0d0d0d 0%, #1a1a2e 30%, #1a1a2e 70%, #0d0d0d 100%)'
              : 'linear-gradient(90deg, #5c3d1e 0%, #8b6914 30%, #a0792d 50%, #8b6914 70%, #5c3d1e 100%)',
            boxShadow: `
              inset 2px 0 6px rgba(0,0,0,0.5),
              inset -2px 0 6px rgba(0,0,0,0.5),
              0 4px 12px rgba(0,0,0,0.4)
            `,
            borderRadius: '2px',
          }}
        >
          {/* Spine highlight line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
            style={{
              width: '2px',
              background: nightMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.25)',
            }}
          />
        </div>

        {/* ---- Right page ---- */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '480px',
            height: '660px',
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: 'rotateY(-3deg)',
            borderRadius: '0 6px 6px 0',
            boxShadow: '4px 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          {rightPage ? (
            <Page
              content={rightPage.content}
              pageNumber={rightPage.pageNumber}
              isLeft={false}
            />
          ) : (
            <div className="w-full h-full bg-transparent" />
          )}
        </div>

        {/* ---- Book edge (stacked page thickness on the right) ---- */}
        <div
          className="absolute"
          style={{
            right: '-8px',
            top: '4px',
            width: '8px',
            height: '656px',
            borderRadius: '0 4px 4px 0',
            background: nightMode
              ? 'linear-gradient(180deg, #2a2a3a 0%, #1f1f30 100%)'
              : 'linear-gradient(180deg, #f0e6d2 0%, #e8dcc4 50%, #ddd0b8 100%)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      {/* ---- Page indicator ---- */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-wide select-none"
        style={{
          color: nightMode ? 'rgba(212,197,169,0.45)' : 'rgba(255,255,255,0.45)',
        }}
      >
        {leftPage?.pageNumber ?? '?'} &ndash;{' '}
        {rightPage?.pageNumber ?? pages.length}
      </div>
    </div>
  );
};

export default DualPage;
