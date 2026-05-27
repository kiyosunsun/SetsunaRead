import { useState, useCallback, useRef } from 'react';
import { useBookStore } from '../stores/bookStore';

/* ---------------------------------------------------------------------------
   Search Result Type
   --------------------------------------------------------------------------- */
export interface SearchResult {
  /** 字符偏移量（在完整内容中的位置） */
  charIndex: number;
  /** 对应页码（0-indexed） */
  pageIndex: number;
  /** 显示页码（1-indexed） */
  pageNumber: number;
  /** 匹配在内容中的索引 */
  matchIndex: number;
  /** 上下文文本 */
  context: string;
  /** 匹配起始位置 */
  matchStart: number;
  /** 匹配长度 */
  matchLength: number;
}

/* ---------------------------------------------------------------------------
   useSearch Hook

   Multi-column 方案：
   - 在完整 content 中搜索
   - 根据字符偏移量计算对应页码
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
      const { content, totalPages } = useBookStore.getState();
      const lowerQuery = searchQuery.toLowerCase();
      const found: SearchResult[] = [];

      if (!content) {
        setResults([]);
        setActiveIndex(-1);
        setIsSearching(false);
        return;
      }

      const lowerContent = content.toLowerCase();
      let startIndex = 0;

      while (startIndex < lowerContent.length) {
        const matchIndex = lowerContent.indexOf(lowerQuery, startIndex);
        if (matchIndex === -1) break;

        // 根据字符偏移量估算页码
        const estimatedPage = totalPages > 0
          ? Math.min(Math.floor((matchIndex / content.length) * totalPages), totalPages - 1)
          : 0;

        // Extract context: ~40 chars before and after the match
        const contextStart = Math.max(0, matchIndex - 40);
        const contextEnd = Math.min(content.length, matchIndex + searchQuery.length + 40);
        const contextText = (contextStart > 0 ? '...' : '') +
          content.slice(contextStart, contextEnd) +
          (contextEnd < content.length ? '...' : '');

        found.push({
          charIndex: matchIndex,
          pageIndex: estimatedPage,
          pageNumber: estimatedPage + 1,
          matchIndex,
          context: contextText,
          matchStart: matchIndex - contextStart,
          matchLength: searchQuery.length,
        });

        startIndex = matchIndex + 1;
      }

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
