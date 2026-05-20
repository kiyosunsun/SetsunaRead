import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book, Page } from '../types/book';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  pages: Page[];

  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  openBook: (book: Book) => void;
  closeBook: () => void;
  setPages: (pages: Page[]) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      books: [],
      currentBook: null,
      currentPage: 0,
      totalPages: 0,
      pages: [],

      addBook: (book: Book) => {
        set((state) => {
          const exists = state.books.some((b) => b.id === book.id);
          if (exists) return state;
          return { books: [...state.books, book] };
        });
      },

      removeBook: (bookId: string) => {
        set((state) => {
          const filtered = state.books.filter((b) => b.id !== bookId);
          if (state.currentBook?.id === bookId) {
            return {
              books: filtered,
              currentBook: null,
              currentPage: 0,
              totalPages: 0,
              pages: [],
            };
          }
          return { books: filtered };
        });
      },

      openBook: (book: Book) => {
        set({
          currentBook: book,
          currentPage: 0,
        });
      },

      closeBook: () => {
        set({
          currentBook: null,
          currentPage: 0,
          totalPages: 0,
          pages: [],
        });
      },

      setPages: (pages: Page[]) => {
        set({ pages, totalPages: pages.length });
      },

      goToPage: (page: number) => {
        const { totalPages } = get();
        if (page >= 0 && page < totalPages) {
          set({ currentPage: page });
        }
      },

      nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages - 1) {
          set({ currentPage: currentPage + 1 });
        }
      },

      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 0) {
          set({ currentPage: currentPage - 1 });
        }
      },
    }),
    {
      name: 'setsuna-book-store',
    },
  ),
);
