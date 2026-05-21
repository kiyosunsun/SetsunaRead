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

function createUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function paginateWithProgress(
  content: string,
  config: PageConfig,
  onProgress: (fraction: number, pageCount: number) => void,
  check: () => void,
): Page[] {
  const { width, height, fontSize, lineHeight, padding } = config;

  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;

  const charsPerLine = Math.floor(contentWidth / fontSize);
  const linesPerPage = Math.floor(contentHeight / lineHeight);
  const charsPerPage = Math.max(charsPerLine * linesPerPage, 1);

  const pages: Page[] = [];
  let remaining = content;
  let pageNumber = 1;
  const totalChars = Math.max(content.length, 1);

  while (remaining.length > 0) {
    check();

    let cutIndex = Math.min(charsPerPage, remaining.length);

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
      id: createUUID(),
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
