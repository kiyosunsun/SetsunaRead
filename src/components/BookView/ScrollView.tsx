import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   滚动视图组件
   以垂直序列渲染所有页面，页码分隔各章节。
   简单的滚动阅读模式，无需分页——整本书从上到下排列。
   --------------------------------------------------------------------------- */
const ScrollView: React.FC = () => {
  const { pages } = useBookStore();
  const { nightMode } = useSettingsStore();

  /* ---- 空状态 ---- */
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-400 select-none">
        No pages loaded. Open a book to start reading.
      </div>
    );
  }

  return (
    <div className="reader-desk w-full h-full overflow-y-auto select-none" style={{ scrollBehavior: 'smooth' }}>
      <div className="flex flex-col items-center gap-10 py-12">
        {pages.map((page, index) => (
          <React.Fragment key={page.pageNumber}>
            {/* 单页带投影 */}
            <div
              className="reader-book relative overflow-hidden"
              style={{
                width: '480px',
                height: '660px',
                borderRadius: '4px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,134,11,0.08)',
              }}
            >
              <Page
                className="reader-paper"
                content={page.content}
                pageNumber={page.pageNumber}
                isLeft={false}
                readingMode="scroll"
              />
            </div>

            {/* 页码分隔线 */}
            {index < pages.length - 1 && (
              <div
                className="flex items-center gap-4 select-none"
                style={{
                  color: nightMode ? 'rgba(196,184,154,0.3)' : 'rgba(90,74,58,0.3)',
                }}
              >
                <div
                  className="h-px w-12"
                  style={{
                    background: nightMode
                      ? 'linear-gradient(90deg, transparent, rgba(184,134,11,0.2), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(184,134,11,0.2), transparent)',
                  }}
                />
                <span className="text-xs tracking-widest uppercase" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                  {page.pageNumber}
                </span>
                <div
                  className="h-px w-12"
                  style={{
                    background: nightMode
                      ? 'linear-gradient(90deg, transparent, rgba(184,134,11,0.2), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(184,134,11,0.2), transparent)',
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* 书末标记 */}
        <div
          className="text-sm tracking-wide select-none py-4"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            color: nightMode ? 'rgba(196,184,154,0.25)' : 'rgba(90,74,58,0.25)',
          }}
        >
          End of book
        </div>
      </div>
    </div>
  );
};

export default ScrollView;
