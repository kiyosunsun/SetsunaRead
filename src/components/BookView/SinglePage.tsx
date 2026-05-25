import React, { useEffect, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { usePageSize } from '../../hooks/usePageSize';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   单页组件
   在屏幕中央显示单页，带键盘导航和柔和的投影深度。
   作为更简洁的阅读模式设计。
   --------------------------------------------------------------------------- */
const SinglePage: React.FC = () => {
  const { pages, currentPage, nextPage, prevPage } = useBookStore();
  const pageSize = usePageSize();

  const pageData = pages[currentPage] ?? null;

  /* ---- 键盘导航 ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
      }
    },
    [nextPage, prevPage],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ---- 空状态 ---- */
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-400 select-none">
        No pages loaded. Open a book to start reading.
      </div>
    );
  }

  return (
    <div className="reader-desk flex items-center justify-center w-full h-full select-none">
      {/* 居中的页面带投影 */}
      <div
        className="reader-book relative overflow-hidden"
        style={{
          width: `${pageSize.width}px`,
          height: `${pageSize.height}px`,
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,134,11,0.08)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {pageData ? (
          <Page
            className="reader-paper"
            content={pageData.content}
            pageNumber={pageData.pageNumber}
            isLeft={false}
          />
        ) : (
          <div className="w-full h-full bg-transparent" />
        )}
      </div>

      {/* 页码指示器 */}
      {/* A 方案：页码放进纸张内部页脚，外层不再叠加 */}
    </div>
  );
};

export default SinglePage;
