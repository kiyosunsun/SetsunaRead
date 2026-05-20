import React from 'react';
import { useSettingsStore, PAPER_COLORS } from '../../stores/settingsStore';
import '../../styles/book.css';

/* ---------------------------------------------------------------------------
   SVG Filigree Corner Ornament
   A reusable Victorian-style decorative corner rendered as inline SVG
   --------------------------------------------------------------------------- */
const FiligreeSVG: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4C4 4 8 14 14 20C20 26 30 32 44 36"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M4 4C4 4 14 8 20 14C26 20 32 30 36 44"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M4 4C4 4 10 10 16 14C22 18 28 24 32 36"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
    <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.5" />
    <circle cx="14" cy="20" r="1.2" fill="currentColor" opacity="0.3" />
    <circle cx="20" cy="14" r="1.2" fill="currentColor" opacity="0.3" />
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
}

/* ---------------------------------------------------------------------------
   Page Component
   Renders a single book page with paper texture, filigree corners,
   spine shadow, page curl (right pages), and configurable typography.
   --------------------------------------------------------------------------- */
const Page: React.FC<PageProps> = ({ content, pageNumber, isLeft }) => {
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
      className={`relative overflow-hidden ${spineClass} ${curlClass} paper-texture`}
      style={pageStyle}
    >
      {/* Filigree corner ornaments */}
      <div className="filigree filigree-tl text-amber-800">
        <FiligreeSVG />
      </div>
      <div className="filigree filigree-tr text-amber-800">
        <FiligreeSVG />
      </div>
      <div className="filigree filigree-bl text-amber-800">
        <FiligreeSVG />
      </div>
      <div className="filigree filigree-br text-amber-800">
        <FiligreeSVG />
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
