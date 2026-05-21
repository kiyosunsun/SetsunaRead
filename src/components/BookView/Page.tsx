import React from 'react';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   Han-style Corner Ornament
   A reusable Chinese-style decorative corner rendered as inline SVG
   --------------------------------------------------------------------------- */
const HanCornerSVG: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10c6 0 10-4 10-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65"/>
    <path d="M6 16c10 0 16-6 16-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.55"/>
    <path d="M6 22c12 0 20-8 20-8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
    <path d="M6 6h18c6 0 10 4 10 10v18" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.35"/>
    <path d="M14 6v6M20 6v6M26 6v6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.28"/>
  </svg>
);

/* ---------------------------------------------------------------------------
   Page Component Props
   --------------------------------------------------------------------------- */
interface PageProps {
  /** HTML content string to render on this page */
  content: string;
  /** Current page number (1-indexed for display) */
  pageNumber: number;
  /** Whether this is a left-hand page in a two-page spread */
  isLeft: boolean;
  className?: string;
}

/* ---------------------------------------------------------------------------
   Page Component
   Renders a single book page with paper texture, filigree corners,
   spine shadow, page curl (right pages), and configurable typography.
   --------------------------------------------------------------------------- */
const Page: React.FC<PageProps> = ({ content, pageNumber, isLeft, className }) => {
  const { paperBackground, fontSize, fontFamily, lineHeight, nightMode } =
    useSettingsStore();

  const paperColor = PAPER_COLORS[paperBackground];

  /* Dynamically build the style object from user settings */
  const pageStyle: React.CSSProperties = {
    backgroundColor: nightMode ? '#1a1a2e' : paperColor,
    fontSize: `${fontSize}px`,
    fontFamily:
      fontFamily === 'serif'
        ? '"Noto Serif", "Source Serif Pro", "Georgia", serif'
        : fontFamily === 'sans-serif'
          ? '"Inter", "Noto Sans", "Helvetica Neue", sans-serif'
          : '"JetBrains Mono", "Fira Code", monospace',
    lineHeight,
    color: nightMode ? '#d4c5a9' : '#2c2c2c',
  };

  /* Determine spine shadow class based on page side */
  const spineClass = isLeft ? 'book-spine-shadow-left' : 'book-spine-shadow-right';

  /* Page curl only appears on right-hand pages */
  const curlClass = !isLeft ? 'page-curl' : '';

  return (
        <div
      className={`relative overflow-hidden ${spineClass} ${curlClass} paper-texture ${className ?? ''}`}
      style={pageStyle}
    >
      {/* Han-style corner ornaments */}
      <div className="filigree filigree-tl text-[#8b6914]">
        <HanCornerSVG />
      </div>
      <div className="filigree filigree-tr text-[#8b6914]">
        <HanCornerSVG />
      </div>
      <div className="filigree filigree-bl text-[#8b6914]">
        <HanCornerSVG />
      </div>
      <div className="filigree filigree-br text-[#8b6914]">
        <HanCornerSVG />
      </div>

      {/* Main content area */}
      <div
        className="relative z-[3] px-16 py-12"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ textIndent: '2em' }}
      />

      {/* Page number centered at bottom */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-[3] opacity-50 text-xs tracking-widest select-none">
        {pageNumber}
      </div>
    </div>
  );
};

export default Page;
