# 古风书页风格与翻页动画优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阅读页 UI 调整为更“国风/宣纸”观感，并把双页翻页动画升级为更接近示例图的“右页翻起”效果，同时统一书签视觉语言。

**Architecture:** 保持现有组件结构（Page/DualPage/BookmarkPanel）不变，通过替换装饰 SVG、调整 book.css（纹理/边框/阴影/书签）以及将 DualPage 的翻页动画从整体容器动画改为“单页翻转层 + 阴影高光层”来实现。尽量把 keyframes 从组件内联 style 移到 `src/styles/book.css`，减少重复注入。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, Zustand, 纯 CSS 动画/渐变/SVG Data URI。

---

## Files overview

**Modify:**
- `src/styles/book.css` — 纸张纹理、边框/角纹样、书脊/书边阴影、翻页动画 keyframes、书签丝带样式
- `src/components/BookView/Page.tsx` — 替换角落装饰（欧式花丝 → 中式云纹/回纹），调整装饰色与透明度
- `src/components/BookView/DualPage.tsx` — 重构翻页动画实现（页层结构 + 动画 class），移除内联 `<style>` keyframes
- `src/components/Reader/BookmarkPanel.tsx` — 调整配色与高亮（朱砂/暗金），保持交互逻辑不变

**Optional verify-only:**
- `src/components/BookView/SinglePage.tsx` / `ScrollView.tsx` — 检查是否复用 `Page` 装饰后视觉一致（不一定需要改）

---

### Task 1: 建立“国风宣纸”视觉 token 与 CSS 变量

**Files:**
- Modify: `src/styles/book.css`

- [ ] **Step 1: 在 `book.css` 顶部新增国风色板 CSS 变量**

将以下代码插入到文件开头注释下方（紧接着 `/* ========================================================================== */` 块后）：

```css
:root {
  --han-paper: #f6f1e6;         /* 宣纸底色 */
  --han-ink: #2f2f2f;           /* 墨色正文 */
  --han-ink-muted: rgba(47, 47, 47, 0.55);
  --han-gold: #a0792d;          /* 暗金点缀 */
  --han-cinnabar: #b43a2f;      /* 朱砂 */
  --han-border: rgba(160, 121, 45, 0.18);
  --han-edge: rgba(0, 0, 0, 0.10);
}
```

- [ ] **Step 2: 保持现有选择器不变，后续改动只替换为变量引用**

（本 step 不改代码，只是约束：避免“魔法颜色”散落。）

- [ ] **Step 3: 手工检查 `book.css` 是否有重复定义颜色（不删除）**

不做清理，避免超范围重构。

- [ ] **Step 4: Commit**

```bash
git add src/styles/book.css
git commit -m "style: add han-style color tokens"
```

---

### Task 2: 纸张纹理改为“宣纸纤维”并增加轻微做旧边缘

**Files:**
- Modify: `src/styles/book.css`

- [ ] **Step 1: 调整 `.paper-texture::before` 纹理（更柔和、更纤维感）**

将现有 `background-image` 的 data-uri 替换为更低频的 turbulence，并降低对比度；把 `opacity` 从 `0.04` 调整到 `0.06`（白天模式更明显一点但仍克制）。

示例替换（完整替换 `background-image: url(...)` 这一行）：

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
```

- [ ] **Step 2: 增加纸张边缘做旧暗角层**

为 `.paper-texture` 新增 `::after`，增加很轻的 vignette：

```css
.paper-texture::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background:
    radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.08) 100%),
    linear-gradient(90deg, rgba(0,0,0,0.10), transparent 18%, transparent 82%, rgba(0,0,0,0.10));
  opacity: 0.25;
  mix-blend-mode: multiply;
}
```

- [ ] **Step 3: 夜间模式下弱化纹理与暗角**

在 `.night-mode .paper-texture::before` 保持更低 opacity，并新增：

```css
.night-mode .paper-texture::after {
  opacity: 0.12;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/book.css
git commit -m "style: switch paper texture to xuan-paper look"
```

---

### Task 3: 角落装饰从欧式花丝替换为“中式云纹/回纹”

**Files:**
- Modify: `src/components/BookView/Page.tsx`

- [ ] **Step 1: 用新的中式角纹 SVG 替换 `FiligreeSVG`**

把 `FiligreeSVG` 组件整体替换为 `HanCornerSVG`（保持尺寸 48x48，仍用 `currentColor` 便于用 Tailwind 控制色）：

```tsx
const HanCornerSVG: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10c6 0 10-4 10-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65"/>
    <path d="M6 16c10 0 16-6 16-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.55"/>
    <path d="M6 22c12 0 20-8 20-8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
    <path d="M6 6h18c6 0 10 4 10 10v18" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.35"/>
    <path d="M14 6v6M20 6v6M26 6v6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.28"/>
  </svg>
);
```

- [ ] **Step 2: 更新 JSX 引用与颜色 class**

把 4 个角落装饰从 `<FiligreeSVG />` 改成 `<HanCornerSVG />`。
并把 `text-amber-800` 改成更克制的 `text-[#8b6914]` 或 `text-amber-700`（与暗金一致）。

- [ ] **Step 3: Commit**

```bash
git add src/components/BookView/Page.tsx
git commit -m "style: replace filigree with han-style corner pattern"
```

---

### Task 4: 将 DualPage 的内联 keyframes 挪到 book.css

**Files:**
- Modify: `src/styles/book.css`
- Modify: `src/components/BookView/DualPage.tsx`

- [ ] **Step 1: 在 `book.css` 追加翻页动画 keyframes 与 class**

把 DualPage.tsx 里的 `@keyframes flipNextSlide/...` 与 `.page-flip-next-slide ...` 全部迁移到 `book.css`，并保持类名不变（以免逻辑先改再调参）。

- [ ] **Step 2: 从 DualPage.tsx 删除 `<style>{`...`}</style>` 块**

确保类名仍由 `animClass` 控制。

- [ ] **Step 3: Commit**

```bash
git add src/styles/book.css src/components/BookView/DualPage.tsx
git commit -m "refactor: move dual page flip keyframes to css"
```

---

### Task 5: 翻页升级为“单页翻起 + 阴影/高光”层（接近示例图）

**Files:**
- Modify: `src/components/BookView/DualPage.tsx`
- Modify: `src/styles/book.css`

- [ ] **Step 1: 为左右页各加一个“翻页层容器”**

在 DualPage.tsx 中，将左右页渲染区包一层：
- `page-shell`：固定尺寸、圆角、外投影
- `page-flip-layer`：用于 rotateY
- `page-flip-shadow`：渐变阴影
- `page-flip-highlight`：纸张高光

保持 Page 组件不变，仍作为内容层。

（此步只搭结构，不先做动画逻辑。）

- [ ] **Step 2: 在 book.css 新增翻页层的基础样式**

```css
.page-shell { position: relative; overflow: hidden; }
.page-flip-layer { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.page-flip-shadow { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.page-flip-highlight { position: absolute; inset: 0; pointer-events: none; opacity: 0; }

.page-flip-shadow.right {
  background: linear-gradient(270deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, transparent 55%);
}
.page-flip-shadow.left {
  background: linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 18%, transparent 55%);
}

.page-flip-highlight.right {
  background: linear-gradient(270deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 14%, transparent 45%);
  mix-blend-mode: screen;
}
.page-flip-highlight.left {
  background: linear-gradient(90deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 14%, transparent 45%);
  mix-blend-mode: screen;
}
```

- [ ] **Step 3: 定义“右页翻起/左页翻起”的 keyframes**

在 `book.css` 新增（示例，后续可微调角度/时长）：

```css
@keyframes pageTurnRight {
  0% { transform: rotateY(0deg); }
  45% { transform: rotateY(-35deg); }
  100% { transform: rotateY(0deg); }
}
@keyframes pageTurnLeft {
  0% { transform: rotateY(0deg); }
  45% { transform: rotateY(35deg); }
  100% { transform: rotateY(0deg); }
}

.page-turn-right { animation: pageTurnRight 0.45s ease-in-out; transform-origin: left center; }
.page-turn-left { animation: pageTurnLeft 0.45s ease-in-out; transform-origin: right center; }

.page-turn-right ~ .page-flip-shadow.right,
.page-turn-right ~ .page-flip-highlight.right { opacity: 1; transition: opacity 0.08s ease; }

.page-turn-left ~ .page-flip-shadow.left,
.page-turn-left ~ .page-flip-highlight.left { opacity: 1; transition: opacity 0.08s ease; }
```

（若选择器不便用 `~`，则把 shadow/highlight 放进同一个容器并改为 `.is-turning` class 控制。）

- [ ] **Step 4: DualPage.tsx 中把 animClass 拆成“左右页各自的 class”**

当前 animClass 作用在整个 3D 容器。改为：
- `leftAnimClass`：上一页（左翻）时加 `page-turn-left` 到左页 layer
- `rightAnimClass`：下一页（右翻）时加 `page-turn-right` 到右页 layer

并保持 `isAnimating` 保护与 `setTimeout` 结束复位。

- [ ] **Step 5: 仍在动画开始时切页，确保内容一致**

保持现有做法：在设置动画 class 后立刻 `nextPage()/prevPage()`，避免额外的“翻页前后内容缓存”逻辑（YAGNI）。

- [ ] **Step 6: Commit**

```bash
git add src/components/BookView/DualPage.tsx src/styles/book.css
git commit -m "feat: upgrade flip to per-page turn with shadow"
```

---

### Task 6: 书签丝带与色彩统一为“朱砂 + 暗金”

**Files:**
- Modify: `src/styles/book.css`
- Modify: `src/components/Reader/BookmarkPanel.tsx`

- [ ] **Step 1: 调整 `book.css` 的 `.bookmark-clip/.bookmark-ribbon`**

把夹子改为更窄、更像压条：
- clip 宽度 16、高度 10、暗金渐变
- ribbon 改为更克制的朱砂渐变，阴影更轻

示例：

```css
.bookmark-clip {
  width: 16px;
  height: 10px;
  background: linear-gradient(180deg, #b08a3a 0%, #8b6914 100%);
}
.bookmark-ribbon {
  width: 14px;
  height: 72px;
  background: linear-gradient(180deg, #b43a2f 0%, #d34b3a 55%, #9f2f28 100%);
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
```

- [ ] **Step 2: BookmarkPanel.tsx 配色替换**

保持结构与交互不变，仅替换：
- 主按钮 `bg-amber-600` → `bg-[#b43a2f]`，hover 深一点
- 当前项高亮 `bg-amber-50`/`bg-amber-900/20` 改为更接近朱砂/暗金的透明底
- 当前项文字 `text-amber-600` → `text-[#b43a2f]`

- [ ] **Step 3: Commit**

```bash
git add src/styles/book.css src/components/Reader/BookmarkPanel.tsx
git commit -m "style: align bookmark visuals with cinnabar and gold"
```

---

### Task 7: 手动验证（UI）

**Files:**
- None (run only)

- [ ] **Step 1: 启动开发服务器**

Run:
```bash
npm run dev
```
Expected: Vite dev server running on `http://localhost:1420`.

- [ ] **Step 2: 打开一本书，验证双页模式**

Check:
- 纸张底色更像宣纸，纹理不噪、不脏
- 四角装饰变为中式纹样且不抢眼
- 书脊阴影仍正确（左右页内阴影方向不反）

- [ ] **Step 3: 点击右半屏/左半屏测试翻页动画**

Check:
- 下一页：右页出现翻起旋转 + 阴影/高光，动画时长 ~0.45s
- 上一页：左页同理
- 连续快速点击不会乱（isAnimating 生效）

- [ ] **Step 4: 打开书签面板**

Check:
- 配色统一为朱砂/暗金
- 当前页高亮清晰但不刺眼

---

## Plan self-review

- Spec coverage: 覆盖书页风格（纹理/角纹/做旧）、翻页升级（单页翻起）、书签配色统一、代码逻辑整理（keyframes 外置）。
- Placeholder scan: 无 TBD/TODO。
- Type consistency: 仅新增 CSS class 与本地 state class，未引入新类型。

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-21-han-style-page-turn.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
