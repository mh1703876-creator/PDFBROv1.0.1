/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  ListFilter, 
  Trash2, 
  Upload, 
  BarChart3, 
  ArrowRightLeft, 
  ArrowDownAZ, 
  Copy, 
  Download, 
  Eye, 
  Hash,
  CheckCircle2,
  FileOutput
} from 'lucide-react';

interface TutorialSubSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

interface TutorialStep {
  id: string;
  stepNumber: string;
  category: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badgeBg: string;
  subsections: TutorialSubSection[];
  tips?: string;
}

const VOCAB_TUTORIAL_STEPS: TutorialStep[] = [
  // STEP 1: INPUT TEXT & STATS
  {
    id: 'input-stats',
    stepNumber: '1 of 3',
    category: 'Input & Metrics',
    title: 'Input Text & Live Statistics',
    summary: 'Paste any text or upload a .txt file to extract and analyze English vocabulary words.',
    icon: ListFilter,
    gradient: 'from-pink-600 to-rose-600',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    subsections: [
      {
        title: '01. Input Text Box',
        description: 'Type or paste paragraphs of text. English words are automatically extracted and normalized.',
        icon: ListFilter,
        tag: '01 Input'
      },
      {
        title: 'Upload TXT & Clear Buttons',
        description: 'Import text from your local files or wipe everything clean with one tap.',
        icon: Upload,
        tag: 'Actions'
      },
      {
        title: 'Input Statistics Deck',
        description: '4 live metric cards tracking Total Words, Unique Words, Duplicate Types, and Removed Occurrences.',
        icon: BarChart3,
        tag: 'Live Stats'
      }
    ],
    tips: 'Automatically filters punctuation, special characters, and single-letter artifacts.'
  },

  // STEP 2: WORD FILTER (STOPWORDS)
  {
    id: 'word-filter',
    stepNumber: '2 of 3',
    category: 'Word Filter',
    title: 'Filter Out Specific Words',
    summary: 'Exclude common filler words (stopwords) like "the, is, are, have" from your final vocabulary list.',
    icon: ListFilter,
    gradient: 'from-pink-600 to-purple-600',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    subsections: [
      {
        title: '02. Word Filter Toggle',
        description: 'Turn the filter switch On or Off anytime without losing your entered words.',
        icon: CheckCircle2,
        tag: '02 Filter'
      },
      {
        title: 'Ignored Words List',
        description: 'Type or paste words separated by commas, spaces, or lines that you want removed.',
        icon: ListFilter,
        tag: 'Stopwords'
      },
      {
        title: 'Filter Statistics & Tags',
        description: 'Displays active filter tags and tracks how many total words were matched and removed.',
        icon: BarChart3,
        tag: 'Filter Stats'
      }
    ],
    tips: 'Word filtering is case-insensitive, so typing "the" will match "The" and "THE".'
  },

  // STEP 3: RESULT, SORTING & EXPORT
  {
    id: 'result-export',
    stepNumber: '3 of 3',
    category: 'Results & Export',
    title: 'Sort, Copy & Download Vocab',
    summary: 'Format your deduplicated vocabulary list, view duplicate frequencies, and export results.',
    icon: Download,
    gradient: 'from-rose-600 to-pink-600',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    subsections: [
      {
        title: '03. Sorting Order',
        description: 'Choose between "Original" order of appearance, "A to Z" alphabetical, or "Z to A" reverse order.',
        icon: ArrowDownAZ,
        tag: '03 Sorting'
      },
      {
        title: 'Output Format (Comma / Line)',
        description: 'Toggle between a comma-separated list ("Apple, Banana, Orange") or one word per line.',
        icon: FileOutput,
        tag: 'Format'
      },
      {
        title: 'Copy Result & Download TXT',
        description: 'Copy directly to clipboard or download as a .txt file named with your exact vocabulary count.',
        icon: Copy,
        tag: 'Export'
      },
      {
        title: '04. Duplicate Word Frequency Preview',
        description: 'Expand the drawer to see exact duplicate occurrences (e.g. "Vocabulary ×4") across your text.',
        icon: Eye,
        tag: '04 Duplicates'
      }
    ],
    tips: 'Word entries are cleanly formatted with First-Letter capitalization.'
  }
];

interface VocabAnalyzerTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VocabAnalyzerTutorial({ isOpen, onClose }: VocabAnalyzerTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = VOCAB_TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === VOCAB_TUTORIAL_STEPS.length - 1;
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl mx-auto rounded-t-3xl border-t border-x border-[#1F2937] bg-[#0E131F] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] transition-transform animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-600/60" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 pt-2 pb-3.5 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentStep.gradient} text-white shadow-md`}>
              <StepIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentStep.badgeBg}`}>
                  {currentStep.stepNumber}
                </span>
                <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider truncate">
                  {currentStep.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1F2937]/70 hover:bg-[#1F2937] text-gray-400 hover:text-white transition-colors cursor-pointer ml-2"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="px-4 sm:px-6 py-4 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-800">
          <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
            {currentStep.summary}
          </p>

          <div className="space-y-2">
            {currentStep.subsections.map((sub, idx) => {
              const SubIcon = sub.icon;
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-[#1F2937] bg-[#111827]/80 p-3 transition-colors hover:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 mt-0.5">
                      <SubIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-white tracking-wide truncate">
                          {sub.title}
                        </h4>
                        {sub.tag && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1F2937] text-gray-300 shrink-0">
                            {sub.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#9CA3AF] leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStep.tips && (
            <div className="flex items-center gap-2 rounded-xl bg-pink-950/20 border border-pink-900/40 px-3.5 py-2.5 text-xs text-pink-300">
              <Sparkles className="h-4 w-4 shrink-0 text-pink-400" />
              <span className="leading-relaxed">{currentStep.tips}</span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pb-1.5">
              <span>Step {currentStepIndex + 1} of {VOCAB_TUTORIAL_STEPS.length}</span>
              <span className="text-gray-500">Tap Next or use arrows</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {VOCAB_TUTORIAL_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-pink-500 scale-y-125'
                      : 'bg-[#1F2937] hover:bg-[#374151]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1F2937] bg-[#0A0D16] px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#9CA3AF] hover:text-white px-2 py-1.5 transition-colors cursor-pointer"
          >
            Close Guide
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className="flex h-9 items-center gap-1 rounded-xl border border-[#1F2937] bg-[#111827] px-3.5 text-xs font-bold text-[#E5E7EB] hover:bg-[#1F2937] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className={`flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                isLastStep
                  ? 'bg-pink-600 hover:bg-pink-500'
                  : 'bg-pink-600 hover:bg-pink-500'
              }`}
            >
              <span>{isLastStep ? 'Got it' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
