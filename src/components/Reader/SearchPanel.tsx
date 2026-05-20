import React, { useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSearch, type SearchResult } from '../../hooks/useSearch';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
   SearchPanel Props
   --------------------------------------------------------------------------- */
interface SearchPanelProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/* ---------------------------------------------------------------------------
   SearchPanel Component
   Slide-in side panel for full-text search across all pages of the current book.
   Shows search input, results list with page numbers, and navigation controls.
   --------------------------------------------------------------------------- */
const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const { nightMode } = useSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  const {
    query,
    results,
    activeIndex,
    isSearching,
    search,
    nextResult,
    prevResult,
    goToResult,
    highlightMatch,
    clearSearch,
  } = useSearch();

  /* ---- Auto-focus input when opened ---- */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to allow the animation to start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ---- Scroll active result into view ---- */
  useEffect(() => {
    if (activeIndex >= 0 && resultsListRef.current) {
      const activeEl = resultsListRef.current.querySelector(`[data-result-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeIndex]);

  /* ---- Keyboard shortcuts ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          prevResult();
        } else {
          nextResult();
        }
      }
    },
    [onClose, nextResult, prevResult],
  );

  /* ---- Handle result click ---- */
  const handleResultClick = useCallback(
    (index: number) => {
      goToResult(index);
      onClose();
    },
    [goToResult, onClose],
  );

  /* ---- Handle input change ---- */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      search(e.target.value);
    },
    [search],
  );

  /* ---- Handle clear button ---- */
  const handleClear = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  /* Don't render when closed */
  if (!isOpen) return null;

  /* Style helpers */
  const bgClass = nightMode ? 'bg-neutral-900' : 'bg-white';
  const borderClass = nightMode ? 'border-neutral-700' : 'border-gray-200';
  const textClass = nightMode ? 'text-neutral-200' : 'text-gray-800';
  const textMutedClass = nightMode ? 'text-neutral-500' : 'text-gray-400';
  const hoverClass = nightMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50';
  const inputBgClass = nightMode ? 'bg-neutral-800' : 'bg-gray-100';
  const inputBorderClass = nightMode ? 'border-neutral-600' : 'border-gray-300';
  const highlightBgClass = nightMode ? 'bg-amber-600/30' : 'bg-amber-200';
  const activeBgClass = nightMode ? 'bg-neutral-700' : 'bg-gray-100';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={handleKeyDown}
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
          <h2 className={cn('text-lg font-semibold', textClass)}>Search</h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
            )}
            title="Close search"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Search Input ---- */}
        <div className={cn('px-5 py-3 border-b', borderClass)}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className={cn('w-4 h-4', textMutedClass)}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search in book..."
              className={cn(
                'w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                inputBgClass,
                inputBorderClass,
                'focus:border-amber-500',
                textClass,
              )}
              aria-label="Search query"
            />
            {query && (
              <button
                onClick={handleClear}
                className={cn(
                  'absolute inset-y-0 right-0 pr-3 flex items-center',
                  textMutedClass,
                  'hover:text-current transition-colors',
                )}
                title="Clear search"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ---- Result count and navigation ---- */}
          {query && (
            <div className="flex items-center justify-between mt-2">
              <span className={cn('text-xs', textMutedClass)}>
                {isSearching
                  ? 'Searching...'
                  : results.length === 0
                    ? 'No results found'
                    : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
              </span>
              {results.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className={cn('text-xs mr-2', textMutedClass)}>
                    {activeIndex + 1} / {results.length}
                  </span>
                  <button
                    onClick={prevResult}
                    className={cn(
                      'p-1 rounded transition-colors',
                      nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
                    )}
                    title="Previous result (Shift+Enter)"
                    aria-label="Previous result"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextResult}
                    className={cn(
                      'p-1 rounded transition-colors',
                      nightMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500',
                    )}
                    title="Next result (Enter)"
                    aria-label="Next result"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Results List ---- */}
        <div ref={resultsListRef} className="flex-1 overflow-y-auto overscroll-contain">
          {!query ? (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className={cn('text-sm', textMutedClass)}>
                Type to search through the book.
              </p>
              <p className={cn('text-xs mt-2', textMutedClass)}>
                Press Enter for next result, Shift+Enter for previous.
              </p>
            </div>
          ) : results.length === 0 && !isSearching ? (
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className={cn('text-sm', textMutedClass)}>
                No results found for "{query}"
              </p>
            </div>
          ) : (
            <ul className="py-1" role="listbox" aria-label="Search results">
              {results.map((result, index) => {
                const isActive = index === activeIndex;
                const contextParts = highlightMatch(result.context, query);

                return (
                  <li
                    key={`${result.pageIndex}-${result.matchIndex}`}
                    data-result-index={index}
                    role="option"
                    aria-selected={isActive}
                  >
                    <button
                      onClick={() => handleResultClick(index)}
                      className={cn(
                        'w-full text-left px-5 py-3 transition-colors',
                        hoverClass,
                        isActive && activeBgClass,
                      )}
                    >
                      {/* Page number badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            isActive
                              ? 'bg-amber-600 text-white'
                              : nightMode
                                ? 'bg-neutral-700 text-neutral-300'
                                : 'bg-gray-200 text-gray-700',
                          )}
                        >
                          Page {result.pageNumber}
                        </span>
                      </div>

                      {/* Context with highlighted match */}
                      <p className={cn('text-sm leading-relaxed', textClass)}>
                        {contextParts.map((part, partIndex) =>
                          part.isMatch ? (
                            <mark
                              key={partIndex}
                              className={cn(
                                'px-0.5 rounded font-medium',
                                highlightBgClass,
                                nightMode ? 'text-amber-200' : 'text-amber-900',
                              )}
                            >
                              {part.text}
                            </mark>
                          ) : (
                            <span key={partIndex}>{part.text}</span>
                          ),
                        )}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---- Footer: keyboard hints ---- */}
        {query && results.length > 0 && (
          <div className={cn('px-5 py-3 border-t text-center shrink-0', borderClass)}>
            <span className={cn('text-xs', textMutedClass)}>
              Enter next / Shift+Enter previous / Esc close
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

export default SearchPanel;
