# SetsunaRead 小说阅读软件设计文档

## 项目概述

一个桌面端小说阅读软件，使用 Tauri 套壳 React 实现。核心特点是高度仿真的书本阅读界面，支持双页、单页、滚动三种阅读模式。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面壳 | Tauri | 轻量级桌面应用框架 |
| 前端框架 | React + TypeScript | UI 渲染 |
| 构建工具 | Vite | 快速开发体验 |
| 样式 | Tailwind CSS + CSS | 原子化 + 书本质感 |
| UI 组件 | shadcn/ui | 基础组件库 |
| 翻页动画 | Flip.js | 3D 翻页效果 |
| 状态管理 | Zustand | 轻量状态管理 |
| 本地存储 | localStorage + IndexedDB | 分层存储策略 |
| 编码检测 | chardet | TXT 文件编码识别 |

## 项目架构

```
SetsunaRead/
├── src-tauri/                  # Tauri 后端（Rust）
│   ├── src/
│   │   ├── main.rs
│   │   └── commands/
│   │       ├── file.rs         # 文件读取命令
│   │       └── storage.rs      # 本地存储命令
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # React 前端
│   ├── components/
│   │   ├── BookView/           # 书本视图（核心）
│   │   │   ├── DualPage.tsx         # 双页模式
│   │   │   ├── SinglePage.tsx       # 单页模式
│   │   │   ├── ScrollView.tsx       # 滚动模式
│   │   │   ├── PageFlipper.tsx      # 翻页动画控制
│   │   │   └── Page.tsx             # 单页渲染
│   │   ├── Reader/             # 阅读器界面
│   │   │   ├── Toolbar.tsx          # 底部工具栏
│   │   │   ├── SettingsPanel.tsx    # 设置面板
│   │   │   ├── Bookshelf.tsx        # 书架界面
│   │   │   ├── ChapterList.tsx      # 章节目录
│   │   │   ├── BookmarkPanel.tsx    # 书签面板
│   │   │   ├── SearchPanel.tsx      # 搜索面板
│   │   │   └── AnnotationPanel.tsx  # 批注面板
│   │   └── ui/                 # shadcn/ui 组件
│   ├── hooks/                  # 自定义 Hook
│   │   ├── useBookParser.ts         # TXT 文件解析
│   │   ├── usePagination.ts         # 分页算法
│   │   ├── useReadingProgress.ts    # 阅读进度管理
│   │   ├── useTheme.ts             # 主题切换
│   │   ├── useBookmark.ts           # 书签管理
│   │   ├── useSearch.ts            # 全文搜索
│   │   └── useAnnotation.ts        # 批注管理
│   ├── stores/                 # 状态管理
│   │   ├── bookStore.ts             # 书籍状态
│   │   ├── settingsStore.ts         # 设置状态
│   │   ├── bookmarkStore.ts         # 书签状态
│   │   └── annotationStore.ts       # 批注状态
│   ├── styles/
│   │   ├── book.css            # 书本质感样式
│   │   └── themes.css          # 主题变量
│   ├── lib/
│   │   └── utils.ts            # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── public/
├── docs/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

## 核心功能

### 1. 书籍管理

- 导入本地 TXT 文件
- 书架界面展示已导入书籍
- 书籍元数据提取（书名、大小）
- 删除书籍

### 2. 阅读模式

#### 仿真双页模式
- 左右两页并排显示
- 书脊阴影效果
- Flip.js 3D 翻页动画
- 点击/键盘左右翻页

#### 单页翻页模式
- 单页居中显示
- CSS slide 过渡动画
- 左右留白模拟书本边缘

#### 滚动模式
- 单列垂直滚动
- 自然滚动阅读体验
- 无翻页动画

### 3. 书本质感

#### 纸张效果
- 背景色：米黄 #f5f0e8（默认）
- 内阴影模拟纸张纹理
- 右侧圆角模拟书页边缘

#### 书脊效果
- 左侧渐变阴影
- 深色到透明过渡

#### 书页卷角
- 右下角 CSS 渐变模拟

#### 阴影效果
- 页面投影
- 悬停时阴影加深

### 4. 自定义设置

| 设置项 | 选项 | 默认值 |
|--------|------|--------|
| 纸张背景 | 米黄、纯白、护眼绿、牛皮纸 | 米黄 |
| 字体大小 | 12px ~ 24px | 16px |
| 字体 | 宋体、黑体、楷体、微软雅黑 | 宋体 |
| 行间距 | 1.5 ~ 3.0 | 1.8 |
| 夜间模式 | 开/关 | 关 |
| 翻页动画 | 开/关 | 开 |

### 5. 阅读进度

- 自动保存当前阅读位置
- 进度百分比显示
- 数据存储在 localStorage

### 6. 书签功能

- 手动添加/删除书签
- 书签列表展示（页码 + 预览文字）
- 点击书签跳转到对应页面
- 数据存储在 localStorage

### 7. 全文搜索

- 输入关键词搜索全文
- 高亮显示匹配结果
- 上/下一个匹配项跳转
- 搜索结果计数

### 8. 批注功能

- 选中文字添加批注/笔记
- 批注列表管理
- 批注高亮显示
- 数据存储在 IndexedDB（容量更大）

### 9. 章节目录

- 自动识别章节标题
- 章节列表展示
- 点击章节跳转
- 当前章节高亮

### 10. 其他功能

- 全屏模式（Tauri 窗口 API）
- 复制选中文字（原生 clipboard API）
- 阅读历史（最近打开的书籍）

## 分页算法

TXT 文件的分页是核心难点：

```typescript
// 分页逻辑伪代码
function paginate(content: string, config: PageConfig): Page[] {
  const pages: Page[] = [];
  const container = createHiddenContainer(config);
  
  let remaining = content;
  while (remaining.length > 0) {
    // 二分法查找一页能容纳的最大字符数
    const charsPerPage = binarySearchMaxChars(container, remaining);
    pages.push({
      content: remaining.slice(0, charsPerPage),
      pageNumber: pages.length + 1
    });
    remaining = remaining.slice(charsPerPage);
  }
  
  return pages;
}
```

**影响分页的因素：**
- 容器尺寸（窗口大小）
- 字体、字号
- 行间距
- 段落间距
- 标点符号处理（避免行首标点）

## 翻页动画实现

使用 Flip.js 库：

```typescript
// 翻页控制
const flipbook = new Flipbook(container, pages, {
  startPage: currentPage,
  size: 'fixed',           // 固定尺寸
  flipDuration: 600,       // 翻页时长 ms
  drawingDuration: 200,
  disableZoom: true,
  autoSize: false,
  clickAction: 'none',     // 自定义点击行为
});
```

## 文件解析（TXT）

TXT 文件需要处理：
- 编码检测（UTF-8、GBK、GB2312）
- 章节识别（正则匹配常见章节格式）
- 空行处理
- 段落合并

```typescript
// 章节识别正则
const CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十百千\d]+章/,
  /^第[一二三四五六七八九十百千\d]+节/,
  /^Chapter\s+\d+/i,
  /^\d+\.\s+/,
];
```

## 状态管理

```typescript
// bookStore
interface BookStore {
  books: Book[];              // 书架书籍列表
  currentBook: Book | null;   // 当前阅读书籍
  chapters: Chapter[];        // 章节列表
  currentPage: number;        // 当前页码
  totalPages: number;         // 总页数
  
  // actions
  addBook: (file: File) => void;
  removeBook: (id: string) => void;
  openBook: (id: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

// settingsStore
interface SettingsStore {
  paperBackground: 'yellow' | 'white' | 'green' | 'brown';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  nightMode: boolean;
  flipAnimation: boolean;
  
  // actions
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggleNightMode: () => void;
}

// bookmarkStore
interface BookmarkStore {
  bookmarks: Bookmark[];       // 当前书籍的书签列表
  
  // actions
  addBookmark: (page: number, preview: string) => void;
  removeBookmark: (id: string) => void;
  goToBookmark: (id: string) => void;
}

// annotationStore (使用 IndexedDB)
interface AnnotationStore {
  annotations: Annotation[];   // 当前书籍的批注列表
  
  // actions
  addAnnotation: (selection: Selection, note: string) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, note: string) => void;
}
```

## 存储策略

| 数据类型 | 存储位置 | 容量 | 原因 |
|----------|----------|------|------|
| 书籍文件 | Tauri 文件系统 | 无限 | 文件本身就在本地 |
| 阅读进度 | localStorage | ~5MB | 数据小，读取快 |
| 书签列表 | localStorage | ~5MB | 数据小 |
| 应用设置 | localStorage | ~5MB | 数据小 |
| 批注内容 | IndexedDB | 几乎无限 | 可能很多，需要更大空间 |
| 章节列表 | 内存 | - | 从文件解析，不需要持久化 |

## 界面布局

### 主阅读界面
```
┌─────────────────────────────────────────────┐
│  SetsunaRead                    [_] [□] [×] │
├─────────────────────────────────────────────┤
│                                             │
│         ┌─────────┐  ┌─────────┐            │
│         │         │  │         │            │
│         │  左页   │  │  右页   │            │
│         │         │  │         │            │
│         │         │  │         │            │
│         └─────────┘  └─────────┘            │
│              第 2 页        第 3 页          │
│                                             │
├─────────────────────────────────────────────┤
│  ◀ 目录  ━━━━━━━━━━━━━ 45%  设置 ▶        │
└─────────────────────────────────────────────┘
```

### 侧边面板（可展开/收起）
```
┌──────────┬──────────────────────────────────┐
│ 章节目录 │                                  │
│ ──────── │         阅读区域                  │
│ 第一章 ✓ │                                  │
│ 第二章   │                                  │
│ 第三章   │                                  │
│ ...      │                                  │
├──────────┤                                  │
│ 书签列表 │                                  │
│ ──────── │                                  │
│ 书签 1   │                                  │
│ 书签 2   │                                  │
├──────────┤                                  │
│ 批注列表 │                                  │
│ ──────── │                                  │
│ 批注 1   │                                  │
│ 批注 2   │                                  │
└──────────┴──────────────────────────────────┘
```

## 实现优先级

### Phase 1：基础框架
1. 初始化 Tauri + React 项目
2. 配置 Tailwind CSS + shadcn/ui
3. 实现 TXT 文件导入
4. 基础阅读界面（单页）

### Phase 2：核心阅读
1. 分页算法实现
2. 单页翻页模式
3. 滚动模式
4. 阅读进度保存

### Phase 3：书本特效
1. 仿真双页模式
2. Flip.js 翻页动画
3. 书本质感样式
4. 夜间模式

### Phase 4：完善功能
1. 书架界面
2. 设置面板
3. 章节目录
4. 书签功能
5. 全文搜索
6. 批注功能
7. 全屏模式

## 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| TXT 分页不准确 | 阅读体验差 | 二分法 + 容器测量 |
| Flip.js 维护状态 | 翻页效果异常 | 测试 + 备选 CSS 方案 |
| 大文件性能 | 卡顿 | 虚拟滚动 + 懒加载 |
| 编码问题 | 中文乱码 | 使用 chardet 库检测 |
| IndexedDB 兼容性 | 批注存储失败 | Tauri 内置 WebView 支持良好 |

## 参考资源

- Tauri 官方文档：https://tauri.app
- Flip.js：https://github.com/nichenqin/flip.js
- shadcn/ui：https://ui.shadcn.com
- Tailwind CSS：https://tailwindcss.com
