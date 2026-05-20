import { useState, useCallback, useRef } from 'react';
import { useBookStore } from '../stores/bookStore';

/* ---------------------------------------------------------------------------
   Search Result Type
   --------------------------------------------------------------------------- */
export interface SearchResult {
  pageIndex: number;
  pageNumber: number;
  matchIndex: number;
  context: string;
  /** Character offset of the match start within the page content */
  matchStart: number;
  /** Length of the matched query within context */
  matchLength: number;
}

/* ---------------------------------------------------------------------------
   useSearch Hook
   Full-text search across all pages of the currently open book.
   --------------------------------------------------------------------------- */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Core search ---- */
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setActiveIndex(-1);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      const { pages } = useBookStore.getState();
      const lowerQuery = searchQuery.toLowerCase();
      const found: SearchResult[] = [];

      pages.forEach((page, pageIndex) => {
        const lowerContent = page.content.toLowerCase();
        let startIndex = 0;

        while (startIndex < lowerContent.length) {
          const matchIndex = lowerContent.indexOf(lowerQuery, startIndex);
          if (matchIndex === -1) break;

          // Extract context: ~40 chars before and after the match
          const contextStart = Math.max(0, matchIndex - 40);
          const contextEnd = Math.min(page.content.length, matchIndex + searchQuery.length + 40);
          const context = (contextStart > 0 ? '...' : '') +
            page.content.slice(contextStart, contextEnd) +
            (contextEnd < page.content.length ? '...' : '');

          found.push({
            pageIndex,
            pageNumber: page.pageNumber,
            matchIndex,
            context,
            matchStart: matchIndex,
            matchLength: searchQuery.length,
          });

          startIndex = matchIndex + 1;
        }
      });

      setResults(found);
      setActiveIndex(found.length > 0 ? 0 : -1);
      setIsSearching(false);
    }, 200);
  }, []);

  /* ---- Navigation ---- */
  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  const prevResult = useCallback(() => {
    if (results.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  /* ---- Jump to result ---- */
  const goToResult = useCallback((index: number) => {
    if (index < 0 || index >= results.length) return;
    const result = results[index];
    useBookStore.getState().goToPage(result.pageIndex);
    setActiveIndex(index);
  }, [results]);

  /* ---- Highlight matching text in a string ---- */
  const highlightMatch = useCallback(
    (text: string, searchQuery: string): { text: string; isMatch: boolean }[] => {
      if (!searchQuery.trim()) return [{ text, isMatch: false }];

      const lowerText = text.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;

      let index = lowerText.indexOf(lowerQuery, lastIndex);
      while (index !== -1) {
        if (index > lastIndex) {
          parts.push({ text: text.slice(lastIndex, index), isMatch: false });
        }
        parts.push({
          text: text.slice(index, index + searchQuery.length),
          isMatch: true,
        });
        lastIndex = index + searchQuery.length;
        index = lowerText.indexOf(lowerQuery, lastIndex);
      }

      if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), isMatch: false });
      }

      return parts.length > 0 ? parts : [{ text, isMatch: false }];
    },
    [],
  );

  /* ---- Clear ---- */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    setIsSearching(false);
  }, []);

  return {
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
  };
}

export default useSearch;
