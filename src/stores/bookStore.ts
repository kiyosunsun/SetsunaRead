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

      nextPage: (step = 1) => {
        const { currentPage, totalPages } = get();
        const next = currentPage + step;
        if (next < totalPages) {
          set({ currentPage: next });
        }
      },

      prevPage: (step = 1) => {
        const { currentPage } = get();
        const prev = currentPage - step;
        if (prev >= 0) {
          set({ currentPage: prev });
        }
      },
    }),
    {
      name: 'setsuna-book-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ books: state.books }),
    },
  ),
);
