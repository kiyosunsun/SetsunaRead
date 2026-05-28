# SetsunaRead

拟物风格的小说阅读桌面应用，高仿真书页效果，支持 TXT 文件导入和多种阅读模式。

## 功能特性

- **拟物书页** — 纸张纹理、书脊阴影、花饰角饰、翻页卷角、3D 透视
- **三种阅读模式** — 双页展开、单页居中、滚动长页
- **TXT 导入** — 自动编码检测、章节识别、Web Worker 后台解析
- **阅读进度** — 自动保存每本书的阅读位置，下次打开恢复
- **书签系统** — 添加/删除书签，按书籍筛选
- **全文搜索** — 关键词搜索 + 上下文提取 + 结果高亮
- **个性化设置** — 字体、字号、行高、纸张风格、夜间模式
- **新手引导** — 首次使用 6 步引导
- **秒开缓存** — IndexedDB 缓存解析结果，二次打开 <0.5 秒

## 快速开始

### 环境要求

- Node.js >= 18
- Rust（Tauri 桌面端需要）

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式（浏览器端）
npm run dev

# 开发模式（桌面端）
npm run tauri dev

# 生产构建
npm run build
npm run tauri build
```

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | 组件化开发、类型系统 |
| Vite | 现代构建工具 |
| Tailwind CSS 3 | 原子化 CSS |
| Zustand + persist | 状态管理、数据持久化 |
| Tauri | 桌面应用套壳 |
| Web Workers | 大文件解析不阻塞主线程 |
| CSS 3D 变换 | 书页拟物效果 |

## 项目结构

```
src/
├── App.tsx                    # 主入口：书架/阅读视图切换
├── types/                     # 类型定义
├── stores/                    # Zustand 状态管理（书籍/设置/书签）
├── hooks/                     # 核心业务逻辑（解析/分页/搜索）
├── workers/                   # Web Worker（文件解析）
├── components/
│   ├── BookView/              # 阅读视图（拟物书页效果）
│   └── Reader/                # 功能面板（工具栏/书架/设置/搜索）
├── styles/                    # 全局样式 + 书页效果 CSS
└── lib/                       # 工具函数/文件存储/缓存
```

## 数据流

```
导入 TXT → Web Worker 解码 → 章节识别 → 异步分页 → Zustand Store → 渲染
                                      ↓
                              IndexedDB 缓存（下次秒开）
```

## 更新日志

见 [CHANGELOG.md](./CHANGELOG.md)，由 git hook 自动生成。

## 许可

学习项目，仅供个人使用。
