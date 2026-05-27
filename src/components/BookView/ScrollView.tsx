import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   滚动视图组件

   Multi-column 方案：
   - 直接渲染完整内容，不需要分页
   - 使用与 Page.tsx 一致的样式
   - 页眉显示章节标题（从 chapterPageMap 查找）

   以垂直滚动方式显示整本书内容。
   --------------------------------------------------------------------------- */
const ScrollView: React.FC = () => {
  const { content, chapters } = useBookStore();
  const { nightMode, paperBackground, fontSize, fontFamily, lineHeight } = useSettingsStore();
  const PAPER_COLORS: Record<string, string> = {
    cream: '#f4ead5',
    white: '#fefefe',
    sepia: '#f0e6d2',
  };
  const paperColor = PAPER_COLORS[paperBackground] || PAPER_COLORS.cream;

  /* ---- 空状态 ---- */
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-400 select-none">
        No pages loaded. Open a book to start reading.
      </div>
    );
  }

  return (
    <div
      className="reader-desk w-full h-full overflow-y-auto select-none"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div
        className="mx-auto py-12 px-12"
        style={{
          maxWidth: '800px',
          backgroundColor: nightMode ? '#1a1612' : paperColor,
          color: nightMode ? '#c4b89a' : '#2c2218',
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          lineHeight,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          textAlign: 'justify',
        }}
      >
        {/* 章节标题（如果有） */}
        {chapters.length > 0 && chapters[0].title !== '全文' && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: `1px solid ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <h1
              style={{
                fontSize: '1.5em',
                fontWeight: 600,
                fontFamily: '"Noto Serif SC", serif',
                letterSpacing: '0.05em',
              }}
            >
              {chapters[0].title}
            </h1>
          </div>
        )}

        {/* 完整内容 */}
        {content}

        {/* 书末标记 */}
        <div
          className="text-sm tracking-wide select-none py-8 text-center"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            color: nightMode ? 'rgba(196,184,154,0.25)' : 'rgba(90,74,58,0.25)',
            marginTop: '4rem',
            borderTop: `1px solid ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          End of book
        </div>
      </div>
    </div>
  );
};

export default ScrollView;
