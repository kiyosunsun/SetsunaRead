import { useState, useCallback, useRef, useEffect } from 'react';
import type { Page, PageConfig } from '@/types/book';

/**
 * Pagination hook for SetsunaRead.
 *
 * Uses a hidden DOM measurement container and binary search to determine
 * how many characters fit on each page, then splits content accordingly.
 *
 * Returns pages, navigation state, and controls.
 */
export function usePagination(
  content: string,
  config: PageConfig,
) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const measureRef = useRef<HTMLDivElement | null>(null);

  // ---- Hidden measurement container setup ----

  useEffect(() => {
    // Create a hidden off-screen measurement container once
    if (!measureRef.current) {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.whiteSpace = 'pre-wrap';
      el.style.wordBreak = 'break-all';
      el.style.pointerEvents = 'none';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      measureRef.current = el;
    }

    return () => {
      if (measureRef.current) {
        measureRef.current.remove();
        measureRef.current = null;
      }
    };
  }, []);

  /**
   * Configure the measurement container to match the current page layout.
   */
  const configureMeasureContainer = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    const contentWidth = config.width - config.padding.left - config.padding.right;
    const contentHeight = config.height - config.padding.top - config.padding.bottom;

    el.style.width = `${contentWidth}px`;
    el.style.height = `${contentHeight}px`;
    el.style.fontSize = `${config.fontSize}px`;
    el.style.fontFamily = config.fontFamily;
    el.style.lineHeight = `${config.lineHeight}`;
    el.style.overflow = 'hidden';
  }, [config]);

  /**
   * Measure how many characters from `text` fit inside the measurement container.
   * Returns the index of the last character that fits.
   */
  const measureChars = useCallback(
    (text: string): number => {
      const el = measureRef.current;
      if (!el || text.length === 0) return text.length;

      configureMeasureContainer();
      el.textContent = text;

      // Check if the full text fits
      if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) {
        const len = text.length;
        el.textContent = '';
        return len;
      }

      // Binary search for the largest prefix that fits
      let low = 0;
      let high = text.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        el.textContent = text.slice(0, mid);

        const fits = el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth;

        if (fits) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      el.textContent = '';
      return best;
    },
    [configureMeasureContainer],
  );

  /**
   * Find a natural break point near `cutIndex` by looking backward for a
   * newline or paragraph boundary. This avoids splitting mid-sentence when
   * possible, but only searches up to `lookback` characters behind.
   */
  const findNaturalBreak = useCallback(
    (text: string, cutIndex: number, lookback: number = 100): number => {
      if (cutIndex >= text.length) return text.length;

      const start = Math.max(0, cutIndex - lookback);
      const segment = text.slice(start, cutIndex);

      // Prefer paragraph breaks, then line breaks
      const lastParagraph = segment.lastIndexOf('\n\n');
      if (lastParagraph >= 0) {
        return start + lastParagraph + 2;
      }

      const lastNewline = segment.lastIndexOf('\n');
      if (lastNewline >= 0) {
        return start + lastNewline + 1;
      }

      // Try sentence-ending punctuation
      const lastPeriod = segment.lastIndexOf('。');
      if (lastPeriod >= 0) {
        return start + lastPeriod + 1;
      }

      return cutIndex;
    },
    [],
  );

  /**
   * Split content into pages using the measurement container and binary search.
   */
  const paginate = useCallback(
    (fullContent: string): Page[] => {
      if (!fullContent || fullContent.length === 0) return [];

      const result: Page[] = [];
      let offset = 0;
      let pageNumber = 1;

      while (offset < fullContent.length) {
        const remaining = fullContent.slice(offset);
        const maxChars = measureChars(remaining);

        if (maxChars === 0) {
          // Safety: avoid infinite loop if container can't fit anything
          break;
        }

        let cutIndex = Math.min(maxChars, remaining.length);

        // Attempt to break at a natural boundary
        if (cutIndex < remaining.length) {
          cutIndex = findNaturalBreak(remaining, cutIndex);
        }

        result.push({
          content: remaining.slice(0, cutIndex),
          pageNumber,
        });

        offset += cutIndex;
        pageNumber++;
      }

      return result;
    },
    [measureChars, findNaturalBreak],
  );

  // ---- Re-paginate when content or config changes ----

  useEffect(() => {
    if (!content) {
      setPages([]);
      setCurrentPage(1);
      setTotalPages(0);
      return;
    }

    const newPages = paginate(content);
    setPages(newPages);
    setTotalPages(newPages.length);
    setCurrentPage((prev) => (prev > newPages.length ? 1 : prev));
  }, [content, config, paginate]);

  // ---- Navigation ----

  const goToPage = useCallback(
    (page: number) => {
      if (totalPages === 0) return;
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    pages,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  };
}

export default usePagination;
