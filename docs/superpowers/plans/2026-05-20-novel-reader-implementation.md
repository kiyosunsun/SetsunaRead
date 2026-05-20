# SetsunaRead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop novel reading software with realistic book interface, supporting TXT files, dual-page/single-page/scroll reading modes, bookmarks, search, and annotations.

**Architecture:** Tauri + React + TypeScript desktop app. Vite for build, Tailwind CSS + custom CSS for book aesthetics, Zustand for state management. Core reading logic in custom hooks, book UI in dedicated components.

**Tech Stack:** Tauri, React, TypeScript, Vite, Tailwind CSS, Zustand, Flip.js, chardet

---

## File Structure

```
SetsunaRead/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   └── commands/
│   │       ├── file.rs
│   │       └── storage.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   │   ├── BookView/
│   │   │   ├── DualPage.tsx
│   │   │   ├── SinglePage.tsx
│   │   │   ├── ScrollView.tsx
│   │   │   ├── PageFlipper.tsx
│   │   │   └── Page.tsx
│   │   ├── Reader/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── Bookshelf.tsx
│   │   │   ├── ChapterList.tsx
│   │   │   ├── BookmarkPanel.tsx
│   │   │   ├── SearchPanel.tsx
│   │   │   └── AnnotationPanel.tsx
│   │   └── ui/ (shadcn components)
│   ├── hooks/
│   │   ├── useBookParser.ts
│   │   ├── usePagination.ts
│   │   ├── useReadingProgress.ts
│   │   ├── useTheme.ts
│   │   ├── useBookmark.ts
│   │   ├── useSearch.ts
│   │   └── useAnnotation.ts
│   ├── stores/
│   │   ├── bookStore.ts
│   │   ├── settingsStore.ts
│   │   ├── bookmarkStore.ts
│   │   └── annotationStore.ts
│   ├── styles/
│   │   ├── book.css
│   │   └── themes.css
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

---

## Phase 1: Project Setup

### Task 1: Initialize Tauri + React Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Create: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`

- [ ] **Step 1: Create project with Vite**

```bash
cd E:/study/SetsunaRead
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install Tauri CLI**

```bash
npm install -D @tauri-apps/cli
```

- [ ] **Step 3: Initialize Tauri**

```bash
npx tauri init
```

Select: Window name = "SetsunaRead", Development URL = "http://localhost:5173"

- [ ] **Step 4: Add Tauri script to package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  }
}
```

- [ ] **Step 5: Verify project runs**

```bash
npm run dev
```

Expected: Vite dev server starts on localhost:5173

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Tauri + React + Vite project"
```

---

### Task 2: Configure Tailwind CSS + shadcn/ui

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src/styles/globals.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3: Add Tailwind directives to globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Import globals.css in main.tsx**

```typescript
import './styles/globals.css'
```

- [ ] **Step 5: Install shadcn/ui dependencies**

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 6: Create utils.ts for cn()**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: configure Tailwind CSS and shadcn/ui utils"
```

---

### Task 3: Install Core Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install state management**

```bash
npm install zustand
```

- [ ] **Step 2: Install encoding detection**

```bash
npm install chardet
npm install -D @types/chardet
```

- [ ] **Step 3: Install flip.js for page animations**

```bash
npm install flip.js
```

- [ ] **Step 4: Verify all dependencies installed**

```bash
npm ls zustand chardet flip.js
```

Expected: All packages listed without errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install core dependencies (zustand, chardet, flip.js)"
```

---

## Phase 2: Core Reading Logic

### Task 4: TXT File Parser Hook

**Files:**
- Create: `src/hooks/useBookParser.ts`
- Create: `src/types/book.ts`

- [ ] **Step 1: Define book types**

```typescript
// src/types/book.ts
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
  padding: { top: number; bottom: number; left: number; right: number };
}
```

- [ ] **Step 2: Create useBookParser hook**

```typescript
// src/hooks/useBookParser.ts
import { useState, useCallback } from 'react';
import chardet from 'chardet';
import { Book, Chapter } from '../types/book';

const CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十百千\d]+章/,
  /^第[一二三四五六七八九十百千\d]+节/,
  /^Chapter\s+\d+/i,
  /^\d+\.\s+/,
];

export function useBookParser() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  const detectEncoding = async (buffer: ArrayBuffer): Promise<string> => {
    const uint8Array = new Uint8Array(buffer);
    const sample = uint8Array.slice(0, 10000);
    const encoding = chardet.detect(Buffer.from(sample));
    return encoding || 'utf-8';
  };

  const parseChapters = (content: string): Chapter[] => {
    const lines = content.split('\n');
    const chapters: Chapter[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isChapter = CHAPTER_PATTERNS.some(pattern => pattern.test(line));

      if (isChapter && i > 0) {
        chapters.push({
          title: line,
          startIndex: currentIndex,
          endIndex: lines.slice(0, i).join('\n').length,
        });
      }
      currentIndex += lines[i].length + 1; // +1 for newline
    }

    // Add last chapter
    if (chapters.length > 0) {
      chapters[chapters.length - 1].endIndex = content.length;
    }

    return chapters;
  };

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const encoding = await detectEncoding(buffer);
      const decoder = new TextDecoder(encoding);
      const content = decoder.decode(buffer);

      const newBook: Book = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.txt$/i, ''),
        filePath: file.name,
        content,
        size: file.size,
        lastRead: Date.now(),
      };

      setBook(newBook);
      setChapters(parseChapters(content));
    } catch (error) {
      console.error('Failed to parse book:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { book, chapters, loading, loadFile };
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add TXT file parser with encoding detection and chapter parsing"
```

---

### Task 5: Pagination Algorithm Hook

**Files:**
- Create: `src/hooks/usePagination.ts`

- [ ] **Step 1: Create usePagination hook**

```typescript
// src/hooks/usePagination.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Page, PageConfig } from '../types/book';

export function usePagination(content: string, config: PageConfig) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const measureRef = useRef<HTMLDivElement | null>(null);

  // Create hidden measurement container
  useEffect(() => {
    if (!measureRef.current) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      div.style.width = `${config.width - config.padding.left - config.padding.right}px`;
      div.style.height = `${config.height - config.padding.top - config.padding.bottom}px`;
      div.style.fontSize = `${config.fontSize}px`;
      div.style.fontFamily = config.fontFamily;
      div.style.lineHeight = `${config.lineHeight}`;
      div.style.textAlign = 'justify';
      div.style.wordBreak = 'break-all';
      div.style.overflowWrap = 'break-word';
      document.body.appendChild(div);
      measureRef.current = div;
    }

    return () => {
      if (measureRef.current) {
        document.body.removeChild(measureRef.current);
        measureRef.current = null;
      }
    };
  }, [config]);

  // Paginate content
  const paginate = useCallback(() => {
    if (!content || !measureRef.current) return;

    const container = measureRef.current;
    const availableHeight = container.clientHeight;
    const availableWidth = container.clientWidth;

    const newPages: Page[] = [];
    let remaining = content;
    let pageNumber = 1;

    while (remaining.length > 0) {
      // Binary search for max chars that fit
      let low = 0;
      let high = remaining.length;
      let bestFit = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testContent = remaining.slice(0, mid);

        container.innerHTML = `<p style="text-indent:2em;margin:0;">${testContent.replace(/\n/g, '</p><p style="text-indent:2em;margin:0;">')}</p>`;

        if (container.scrollHeight <= availableHeight) {
          bestFit = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (bestFit === 0) {
        // Force at least one character
        bestFit = 1;
      }

      newPages.push({
        content: remaining.slice(0, bestFit),
        pageNumber,
      });

      remaining = remaining.slice(bestFit);
      pageNumber++;
    }

    setPages(newPages);
  }, [content, config]);

  useEffect(() => {
    paginate();
  }, [paginate]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page);
    }
  }, [pages.length]);

  const nextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pages.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    pages,
    currentPage,
    totalPages: pages.length,
    goToPage,
    nextPage,
    prevPage,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add pagination algorithm with binary search"
```

---

### Task 6: Zustand Stores

**Files:**
- Create: `src/stores/bookStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/bookmarkStore.ts`

- [ ] **Step 1: Create bookStore**

```typescript
// src/stores/bookStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book, Page } from '../types/book';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  pages: Page[];

  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
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

      addBook: (book) => set((state) => ({
        books: [...state.books, book],
      })),

      removeBook: (id) => set((state) => ({
        books: state.books.filter(b => b.id !== id),
      })),

      openBook: (book) => set({
        currentBook: book,
        currentPage: 0,
      }),

      closeBook: () => set({
        currentBook: null,
        currentPage: 0,
        pages: [],
      }),

      setPages: (pages) => set({
        pages,
        totalPages: pages.length,
      }),

      goToPage: (page) => set({ currentPage: page }),

      nextPage: () => set((state) => ({
        currentPage: Math.min(state.currentPage + 1, state.totalPages - 1),
      })),

      prevPage: () => set((state) => ({
        currentPage: Math.max(state.currentPage - 1, 0),
      })),
    }),
    {
      name: 'setsuna-reader-books',
      partialize: (state) => ({
        books: state.books.map(b => ({
          ...b,
          content: '', // Don't persist content
        })),
      }),
    }
  )
);
```

- [ ] **Step 2: Create settingsStore**

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  paperBackground: 'yellow' | 'white' | 'green' | 'brown';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  nightMode: boolean;
  flipAnimation: boolean;
}

interface SettingsState extends Settings {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggleNightMode: () => void;
}

const PAPER_COLORS = {
  yellow: '#f5f0e8',
  white: '#ffffff',
  green: '#e8f5e9',
  brown: '#d7ccc8',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      paperBackground: 'yellow',
      fontSize: 15,
      fontFamily: 'Noto Serif SC, SimSun, serif',
      lineHeight: 2,
      nightMode: false,
      flipAnimation: true,

      updateSetting: (key, value) => set({ [key]: value }),

      toggleNightMode: () => set((state) => ({
        nightMode: !state.nightMode,
      })),
    }),
    {
      name: 'setsuna-reader-settings',
    }
  )
);

export { PAPER_COLORS };
```

- [ ] **Step 3: Create bookmarkStore**

```typescript
// src/stores/bookmarkStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  preview: string;
  createdAt: number;
}

interface BookmarkState {
  bookmarks: Bookmark[];

  addBookmark: (bookId: string, page: number, preview: string) => void;
  removeBookmark: (id: string) => void;
  getBookmarks: (bookId: string) => Bookmark[];
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (bookId, page, preview) => set((state) => ({
        bookmarks: [
          ...state.bookmarks,
          {
            id: crypto.randomUUID(),
            bookId,
            page,
            preview,
            createdAt: Date.now(),
          },
        ],
      })),

      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.id !== id),
      })),

      getBookmarks: (bookId) => {
        return get().bookmarks.filter(b => b.bookId === bookId);
      },
    }),
    {
      name: 'setsuna-reader-bookmarks',
    }
  )
);
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add Zustand stores for books, settings, and bookmarks"
```

---

## Phase 3: Book UI Components

### Task 7: Page Component with Book Styling

**Files:**
- Create: `src/components/BookView/Page.tsx`
- Create: `src/styles/book.css`

- [ ] **Step 1: Create book.css**

```css
/* src/styles/book.css */

/* Paper texture */
.paper-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

/* Book spine shadow */
.book-spine-shadow-left {
  box-shadow: inset -8px 0 16px -8px rgba(0,0,0,0.06);
}

.book-spine-shadow-right {
  box-shadow: inset 8px 0 16px -8px rgba(0,0,0,0.06);
}

/* Page corner curl */
.page-curl {
  position: relative;
}

.page-curl::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 52%, #e8e3d8 52%);
  border-radius: 0 0 3px 0;
  pointer-events: none;
}

/* Victorian filigree corner */
.filigree {
  position: absolute;
  width: 56px;
  height: 56px;
  pointer-events: none;
  opacity: 0.22;
}

.filigree-tl { top: 12px; left: 12px; }
.filigree-tr { top: 12px; right: 12px; transform: scaleX(-1); }
.filigree-bl { bottom: 12px; left: 12px; transform: scaleY(-1); }
.filigree-br { bottom: 12px; right: 12px; transform: scale(-1,-1); }

/* Bookmark styles */
.bookmark-clip {
  background: linear-gradient(180deg, #333 0%, #222 100%);
  border-radius: 6px 6px 0 0;
  box-shadow:
    0 -3px 10px rgba(0,0,0,0.35),
    inset 0 1px 3px rgba(255,255,255,0.12);
}

.bookmark-ribbon {
  background: rgba(15,15,15,0.75);
  backdrop-filter: blur(12px);
  border-radius: 0 0 6px 6px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
}

/* Night mode */
.night-mode .page {
  background: #1a1a2e !important;
  color: #d4d4d4 !important;
}

.night-mode .book-spine {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.05) 0%,
    rgba(255,255,255,0.02) 50%,
    rgba(255,255,255,0.05) 100%
  ) !important;
}
```

- [ ] **Step 2: Create Page component**

```typescript
// src/components/BookView/Page.tsx
import React from 'react';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';

interface PageProps {
  content: string;
  pageNumber: number;
  isLeft?: boolean;
}

export function Page({ content, pageNumber, isLeft = false }: PageProps) {
  const { paperBackground, fontSize, fontFamily, lineHeight, nightMode } = useSettingsStore();

  const bgColor = nightMode ? '#1a1a2e' : PAPER_COLORS[paperBackground];
  const textColor = nightMode ? '#d4d4d4' : '#2a2a2a';

  return (
    <div
      className={`
        relative overflow-hidden
        ${isLeft ? 'book-spine-shadow-left' : 'book-spine-shadow-right'}
        ${!nightMode ? 'paper-texture' : ''}
      `}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontSize: `${fontSize}px`,
        fontFamily,
        lineHeight,
        padding: '60px 55px 70px',
        textAlign: 'justify',
        wordBreak: 'break-all',
        overflowWrap: 'break-word',
      }}
    >
      {/* Filigree corners */}
      <div className="filigree filigree-tl">
        <svg viewBox="0 0 80 80">
          <g fill="none" stroke={nightMode ? '#888' : '#5a4a35'} strokeWidth="1" opacity="0.25">
            <path d="M5,5 C5,25 15,35 25,40"/>
            <path d="M5,5 C25,5 35,15 40,25"/>
            <path d="M8,12 C12,18 18,22 22,24"/>
            <path d="M12,8 C18,12 22,18 24,22"/>
            <circle cx="5" cy="5" r="2" fill={nightMode ? '#888' : '#5a4a35'} fillOpacity="0.3"/>
          </g>
        </svg>
      </div>
      <div className="filigree filigree-br">
        <svg viewBox="0 0 80 80">
          <g fill="none" stroke={nightMode ? '#888' : '#5a4a35'} strokeWidth="1" opacity="0.25">
            <path d="M5,5 C5,25 15,35 25,40"/>
            <path d="M5,5 C25,5 35,15 40,25"/>
            <path d="M8,12 C12,18 18,22 22,24"/>
            <path d="M12,8 C18,12 22,18 24,22"/>
            <circle cx="5" cy="5" r="2" fill={nightMode ? '#888' : '#5a4a35'} fillOpacity="0.3"/>
          </g>
        </svg>
      </div>

      {/* Content */}
      <div
        dangerouslySetInnerHTML={{
          __html: content.split('\n').map(p =>
            `<p style="text-indent:2em;margin-bottom:0.3em;">${p}</p>`
          ).join('')
        }}
      />

      {/* Page number */}
      <div
        className="absolute bottom-6 left-0 right-0 text-center text-xs opacity-60"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '1px' }}
      >
        {pageNumber}
      </div>

      {/* Page curl */}
      {!isLeft && <div className="page-curl absolute bottom-0 right-0 w-10 h-10" />}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Page component with book styling and filigree corners"
```

---

### Task 8: DualPage Reading Mode

**Files:**
- Create: `src/components/BookView/DualPage.tsx`

- [ ] **Step 1: Create DualPage component**

```typescript
// src/components/BookView/DualPage.tsx
import React, { useEffect, useCallback } from 'react';
import { Page } from './Page';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function DualPage() {
  const { pages, currentPage, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  }, [nextPage, prevPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (pages.length === 0) return null;

  const leftPage = pages[currentPage];
  const rightPage = pages[currentPage + 1];

  return (
    <div className={`flex-1 flex justify-center items-center ${nightMode ? 'night-mode' : ''}`}>
      <div
        className="flex relative"
        style={{
          filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.3))',
          transform: 'perspective(2000px) rotateX(1deg)',
        }}
      >
        {/* Left Page */}
        <div
          style={{
            width: '48vw',
            maxWidth: '520px',
            height: '85vh',
            maxHeight: '720px',
            borderRadius: '2px 0 0 2px',
            transform: 'perspective(800px) rotateY(1deg)',
            transformOrigin: 'right center',
          }}
        >
          {leftPage && (
            <Page
              content={leftPage.content}
              pageNumber={leftPage.pageNumber}
              isLeft={true}
            />
          )}
        </div>

        {/* Book Spine */}
        <div
          className="w-8 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.08) 30%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Right Page */}
        <div
          style={{
            width: '48vw',
            maxWidth: '520px',
            height: '85vh',
            maxHeight: '720px',
            borderRadius: '0 2px 2px 0',
            transform: 'perspective(800px) rotateY(-1deg)',
            transformOrigin: 'left center',
          }}
        >
          {rightPage && (
            <Page
              content={rightPage.content}
              pageNumber={rightPage.pageNumber}
              isLeft={false}
            />
          )}
        </div>

        {/* Book Edge */}
        <div
          className="absolute right-[-14px] top-1 bottom-1 w-3.5"
          style={{
            background: 'linear-gradient(90deg, #c4b8a8, #d4c8b8 25%, #cdc0ae 50%, #c0b39e 75%, #a89880)',
            borderRadius: '0 4px 4px 0',
            boxShadow: '3px 2px 8px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add DualPage reading mode with book spine and edge"
```

---

### Task 9: SinglePage and ScrollView Modes

**Files:**
- Create: `src/components/BookView/SinglePage.tsx`
- Create: `src/components/BookView/ScrollView.tsx`

- [ ] **Step 1: Create SinglePage component**

```typescript
// src/components/BookView/SinglePage.tsx
import React, { useEffect, useCallback } from 'react';
import { Page } from './Page';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function SinglePage() {
  const { pages, currentPage, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  }, [nextPage, prevPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (pages.length === 0) return null;

  const currentPageData = pages[currentPage];

  return (
    <div className={`flex-1 flex justify-center items-center ${nightMode ? 'night-mode' : ''}`}>
      <div
        style={{
          width: '50vw',
          maxWidth: '600px',
          height: '85vh',
          maxHeight: '720px',
          filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.3))',
          borderRadius: '4px',
        }}
      >
        <Page
          content={currentPageData.content}
          pageNumber={currentPageData.pageNumber}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ScrollView component**

```typescript
// src/components/BookView/ScrollView.tsx
import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';

export function ScrollView() {
  const { pages } = useBookStore();
  const { paperBackground, fontSize, fontFamily, lineHeight, nightMode } = useSettingsStore();

  const bgColor = nightMode ? '#1a1a2e' : PAPER_COLORS[paperBackground];
  const textColor = nightMode ? '#d4d4d4' : '#2a2a2a';

  return (
    <div className={`flex-1 overflow-y-auto ${nightMode ? 'night-mode' : ''}`}>
      <div
        className="max-w-2xl mx-auto py-12 px-8"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight,
        }}
      >
        {pages.map((page, index) => (
          <div key={index} className="mb-8">
            <div
              dangerouslySetInnerHTML={{
                __html: page.content.split('\n').map(p =>
                  `<p style="text-indent:2em;margin-bottom:0.5em;">${p}</p>`
                ).join('')
              }}
            />
            <div
              className="text-center text-xs opacity-60 mt-8"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {page.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add SinglePage and ScrollView reading modes"
```

---

## Phase 4: Reader UI

### Task 10: Toolbar Component

**Files:**
- Create: `src/components/Reader/Toolbar.tsx`

- [ ] **Step 1: Create Toolbar component**

```typescript
// src/components/Reader/Toolbar.tsx
import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface ToolbarProps {
  onOpenSettings: () => void;
  onOpenChapters: () => void;
  onOpenBookmarks: () => void;
  onOpenSearch: () => void;
  readingMode: 'dual' | 'single' | 'scroll';
  onModeChange: (mode: 'dual' | 'single' | 'scroll') => void;
}

export function Toolbar({
  onOpenSettings,
  onOpenChapters,
  onOpenBookmarks,
  onOpenSearch,
  readingMode,
  onModeChange,
}: ToolbarProps) {
  const { currentPage, totalPages, nextPage, prevPage } = useBookStore();
  const { nightMode } = useSettingsStore();

  const progress = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

  return (
    <div
      className="h-10 flex items-center px-5 gap-4"
      style={{
        background: '#1a1a1a',
        borderTop: '1px solid #333',
      }}
    >
      <button
        onClick={prevPage}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        ◀ 上一页
      </button>

      <button
        onClick={onOpenChapters}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        目录
      </button>

      <button
        onClick={onOpenBookmarks}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        书签
      </button>

      <button
        onClick={onOpenSearch}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        搜索
      </button>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          第 {currentPage + 1} 页 / 共 {totalPages} 页
        </span>
        <div className="flex-1 h-0.5 bg-gray-700 rounded relative">
          <div
            className="h-full rounded"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }}
          />
        </div>
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>

      {/* Reading mode selector */}
      <select
        value={readingMode}
        onChange={(e) => onModeChange(e.target.value as 'dual' | 'single' | 'scroll')}
        className="text-xs bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1"
      >
        <option value="dual">双页</option>
        <option value="single">单页</option>
        <option value="scroll">滚动</option>
      </select>

      <button
        onClick={onOpenSettings}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        设置
      </button>

      <button
        onClick={nextPage}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        下一页 ▶
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Toolbar with progress bar and mode selector"
```

---

### Task 11: Settings Panel

**Files:**
- Create: `src/components/Reader/SettingsPanel.tsx`

- [ ] **Step 1: Create SettingsPanel component**

```typescript
// src/components/Reader/SettingsPanel.tsx
import React from 'react';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    paperBackground,
    fontSize,
    fontFamily,
    lineHeight,
    nightMode,
    flipAnimation,
    updateSetting,
    toggleNightMode,
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="w-96 rounded-xl p-6"
        style={{ background: '#1e293b' }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-white">阅读设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Paper background */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">纸张背景</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(PAPER_COLORS) as Array<keyof typeof PAPER_COLORS>).map((key) => (
              <button
                key={key}
                onClick={() => updateSetting('paperBackground', key)}
                className={`px-4 py-2 rounded text-sm ${
                  paperBackground === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                style={{ backgroundColor: paperBackground === key ? undefined : PAPER_COLORS[key] }}
              >
                {key === 'yellow' ? '米黄' : key === 'white' ? '纯白' : key === 'green' ? '护眼绿' : '牛皮纸'}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">
            字体大小: {fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="24"
            value={fontSize}
            onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Line height */}
        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-2">
            行间距: {lineHeight}
          </label>
          <input
            type="range"
            min="1.5"
            max="3"
            step="0.1"
            value={lineHeight}
            onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Night mode */}
        <div className="mb-5">
          <button
            onClick={toggleNightMode}
            className={`px-4 py-2 rounded text-sm ${
              nightMode
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {nightMode ? '🌙 夜间模式开' : '☀️ 夜间模式关'}
          </button>
        </div>

        {/* Flip animation */}
        <div className="mb-5">
          <button
            onClick={() => updateSetting('flipAnimation', !flipAnimation)}
            className={`px-4 py-2 rounded text-sm ${
              flipAnimation
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {flipAnimation ? '✨ 翻页动画开' : '翻页动画关'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add SettingsPanel with paper, font, and theme options"
```

---

### Task 12: Chapter List and Bookmark Panel

**Files:**
- Create: `src/components/Reader/ChapterList.tsx`
- Create: `src/components/Reader/BookmarkPanel.tsx`

- [ ] **Step 1: Create ChapterList component**

```typescript
// src/components/Reader/ChapterList.tsx
import React from 'react';
import { Chapter } from '../../types/book';

interface ChapterListProps {
  chapters: Chapter[];
  currentChapterIndex: number;
  onSelect: (chapter: Chapter) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChapterList({
  chapters,
  currentChapterIndex,
  onSelect,
  isOpen,
  onClose,
}: ChapterListProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-12 top-10 bottom-10 w-64 z-40">
      <div
        className="h-full rounded-xl overflow-hidden flex flex-col"
        style={{ background: '#1a1a1a' }}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">章节目录</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {chapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => onSelect(chapter)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                index === currentChapterIndex
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {chapter.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BookmarkPanel component**

```typescript
// src/components/Reader/BookmarkPanel.tsx
import React from 'react';
import { useBookmarkStore } from '../../stores/bookmarkStore';
import { useBookStore } from '../../stores/bookStore';

interface BookmarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkPanel({ isOpen, onClose }: BookmarkPanelProps) {
  const { currentBook } = useBookStore();
  const { bookmarks, removeBookmark } = useBookmarkStore();
  const { goToPage } = useBookStore();

  if (!isOpen || !currentBook) return null;

  const bookBookmarks = bookmarks
    .filter(b => b.bookId === currentBook.id)
    .sort((a, b) => a.page - b.page);

  return (
    <div className="fixed left-12 top-10 bottom-10 w-64 z-40">
      <div
        className="h-full rounded-xl overflow-hidden flex flex-col"
        style={{ background: '#1a1a1a' }}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">书签列表</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {bookBookmarks.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              暂无书签
            </div>
          ) : (
            bookBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-3 mb-2 rounded cursor-pointer hover:bg-gray-800 border-l-2 border-yellow-500"
                onClick={() => goToPage(bookmark.page)}
              >
                <div className="text-xs text-yellow-500 mb-1">
                  第 {bookmark.page + 1} 页
                </div>
                <div className="text-xs text-gray-400 line-clamp-2">
                  {bookmark.preview}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark(bookmark.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-400 mt-1"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add ChapterList and BookmarkPanel components"
```

---

### Task 13: Search Panel

**Files:**
- Create: `src/components/Reader/SearchPanel.tsx`
- Create: `src/hooks/useSearch.ts`

- [ ] **Step 1: Create useSearch hook**

```typescript
// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { Page } from '../types/book';

interface SearchResult {
  pageIndex: number;
  pageNumber: number;
  matchIndex: number;
  context: string;
}

export function useSearch(pages: Page[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const newResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    pages.forEach((page, pageIndex) => {
      const lowerContent = page.content.toLowerCase();
      let startIndex = 0;
      let matchIndex;

      while ((matchIndex = lowerContent.indexOf(lowerQuery, startIndex)) !== -1) {
        const start = Math.max(0, matchIndex - 20);
        const end = Math.min(page.content.length, matchIndex + searchQuery.length + 20);
        const context = (start > 0 ? '...' : '') +
          page.content.slice(start, matchIndex) +
          `<mark class="bg-yellow-300 text-black">${page.content.slice(matchIndex, matchIndex + searchQuery.length)}</mark>` +
          page.content.slice(matchIndex + searchQuery.length, end) +
          (end < page.content.length ? '...' : '');

        newResults.push({
          pageIndex,
          pageNumber: page.pageNumber,
          matchIndex,
          context,
        });

        startIndex = matchIndex + 1;
      }
    });

    setResults(newResults);
    setCurrentResultIndex(0);
  }, [pages]);

  const nextResult = useCallback(() => {
    setCurrentResultIndex(prev =>
      prev < results.length - 1 ? prev + 1 : 0
    );
  }, [results.length]);

  const prevResult = useCallback(() => {
    setCurrentResultIndex(prev =>
      prev > 0 ? prev - 1 : results.length - 1
    );
  }, [results.length]);

  return {
    query,
    results,
    currentResultIndex,
    search,
    nextResult,
    prevResult,
    currentResult: results[currentResultIndex],
  };
}
```

- [ ] **Step 2: Create SearchPanel component**

```typescript
// src/components/Reader/SearchPanel.tsx
import React, { useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useBookStore } from '../../stores/bookStore';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const { pages, goToPage } = useBookStore();
  const { query, results, currentResultIndex, search, nextResult, prevResult } = useSearch(pages);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSearch = () => {
    search(inputValue);
  };

  const handleResultClick = (result: typeof results[0]) => {
    goToPage(result.pageIndex);
  };

  return (
    <div className="fixed left-12 top-10 bottom-10 w-80 z-40">
      <div
        className="h-full rounded-xl overflow-hidden flex flex-col"
        style={{ background: '#1a1a1a' }}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-white">全文搜索</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入关键词..."
              className="flex-1 px-3 py-2 rounded text-sm bg-gray-800 text-white border border-gray-600 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
            >
              搜索
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>共 {results.length} 个结果</span>
              <div className="flex gap-2">
                <button onClick={prevResult} className="hover:text-white">◀</button>
                <span>{currentResultIndex + 1} / {results.length}</span>
                <button onClick={nextResult} className="hover:text-white">▶</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultClick(result)}
              className={`p-3 mb-2 rounded cursor-pointer text-xs ${
                index === currentResultIndex
                  ? 'bg-blue-500/20 border border-blue-500'
                  : 'hover:bg-gray-800'
              }`}
            >
              <div className="text-gray-500 mb-1">第 {result.pageNumber} 页</div>
              <div
                className="text-gray-300 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: result.context }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add SearchPanel with full-text search"
```

---

### Task 14: App Integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx**

```typescript
// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { DualPage } from './components/BookView/DualPage';
import { SinglePage } from './components/BookView/SinglePage';
import { ScrollView } from './components/BookView/ScrollView';
import { Toolbar } from './components/Reader/Toolbar';
import { SettingsPanel } from './components/Reader/SettingsPanel';
import { ChapterList } from './components/Reader/ChapterList';
import { BookmarkPanel } from './components/Reader/BookmarkPanel';
import { SearchPanel } from './components/Reader/SearchPanel';
import { useBookStore } from './stores/bookStore';
import { useBookParser } from './hooks/useBookParser';
import { usePagination } from './hooks/usePagination';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const [readingMode, setReadingMode] = useState<'dual' | 'single' | 'scroll'>('dual');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { book, chapters, loadFile } = useBookParser();
  const { currentBook, openBook, setPages, currentPage } = useBookStore();
  const { fontSize, fontFamily, lineHeight, nightMode } = useSettingsStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const pageConfig = {
    width: window.innerWidth * 0.48,
    height: window.innerHeight * 0.85,
    fontSize,
    fontFamily,
    lineHeight,
    padding: { top: 60, bottom: 70, left: 55, right: 55 },
  };

  const { pages, totalPages } = usePagination(
    currentBook?.content || '',
    pageConfig
  );

  useEffect(() => {
    if (pages.length > 0) {
      setPages(pages);
    }
  }, [pages, setPages]);

  const handleFileImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await loadFile(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (book) {
      openBook(book);
    }
  }, [book, openBook]);

  return (
    <div className={`h-screen flex flex-col ${nightMode ? 'bg-gray-900' : 'bg-[#3d3d3d]'}`}>
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-gray-700">
        <span className="text-xs text-gray-400">
          {currentBook ? currentBook.title : 'SetsunaRead'}
        </span>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400 cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-green-400 cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-red-400 cursor-pointer" />
        </div>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        {!currentBook ? (
          /* Bookshelf / Import screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl text-white mb-4">SetsunaRead</h1>
              <p className="text-gray-400 mb-6">导入 TXT 文件开始阅读</p>
              <button
                onClick={handleFileImport}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                选择文件
              </button>
            </div>
          </div>
        ) : (
          /* Reading view */
          <>
            {readingMode === 'dual' && <DualPage />}
            {readingMode === 'single' && <SinglePage />}
            {readingMode === 'scroll' && <ScrollView />}

            <Toolbar
              readingMode={readingMode}
              onModeChange={setReadingMode}
              onOpenSettings={() => setShowSettings(true)}
              onOpenChapters={() => setShowChapters(true)}
              onOpenBookmarks={() => setShowBookmarks(true)}
              onOpenSearch={() => setShowSearch(true)}
            />
          </>
        )}
      </div>

      {/* Panels */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ChapterList
        chapters={chapters}
        currentChapterIndex={0}
        onSelect={(chapter) => {
          setShowChapters(false);
        }}
        isOpen={showChapters}
        onClose={() => setShowChapters(false)}
      />
      <BookmarkPanel isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} />
      <SearchPanel isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: integrate all components into App"
```

---

## Phase 5: Bookshelf and Polish

### Task 15: Bookshelf Component

**Files:**
- Create: `src/components/Reader/Bookshelf.tsx`

- [ ] **Step 1: Create Bookshelf component**

```typescript
// src/components/Reader/Bookshelf.tsx
import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { Book } from '../../types/book';

interface BookshelfProps {
  onOpenBook: (book: Book) => void;
  onImport: () => void;
}

export function Bookshelf({ onOpenBook, onImport }: BookshelfProps) {
  const { books, removeBook } = useBookStore();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-white">我的书架</h2>
        <button
          onClick={onImport}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          导入书籍
        </button>
      </div>

      {books.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="text-lg mb-2">书架空空如也</p>
          <p className="text-sm">点击上方按钮导入 TXT 文件</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="p-4 rounded-lg cursor-pointer transition-all hover:scale-105"
              style={{ background: '#2a2a2a' }}
              onClick={() => onOpenBook(book)}
            >
              <div
                className="h-32 rounded mb-3 flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e3d8 100%)' }}
              >
                📖
              </div>
              <h3 className="text-sm text-white truncate mb-1">{book.title}</h3>
              <p className="text-xs text-gray-500">
                {formatSize(book.size)} · {formatDate(book.lastRead)}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBook(book.id);
                }}
                className="text-xs text-red-500 hover:text-red-400 mt-2"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Bookshelf component for managing books"
```

---

### Task 16: Final Integration and Testing

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx with Bookshelf**

Update the App.tsx to include Bookshelf when no book is open, and integrate all features properly.

- [ ] **Step 2: Test the complete flow**

```bash
npm run dev
```

Test:
1. Import a TXT file
2. Verify bookshelf shows the book
3. Open the book and verify dual-page view
4. Test navigation (arrow keys, click)
5. Test settings panel
6. Test chapter list
7. Test bookmarks
8. Test search
9. Test night mode

- [ ] **Step 3: Build for production**

```bash
npm run build
npx tauri build
```

Expected: Tauri builds successfully, produces executable

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete SetsunaRead v1.0 with all features"
```

---

### Task 17: Onboarding Guide

**Files:**
- Create: `src/components/Reader/OnboardingGuide.tsx`
- Create: `src/hooks/useOnboarding.ts`

- [ ] **Step 1: Create useOnboarding hook**

```typescript
// src/hooks/useOnboarding.ts
import { useState, useEffect } from 'react';

// 存储用户是否已完成引导的状态
// 使用 localStorage 持久化，这样刷新页面后不会再次显示引导
const ONBOARDING_KEY = 'setsuna-reader-onboarding-completed';

export function useOnboarding() {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 检查用户是否是首次使用
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // 首次使用，显示引导
      setShowGuide(true);
    }
  }, []);

  // 完成当前步骤，进入下一步
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  // 返回上一步
  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // 跳过引导
  const skipGuide = () => {
    setShowGuide(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  // 完成引导
  const completeGuide = () => {
    setShowGuide(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return {
    showGuide,
    currentStep,
    nextStep,
    prevStep,
    skipGuide,
    completeGuide,
  };
}
```

- [ ] **Step 2: Create OnboardingGuide component**

```typescript
// src/components/Reader/OnboardingGuide.tsx
import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';

// 引导步骤配置
// 每个步骤包含：标题、描述、图标、高亮区域
const STEPS = [
  {
    title: '欢迎使用 SetsunaRead',
    description: '这是一个仿真的电子书阅读器，支持 TXT 文件导入，提供沉浸式的阅读体验。',
    icon: '📖',
    highlight: null, // 不高亮任何区域
  },
  {
    title: '导入书籍',
    description: '点击"选择文件"按钮导入 TXT 格式的小说文件。支持自动识别编码，兼容 GBK、UTF-8 等格式。',
    icon: '📁',
    highlight: 'import-button', // 高亮导入按钮
  },
  {
    title: '仿真双页阅读',
    description: '默认使用双页模式，模拟真实书本翻页效果。支持键盘左右箭头翻页，也可以点击页面边缘。',
    icon: '📄',
    highlight: 'book-view', // 高亮书本区域
  },
  {
    title: '阅读设置',
    description: '点击工具栏的"设置"按钮，可以调整纸张背景、字体大小、行间距，开启夜间模式等。',
    icon: '⚙️',
    highlight: 'settings-button', // 高亮设置按钮
  },
  {
    title: '书签与搜索',
    description: '支持添加书签、全文搜索、章节目录跳转。所有数据保存在本地，无需联网。',
    icon: '🔖',
    highlight: 'toolbar', // 高亮工具栏
  },
  {
    title: '开始阅读',
    description: '现在你可以导入一本小说，享受沉浸式的阅读体验了！',
    icon: '🎉',
    highlight: null,
  },
];

interface OnboardingGuideProps {
  isOpen: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingGuide({
  isOpen,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingGuideProps) {
  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 半透明遮罩层 */}
      <div className="absolute inset-0 bg-black/70" />

      {/* 引导卡片 */}
      <div
        className="relative z-10 w-96 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* 顶部图标区域 */}
        <div className="h-40 flex items-center justify-center relative overflow-hidden">
          {/* 装饰性背景圆 */}
          <div
            className="absolute w-64 h-64 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
              top: '-50%',
              right: '-20%',
            }}
          />
          <span className="text-7xl relative z-10">{step.icon}</span>
        </div>

        {/* 内容区域 */}
        <div className="px-8 pb-8">
          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-amber-400'
                    : index < currentStep
                    ? 'w-4 bg-amber-400/50'
                    : 'w-4 bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* 标题 */}
          <h2 className="text-xl font-bold text-white text-center mb-3">
            {step.title}
          </h2>

          {/* 描述 */}
          <p className="text-sm text-gray-300 text-center leading-relaxed mb-8">
            {step.description}
          </p>

          {/* 按钮区域 */}
          <div className="flex gap-3">
            {/* 跳过按钮 */}
            {!isLastStep && (
              <button
                onClick={onSkip}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                跳过
              </button>
            )}

            {/* 上一步按钮 */}
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
              >
                上一步
              </button>
            )}

            {/* 下一步/完成按钮 */}
            <button
              onClick={isLastStep ? onComplete : onNext}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-black transition-colors"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              {isLastStep ? '开始阅读' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Integrate OnboardingGuide into App.tsx**

在 `src/App.tsx` 中添加：

```typescript
// 在文件顶部导入
import { OnboardingGuide } from './components/Reader/OnboardingGuide';
import { useOnboarding } from './hooks/useOnboarding';

// 在 App 组件内部添加
const { showGuide, currentStep, nextStep, prevStep, skipGuide, completeGuide } = useOnboarding();

// 在 return 的 JSX 中，在最外层 div 内添加
<OnboardingGuide
  isOpen={showGuide}
  currentStep={currentStep}
  onNext={nextStep}
  onPrev={prevStep}
  onSkip={skipGuide}
  onComplete={completeGuide}
/>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add onboarding guide for first-time users"
```

---

## Summary

This plan covers:

1. **Project Setup** - Tauri + React + Vite + Tailwind + shadcn/ui
2. **Core Logic** - TXT parsing, pagination, state management
3. **Book UI** - Page component, dual/single/scroll modes, book styling
4. **Reader UI** - Toolbar, settings, chapters, bookmarks, search
5. **Polish** - Bookshelf, final integration

Each task is self-contained with clear steps, code, and commit points.
