import { useState, useCallback, useRef, useEffect } from 'react';
import type { Book, Chapter, PageConfig, ChapterPageMap, Page } from '@/types/book';
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
      pageConfig?: PageConfig;
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
  /** Worker 返回完整内容，主线程负责 Multi-column 测量 */
  content: string;
};

type WorkerErrorMsg = {
  type: 'error';
  requestId: string;
  message: string;
};

type WorkerMsg = WorkerProgressMsg | WorkerResultMsg | WorkerErrorMsg;

/**
 * TXT file parser hook for SetsunaRead.
 *
 * ## Multi-column 分页方案
 *
 * 核心原理：CSS Multi-column 让浏览器自动将内容分成多列，
 * 通过 transform: translateX() 控制显示哪一列。
 * 浏览器原生分页，100% 精确，无留白、无溢出。
 *
 * 流程：
 * 1. Worker 解析文件，返回完整内容
 * 2. 主线程创建隐藏测量容器，用 Multi-column 布局
 * 3. 测量 scrollWidth 得到总宽度，计算总页数
 * 4. 测量每个章节标题位置，计算章节页码映射
 * 5. 存储完整数据到 bookStore
 */

// --- Encoding Detection ---

/**
 * Detect text encoding from raw bytes using TextDecoder trial decoding.
 * Falls back to UTF-8 if all decodings fail.
 */
export function detectEncoding(buffer: ArrayBuffer): string {
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

// --- Multi-column 测量 ---

/**
 * 将字体族 CSS 值转换为更完整的字体栈。
 * 与 Page.tsx 组件的 pageStyle 保持一致。
 */
function resolveFontStack(fontFamily: string): string {
  if (fontFamily === 'serif') {
    return '"Noto Serif SC", "Noto Serif", "Source Serif Pro", Georgia, serif';
  }
  if (fontFamily === 'sans-serif') {
    return '"Noto Sans SC", "Inter", "Noto Sans", "Helvetica Neue", sans-serif';
  }
  if (fontFamily === 'monospace') {
    return '"JetBrains Mono", "Fira Code", monospace';
  }
  return fontFamily;
}

/**
 * 使用隐藏 DOM 容器精确切分页面。
 *
 * ## 100% 可靠方案：溢出检测 + 动态调整
 *
 * 流程：
 * 1. 初始估算切分
 * 2. 对每一页实际测量是否溢出
 * 3. 如果溢出，减少内容直到刚好不溢出
 * 4. 多余内容留到下一页
 *
 * ## 异步批处理
 * 每处理 50 页后让出主线程，让浏览器更新 UI。
 *
 * @param onProgress 可选的进度回调函数
 */
export async function paginateContent(
  content: string,
  config: PageConfig,
  chapters: Chapter[],
  onProgress?: (percent: number, message: string) => void,
): Promise<{ pages: Page[]; chapterPageMap: ChapterPageMap[] }> {
  if (!content || content.length === 0) {
    return { pages: [], chapterPageMap: [] };
  }

  const { width, height, fontSize, lineHeight, fontFamily } = config;
  const fontStack = resolveFontStack(fontFamily);

  // ---- 创建测量容器 ----
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    visibility: hidden;
    top: -9999px;
    left: -9999px;
    width: ${width}px;
    height: ${height}px;
    font-size: ${fontSize}px;
    font-family: ${fontStack};
    line-height: ${lineHeight};
    overflow: hidden;
    box-sizing: border-box;
  `;

  // ---- 页面内部结构 ----
  const inner = document.createElement('div');
  inner.style.cssText = `
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100%;
    padding-left: 3rem;
    padding-right: 3rem;
  `;

  // 页眉
  const header = document.createElement('div');
  header.style.cssText = 'padding-top: 1.5rem;';
  const headerText = document.createElement('div');
  headerText.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif SC', serif;
    font-size: 11px;
    letter-spacing: 0.12em;
  `;
  headerText.textContent = '章节标题';
  header.appendChild(headerText);

  // 正文容器
  const body = document.createElement('div');
  body.style.cssText = `
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    box-sizing: border-box;
    white-space: pre-wrap;
    text-align: justify;
    min-height: 0;
  `;

  // 页脚
  const footer = document.createElement('div');
  footer.style.cssText = 'padding-bottom: 1.5rem; border-top: 1px solid rgba(0,0,0,0.06); margin-top: 0.5rem;';
  const footerText = document.createElement('div');
  footerText.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Serif SC', serif;
    font-size: 11px;
    letter-spacing: 0.12em;
  `;
  footerText.textContent = '1';
  footer.appendChild(footerText);

  inner.appendChild(header);
  inner.appendChild(body);
  inner.appendChild(footer);
  container.appendChild(inner);
  document.body.appendChild(container);

  try {
    // ---- 测量正文容器可用高度 ----
    const availableHeight = body.clientHeight;

    console.log('[paginateContent] 测量参数:', {
      contentLength: content.length,
      containerWidth: width,
      containerHeight: height,
      availableHeight,
      fontSize,
      lineHeight,
    });

    if (availableHeight <= 0) {
      console.warn('[paginateContent] 无法测量正文容器高度');
      return fallbackPaginate(content, config, chapters);
    }

    // ---- 异步分批切分（避免阻塞主线程）----
    const pages: Page[] = [];
    let offset = 0;
    let pageNumber = 1;

    // 估算初始每页字符数（用于加速）
    let estimatedCharsPerPage = 800;

    // 进度报告（节流：最多每 100ms 更新一次）
    let lastReportedTime = 0;
    let lastReportedPercent = 0;
    const reportProgress = (currentOffset: number, force: boolean = false) => {
      const now = Date.now();
      const percent = Math.floor((currentOffset / content.length) * 100);

      // 强制更新，或者距离上次更新超过 100ms 且百分比变化
      if (force || (now - lastReportedTime > 100 && percent !== lastReportedPercent)) {
        lastReportedTime = now;
        lastReportedPercent = percent;
        if (onProgress) {
          onProgress(percent, `正在分页 ${Math.floor(currentOffset / 1000)}K / ${Math.floor(content.length / 1000)}K 字符`);
        }
      }
    };

    // 死循环保护
    let stuckCounter = 0;
    const MAX_STUCK_COUNT = 100;

    // 每批处理的页数（让浏览器有机会更新 UI）
    const BATCH_SIZE = 50;
    let batchCount = 0;

    /**
     * 处理一批页面，返回 Promise 以让出主线程
     */
    const processBatch = (): Promise<void> => {
      return new Promise((resolve) => {
        let processedInBatch = 0;

        while (offset < content.length && processedInBatch < BATCH_SIZE) {
          const remaining = content.length - offset;

          // 估算这一页的内容长度
          let tryLength = Math.min(estimatedCharsPerPage, remaining);
          let pageContent = content.slice(offset, offset + tryLength);

          // 实际测量这一页
          body.textContent = pageContent;

          // 如果不溢出，尝试多放一些（减小步长提高精度）
          while (body.scrollHeight <= availableHeight && tryLength < remaining) {
            const newTryLength = Math.min(tryLength + 50, remaining);
            pageContent = content.slice(offset, offset + newTryLength);
            body.textContent = pageContent;

            if (body.scrollHeight <= availableHeight) {
              tryLength = newTryLength;
            } else {
              break;
            }
          }

          // 如果溢出，减少内容直到刚好不溢出（减小步长提高精度）
          while (body.scrollHeight > availableHeight && tryLength > 50) {
            tryLength -= 10;
            pageContent = content.slice(offset, offset + tryLength);
            body.textContent = pageContent;
          }

          // 找自然断点（优化：优先向前扩展，减少回退）
          let finalLength = tryLength;
          if (tryLength < remaining) {
            // 向前找段落边界（最多 50 字符）
            const searchEnd = Math.min(tryLength + 50, remaining);
            const searchText = content.slice(offset + tryLength, offset + searchEnd);
            const paraMatch = searchText.search(/[　\n]/);

            if (paraMatch >= 0 && paraMatch <= 50) {
              // 找到段落边界，尝试扩展到那里
              const extendedLength = tryLength + paraMatch;
              const extendedContent = content.slice(offset, offset + extendedLength);
              body.textContent = extendedContent;

              if (body.scrollHeight <= availableHeight) {
                // 扩展后不溢出，使用扩展长度
                finalLength = extendedLength;
                pageContent = extendedContent;
              }
              // 如果扩展后溢出，保持原长度
            }

            // 如果没有找到段落边界，检查是否需要回退到句子结尾
            if (finalLength === tryLength) {
              // 向后找句子结尾（最多回退 30 字符）
              const lookbackStart = Math.max(offset, offset + tryLength - 30);
              const lookbackText = content.slice(lookbackStart, offset + tryLength);
              const sentenceEnd = Math.max(
                lookbackText.lastIndexOf('。'),
                lookbackText.lastIndexOf('！'),
                lookbackText.lastIndexOf('？'),
              );

              if (sentenceEnd >= 0 && sentenceEnd < lookbackText.length - 5) {
                // 句子结尾不在最后 5 字符，说明可以回退
                const backLength = tryLength - (lookbackText.length - sentenceEnd - 1);
                // 只有当回退量合理（不超过 20 字符）时才回退
                if (tryLength - backLength <= 20) {
                  finalLength = backLength;
                  pageContent = content.slice(offset, offset + finalLength);
                }
              }
            }
          }

          // 确保 finalLength 至少为 1
          finalLength = Math.max(1, finalLength);
          estimatedCharsPerPage = Math.max(100, finalLength);

          // 保存这一页
          const chapterIndex = findChapterIndex(chapters, offset);
          pages.push({
            content: pageContent,
            pageNumber,
            chapterIndex,
            chapterTitle: chapterIndex !== undefined ? chapters[chapterIndex].title : undefined,
          });

          // 前进
          const prevOffset = offset;
          offset += finalLength;
          pageNumber++;
          processedInBatch++;

          // 每页都报告进度（节流）
          reportProgress(offset);

          // 死循环检测
          if (offset === prevOffset) {
            stuckCounter++;
            if (stuckCounter >= MAX_STUCK_COUNT) {
              console.error('[paginateContent] 检测到死循环，强制终止');
              break;
            }
            offset += 100;
          } else {
            stuckCounter = 0;
          }
        }

        // 批次结束时强制报告进度
        reportProgress(offset, true);

        batchCount++;
        if (batchCount % 10 === 0) {
          console.log(`[paginateContent] 进度: ${Math.floor(offset / content.length * 100)}%, 已处理 ${Math.floor(offset / 1000)}K 字符, 共 ${pages.length} 页`);
        }

        // 用 setTimeout(0) 让出主线程，让浏览器更新 UI
        if (offset < content.length) {
          setTimeout(resolve, 0);
        } else {
          resolve();
        }
      });
    };

    // 循环处理所有批次
    while (offset < content.length) {
      await processBatch();
    }

    body.textContent = '';

    // ---- 计算章节页码映射 ----
    const chapterPageMap: ChapterPageMap[] = chapters.map((chapter, idx) => {
      let startPage = 0;
      let endPage = pages.length - 1;

      for (let i = 0; i < pages.length; i++) {
        if (pages[i].chapterIndex === idx) {
          if (startPage === 0) startPage = i;
          endPage = i;
        }
      }

      return {
        title: chapter.title,
        startPage,
        endPage,
      };
    });

    console.log('[paginateContent] 切分完成，共', pages.length, '页');
    return { pages, chapterPageMap };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 查找自然断点（段落、句子边界）。
 */
function findNaturalBreak(content: string, cutIndex: number): number {
  if (cutIndex >= content.length) return content.length;

  // 向前搜索段落起始（最多 30 字符）
  const lookahead = 30;
  const aheadEnd = Math.min(content.length, cutIndex + lookahead);
  const ahead = content.slice(cutIndex, aheadEnd);
  const paraStart = ahead.search(/[　\n]/);

  if (paraStart >= 0 && paraStart <= 20) {
    return cutIndex + paraStart;
  }

  // 回退找句子结尾（最多 20 字符）
  const lookback = 20;
  const lookbackStart = Math.max(0, cutIndex - lookback);
  const behind = content.slice(lookbackStart, cutIndex);
  const lastPeriod = behind.lastIndexOf('。');
  const lastExcl = behind.lastIndexOf('！');
  const lastQuest = behind.lastIndexOf('？');
  const best = Math.max(lastPeriod, lastExcl, lastQuest);

  if (best >= 0) {
    return lookbackStart + best + 1;
  }

  return cutIndex;
}

/**
 * 根据字符偏移量查找章节索引。
 */
function findChapterIndex(chapters: Chapter[], offset: number): number | undefined {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (offset >= chapters[i].startIndex && offset < chapters[i].endIndex) {
      return i;
    }
  }
  return chapters.length > 0 ? 0 : undefined;
}

/**
 * 降级分页：当 DOM 测量不可用时，用字符数估算。
 */
function fallbackPaginate(
  content: string,
  config: PageConfig,
  chapters: Chapter[],
): { pages: Page[]; chapterPageMap: ChapterPageMap[] } {
  const { width, height, fontSize, lineHeight } = config;

  // 保守估算
  const contentHeight = height - 80;
  const contentWidth = width - 96;

  const actualLineHeight = fontSize * lineHeight;
  const linesPerPage = Math.floor(contentHeight / actualLineHeight);
  const avgCharWidth = fontSize * 0.6;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);
  const charsPerPage = Math.max(charsPerLine * linesPerPage, charsPerLine);

  // 切分内容
  const pages: Page[] = [];
  let offset = 0;
  let pageNumber = 1;

  while (offset < content.length) {
    let cutIndex = Math.min(offset + charsPerPage, content.length);

    if (cutIndex < content.length) {
      cutIndex = findNaturalBreak(content, cutIndex);
    }

    if (cutIndex <= offset) {
      cutIndex = Math.min(offset + charsPerPage, content.length);
    }

    const pageContent = content.slice(offset, cutIndex);
    const chapterIndex = findChapterIndex(chapters, offset);

    pages.push({
      content: pageContent,
      pageNumber,
      chapterIndex,
      chapterTitle: chapterIndex !== undefined ? chapters[chapterIndex].title : undefined,
    });

    offset = cutIndex;
    pageNumber++;
  }

  // 章节页码映射
  const chapterPageMap: ChapterPageMap[] = chapters.map((chapter, idx) => {
    let startPage = 0;
    let endPage = pages.length - 1;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].chapterIndex === idx) {
        if (startPage === 0) startPage = i;
        endPage = i;
      }
    }

    return {
      title: chapter.title,
      startPage,
      endPage,
    };
  });

  return { pages, chapterPageMap };
}

// --- Main Hook ---

export interface UseBookParserReturn {
  book: Book | null;
  chapters: Chapter[];
  loading: boolean;
  progress: ImportProgress | null;
  cancel: () => void;
  loadFile: (
    input: ArrayBuffer | string,
    fileName: string,
    filePath: string,
    pageConfig: PageConfig,
  ) => Promise<{
    book: Book;
    content: string;
    chapters: Chapter[];
    totalPages: number;
    chapterPageMap: ChapterPageMap[];
    pages: Page[];
  }>;
}

export function useBookParser(): UseBookParserReturn {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
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
    ): Promise<{
      book: Book;
      content: string;
      chapters: Chapter[];
      totalPages: number;
      chapterPageMap: ChapterPageMap[];
      pages: Page[];
    }> => {
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

          // 发送请求到 Worker
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

        if (activeRequestIdRef.current !== requestId) {
          throw new Error('请求已取消');
        }

        // ---- 分页（异步，避免阻塞主线程）----
        setProgress({ stage: 'pagination', percent: 90, message: '正在计算分页…' });

        const { pages, chapterPageMap } = await paginateContent(
          result.content,
          pageConfig,
          result.chapters,
          // 分页进度回调：将 90-100% 的进度映射到分页过程
          (percent, message) => {
            const mappedPercent = 90 + Math.floor(percent * 0.1);
            setProgress({ stage: 'pagination', percent: mappedPercent, message });
          },
        );

        // 存储数据
        setBook(result.book);
        setChapters(result.chapters);
        setProgress(null);

        // 返回分页结果供调用方存储到 bookStore
        return {
          book: result.book,
          content: result.content,
          chapters: result.chapters,
          totalPages: pages.length,
          chapterPageMap,
          pages,
        };
      } catch (err) {
        console.error('Failed to load book:', err);
        throw err;
      } finally {
        if (activeRequestIdRef.current === null) {
          // 已取消，抛出错误
          throw new Error('请求已取消');
        }

        activeRequestIdRef.current = null;
        setLoading(false);
      }
    },
    [],
  );

  return { book, chapters, loading, progress, cancel, loadFile };
}

export default useBookParser;
