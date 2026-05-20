import { useState, useCallback } from 'react';
import type { Book, Chapter, Page, PageConfig } from '@/types/book';

/**
 * TXT file parser hook for SetsunaRead.
 * Provides encoding detection, chapter parsing, and paginated content splitting.
 */

// --- Encoding Detection ---

/**
 * Detect text encoding from raw bytes using TextDecoder trial decoding.
 * Falls back to UTF-8 if all decodings fail.
 */
export function detectEncoding(
  buffer: ArrayBuffer,
): string {
  const bytes = new Uint8Array(buffer);
  const encodings: string[] = [
    'utf-8',
    'gbk',
    'gb2312',
    'gb18030',
    'big5',
    'euc-kr',
    'shift_jis',
    'iso-8859-1',
  ];

  let bestEncoding = 'utf-8';
  let bestScore = -1;

  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      decoder.decode(bytes);
      // If no error, score by replacement character density
      const lossyDecoder = new TextDecoder(encoding, { fatal: false });
      const decoded = lossyDecoder.decode(bytes);
      const replacements = (decoded.match(/�/g) || []).length;
      const score = 1 - replacements / decoded.length;
      if (score > bestScore) {
        bestScore = score;
        bestEncoding = encoding;
      }
    } catch {
      // Encoding not supported by this runtime, skip
    }
  }

  return bestEncoding;
}

// --- Chapter Detection ---

/**
 * Common chapter heading regex patterns for Chinese novels.
 * Patterns are ordered from most specific to most general.
 */
const CHAPTER_PATTERNS: RegExp[] = [
  /第[一二三四五六七八九十百千万零\d]+章[^\n]*/g,
  /第[一二三四五六七八九十百千万零\d]+节[^\n]*/g,
  /第[一二三四五六七八九十百千万零\d]+回[^\n]*/g,
  /第[一二三四五六七八九十百千万零\d]+卷[^\n]*/g,
  /Chapter\s+\d+[^\n]*/gi,
  /CHAPTER\s+\d+[^\n]*/g,
  /第\d+章[^\n]*/g,
  /第\d+节[^\n]*/g,
];

/**
 * Parse chapter structure from book content.
 * Returns an array of Chapter objects with title and position info.
 * If no chapters are detected, returns the entire content as a single chapter.
 */
export function parseChapters(content: string): Chapter[] {
  const chapters: Chapter[] = [];
  const seenPositions = new Set<number>();

  for (const pattern of CHAPTER_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const index = match.index;
      if (!seenPositions.has(index)) {
        seenPositions.add(index);
        chapters.push({
          title: match[0].trim(),
          startIndex: index,
          endIndex: 0, // Will be set in the next step
        });
      }
    }
  }

  // Sort chapters by position in the text
  chapters.sort((a, b) => a.startIndex - b.startIndex);

  // Set endIndex for each chapter
  for (let i = 0; i < chapters.length; i++) {
    chapters[i].endIndex =
      i + 1 < chapters.length ? chapters[i + 1].startIndex : content.length;
  }

  // If no chapters detected, treat the whole file as one chapter
  if (chapters.length === 0 && content.length > 0) {
    chapters.push({
      title: '全文',
      startIndex: 0,
      endIndex: content.length,
    });
  }

  return chapters;
}

// --- Pagination ---

/**
 * Split content into pages based on the given PageConfig dimensions.
 * Uses a simple character-count estimation for page breaks.
 */
export function paginateContent(
  content: string,
  config: PageConfig,
): Page[] {
  const { width, height, fontSize, lineHeight, padding } = config;

  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;

  // Estimate characters per line and lines per page
  const charsPerLine = Math.floor(contentWidth / fontSize);
  const linesPerPage = Math.floor(contentHeight / lineHeight);
  const charsPerPage = Math.max(charsPerLine * linesPerPage, 1);

  const pages: Page[] = [];
  let remaining = content;
  let pageNumber = 1;

  while (remaining.length > 0) {
    let cutIndex = Math.min(charsPerPage, remaining.length);

    // Try to break at a natural boundary (newline or paragraph)
    if (cutIndex < remaining.length) {
      const lookback = Math.min(100, cutIndex);
      const segment = remaining.slice(cutIndex - lookback, cutIndex);
      const lastNewline = segment.lastIndexOf('\n');
      if (lastNewline > 0) {
        cutIndex = cutIndex - lookback + lastNewline + 1;
      }
    }

    pages.push({
      content: remaining.slice(0, cutIndex),
      pageNumber,
    });

    remaining = remaining.slice(cutIndex);
    pageNumber++;
  }

  return pages;
}

// --- Main Hook ---

export interface UseBookParserReturn {
  book: Book | null;
  chapters: Chapter[];
  pages: Page[];
  loading: boolean;
  loadFile: (
    input: ArrayBuffer | string,
    fileName: string,
    filePath: string,
    pageConfig: PageConfig,
  ) => Promise<void>;
}

export function useBookParser(): UseBookParserReturn {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFile = useCallback(
    async (
      input: ArrayBuffer | string,
      fileName: string,
      filePath: string,
      pageConfig: PageConfig,
    ): Promise<void> => {
      setLoading(true);
      try {
        let content: string;

        if (typeof input === 'string') {
          content = input;
        } else {
          const encoding = detectEncoding(input);
          const decoder = new TextDecoder(encoding);
          content = decoder.decode(input);
        }

        // Strip BOM if present
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }

        const bookData: Book = {
          id: crypto.randomUUID(),
          title: fileName.replace(/\.txt$/i, ''),
          filePath,
          content,
          size: typeof input === 'string'
            ? new TextEncoder().encode(input).byteLength
            : input.byteLength,
          lastRead: Date.now(),
        };

        const detectedChapters = parseChapters(content);
        const paginatedPages = paginateContent(content, pageConfig);

        setBook(bookData);
        setChapters(detectedChapters);
        setPages(paginatedPages);
      } catch (err) {
        console.error('Failed to load book:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { book, chapters, pages, loading, loadFile };
}
