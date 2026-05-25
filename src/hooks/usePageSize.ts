import { useState, useEffect } from 'react';

/**
 * 页面尺寸 Hook - SetsunaRead
 *
 * 根据视口尺寸动态计算最佳页面尺寸，充分利用屏幕空间。
 * 返回 { width, height }，单位为 px。
 */
export function usePageSize() {
  const [pageSize, setPageSize] = useState({ width: 480, height: 660 });

  useEffect(() => {
    function calculateSize() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // UI 元素预留高度（工具栏）
      const uiReservedHeight = 50;
      // 左右两侧边距（每侧 30px）
      const horizontalMargin = 60;
      // 书脊宽度
      const spineWidth = 20;

      // 可用宽度 = 视口宽度 - 边距 - 书脊
      const availableWidth = viewportWidth - horizontalMargin - spineWidth;
      // 每页宽度 = 可用宽度 / 2
      const pageWidth = Math.floor(availableWidth / 2);

      // 可用高度 = 视口高度 - UI预留 - 上下边距(各20px)
      const availableHeight = viewportHeight - uiReservedHeight - 40;
      // 页面高度：尽量撑满可用高度，宽高比不超过 1.5
      const maxHeightByRatio = Math.floor(pageWidth * 1.5);
      const pageHeight = Math.min(maxHeightByRatio, availableHeight);

      // 限制最小和最大尺寸
      const finalWidth = Math.max(320, Math.min(700, pageWidth));
      const finalHeight = Math.max(440, Math.min(900, pageHeight));

      setPageSize({ width: finalWidth, height: finalHeight });
    }

    calculateSize();

    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, []);

  return pageSize;
}

export default usePageSize;
