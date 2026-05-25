/// <reference lib="webworker" />

import type { Book, Chapter, Page, PageConfig } from '@/types/book';

type TxtParseRequest = {
  type: 'parse';
  requestId: string;
  fileName: string;
  filePath: string;
  buffer?: ArrayBuffer;
  content?: string;
  pageConfig: PageConfig;
};

type TxtParseCancel = {
  type: 'cancel';
  requestId: string;
};

type RequestMessage = TxtParseRequest | TxtParseCancel;

type ProgressStage = 'reading' | 'decoding' | 'chapters' | 'pagination' | 'finalizing';

type ProgressMessage = {
  type: 'progress';
  requestId: string;
  stage: ProgressStage;
  percent: number;
  message: string;
};

type ResultMessage = {
  type: 'result';
  requestId: string;
  book: Book;
  chapters: Chapter[];
  pages: Page[];
};

type ErrorMessage = {
  type: 'error';
  requestId: string;
  message: string;
};

type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage;

const workerScope = self as DedicatedWorkerGlobalScope;
const CANCELED_ERROR = '__TXT_PARSE_CANCELED__';
const canceledRequests = new Map<string, number>();
const CANCEL_TTL_MS = 60_000;

function gcCanceledRequests() {
  const now = Date.now();
  for (const [id, ts] of canceledRequests) {
    if (now - ts > CANCEL_TTL_MS) canceledRequests.delete(id);
  }
}

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

function postMessageToMainThread(message: WorkerMessage) {
  workerScope.postMessage(message);
}

function postProgress(
  requestId: string,
  stage: ProgressStage,
  percent: number,
  message: string,
  lastPercentRef: { current: number },
) {
  const clamped = Math.min(100, Math.max(0, percent));
  const monotonic = Math.max(lastPercentRef.current, clamped);
  lastPercentRef.current = monotonic;

  postMessageToMainThread({
    type: 'progress',
    requestId,
    stage,
    percent: monotonic,
    message,
  });
}

function checkCanceled(requestId: string) {
  if (canceledRequests.has(requestId)) {
    throw new Error(CANCELED_ERROR);
  }
}

function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  const SAMPLE_SIZE = 512 * 1024;
  const sample = bytes.byteLength > SAMPLE_SIZE ? bytes.slice(0, SAMPLE_SIZE) : bytes;

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
      decoder.decode(sample);

      const lossyDecoder = new TextDecoder(encoding, { fatal: false });
      const decoded = lossyDecoder.decode(sample);
      const replacements = (decoded.match(/�/g) || []).length;
      const score = 1 - replacements / Math.max(decoded.length, 1);

      if (score > bestScore) {
        bestScore = score;
        bestEncoding = encoding;
      }
    } catch {
      // 某些运行时可能不支持特定编码，直接跳过。
    }
  }

  return bestEncoding;
}

function parseChapters(content: string): Chapter[] {
  const chapters: Chapter[] = [];
  const seenPositions = new Set<number>();

  for (const pattern of CHAPTER_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const index = match.index;
      if (!seenPositions.has(index)) {
        seenPositions.add(index);
        chapters.push({
          title: match[0].trim(),
          startIndex: index,
          endIndex: 0,
        });
      }
    }
  }

  chapters.sort((a, b) => a.startIndex - b.startIndex);

  for (let i = 0; i < chapters.length; i++) {
    chapters[i].endIndex = i + 1 < chapters.length
      ? chapters[i + 1].startIndex
      : content.length;
  }

  if (chapters.length === 0 && content.length > 0) {
    chapters.push({
      title: '全文',
      startIndex: 0,
      endIndex: content.length,
    });
  }

  return chapters;
}

function getChapterIndexForRange(chapters: Chapter[], startIndex: number): number | undefined {
  for (let i = chapters.length - 1; i >= 0; i--) {
    const chapter = chapters[i];
    if (startIndex >= chapter.startIndex && startIndex < chapter.endIndex) {
      return i;
    }
  }

  return chapters.length > 0 ? 0 : undefined;
}

/**
 * 判断字符是否为中文字符（全角字符）。
 * 中文字符宽度约为 fontSize，英文字符约为 fontSize * 0.55。
 */
function isChineseChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||   // CJK 统一汉字
    (code >= 0x3400 && code <= 0x4dbf) ||   // CJK 扩展 A
    (code >= 0x20000 && code <= 0x2a6df) || // CJK 扩展 B
    (code >= 0x2a700 && code <= 0x2b73f) || // CJK 扩展 C
    (code >= 0x2b740 && code <= 0x2b81f) || // CJK 扩展 D
    (code >= 0xf900 && code <= 0xfaff) ||   // CJK 兼容汉字
    (code >= 0x2f800 && code <= 0x2fa1f)    // CJK 兼容补充
  );
}

/**
 * 计算字符串的"视觉宽度"（以 fontSize 为单位）。
 * 中文字符算 1 单位，英文/数字/标点算 0.55 单位。
 */
function measureTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isChineseChar(char)) {
      width += fontSize;
    } else if (char === '\n' || char === '\t') {
      // 换行和制表符不计入宽度
    } else {
      // 英文、数字、标点等半角字符
      width += fontSize * 0.55;
    }
  }
  return width;
}

/**
 * 查找自然断点（段落、句子边界）。
 * 向前搜索最多 lookback 个字符。
 */
/**
 * 查找自然断点（段落、句子边界）。
 * 向前搜索下一个段落起始位置（全角空格或换行符开头），
 * 同时回退到最近的句子结尾标点。
 */
function findNaturalBreak(text: string, cutIndex: number, lookahead: number = 200): number {
  if (cutIndex >= text.length) return text.length;

  // --- 向前搜索：找下一个段落起始位置 ---
  const end = Math.min(text.length, cutIndex + lookahead);
  const ahead = text.slice(cutIndex, end);

  // 段落起始标志：全角空格（中文缩进）或换行符
  const paraStart = ahead.search(/[　\n]/);
  if (paraStart >= 0) {
    const breakAt = cutIndex + paraStart;
    // 如果段落标志前有句子结尾标点，在标点处断开更自然
    const beforePara = text.slice(Math.max(0, breakAt - 2), breakAt);
    const lastSentenceEnd = Math.max(
      beforePara.lastIndexOf('。'),
      beforePara.lastIndexOf('！'),
      beforePara.lastIndexOf('？'),
      beforePara.lastIndexOf('\n'),
    );
    if (lastSentenceEnd >= 0) {
      return breakAt - 2 + lastSentenceEnd + 1;
    }
    return breakAt;
  }

  // --- 回退：在 cutIndex 附近找句子结尾标点 ---
  const lookbackStart = Math.max(0, cutIndex - 80);
  const behind = text.slice(lookbackStart, cutIndex);

  const lastPeriod = behind.lastIndexOf('。');
  const lastExcl = behind.lastIndexOf('！');
  const lastQuest = behind.lastIndexOf('？');
  const best = Math.max(lastPeriod, lastExcl, lastQuest);

  if (best >= 0) {
    return lookbackStart + best + 1;
  }

  return cutIndex;
}

function paginateWithProgress(
  content: string,
  config: PageConfig,
  chapters: Chapter[],
  onProgress: (fraction: number, pageCount: number) => void,
  check: () => void,
): Page[] {
  const { width, height, fontSize, lineHeight, padding } = config;

  // 计算内容区域（减去页面内边距）
  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;

  // 计算每页行数
  const actualLineHeight = fontSize * lineHeight;
  const linesPerPage = Math.floor(contentHeight / actualLineHeight);

  // 估算每行字符数（考虑中英文混合宽度）
  // 第一行有 text-indent: 2em，所以少 2 个中文字符的宽度
  const firstLineWidth = contentWidth - fontSize * 2; // 第一行缩进 2em
  const normalLineWidth = contentWidth;

  // 用测试字符串估算每行字符数
  const testStr = '这是测试文字abcABC123这是测试文字abcABC123';
  const testWidth = measureTextWidth(testStr, fontSize);
  const avgCharWidth = testWidth / testStr.length;

  const firstLineChars = Math.floor(firstLineWidth / avgCharWidth);
  const normalLineChars = Math.floor(normalLineWidth / avgCharWidth);

  // 计算每页总字符数
  // 第一行用 firstLineChars，后续行用 normalLineChars
  // 此估算仅作为初步分页，主线程会用 DOM 验证并修正溢出的页面
  const charsPerPage = Math.max(
    firstLineChars + Math.max(0, linesPerPage - 1) * normalLineChars,
    normalLineChars, // 至少一行
  );

  const pages: Page[] = [];
  let remaining = content;
  let pageNumber = 1;
  const totalChars = Math.max(content.length, 1);
  let offset = 0;

  while (remaining.length > 0) {
    check();

    let cutIndex = Math.min(charsPerPage, remaining.length);

    // 查找自然断点
    if (cutIndex < remaining.length) {
      cutIndex = findNaturalBreak(remaining, cutIndex);
    }

    // 安全检查：确保至少有一些内容
    if (cutIndex === 0 && remaining.length > 0) {
      cutIndex = Math.min(normalLineChars, remaining.length);
    }

    const pageStart = offset;
    const chapterIndex = getChapterIndexForRange(chapters, pageStart);

    pages.push({
      content: remaining.slice(0, cutIndex),
      pageNumber,
      chapterIndex,
      chapterTitle: typeof chapterIndex === 'number' ? chapters[chapterIndex]?.title : undefined,
    });

    remaining = remaining.slice(cutIndex);
    offset += cutIndex;

    if (pageNumber % 25 === 0 || remaining.length === 0) {
      const processedChars = content.length - remaining.length;
      onProgress(processedChars / totalChars, pageNumber);
    }

    pageNumber++;
  }

  if (pages.length === 0) {
    onProgress(1, 0);
  }

  return pages;
}

async function handleParseMessage(message: TxtParseRequest) {
  const { requestId, fileName, filePath, buffer, content: providedContent, pageConfig } = message;
  const lastPercentRef = { current: 0 };

  try {
    postProgress(requestId, 'reading', 0, '已接收文件，准备开始解析', lastPercentRef);
    checkCanceled(requestId);

    let content = providedContent;
    let size = providedContent ? new TextEncoder().encode(providedContent).byteLength : 0;

    if (typeof content !== 'string') {
      if (!buffer) throw new Error('缺少文件数据');

      postProgress(requestId, 'decoding', 5, '正在检测文本编码', lastPercentRef);
      const encoding = detectEncoding(buffer);
      checkCanceled(requestId);

      postProgress(requestId, 'decoding', 12, `已识别编码：${encoding}`, lastPercentRef);
      const decoder = new TextDecoder(encoding);
      content = decoder.decode(buffer);
      size = buffer.byteLength;

      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }

      checkCanceled(requestId);
    }

    postProgress(requestId, 'chapters', 22, '正在识别章节结构', lastPercentRef);
    const chapters = parseChapters(content);
    checkCanceled(requestId);

    postProgress(requestId, 'pagination', 30, '正在分页排版，请稍候', lastPercentRef);
    const pages = paginateWithProgress(
      content,
      pageConfig,
      chapters,
      (fraction, pageCount) => {
        const percent = 30 + fraction * 65;
        postProgress(
          requestId,
          'pagination',
          percent,
          pageCount > 0 ? `正在分页排版，已生成 ${pageCount} 页` : '正在分页排版',
          lastPercentRef,
        );
      },
      () => checkCanceled(requestId),
    );
    checkCanceled(requestId);

    postProgress(requestId, 'finalizing', 98, '正在整理书籍数据', lastPercentRef);

    const book: Book = {
      id: `${filePath || fileName}::${size}`,
      title: fileName.replace(/\.txt$/i, ''),
      filePath,
      content,
      size,
      lastRead: Date.now(),
    };

    postMessageToMainThread({
      type: 'result',
      requestId,
      book,
      chapters,
      pages,
    });
  } catch (error) {
    if (error instanceof Error && error.message === CANCELED_ERROR) {
      return;
    }

    postMessageToMainThread({
      type: 'error',
      requestId,
      message: error instanceof Error ? error.message : 'TXT 解析失败，请重试',
    });
  } finally {
    canceledRequests.delete(requestId);
    gcCanceledRequests();
  }
}

workerScope.onmessage = (event: MessageEvent<RequestMessage>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    canceledRequests.set(message.requestId, Date.now());
    gcCanceledRequests();
    return;
  }

  void handleParseMessage(message);
};

export {};
