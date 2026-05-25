import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePageSize } from '../../hooks/usePageSize';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   双页组件
   以类似实体书打开的方式并排显示两页。
   包含键盘导航、3D 透视、书脊和书边厚度。
   页面尺寸根据视口自适应，充分利用屏幕空间。
   --------------------------------------------------------------------------- */
const FLIP_DURATION_MS = 450;

const DualPage: React.FC = () => {
  const { pages, currentPage, goToPage } = useBookStore();
  const { nightMode, flipAnimation } = useSettingsStore();
  const [leftAnimClass, setLeftAnimClass] = useState('');
  const [rightAnimClass, setRightAnimClass] = useState('');
  const isAnimating = useRef(false);
  const pageSize = usePageSize();

  /* ---- 左右页索引（currentPage 为 0-indexed） ---- */
  const leftPageIndex = currentPage;
  const rightPageIndex = currentPage + 1;

  const leftPage = pages[leftPageIndex] ?? null;
  const rightPage = pages[rightPageIndex] ?? null;
  const shouldAnimateFlip = flipAnimation !== 'fade' && flipAnimation !== 'slide';

  const clearAnimation = useCallback(() => {
    setLeftAnimClass('');
    setRightAnimClass('');
    isAnimating.current = false;
  }, []);

  const animateFlip = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating.current) return;

      /* 双页模式一次跳 2 页（一"张"纸 = 左右两面） */
      const nextPageIndex = direction === 'next' ? currentPage + 2 : currentPage - 2;

      if (direction === 'next' && nextPageIndex >= pages.length) return;
      if (direction === 'prev' && nextPageIndex < 0) return;

      if (!shouldAnimateFlip) {
        goToPage(nextPageIndex);
        return;
      }

      isAnimating.current = true;

      if (direction === 'next') {
        // 右页翻转动画：旋转到峰值时（旧内容被隐藏），切换页面并清除动画
        setRightAnimClass('page-turn-right');
        window.setTimeout(() => {
          clearAnimation();
          goToPage(nextPageIndex);
        }, FLIP_DURATION_MS * 0.5);
      } else {
        // 左页翻转动画：旋转到峰值时（旧内容被隐藏），切换页面并清除动画
        setLeftAnimClass('page-turn-left');
        window.setTimeout(() => {
          clearAnimation();
          goToPage(nextPageIndex);
        }, FLIP_DURATION_MS * 0.5);
      }
    },
    [clearAnimation, currentPage, goToPage, pages.length, shouldAnimateFlip],
  );

  /* ---- 键盘导航 ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      /* 如果用户正在输入则忽略 */
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          animateFlip('next');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          animateFlip('prev');
          break;
      }
    },
    [animateFlip],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isAnimating.current) return;

      const target = e.target as HTMLElement;
      if (target.closest('[data-no-page-turn="true"]')) return;

      const bounds = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - bounds.left;

      if (clickX < bounds.width / 2) {
        animateFlip('prev');
      } else {
        animateFlip('next');
      }
    },
    [animateFlip],
  );

  /* ---- 空状态 ---- */
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-400 select-none">
        No pages loaded. Open a book to start reading.
      </div>
    );
  }

  return (
    <div
      className="reader-desk flex items-center justify-center w-full h-full select-none"
      style={{ perspective: '2000px' }}
      onClick={handleContainerClick}
    >
      {/* 3D 容器，营造打开的书本视觉效果 */}
      <div
        className="reader-book flex items-stretch relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-0.5deg) rotateX(0.2deg)',
          transition: 'transform 0.4s ease',
        }}
      >
        {/* ---- 左页 ---- */}
        <div
          className="page-shell page-shell-left"
          style={{
            width: `${pageSize.width}px`,
            height: `${pageSize.height}px`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'right center',
            transform: 'rotateY(0.5deg)',
            borderRadius: '4px 0 0 4px',
            boxShadow: '-6px 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div className={`page-flip-layer ${leftAnimClass}`}>
            {leftPage ? (
              <Page
                className="reader-paper"
                content={leftPage.content}
                pageNumber={leftPage.pageNumber}
                isLeft={true}
              />
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
          <div className={`page-flip-shadow left ${leftAnimClass ? 'is-visible' : ''}`} />
          <div className={`page-flip-highlight left ${leftAnimClass ? 'is-visible' : ''}`} />
        </div>

        {/* ---- 书脊中缝（装订凹槽） ---- */}
        <div
          className="relative flex-shrink-0"
          data-no-page-turn="true"
          style={{
            width: '20px',
            height: `${pageSize.height}px`,
            background: nightMode
              ? 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(30,25,15,0.1) 30%, rgba(30,25,15,0.1) 70%, rgba(0,0,0,0.3) 100%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(60,40,20,0.1) 30%, rgba(60,40,20,0.1) 70%, rgba(0,0,0,0.25) 100%)',
            boxShadow: `
              inset 3px 0 8px rgba(0,0,0,0.4),
              inset -3px 0 8px rgba(0,0,0,0.4)
            `,
            borderRadius: '2px',
          }}
        >
          {/* 书脊高光线 */}
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
            style={{
              width: '1px',
              background: nightMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.12)',
            }}
          />
        </div>

        {/* ---- 右页 ---- */}
        <div
          className="page-shell page-shell-right"
          style={{
            width: `${pageSize.width}px`,
            height: `${pageSize.height}px`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: 'rotateY(-0.5deg)',
            borderRadius: '0 4px 4px 0',
            boxShadow: '6px 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <div className={`page-flip-layer ${rightAnimClass}`}>
            {rightPage ? (
              <Page
                className="reader-paper"
                content={rightPage.content}
                pageNumber={rightPage.pageNumber}
                isLeft={false}
              />
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
          <div className={`page-flip-shadow right ${rightAnimClass ? 'is-visible' : ''}`} />
          <div className={`page-flip-highlight right ${rightAnimClass ? 'is-visible' : ''}`} />
        </div>

        {/* ---- 书边厚度（右侧堆叠书页） ---- */}
        <div
          className="absolute"
          data-no-page-turn="true"
          style={{
            right: '-6px',
            top: '3px',
            width: '6px',
            height: `${pageSize.height - 3}px`,
            borderRadius: '0 3px 3px 0',
            background: nightMode
              ? 'linear-gradient(180deg, #2a2520 0%, #201c18 100%)'
              : 'linear-gradient(180deg, #f0e6d2 0%, #e8dcc4 50%, #ddd0b8 100%)',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
          }}
        />
      </div>

      {/* ---- 页码指示器 ---- */}
      {/* A 方案：每页页脚显示页码，因此这里不再额外叠加页码，避免不对齐/重复 */}
    </div>
  );
};

export default DualPage;
