import { useState, useCallback, useRef, useEffect } from 'react';
import type { Book, Chapter, Page, PageConfig } from '@/types/book';
import type { ImportProgress } from '@/types/importProgress';

type ProgressStage = ImportProgress['stage'];

type WorkerRequestMsg =
  | {
      type: 'parse';
      requestId: string;
      fileName: string;
      filePath: string;
      buffer?: ArrayBuffer;
      content?: string;
      pageConfig: PageConfig;
    }
  | { type: 'cancel'; requestId: string };

type WorkerProgressMsg = {
  type: 'progress';
  requestId: string;
  stage: ProgressStage;
  percent: number;
  message: string;
};

type WorkerResultMsg = {
  type: 'result';
  requestId: string;
  book: Book;
  chapters: Chapter[];
  pages: Page[];
};

type WorkerErrorMsg = {
  type: 'error';
  requestId: string;
  message: string;
};

type WorkerMsg = WorkerProgressMsg | WorkerResultMsg | WorkerErrorMsg;

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
 * 在主线程中用隐藏 DOM 容器精确分页。
 * 使用与实际渲染完全相同的样式测量，确保分页结果准确。
 */
export function paginateContent(
  content: string,
  config: PageConfig,
): Page[] {
  const { width, height, fontSize, lineHeight, fontFamily, padding } = config;

  // 创建隐藏的测量容器（与 Page 组件样式完全一致）
  const measureEl = document.createElement('div');
  measureEl.style.position = 'absolute';
  measureEl.style.visibility = 'hidden';
  measureEl.style.top = '-9999px';
  measureEl.style.left = '-9999px';
  measureEl.style.width = `${width}px`;
  measureEl.style.height = `${height}px`;
  measureEl.style.fontSize = `${fontSize}px`;
  measureEl.style.fontFamily =
    fontFamily === 'serif'
      ? '"Noto Serif SC", "Noto Serif", "Source Serif Pro", Georgia, serif'
      : fontFamily === 'sans-serif'
        ? '"Noto Sans SC", "Inter", "Noto Sans", "Helvetica Neue", sans-serif'
        : '"JetBrains Mono", "Fira Code", monospace';
  measureEl.style.lineHeight = `${lineHeight}`;
  measureEl.style.paddingTop = `${padding.top}px`;
  measureEl.style.paddingBottom = `${padding.bottom}px`;
  measureEl.style.paddingLeft = `${padding.left}px`;
  measureEl.style.paddingRight = `${padding.right}px`;
  measureEl.style.overflow = 'hidden';
  measureEl.style.whiteSpace = 'pre-wrap';
  measureEl.style.wordWrap = 'break-word';
  measureEl.style.overflowWrap = 'break-word';
  measureEl.style.textAlign = 'justify';

  document.body.appendChild(measureEl);

  try {
    const pages: Page[] = [];
    let remaining = content;
    let pageNumber = 1;

    while (remaining.length > 0) {
      // 设置内容并测量
      measureEl.textContent = remaining;

      // 如果内容能完全放下，直接返回
      if (measureEl.scrollHeight <= measureEl.clientHeight) {
        pages.push({
          content: remaining,
          pageNumber,
        });
        break;
      }

      // 二分查找：找到能放下多少字符
      let low = 0;
      let high = remaining.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        measureEl.textContent = remaining.slice(0, mid);

        if (measureEl.scrollHeight <= measureEl.clientHeight) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      // 找到自然断点（段落或句子边界）
      let cutIndex = best;
      if (cutIndex < remaining.length) {
        const lookahead = 200;
        const ahead = remaining.slice(cutIndex, cutIndex + lookahead);
        const paraStart = ahead.search(/[　\n]/);
        if (paraStart >= 0) {
          const breakAt = cutIndex + paraStart;
          const beforePara = remaining.slice(Math.max(0, breakAt - 2), breakAt);
          const lastSentenceEnd = Math.max(
            beforePara.lastIndexOf('。'),
            beforePara.lastIndexOf('！'),
            beforePara.lastIndexOf('？'),
            beforePara.lastIndexOf('\n'),
          );
          cutIndex = lastSentenceEnd >= 0 ? breakAt - 2 + lastSentenceEnd + 1 : breakAt;
        } else {
          const lookbackStart = Math.max(0, cutIndex - 80);
          const behind = remaining.slice(lookbackStart, cutIndex);
          const bestPunct = Math.max(
            behind.lastIndexOf('。'),
            behind.lastIndexOf('！'),
            behind.lastIndexOf('？'),
          );
          if (bestPunct >= 0) cutIndex = lookbackStart + bestPunct + 1;
        }
      }

      // 安全检查
      if (cutIndex === 0) {
        cutIndex = Math.min(100, remaining.length);
      }

      pages.push({
        content: remaining.slice(0, cutIndex),
        pageNumber,
      });

      remaining = remaining.slice(cutIndex);
      pageNumber++;
    }

    return pages;
  } finally {
    // 清理测量容器
    document.body.removeChild(measureEl);
  }
}

// --- Main Hook ---

export interface UseBookParserReturn {
  book: Book | null;
  chapters: Chapter[];
  pages: Page[];
  loading: boolean;
  progress: ImportProgress | null;
  cancel: () => void;
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
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      activeRequestIdRef.current = null;
    };
  }, []);

  const cancel = useCallback(() => {
    const id = activeRequestIdRef.current;
    const worker = workerRef.current;
    if (!id || !worker) return;

    worker.postMessage({ type: 'cancel', requestId: id } satisfies WorkerRequestMsg);
    activeRequestIdRef.current = null;
    setLoading(false);
    setProgress(null);
  }, []);

  const loadFile = useCallback(
    async (
      input: ArrayBuffer | string,
      fileName: string,
      filePath: string,
      pageConfig: PageConfig,
    ): Promise<void> => {
      setLoading(true);
      setProgress({ stage: 'reading', percent: 0, message: '准备开始…' });

      try {
        if (!workerRef.current) {
          workerRef.current = new Worker(new URL('../workers/txtParser.worker.ts', import.meta.url), {
            type: 'module',
          });
        }

        const worker = workerRef.current;
        const requestId = crypto.randomUUID();
        activeRequestIdRef.current = requestId;

        const result = await new Promise<WorkerResultMsg>((resolve, reject) => {
          const onMessage = (ev: MessageEvent<WorkerMsg>) => {
            const msg = ev.data;
            if (msg.requestId !== requestId) return;

            if (msg.type === 'progress') {
              setProgress({ stage: msg.stage, percent: msg.percent, message: msg.message });
              return;
            }

            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);

            if (msg.type === 'result') resolve(msg);
            else reject(new Error(msg.message));
          };

          const onError = () => {
            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);
            reject(new Error('解析失败'));
          };

          worker.addEventListener('message', onMessage);
          worker.addEventListener('error', onError);

          if (typeof input === 'string') {
            worker.postMessage({
              type: 'parse',
              requestId,
              fileName,
              filePath,
              content: input,
              pageConfig,
            } satisfies WorkerRequestMsg);
          } else {
            worker.postMessage(
              {
                type: 'parse',
                requestId,
                fileName,
                filePath,
                buffer: input,
                pageConfig,
              } satisfies WorkerRequestMsg,
              [input],
            );
          }
        });

        if (activeRequestIdRef.current !== requestId) return;

        setBook(result.book);
        setChapters(result.chapters);
        setPages(result.pages);
        setProgress(null);
      } catch (err) {
        console.error('Failed to load book:', err);
        throw err;
      } finally {
        if (activeRequestIdRef.current === null) {
          // canceled
          return;
        }

        activeRequestIdRef.current = null;
        setLoading(false);
      }
    },
    [],
  );

  return { book, chapters, pages, loading, progress, cancel, loadFile };
}

export default useBookParser;
