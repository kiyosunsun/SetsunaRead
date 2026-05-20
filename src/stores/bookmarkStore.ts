import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  title: string;
  createdAt: number;
}

interface BookmarkState {
  bookmarks: Bookmark[];

  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (bookmarkId: string) => void;
  getBookmarks: (bookId: string) => Bookmark[];
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (bookmark) => {
        const newBookmark: Bookmark = {
          ...bookmark,
          id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
        }));
      },

      removeBookmark: (bookmarkId: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
        }));
      },

      getBookmarks: (bookId: string) => {
        return get().bookmarks.filter((b) => b.bookId === bookId);
      },
    }),
    {
      name: 'setsuna-bookmark-store',
    },
  ),
);
