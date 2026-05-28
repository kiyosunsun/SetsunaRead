# 更新日志

> 本文件由 git hook 自动生成，格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
> 仅记录 `feat`、`fix`、`style`、`docs` 类型的提交。

## v0.7.0 — 2026-05-28

- `778237c` 新增 书籍解析结果 IndexedDB 缓存，二次打开秒开
- `14be255` 修复 页眉章节标题显示不准确问题

## v0.6.0 — 2026-05-27

- `91a9cf7` 变更 书签指示器升级为拟物样式，适配双页模式，品牌名统一为 Setsuna
- `ca39a95` 新增 阅读进度持久化，自动保存和恢复每本书的阅读位置

## v0.5.0 — 2026-05-26

- `8e90787` 新增 接入 Tauri 桌面端，改用原生对话框导入文件并保留真实路径
- `c5a9d97` 新增 增加字体选择功能并优化设置面板
- `a9b33d7` 新增 增加中文字体支持并完善阅读器功能

## v0.4.0 — 2026-05-25

- `03ad1ca` 变更 阅读区接入桌面与纸张拟物骨架
- `5549548` 变更 增加昼夜主题 tokens 并接入 App
- `2e87677` 变更 清理默认全局样式以避免冲突
- `66b0de1` 文档 增加拟物阅读器整体风格设计规格

## v0.3.0 — 2026-05-24

- `f59febb` 新增 parse txt in worker with progress overlay
- `1a25d92` 新增 add import progress overlay UI
- `daa185a` 文档 add txt import progress worker plan
- `bd8a8fe` 变更 align bookmark visuals with cinnabar and gold
- `b3bbbe4` 新增 upgrade flip to per-page turn with shadow
- `fc99c51` 变更 replace filigree with han-style corner pattern
- `50fb3bd` 变更 remove blend mode from paper vignette
- `0281e9e` 变更 switch paper texture to xuan-paper look
- `cfbdd79` 变更 add han-style color tokens
- `9f9daff` 文档 add han-style page turn plan

## v0.2.0 — 2026-05-23

- `de3e7ea` 新增 translate all UI text to Chinese
- `279cb14` 新增 add onboarding guide for first-time users
- `3566007` 新增 integrate Bookshelf into App with full navigation flow
- `8897c75` 新增 integrate all reading components into main App shell
- `27e6064` 新增 add SearchPanel component and useSearch hook
- `3ba8fbd` 新增 add ChapterList and BookmarkPanel components
- `296e73f` 新增 add SettingsPanel component for reading customization
- `6db9219` 新增 add Toolbar component for reading view
- `2f810e8` 新增 add SinglePage and ScrollView reading modes
- `b13bcff` 新增 add DualPage reading mode with book spine and 3D perspective
- `b02bbc8` 新增 add Page component with realistic book styling

## v0.1.0 — 2026-05-22

- `16f6d41` 新增 add Zustand stores for books, settings, and bookmarks
- `f228cd9` 新增 add pagination algorithm hook with binary search page fitting
- `112d18f` 新增 add TXT file parser hook with encoding detection and chapter parsing
- `d81620b` 新增 install core dependencies (zustand, chardet, page-flip)
- `602e919` 新增 configure Tailwind CSS v3 + shadcn/ui utilities
- `23d02d6` 新增 initialize Tauri + React + Vite project

## 2026-05-28

- `ff3d360` 文档 新增 README、CHANGELOG 及自动更新 hook 脚本
- `cbcdfe6` 修复 修复书签指示器在双页模式下不显示及跨页误显问题
