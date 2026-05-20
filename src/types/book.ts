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

export interface Page {
  content: string;
  pageNumber: number;
  chapterIndex?: number;
}

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
