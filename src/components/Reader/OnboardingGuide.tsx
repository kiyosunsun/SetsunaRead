import React from 'react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';

/* ---------------------------------------------------------------------------
   Onboarding Guide Props
   --------------------------------------------------------------------------- */
interface OnboardingGuideProps {
  /** Whether the guide is visible */
  isOpen: boolean;
  /** Current step index (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrev: () => void;
  /** Skip the guide */
  onSkip: () => void;
  /** Complete the guide */
  onComplete: () => void;
}

/* ---------------------------------------------------------------------------
   Onboarding Step Definition
   --------------------------------------------------------------------------- */
interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

/* ---------------------------------------------------------------------------
   Step Icons (SVG components)
   --------------------------------------------------------------------------- */
function WelcomeIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function DualPageIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5M3.75 6v12m16.5-12v12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BookmarksIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function StartIcon() {
  return (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Onboarding Steps Data
   --------------------------------------------------------------------------- */
function getSteps(): OnboardingStep[] {
  return [
    {
      title: 'Welcome to SetsunaRead',
      description: 'A beautiful, distraction-free reading experience for your favorite books. Let us show you around.',
      icon: <WelcomeIcon />,
      gradient: 'from-amber-500/20 via-orange-500/20 to-rose-500/20',
    },
    {
      title: 'Import Your Books',
      description: 'Click the "Import" button on the bookshelf to add .txt files. We support multiple encodings including UTF-8, GBK, and Big5.',
      icon: <ImportIcon />,
      gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    },
    {
      title: 'Dual Page Mode',
      description: 'Enjoy a book-like reading experience with dual page view. Switch between Dual, Single, and Scroll modes from the toolbar.',
      icon: <DualPageIcon />,
      gradient: 'from-violet-500/20 via-purple-500/20 to-indigo-500/20',
    },
    {
      title: 'Customize Settings',
      description: 'Adjust font size, line height, paper background, and flip animation to match your reading preferences.',
      icon: <SettingsIcon />,
      gradient: 'from-blue-500/20 via-sky-500/20 to-cyan-500/20',
    },
    {
      title: 'Bookmarks & Search',
      description: 'Save your place with bookmarks and quickly find passages using the built-in search feature.',
      icon: <BookmarksIcon />,
      gradient: 'from-rose-500/20 via-pink-500/20 to-fuchsia-500/20',
    },
    {
      title: 'Start Reading',
      description: 'You are all set! Import your first book and begin your reading journey. Happy reading!',
      icon: <StartIcon />,
      gradient: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20',
    },
  ];
}

/* ---------------------------------------------------------------------------
   Onboarding Guide Component
   Modal overlay with step indicator for first-time users.
   --------------------------------------------------------------------------- */
const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  isOpen,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}) => {
  const { nightMode } = useSettingsStore();

  /* Don't render when closed */
  if (!isOpen) return null;

  const steps = getSteps();
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  /* Style helpers */
  const bgClass = nightMode ? 'bg-neutral-900' : 'bg-white';
  const textClass = nightMode ? 'text-neutral-100' : 'text-gray-900';
  const textMutedClass = nightMode ? 'text-neutral-400' : 'text-gray-500';
  const iconColor = nightMode ? 'text-amber-400' : 'text-amber-600';
  const dotActiveClass = nightMode ? 'bg-amber-400' : 'bg-amber-600';
  const dotInactiveClass = nightMode ? 'bg-neutral-600' : 'bg-gray-300';
  const btnSecondaryClass = nightMode
    ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700';
  const btnPrimaryClass = nightMode
    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-900'
    : 'bg-amber-600 hover:bg-amber-500 text-white';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding guide"
    >
      {/* ---- Backdrop ---- */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* ---- Modal ---- */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden mx-4',
          bgClass,
          nightMode ? 'border-neutral-700' : 'border-gray-200',
        )}
      >
        {/* ---- Gradient Header ---- */}
        <div
          className={cn(
            'relative px-8 pt-10 pb-8 bg-gradient-to-br',
            step.gradient,
          )}
        >
          {/* ---- Icon ---- */}
          <div className={cn('flex justify-center mb-4', iconColor)}>
            {step.icon}
          </div>

          {/* ---- Title ---- */}
          <h2 className={cn('text-xl font-bold text-center', textClass)}>
            {step.title}
          </h2>

          {/* ---- Description ---- */}
          <p className={cn('text-sm text-center mt-3 leading-relaxed', textMutedClass)}>
            {step.description}
          </p>
        </div>

        {/* ---- Step Indicator Dots ---- */}
        <div className="flex justify-center gap-2 py-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === currentStep ? dotActiveClass : dotInactiveClass,
                i === currentStep && 'scale-125',
              )}
              aria-label={`Step ${i + 1}${i === currentStep ? ' (current)' : ''}`}
            />
          ))}
        </div>

        {/* ---- Navigation Buttons ---- */}
        <div className={cn('flex items-center justify-between px-6 pb-6 gap-3')}>
          {/* Left side: Skip or Previous */}
          <div className="flex-1">
            {isFirstStep ? (
              <button
                onClick={onSkip}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  btnSecondaryClass,
                )}
              >
                Skip
              </button>
            ) : (
              <button
                onClick={onPrev}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  btnSecondaryClass,
                )}
              >
                Previous
              </button>
            )}
          </div>

          {/* Right side: Next or Complete */}
          <div className="flex-1 flex justify-end">
            {isLastStep ? (
              <button
                onClick={onComplete}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  btnPrimaryClass,
                )}
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={onNext}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  btnPrimaryClass,
                )}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
