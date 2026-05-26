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
  /** 渲染的 HTML 内容字符串 */
  content: string;
  /** 当前页码（1-indexed 用于显示） */
  pageNumber: number;
  /** 是否为双页展开中的左页 */
  isLeft: boolean;
  className?: string;
  /** 阅读模式（用于控制书签指示器位置） */
  readingMode?: 'dual' | 'single' | 'scroll';
  /** 章节标题（由分页算法预计算，优先使用） */
  chapterTitle?: string;
}

/* ---------------------------------------------------------------------------
   页面组件
   渲染预切分后的单页内容。
   --------------------------------------------------------------------------- */
const Page: React.FC<PageProps> = ({
  content,
  pageNumber,
  isLeft,
  className,
  readingMode = 'single',
  chapterTitle,
}) => {
  const { paperBackground, fontSize, fontFamily, lineHeight, nightMode } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* 检查当前页是否已添加书签 */
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookId = useBookStore((state) => state.currentBook?.id);
  const currentPage0 = useBookStore((state) => state.currentPage);
  const isBookmarked = useMemo(
    () => bookmarks.some((b) => b.bookId === bookId && b.pageNumber === currentPage0 + 1),
    [bookmarks, bookId, currentPage0],
  );

  const paperColor = PAPER_COLORS[paperBackground];

  /* 根据页面朝向确定书脊阴影类 */
  const spineClass = isLeft ? 'book-spine-shadow-left' : 'book-spine-shadow-right';

  /* 翻页卷角仅出现在右页 */
  const curlClass = !isLeft ? 'page-curl' : '';

  /* 根据用户设置动态构建样式对象 */
  const pageStyle: React.CSSProperties = {
    backgroundColor: nightMode ? '#1a1612' : paperColor,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    lineHeight,
    color: nightMode ? '#c4b89a' : '#2c2218',
  };

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

      {/* ---- 拟物书签（单页/滚动模式：右上角） ---- */}
      {isBookmarked && readingMode !== 'dual' && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: '20px',
            width: '88px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {/* 金属书签夹 */}
          <div
            style={{
              width: '88px',
              height: '22px',
              background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
              borderRadius: '6px 6px 0 0',
              position: 'relative',
              boxShadow: '0 -3px 10px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: '12%',
                right: '12%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* 书签主体 */}
          <div
            style={{
              width: '82px',
              margin: '0 auto',
              background: 'linear-gradient(180deg, #1a1a1a 0%, #111 15%, #0d0d0d 100%)',
              borderRadius: '0 0 4px 4px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {/* 光泽 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '55%',
                height: '100%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 20%, transparent 40%)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            {/* 竖排金字 */}
            <div
              style={{
                writingMode: 'vertical-rl',
                color: '#d4a853',
                fontSize: '11px',
                letterSpacing: '4px',
                padding: '18px 10px 14px',
                textAlign: 'center',
                lineHeight: 1.6,
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              书签
            </div>

            {/* 紫蝴蝶 + 发光 */}
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '44px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60px',
                  height: '60px',
                  background: 'radial-gradient(circle, rgba(147,112,219,0.25) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(6px)',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 8px rgba(147,112,219,0.6))' }}>
                🦋
              </span>
            </div>

            {/* 品牌 */}
            <div
              style={{
                padding: '12px 8px 16px',
                textAlign: 'center',
                borderTop: '1px solid rgba(212,168,83,0.15)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  color: '#d4a853',
                  fontWeight: 600,
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '2px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                Setsuna
              </div>
              <div
                style={{
                  fontSize: '8px',
                  color: 'rgba(212,168,83,0.5)',
                  fontFamily: "'Microsoft YaHei', sans-serif",
                  marginTop: '3px',
                  letterSpacing: '1px',
                }}
              >
                本地阅读
              </div>
              <div
                style={{
                  display: 'inline-block',
                  width: '26px',
                  height: '26px',
                  background: 'linear-gradient(135deg, #c0392b, #a93226)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    fontFamily: "'SimSun', serif",
                  }}
                >
                  阅
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-[3] page-pad page-grid">
        {/* 页眉：显示章节标题 */}
        <div className="page-header">
          <div className="page-header-inner">
            <span className="page-header-text">
              {chapterTitle ||
                (content.slice(0, 50).includes('第') ? content.slice(0, 30) : '')}
            </span>
          </div>
        </div>

        {/* 页面正文 */}
        <div
          ref={contentRef}
          className="page-body"
        >
          {content}
        </div>

        {/* 页脚：显示当前页码 */}
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
