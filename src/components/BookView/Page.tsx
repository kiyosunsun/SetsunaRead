import React, { useMemo, useRef } from 'react';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';
import { useBookStore } from '../../stores/bookStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import '../../styles/book.css';

const CornerOrnament = (props: { className: string }) => (
  <svg viewBox="0 0 48 48" className={props.className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M4 4C4 4 8 14 14 20C20 26 30 32 44 36" />
    <path d="M4 4C4 4 14 8 20 14C26 20 32 30 36 44" />
    <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.5" />
  </svg>
);

/* ---------------------------------------------------------------------------
   页面组件 Props
   --------------------------------------------------------------------------- */
interface PageProps {
  /** 渲染的 HTML 内容字符串（可以是全文，浏览器自动分页） */
  content: string;
  /** 当前页码（1-indexed 用于显示） */
  pageNumber: number;
  /** 是否为双页展开中的左页 */
  isLeft: boolean;
  className?: string;
}

/* ---------------------------------------------------------------------------
   页面组件
   使用 CSS Multi-column 自动分页。
   浏览器自动将内容分成多列，通过 transform 控制显示哪一列。
   --------------------------------------------------------------------------- */
const Page: React.FC<PageProps> = ({ content, pageNumber, isLeft, className }) => {
  const { paperBackground, fontSize, fontFamily, lineHeight, nightMode } = useSettingsStore();
  const { pages, currentPage } = useBookStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* 检查当前页是否已添加书签 */
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookId = useBookStore((state) => state.currentBook?.id);
  const isBookmarked = useMemo(
    () => bookmarks.some((b) => b.bookId === bookId && b.pageNumber === pageNumber),
    [bookmarks, bookId, pageNumber],
  );

  const paperColor = PAPER_COLORS[paperBackground];

  const pageHeaderText = useMemo(() => {
    const active = pages[currentPage];
    if (!active) return '';

    if (typeof active.chapterTitle === 'string' && active.chapterTitle.trim()) {
      return active.chapterTitle.trim();
    }

    if (typeof active.chapterIndex === 'number') {
      return `第 ${active.chapterIndex + 1} 章`;
    }

    return '';
  }, [currentPage, pages]);

  /* 根据用户设置动态构建样式对象 */
  const pageStyle: React.CSSProperties = {
    backgroundColor: nightMode ? '#1a1612' : paperColor,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    lineHeight,
    color: nightMode ? '#c4b89a' : '#2c2218',
  };

  /* 根据页面朝向确定书脊阴影类 */
  const spineClass = isLeft ? 'book-spine-shadow-left' : 'book-spine-shadow-right';

  /* 翻页卷角仅出现在右页 */
  const curlClass = !isLeft ? 'page-curl' : '';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${spineClass} ${curlClass} paper-texture ${className ?? ''}`}
      style={{ ...pageStyle, height: '100%' }}
    >
      <CornerOrnament className="reader-ornament tl" />
      <CornerOrnament className="reader-ornament tr" />
      <CornerOrnament className="reader-ornament bl" />
      <CornerOrnament className="reader-ornament br" />

      {/* ---- 书签丝带 ---- */}
      {isBookmarked && (
        <div
          className="absolute z-[10] pointer-events-none"
          style={{
            top: 0,
            right: '24px',
            width: '18px',
            height: '64px',
            background: 'linear-gradient(180deg, #b43a2f 0%, #8b2e25 100%)',
            borderRadius: '0 0 3px 3px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {/* 丝带尾部 V 形剪口 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: 0,
              width: 0,
              height: 0,
              borderLeft: '9px solid #8b2e25',
              borderRight: '9px solid #8b2e25',
              borderBottom: '6px solid transparent',
            }}
          />
        </div>
      )}

      <div className="relative z-[3] page-pad page-grid">
        <div className="page-header">
          <div className="page-header-inner">
            <span className="page-header-text">{pageHeaderText}</span>
          </div>
        </div>

        {/* 页面正文：Worker 已完成分页，直接渲染纯文本 */}
        <div
          ref={contentRef}
          className="page-body"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="page-footer">
          <div className="page-footer-inner">
            <span className="page-footer-text">{pageNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
