# TXT 大文件打开不卡顿 + 全屏进度提示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打开 10MB+ TXT 不再卡死主线程，并在导入/解析/分页过程中提供全屏进度提示（可取消）。

**Architecture:** 将 TXT 解析（解码、章节识别、分页）迁移到 Web Worker，主线程通过消息协议接收阶段与百分比进度；UI 增加一个全屏 LoadingOverlay（古风样式），由 App/Bookshelf 导入流程驱动显示与取消。Zustand store 仍负责保存最终 Book/Pages/Chapters。

**Tech Stack:** React 18 + TypeScript + Vite（worker via `new Worker(new URL(..., import.meta.url))`）, Zustand, Tailwind。

---

## Files overview

**Create:**
- `src/workers/txtParser.worker.ts` — Worker 入口：接收 ArrayBuffer + 配置，分阶段解析并回传进度与最终结果
- `src/types/importProgress.ts` — 进度消息类型（阶段/百分比/文案/可选统计）
- `src/components/Reader/ImportProgressOverlay.tsx` — 全屏进度遮罩（古风样式，可取消）

**Modify:**
- `src/hooks/useBookParser.ts` — 改为调用 worker；保留 hook API，但新增 progress 状态与 cancel
- `src/App.tsx` — 接入 overlay（导入时展示），导入完成后关闭并进入阅读
- `src/components/Reader/Bookshelf.tsx` — 导入按钮触发导入时显示 overlay（通过上层回调/状态）
- `src/stores/bookStore.ts` — 增加 setBook/setChapters（或复用现有 openBook/setPages）以一次性写入最终结果

---

## Message protocol

Worker 接收：
```ts
export type TxtParseRequest = {
  type: 'parse';
  requestId: string;
  fileName: string;
  filePath: string;
  buffer: ArrayBuffer;
  pageConfig: PageConfig;
};

export type TxtParseCancel = {
  type: 'cancel';
  requestId: string;
};
```

Worker 回传：
```ts
export type TxtParseProgress = {
  type: 'progress';
  requestId: string;
  stage: 'reading' | 'decoding' | 'chapters' | 'pagination' | 'finalizing';
  percent: number; // 0-100
  message: string; // 中文文案
};

export type TxtParseResult = {
  type: 'result';
  requestId: string;
  book: Book;
  chapters: Chapter[];
  pages: Page[];
};

export type TxtParseError = {
  type: 'error';
  requestId: string;
  message: string;
};
```

---

### Task 1: 新增进度类型与 Overlay 组件（先做 UI 框架）

**Files:**
- Create: `src/types/importProgress.ts`
- Create: `src/components/Reader/ImportProgressOverlay.tsx`

- [ ] **Step 1: 创建进度类型文件**

`src/types/importProgress.ts`
```ts
export type ImportStage =
  | 'reading'
  | 'decoding'
  | 'chapters'
  | 'pagination'
  | 'finalizing';

export type ImportProgress = {
  stage: ImportStage;
  percent: number; // 0-100
  message: string;
};
```

- [ ] **Step 2: 创建全屏进度遮罩组件（古风样式）**

`src/components/Reader/ImportProgressOverlay.tsx`
```tsx
import React from 'react';
import type { ImportProgress } from '@/types/importProgress';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  title: string;
  progress: ImportProgress;
  onCancel: () => void;
};

const stageLabel: Record<ImportProgress['stage'], string> = {
  reading: '正在读取文件',
  decoding: '正在解码文本',
  chapters: '正在识别章节',
  pagination: '正在分页排版',
  finalizing: '正在整理数据',
};

export default function ImportProgressOverlay({ open, title, progress, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className={cn(
          'relative w-[520px] max-w-[92vw] rounded-2xl border shadow-2xl overflow-hidden',
          'bg-[#111114] border-[rgba(160,121,45,0.25)]',
        )}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="text-sm tracking-widest text-[rgba(160,121,45,0.75)] select-none">开卷有益</div>
          <h3 className="mt-1 text-lg font-semibold text-[rgba(246,241,230,0.92)] truncate">正在打开《{title}》</h3>

          <div className="mt-4 text-sm text-[rgba(246,241,230,0.75)]">
            {stageLabel[progress.stage]} · {progress.message}
          </div>

          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8b6914] via-[#a0792d] to-[#b43a2f]"
              style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            />
          </div>

          <div className="mt-2 text-right text-xs text-white/50 tabular-nums">{progress.percent.toFixed(0)}%</div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm border border-white/10 text-white/80 hover:bg-white/5"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/importProgress.ts src/components/Reader/ImportProgressOverlay.tsx
git commit -m "feat: add import progress overlay UI"
```

---

### Task 2: 创建 TXT 解析 Worker（可取消 + 分段进度）

**Files:**
- Create: `src/workers/txtParser.worker.ts`
- Modify: `src/hooks/useBookParser.ts` (move helpers to shared or duplicate minimal)

- [ ] **Step 1: 抽取/复用解析函数到 worker（允许复制）**

为了避免 worker 依赖 React hook 文件，将 `detectEncoding` / `parseChapters` / `paginateContent` 逻辑复制到 worker 内（先不做抽公共文件，YAGNI）。

- [ ] **Step 2: Worker 实现消息处理与取消**

`src/workers/txtParser.worker.ts`
```ts
/// <reference lib="webworker" />
import type { Book, Chapter, Page, PageConfig } from '@/types/book';

type RequestMsg =
  | { type: 'parse'; requestId: string; fileName: string; filePath: string; buffer: ArrayBuffer; pageConfig: PageConfig }
  | { type: 'cancel'; requestId: string };

type ProgressStage = 'reading' | 'decoding' | 'chapters' | 'pagination' | 'finalizing';

type ProgressMsg = { type: 'progress'; requestId: string; stage: ProgressStage; percent: number; message: string };

type ResultMsg = { type: 'result'; requestId: string; book: Book; chapters: Chapter[]; pages: Page[] };

type ErrorMsg = { type: 'error'; requestId: string; message: string };

const ctx: DedicatedWorkerGlobalScope = self as any;

const canceled = new Set<string>();

function post(msg: ProgressMsg | ResultMsg | ErrorMsg) {
  ctx.postMessage(msg);
}

function checkCanceled(requestId: string) {
  if (canceled.has(requestId)) throw new Error('__CANCELED__');
}

ctx.onmessage = async (e: MessageEvent<RequestMsg>) => {
  const msg = e.data;

  if (msg.type === 'cancel') {
    canceled.add(msg.requestId);
    return;
  }

  const { requestId, fileName, filePath, buffer, pageConfig } = msg;

  try {
    post({ type: 'progress', requestId, stage: 'decoding', percent: 3, message: '准备解码…' });
    checkCanceled(requestId);

    const encoding = detectEncoding(buffer);
    post({ type: 'progress', requestId, stage: 'decoding', percent: 8, message: `编码：${encoding}` });

    const decoder = new TextDecoder(encoding);
    let content = decoder.decode(buffer);
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

    checkCanceled(requestId);

    post({ type: 'progress', requestId, stage: 'chapters', percent: 18, message: '扫描章节标题…' });
    const chapters = parseChapters(content);

    checkCanceled(requestId);

    post({ type: 'progress', requestId, stage: 'pagination', percent: 28, message: '开始分页…' });
    const pages = paginateWithProgress(content, pageConfig, (p) => {
      post({ type: 'progress', requestId, stage: 'pagination', percent: 28 + p * 70, message: '分页中…' });
    }, () => checkCanceled(requestId));

    post({ type: 'progress', requestId, stage: 'finalizing', percent: 99, message: '即将完成…' });

    const book: Book = {
      id: crypto.randomUUID(),
      title: fileName.replace(/\.txt$/i, ''),
      filePath,
      content,
      size: buffer.byteLength,
      lastRead: Date.now(),
    };

    post({ type: 'result', requestId, book, chapters, pages });
  } catch (err: any) {
    if (err?.message === '__CANCELED__') return;
    post({ type: 'error', requestId, message: err?.message ?? '解析失败' });
  } finally {
    canceled.delete(requestId);
  }
};

// ---- helpers (copy from useBookParser.ts with minimal changes) ----
function detectEncoding(buffer: ArrayBuffer): string { /* copy existing */ return 'utf-8'; }
function parseChapters(content: string): Chapter[] { /* copy existing */ return []; }

function paginateWithProgress(
  content: string,
  config: PageConfig,
  onProgress: (fraction: number) => void,
  check: () => void,
): Page[] {
  // chunked loop: report every N pages
  const { width, height, fontSize, lineHeight, padding } = config;
  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;
  const charsPerLine = Math.floor(contentWidth / fontSize);
  const linesPerPage = Math.floor(contentHeight / lineHeight);
  const charsPerPage = Math.max(charsPerLine * linesPerPage, 1);

  const pages: Page[] = [];
  let remaining = content;
  let pageNumber = 1;

  const total = content.length;
  let processed = 0;

  while (remaining.length  > 0) {
    check();
    let cutIndex = Math.min(charsPerPage, remaining.length);
    if (cutIndex < remaining.length) {
      const lookback = Math.min(100, cutIndex);
      const segment = remaining.slice(cutIndex - lookback, cutIndex);
      const lastNewline = segment.lastIndexOf('\n');
      if (lastNewline > 0) cutIndex = cutIndex - lookback + lastNewline + 1;
    }

    pages.push({ content: remaining.slice(0, cutIndex), pageNumber });

    remaining = remaining.slice(cutIndex);
    processed += cutIndex;

    if (pageNumber % 25 === 0) {
      onProgress(processed / total);
    }

    pageNumber++;
  }

  onProgress(1);
  return pages;
}
```

- [ ] **Step 3: 用真实 helper 替换占位函数**

把 `detectEncoding` / `parseChapters` 从 `src/hooks/useBookParser.ts` 原样复制过来（仅改 import type）。

- [ ] **Step 4: Commit**

```bash
git add src/workers/txtParser.worker.ts
git commit -m "feat: add txt parse worker with progress"
```

---

### Task 3: useBookParser 改为调用 Worker + 暴露 progress/cancel

**Files:**
- Modify: `src/hooks/useBookParser.ts`

- [ ] **Step 1: 扩展 hook 返回值**

在 `UseBookParserReturn` 新增：
```ts
progress: ImportProgress | null;
cancel: () => void;
```

- [ ] **Step 2: 在 hook 内创建 Worker 并管理 requestId**

在 `useBookParser()` 内新增：
- `const workerRef = useRef<Worker | null>(null)`
- `const activeRequestIdRef = useRef<string | null>(null)`
- `const [progress, setProgress] = useState<ImportProgress | null>(null)`

创建 worker：
```ts
if (!workerRef.current) {
  workerRef.current = new Worker(new URL('../workers/txtParser.worker.ts', import.meta.url), { type: 'module' });
}
```

- [ ] **Step 3: 实现 loadFile 用 worker 解析**

当 input 为 ArrayBuffer：发送 parse 消息；收到 progress 更新 `setProgress`；收到 result 更新 book/chapters/pages；收到 error throw。

- [ ] **Step 4: 实现 cancel**

```ts
const cancel = () => {
  const id = activeRequestIdRef.current;
  if (!id || !workerRef.current) return;
  workerRef.current.postMessage({ type: 'cancel', requestId: id });
  activeRequestIdRef.current = null;
  setLoading(false);
  setProgress(null);
};
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBookParser.ts
git commit -m "feat: parse txt in worker and expose progress"
```

---

### Task 4: App 接入 Overlay（导入时显示 + 可取消）

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Reader/Bookshelf.tsx`

- [ ] **Step 1: App 中使用 useBookParser 的 progress/loading/cancel**

在 App 中渲染：
```tsx
<ImportProgressOverlay
  open={loading  && !!progress}
  title={importingTitle}
  progress={progress ?? { stage: 'decoding', percent: 0, message: '准备中…' }}
  onCancel={cancel}
/>
```

其中 `importingTitle` 由 Bookshelf 调用导入时设置（用 state 存 file.name 去掉 .txt）。

- [ ] **Step 2: Bookshelf 导入回调透传 fileName**

让 `onImportBook(file)` 的上层在调用 `loadFile` 前先 setTitle。

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/components/Reader/Bookshelf.tsx
git commit -m "feat: show full-screen progress while importing txt"
```

---

### Task 5: 手动验证（重点：10MB+ 不假死）

**Files:**
- None

- [ ] **Step 1: 运行开发服务器**

Run: `npm run dev`

- [ ] **Step 2: 导入 10MB+ TXT**

Expected:
- 点击打开后 UI 不假死
- Overlay 立刻出现
- 进度条阶段从 解码→章节→分页 逐步推进
- 可点击“取消”中断

- [ ] **Step 3: 导入完成后进入阅读页**

Expected:
- 能翻页
- 章节列表可正常显示（如有）

---

## Plan self-review

- Spec coverage: 覆盖 worker 化 + 全屏进度 + 取消。
- Placeholder scan: detectEncoding/parseChapters 复制后不再占位。
- Type consistency: ImportProgress 与 worker 消息 stage 保持一致。

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-21-txt-import-progress-worker.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
