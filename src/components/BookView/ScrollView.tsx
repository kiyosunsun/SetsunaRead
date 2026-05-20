import React, { useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   ScrollView Component
   Renders all pages in a vertical sequence with page numbers between sections.
   Simple scrolling reading mode with no pagination — the entire book is
   laid out top to bottom.
   --------------------------------------------------------------------------- */
const ScrollView: React.FC = () => {
  const { pages } = useBookStore();
  const { nightMode } = useSettingsStore();

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
      className={`w-full h-full overflow-y-auto select-none ${bgClass}`}
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="flex flex-col items-center gap-10 py-12">
        {pages.map((page, index) => (
          <React.Fragment key={page.pageNumber}>
            {/* Single page with drop shadow */}
            <div
              className="relative overflow-hidden"
              style={{
                width: '480px',
                height: '660px',
                borderRadius: '6px',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <Page
                content={page.content}
                pageNumber={page.pageNumber}
                isLeft={false}
              />
            </div>

            {/* Page number divider between sections */}
            {index < pages.length - 1 && (
              <div
                className="flex items-center gap-4 select-none"
                style={{
                  color: nightMode
                    ? 'rgba(212,197,169,0.35)'
                    : 'rgba(255,255,255,0.35)',
                }}
              >
                <div
                  className="h-px w-12"
                  style={{
                    background: nightMode
                      ? 'rgba(212,197,169,0.2)'
                      : 'rgba(255,255,255,0.2)',
                  }}
                />
                <span className="text-xs tracking-widest uppercase">
                  {page.pageNumber}
                </span>
                <div
                  className="h-px w-12"
                  style={{
                    background: nightMode
                      ? 'rgba(212,197,169,0.2)'
                      : 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* End-of-book indicator */}
        <div
          className="text-sm tracking-wide select-none py-4"
          style={{
            color: nightMode
              ? 'rgba(212,197,169,0.3)'
              : 'rgba(255,255,255,0.3)',
          }}
        >
          End of book
        </div>
      </div>
    </div>
  );
};

export default ScrollView;
