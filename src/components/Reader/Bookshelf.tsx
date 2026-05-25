import React, { useRef, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useSettingsStore } from '../../stores/settingsStore';

/* ---------------------------------------------------------------------------
   书架 Props
   --------------------------------------------------------------------------- */
interface BookshelfProps {
  /** 选中书籍时的回调 */
  onOpenBook: (bookId: string) => void;
  /** 导入新书时的回调 */
  onImportBook: (file: File) => void;
}

/* ---------------------------------------------------------------------------
   书脊颜色方案
   --------------------------------------------------------------------------- */
const SPINE_COLORS = [
  { name: 'wine', bg: 'linear-gradient(135deg, #8b2500 0%, #a0522d 50%, #8b2500 100%)' },
  { name: 'forest', bg: 'linear-gradient(135deg, #2d4a2e 0%, #3d6b3e 50%, #2d4a2e 100%)' },
  { name: 'navy', bg: 'linear-gradient(135deg, #1a2744 0%, #2a3d5e 50%, #1a2744 100%)' },
  { name: 'plum', bg: 'linear-gradient(135deg, #4a2040 0%, #6a3060 50%, #4a2040 100%)' },
  { name: 'amber', bg: 'linear-gradient(135deg, #8b6914 0%, #a0792d 50%, #8b6914 100%)' },
  { name: 'charcoal', bg: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)' },
];

/* ---------------------------------------------------------------------------
   根据书籍 ID 生成稳定的书脊颜色索引
   --------------------------------------------------------------------------- */
function getSpineColorIndex(bookId: string): number {
  let hash = 0;
  for (let i = 0; i < bookId.length; i++) {
    hash = (hash * 31 + bookId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % SPINE_COLORS.length;
}

/* ---------------------------------------------------------------------------
   辅助：格式化文件大小
   --------------------------------------------------------------------------- */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------------------------------------------------------------------------
   辅助：格式化上次阅读时间
   --------------------------------------------------------------------------- */
function formatLastRead(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString();
}

/* ---------------------------------------------------------------------------
   木质书架背景（内联 style 中的通用渐变）
   --------------------------------------------------------------------------- */
const woodBgStyle: React.CSSProperties = {
  background: `
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 30px,
      rgba(0,0,0,0.03) 30px,
      rgba(0,0,0,0.03) 31px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.015) 2px,
      rgba(0,0,0,0.015) 4px
    ),
    linear-gradient(180deg, #f7f0e3 0%, #ede4d1 40%, #e5d9c3 100%)
  `,
};

/* ---------------------------------------------------------------------------
   书架横板样式
   --------------------------------------------------------------------------- */
const shelfBoardStyle: React.CSSProperties = {
  background: `
    linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 3px, transparent 100%),
    linear-gradient(180deg, #d4c4a8 0%, #c8b898 50%, #bfae8e 100%)
  `,
  boxShadow: `
    0 6px 20px rgba(0,0,0,0.2),
    inset 0 2px 0 rgba(255,255,255,0.3),
    inset 0 -2px 0 rgba(0,0,0,0.1)
  `,
};

/* ---------------------------------------------------------------------------
   书架底部阴影伪元素需要通过 div 模拟
   --------------------------------------------------------------------------- */
function ShelfShadow() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -8,
        left: 8,
        right: 8,
        height: 8,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.15), transparent)',
        borderRadius: '0 0 4px 4px',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ---------------------------------------------------------------------------
   空状态打开书本 SVG 图标（更精致）
   --------------------------------------------------------------------------- */
function OpenBookIcon({ color }: { color: string }) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(184,134,11,0.15))' }}
    >
      {/* 书本外轮廓 */}
      <path
        d="M60 25 C60 25 35 15 15 20 L15 95 C35 90 60 100 60 100 C60 100 85 90 105 95 L105 20 C85 15 60 25 60 25Z"
        stroke={color}
        strokeWidth="2"
        opacity="0.6"
      />
      {/* 书脊线 */}
      <line x1="60" y1="25" x2="60" y2="100" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* 左页文字行 */}
      <line x1="25" y1="38" x2="52" y2="35" stroke={color} strokeWidth="1" opacity="0.35" />
      <line x1="25" y1="48" x2="52" y2="45" stroke={color} strokeWidth="1" opacity="0.35" />
      <line x1="25" y1="58" x2="52" y2="55" stroke={color} strokeWidth="1" opacity="0.35" />
      <line x1="25" y1="68" x2="52" y2="65" stroke={color} strokeWidth="1" opacity="0.35" />
      {/* 右页文字行 */}
      <line x1="68" y1="35" x2="95" y2="38" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="68" y1="45" x2="95" y2="48" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="68" y1="55" x2="95" y2="58" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="68" y1="65" x2="95" y2="68" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* 顶部装饰圆点 */}
      <circle cx="60" cy="12" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   单个书脊组件
   --------------------------------------------------------------------------- */
interface BookSpineProps {
  bookId: string;
  title: string;
  lastRead: number;
  size: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function BookSpine({ bookId, title, lastRead, size, onClick, onDelete }: BookSpineProps) {
  const colorIndex = getSpineColorIndex(bookId);
  const spine = SPINE_COLORS[colorIndex];
  const bookHeight = 180 + (title.length % 5) * 8; // 书脊高度随标题长度微调

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`打开书籍：${title}`}
      title={`${title}\n${formatSize(size)} · ${formatLastRead(lastRead)}`}
      className="book-spine-item group/spine"
      style={{
        width: 48,
        height: bookHeight,
        borderRadius: '3px 4px 4px 3px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: spine.bg,
        boxShadow: `
          2px 2px 8px rgba(0,0,0,0.3),
          inset 2px 0 0 rgba(255,255,255,0.15),
          inset -1px 0 0 rgba(0,0,0,0.2)
        `,
        flexShrink: 0,
      }}
    >
      {/* 书脊左侧高光线（凹槽） */}
      <div
        style={{
          position: 'absolute',
          left: 3,
          top: 8,
          bottom: 8,
          width: 1,
          background: 'rgba(255,255,255,0.2)',
          pointerEvents: 'none',
        }}
      />

      {/* 竖排书名 */}
      <div
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          maxHeight: bookHeight - 32,
          overflow: 'hidden',
          lineHeight: 1.6,
          padding: '4px 0',
        }}
      >
        {title}
      </div>

      {/* 删除按钮（hover 时显示） */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/spine:opacity-100"
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#8b2500',
          border: '2px solid #f4ead5',
          color: 'white',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transition: 'opacity 0.2s',
          zIndex: 10,
          lineHeight: 1,
          padding: 0,
        }}
        title={`删除"${title}"`}
        aria-label={`删除书籍：${title}`}
      >
        x
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   书架组件
   木质书脊风格的书架展示
   --------------------------------------------------------------------------- */
const Bookshelf: React.FC<BookshelfProps> = ({ onOpenBook, onImportBook }) => {
  const books = useBookStore((s) => s.books);
  const removeBook = useBookStore((s) => s.removeBook);
  const { nightMode } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- 文件导入处理 ---- */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImportBook(file);
      }
      e.target.value = '';
    },
    [onImportBook],
  );

  /* ---- 删除处理（带确认） ---- */
  const handleDelete = useCallback(
    (e: React.MouseEvent, bookId: string, bookTitle: string) => {
      e.stopPropagation();
      if (window.confirm(`确定删除"${bookTitle}"吗？`)) {
        removeBook(bookId);
      }
    },
    [removeBook],
  );

  /* ---- 夜间模式：覆盖木纹背景为深色 ---- */
  const nightWoodBg: React.CSSProperties = nightMode
    ? {
        background: `
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 30px,
            rgba(255,255,255,0.02) 30px,
            rgba(255,255,255,0.02) 31px
          ),
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(255,255,255,0.01) 2px,
            rgba(255,255,255,0.01) 4px
          ),
          linear-gradient(180deg, #1a1612 0%, #141210 40%, #0d0b09 100%)
        `,
      }
    : {};

  /* ---- 夜间模式：书架横板颜色 ---- */
  const nightShelfBoard: React.CSSProperties = nightMode
    ? {
        background: `
          linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 3px, transparent 100%),
          linear-gradient(180deg, #3a3228 0%, #2e2820 50%, #242018 100%)
        `,
        boxShadow: `
          0 6px 20px rgba(0,0,0,0.5),
          inset 0 2px 0 rgba(255,255,255,0.06),
          inset 0 -2px 0 rgba(0,0,0,0.2)
        `,
      }
    : {};

  /* ---- 夜间模式文字颜色 ---- */
  const nightTextColor = nightMode ? 'rgba(212,197,169,0.92)' : '#2c2218';
  const nightMutedColor = nightMode ? 'rgba(212,197,169,0.5)' : '#8a7a6a';
  const nightIconColor = nightMode ? 'rgba(212,197,169,0.3)' : '#8b6914';

  /* ---- 装饰线颜色 ---- */
  const brassGradient = nightMode
    ? 'linear-gradient(90deg, transparent, #c4982f, transparent)'
    : 'linear-gradient(90deg, transparent, #b8860b, transparent)';

  /* ======================================================================
     空状态
     ====================================================================== */
  if (books.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center select-none"
        style={{ ...woodBgStyle, ...nightWoodBg, position: 'relative' }}
      >
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="导入书籍文件"
        />

        {/* 顶部铜金色装饰线 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: brassGradient,
          }}
        />

        <div className="text-center max-w-md mx-4" style={{ zIndex: 1 }}>
          {/* 精致的打开书本图标 */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
            <OpenBookIcon color={nightIconColor} />
          </div>

          {/* 标题：Noto Serif SC 衬线字体 */}
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 24,
              fontWeight: 600,
              color: nightTextColor,
              marginBottom: 8,
              letterSpacing: 2,
            }}
          >
            书架空空如也
          </h2>

          {/* 副标题 */}
          <p
            style={{
              fontSize: 14,
              color: nightMutedColor,
              marginBottom: 32,
              letterSpacing: 1,
            }}
          >
            导入一本 .txt 小说，开始沉浸阅读
          </p>

          {/* 导入按钮：深色木质渐变 + 铜金色边框 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 36px',
              background: nightMode
                ? 'linear-gradient(135deg, #3a3228 0%, #242018 100%)'
                : 'linear-gradient(135deg, #4a3425 0%, #2c1e12 100%)',
              color: nightMode ? '#d4c5a9' : '#f4ead5',
              border: `1px solid ${nightMode ? '#5a4a3a' : '#6b4f3a'}`,
              borderRadius: 12,
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: nightMode
                ? '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = nightMode
                ? 'linear-gradient(135deg, #4a3a28 0%, #2e2418 100%)'
                : 'linear-gradient(135deg, #6b4f3a 0%, #4a3425 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = nightMode
                ? '0 6px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = nightMode
                ? 'linear-gradient(135deg, #3a3228 0%, #242018 100%)'
                : 'linear-gradient(135deg, #4a3425 0%, #2c1e12 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = nightMode
                ? '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            导入书籍
          </button>
        </div>
      </div>
    );
  }

  /* ======================================================================
     有书籍状态
     ====================================================================== */
  return (
    <div
      className="min-h-screen select-none"
      style={{ ...woodBgStyle, ...nightWoodBg, position: 'relative' }}
    >
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="导入书籍文件"
      />

      {/* 顶部铜金色装饰线 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: brassGradient,
          zIndex: 10,
        }}
      />

      {/* 标题栏 */}
      <div
        style={{
          padding: '28px 40px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: nightMode
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 22,
              fontWeight: 600,
              color: nightTextColor,
              letterSpacing: 3,
              margin: 0,
            }}
          >
            我的书架
          </h2>
          <span
            style={{
              fontSize: 13,
              color: nightMutedColor,
              fontWeight: 400,
            }}
          >
            {books.length} 本书
          </span>
        </div>

        {/* 导入按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: 'transparent',
            color: nightMode ? '#c4982f' : '#4a3425',
            border: `1.5px solid ${nightMode ? '#5a4a3a' : '#6b4f3a'}`,
            borderRadius: 10,
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = nightMode ? '#242018' : '#4a3425';
            e.currentTarget.style.color = nightMode ? '#d4c5a9' : '#f4ead5';
            e.currentTarget.style.borderColor = nightMode ? '#5a4a3a' : '#4a3425';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = nightMode ? '#c4982f' : '#4a3425';
            e.currentTarget.style.borderColor = nightMode ? '#5a4a3a' : '#6b4f3a';
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          导入
        </button>
      </div>

      {/* 书架区域 */}
      <div style={{ padding: '24px 40px 40px' }}>
        {/* 木质书架横板 */}
        <div
          style={{
            ...shelfBoardStyle,
            ...nightShelfBoard,
            position: 'relative',
            borderRadius: 8,
            padding: '28px 24px 20px',
          }}
        >
          <ShelfShadow />

          {/* 书脊行 */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-end',
              justifyContent: 'center',
              minHeight: 200,
              paddingBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            {books.map((book) => (
              <BookSpine
                key={book.id}
                bookId={book.id}
                title={book.title}
                lastRead={book.lastRead}
                size={book.size}
                onClick={() => onOpenBook(book.id)}
                onDelete={(e) => handleDelete(e, book.id, book.title)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookshelf;
