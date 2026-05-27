export interface Book {
  id: string;
  title: string;
  filePath: string;
  content: string;
  size: number;
  lastRead: number;
}

export interface Chapter {
  title: string;
  startIndex: number;
  endIndex: number;
}

/**
 * @deprecated 已废弃。Multi-column 方案不再预切分页面。
 * 保留此类型仅供参考，如需回退可恢复使用。
 */
export interface Page {
  content: string;
  pageNumber: number;
  chapterIndex?: number;
  chapterTitle?: string;
}

/**
 * 页面配置
 * 用于 Multi-column 布局计算列宽和可用高度
 */
export interface PageConfig {
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * 章节页码映射
 * 用于 Multi-column 方案下根据页码定位章节
 */
export interface ChapterPageMap {
  /** 章节标题 */
  title: string;
  /** 章节起始页码（0-indexed） */
  startPage: number;
  /** 章节结束页码（0-indexed，包含） */
  endPage: number;
}
