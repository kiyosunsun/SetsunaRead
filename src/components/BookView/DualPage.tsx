import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { usePageSize } from '../../hooks/usePageSize';
import Page from './Page';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   双页组件
   以类似实体书打开的方式并排显示两页。
   包含键盘导航、3D 透视、书脊和书边厚度。
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

  /* ---- 书签指示器：右页有书签时显示 ---- */
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookId = useBookStore((state) => state.currentBook?.id);
  const isRightPageBookmarked = useMemo(() => {
    if (!bookId || !rightPage) return false;
    return bookmarks.some((b) => b.bookId === bookId && b.pageNumber === rightPage.pageNumber);
  }, [bookmarks, bookId, rightPage]);

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
        setRightAnimClass('page-turn-right');
        window.setTimeout(() => {
          clearAnimation();
          goToPage(nextPageIndex);
        }, FLIP_DURATION_MS * 0.5);
      } else {
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
      {/* 3D 容器 */}
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
                chapterTitle={leftPage.chapterTitle}
              />
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
          <div className={`page-flip-shadow left ${leftAnimClass ? 'is-visible' : ''}`} />
          <div className={`page-flip-highlight left ${leftAnimClass ? 'is-visible' : ''}`} />
        </div>

        {/* ---- 书脊中缝 ---- */}
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
                chapterTitle={rightPage.chapterTitle}
              />
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
          <div className={`page-flip-shadow right ${rightAnimClass ? 'is-visible' : ''}`} />
          <div className={`page-flip-highlight right ${rightAnimClass ? 'is-visible' : ''}`} />
        </div>

        {/* ---- 书签 ---- */}
        {isRightPageBookmarked && (
          <div
            data-no-page-turn="true"
            style={{
              position: 'absolute',
              top: '-12px',
              left: `calc(${pageSize.width}px + 20px + ${pageSize.width / 2}px)`,
              transform: 'translateX(-50%)',
              width: '88px',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '88px',
                height: '22px',
                background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                borderRadius: '6px 6px 0 0',
                position: 'relative',
                margin: '0 auto',
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
            <div
              style={{
                width: '82px',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #111 15%, #0d0d0d 100%)',
                borderRadius: '0 0 4px 4px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 0 30px rgba(255,255,255,0.015)',
              }}
            >
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

        {/* ---- 书边厚度 ---- */}
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
    </div>
  );
};

export default DualPage;
