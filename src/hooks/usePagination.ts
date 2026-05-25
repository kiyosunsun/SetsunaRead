import { useState, useCallback, useRef, useEffect } from 'react';
import type { Page, PageConfig } from '@/types/book';

/**
 * 分页 Hook - SetsunaRead
 *
 * 使用隐藏 DOM 测量容器，基于行数估算进行分页。
 * 比字符数二分查找更精确，避免中文排版导致的页面空白。
 *
 * 返回 pages、导航状态和控制方法。
 */
export function usePagination(
  content: string,
  config: PageConfig,
) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const measureRef = useRef<HTMLDivElement | null>(null);

  // ---- 隐藏测量容器初始化 ----

  useEffect(() => {
    // 创建一个离屏的隐藏测量容器
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
   * 配置测量容器以匹配当前页面布局。
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
   * 测量单行能容纳的字符数。
   * 通过测量一个长字符串的实际渲染宽度来估算。
   */
  const measureCharsPerLine = useCallback((): number => {
    const el = measureRef.current;
    if (!el) return 20; // 默认值

    configureMeasureContainer();

    // 用一串测试字符来测量行宽
    const testStr = '这是测试文字abcABC123这是测试文字abcABC123';
    el.textContent = testStr;

    // 获取容器宽度和文本实际渲染宽度
    const containerWidth = el.clientWidth;
    const textWidth = el.scrollWidth;

    if (textWidth === 0) return 20;

    // 计算每个字符的平均宽度
    const avgCharWidth = textWidth / testStr.length;

    // 每行能放的字符数（向下取整，留一点余量）
    const charsPerLine = Math.floor(containerWidth / avgCharWidth);

    el.textContent = '';
    return Math.max(10, charsPerLine); // 至少10个字符
  }, [configureMeasureContainer]);

  /**
   * 测量内容实际渲染的高度，返回行数。
   */
  const measureLineCount = useCallback((text: string): number => {
    const el = measureRef.current;
    if (!el || text.length === 0) return 0;

    configureMeasureContainer();
    el.textContent = text;

    // 获取单行高度（通过测量一个字符的高度）
    el.textContent = '测';
    const singleLineHeight = el.scrollHeight;

    // 获取内容总高度
    el.textContent = text;
    const totalHeight = el.scrollHeight;

    el.textContent = '';

    if (singleLineHeight === 0) return 0;
    return Math.ceil(totalHeight / singleLineHeight);
  }, [configureMeasureContainer]);

  /**
   * 测量容器能容纳的最大行数。
   */
  const measureMaxLines = useCallback((): number => {
    const el = measureRef.current;
    if (!el) return 20;

    configureMeasureContainer();

    // 获取容器高度和单行高度
    const containerHeight = el.clientHeight;

    // 测量单行高度
    el.textContent = '测';
    const singleLineHeight = el.scrollHeight;
    el.textContent = '';

    if (singleLineHeight === 0) return 20;
    return Math.floor(containerHeight / singleLineHeight);
  }, [configureMeasureContainer]);

  /**
   * 查找自然断点（段落、句子边界）。
   * 向前搜索下一个段落起始位置，回退到最近的句子结尾标点。
   */
  const findNaturalBreak = useCallback(
    (text: string, cutIndex: number, lookahead: number = 200): number => {
      if (cutIndex >= text.length) return text.length;

      // 向前搜索：找下一个段落起始位置
      const end = Math.min(text.length, cutIndex + lookahead);
      const ahead = text.slice(cutIndex, end);
      const paraStart = ahead.search(/[　\n]/);
      if (paraStart >= 0) {
        const breakAt = cutIndex + paraStart;
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

      // 回退：找句子结尾标点
      const lookbackStart = Math.max(0, cutIndex - 80);
      const behind = text.slice(lookbackStart, cutIndex);
      const lastPeriod = behind.lastIndexOf('。');
      const lastExcl = behind.lastIndexOf('！');
      const lastQuest = behind.lastIndexOf('？');
      const best = Math.max(lastPeriod, lastExcl, lastQuest);
      if (best >= 0) return lookbackStart + best + 1;

      return cutIndex;
    },
    [],
  );

  /**
   * 将内容分页。
   * 基于行数估算：计算每页能放多少行，然后按行数切分内容。
   */
  const paginate = useCallback(
    (fullContent: string): Page[] => {
      if (!fullContent || fullContent.length === 0) return [];

      const result: Page[] = [];
      let offset = 0;
      let pageNumber = 1;

      // 获取每行字符数和每页最大行数
      const charsPerLine = measureCharsPerLine();
      const maxLines = measureMaxLines();

      while (offset < fullContent.length) {
        const remaining = fullContent.slice(offset);

        // 估算当前剩余内容的行数
        const remainingLines = measureLineCount(remaining);

        // 如果剩余内容能一页放完，直接放完
        if (remainingLines <= maxLines) {
          result.push({
            content: remaining,
            pageNumber,
          });
          break;
        }

        // 计算当前页应该放多少字符（基于行数）
        // 每页 maxLines 行，每行 charsPerLine 字符
        let targetChars = maxLines * charsPerLine;

        // 确保 targetChars 不超过剩余内容长度
        targetChars = Math.min(targetChars, remaining.length);

        // 查找自然断点
        let cutIndex = targetChars;
        if (cutIndex < remaining.length) {
          cutIndex = findNaturalBreak(remaining, cutIndex);
        }

        // 安全检查：确保至少有一些内容
        if (cutIndex === 0) {
          cutIndex = Math.min(charsPerLine, remaining.length);
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
    [measureCharsPerLine, measureMaxLines, measureLineCount, findNaturalBreak],
  );

  // ---- 内容或配置变化时重新分页 ----

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

  // ---- 导航方法 ----

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
