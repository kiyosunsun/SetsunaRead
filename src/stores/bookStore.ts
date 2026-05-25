import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Book, Page } from '../types/book';

type PersistedBook = Omit<Book, 'content'>;

interface BookState {
  books: PersistedBook[];
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  pages: Page[];
  /** 每本书的阅读进度 { bookId: pageNumber } */
  readingProgress: Record<string, number>;

  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  openBook: (book: Book) => void;
  closeBook: () => void;
  setPages: (pages: Page[]) => void;
  goToPage: (page: number) => void;
  nextPage: (step?: number) => void;
  prevPage: (step?: number) => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      books: [],
      currentBook: null,
      currentPage: 0,
      totalPages: 0,
      pages: [],
      readingProgress: {},

      addBook: (book: Book) => {
        set((state) => {
          const exists = state.books.some((b) => b.id === book.id);
          if (exists) return state;

          const { content, ...persisted } = book;
          return { books: [...state.books, persisted] };
        });
      },

      removeBook: (bookId: string) => {
        set((state) => {
          const filtered = state.books.filter((b) => b.id !== bookId);
          // 同时删除该书的阅读进度
          const { [bookId]: _, ...restProgress } = state.readingProgress;
          if (state.currentBook?.id === bookId) {
            return {
              books: filtered,
              currentBook: null,
              currentPage: 0,
              totalPages: 0,
              pages: [],
              readingProgress: restProgress,
            };
          }
          return { books: filtered, readingProgress: restProgress };
        });
      },

      openBook: (book: Book) => {
        const { readingProgress } = get();
        // 恢复该书的阅读进度，没有则从第 0 页开始
        const savedPage = readingProgress[book.id] ?? 0;
        set({
          currentBook: book,
          currentPage: savedPage,
        });
      },

      closeBook: () => {
        const { currentBook, currentPage, readingProgress } = get();
        // 关闭时保存当前阅读进度
        if (currentBook) {
          set({
            currentBook: null,
            currentPage: 0,
            totalPages: 0,
            pages: [],
            readingProgress: {
              ...readingProgress,
              [currentBook.id]: currentPage,
            },
          });
        } else {
          set({
            currentBook: null,
            currentPage: 0,
            totalPages: 0,
            pages: [],
          });
        }
      },

      setPages: (pages: Page[]) => {
        set({ pages, totalPages: pages.length });
      },

      goToPage: (page: number) => {
        const { totalPages, currentBook, readingProgress } = get();
        if (page >= 0 && page < totalPages) {
          set({
            currentPage: page,
            // 同步更新阅读进度
            ...(currentBook ? { readingProgress: { ...readingProgress, [currentBook.id]: page } } : {}),
          });
        }
      },

      nextPage: (step = 1) => {
        const { currentPage, totalPages, currentBook, readingProgress } = get();
        const next = currentPage + step;
        if (next < totalPages) {
          set({
            currentPage: next,
            ...(currentBook ? { readingProgress: { ...readingProgress, [currentBook.id]: next } } : {}),
          });
        }
      },

      prevPage: (step = 1) => {
        const { currentPage, currentBook, readingProgress } = get();
        const prev = currentPage - step;
        if (prev >= 0) {
          set({
            currentPage: prev,
            ...(currentBook ? { readingProgress: { ...readingProgress, [currentBook.id]: prev } } : {}),
          });
        }
      },
    }),
    {
      name: 'setsuna-book-store',
      // 使用 localStorage 持久化书架和阅读进度
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        books: state.books,
        // 保存每本书的阅读进度（用 bookId 映射 currentPage）
        readingProgress: state.readingProgress,
      }),
    },
  ),
);
