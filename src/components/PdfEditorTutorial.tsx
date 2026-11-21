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
  Info, 
  Download, 
  PenLine, 
  Sliders, 
  Type, 
  Eye, 
  CheckCircle2,
  HelpCircle,
  Undo2,
  Redo2,
  ClipboardCopy,
  Trash2,
  FileUp,
  Files,
  Maximize2,
  Columns,
  Square,
  AlignLeft,
  Hash,
  Layers,
  Zap,
  Palette,
  Search,
  Languages
} from 'lucide-react';
import { BottomTabType } from '../types';

export interface TutorialSubSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export interface TutorialStep {
  id: string;
  tab?: BottomTabType;
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

const TUTORIAL_STEPS: TutorialStep[] = [
  // STEP 0: OVERVIEW & HEADER
  {
    id: 'overview',
    tab: 'input',
    stepNumber: '1 of 5',
    category: 'Getting Started',
    title: 'Welcome to PDFBRO',
    summary: 'Create, format, customize, and export clean PDF documents offline in seconds.',
    icon: Sparkles,
    gradient: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    subsections: [
      {
        title: 'Tutorial Icon (?)',
        description: 'Tap anytime in the top header to reopen this visual guide.',
        icon: HelpCircle,
        tag: 'Header'
      },
      {
        title: 'Info Guide (i)',
        description: 'See all syntax symbols (#bold#, %italic%, @underline@, |tables|) and copy AI prompts.',
        icon: Info,
        tag: 'Header'
      },
      {
        title: 'Export PDF',
        description: 'Compiles your document with custom typography and downloads the PDF directly to your device.',
        icon: Download,
        tag: 'Header'
      },
      {
        title: '4 Workflow Tabs',
        description: 'Switch between Editor, Layout, Fonts, and Preview using the top navigation bar.',
        icon: Layers,
        tag: 'Navigation'
      }
    ],
    tips: 'Runs 100% in your browser. No files are uploaded to any server.'
  },

  // STEP 1: EDITOR TAB
  {
    id: 'editor-tab',
    tab: 'input',
    stepNumber: '2 of 5',
    category: 'Editor Tab',
    title: 'Write & Format Content',
    summary: 'Your main workspace for writing text, applying quick formatting markers, and checking live stats.',
    icon: PenLine,
    gradient: 'from-blue-600 to-cyan-600',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    subsections: [
      {
        title: 'Undo & Redo',
        description: 'Undo (Ctrl+Z) or redo your edits with full history tracking.',
        icon: Undo2,
        tag: 'Action Bar'
      },
      {
        title: 'Cut & Clear',
        description: 'Quickly cut all text to your clipboard or clear the editor with the trash button.',
        icon: ClipboardCopy,
        tag: 'Action Bar'
      },
      {
        title: 'Upload TXT',
        description: 'Import any .txt file directly into the editor with one click or drag & drop.',
        icon: FileUp,
        tag: 'Action Bar'
      },
      {
        title: 'Instant Syntax Markers',
        description: 'Type #bold#, %italic%, !uppercase!, @underline@, and <.> bullet points directly in your text.',
        icon: Hash,
        tag: 'Writing Area'
      },
      {
        title: 'Live Statistics Deck',
        description: 'Real-time counters for Characters, Words, Lines, and estimated Reading Time.',
        icon: Layers,
        tag: 'Live Stats'
      }
    ],
    tips: 'Combine markers like #%Heading%# for bold italic emphasis.'
  },

  // STEP 2: LAYOUT TAB
  {
    id: 'layout-tab',
    tab: 'layout',
    stepNumber: '3 of 5',
    category: 'Layout Tab',
    title: 'Configure Page & Typography',
    summary: 'Adjust page geometry, multi-column flow, margins, font sizing, and document styling across 9 sections:',
    icon: Sliders,
    gradient: 'from-emerald-600 to-teal-600',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    subsections: [
      {
        title: 'Templates Settings',
        description: 'Save your current layout setup as a reusable template or export/import backup JSON files.',
        icon: Files,
        tag: 'Templates'
      },
      {
        title: '01. Paper Size Preset',
        description: 'Select Letter, A4, A3, Legal, Executive, or Custom dimensions in inches.',
        icon: Maximize2,
        tag: '01 Size'
      },
      {
        title: '02. Multi Column Flow',
        description: 'Format text into Single (1), Double (2), Three (3), or Four (4) column layouts.',
        icon: Columns,
        tag: '02 Columns'
      },
      {
        title: '03. Page Margins Preset',
        description: 'Choose preset margins (0.2", 0.3", 0.5", 1.0") or custom top/bottom/left/right spacing.',
        icon: Square,
        tag: '03 Margins'
      },
      {
        title: '04. Word Typography Details',
        description: 'Set Font Size (PT), Line Spacing Multiplier (1.4), and Text Alignment (Left, Right, Center, Justified).',
        icon: AlignLeft,
        tag: '04 Typography'
      },
      {
        title: '05. Page Navigation Counters',
        description: 'Position page numbers (Bottom Center, Top Right, etc.), select style (Page 1, 1/4), and label size.',
        icon: Hash,
        tag: '05 Counters'
      },
      {
        title: '06. Meta Text Overlays',
        description: 'Add up to 3 custom header/footer text watermarks with force uppercase and bold options.',
        icon: Layers,
        tag: '06 Overlays'
      },
      {
        title: '07. Compression Quality',
        description: 'Choose between Maximum (smallest file), Balanced, or High Quality vector rendering.',
        icon: Zap,
        tag: '07 Quality'
      },
      {
        title: '08. Document Theme',
        description: 'Switch between Classic White, Vintage Cream, and Charcoal Black styling.',
        icon: Palette,
        tag: '08 Theme'
      }
    ],
    tips: 'All font sizing and spacing options are controlled right here in the Layout tab.'
  },

  // STEP 3: FONTS TAB
  {
    id: 'fonts-tab',
    tab: 'font',
    stepNumber: '4 of 5',
    category: 'Fonts Tab',
    title: 'English & Bangla Typography',
    summary: 'Pick from curated Google Fonts with dual-font support for English and Bengali script.',
    icon: Type,
    gradient: 'from-violet-600 to-indigo-600',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    subsections: [
      {
        title: 'Language Switcher (English / Bangla)',
        description: 'Toggle between English fonts (Poppins, Inter, Roboto) and Bangla fonts (Noto Sans Bengali, Hind Siliguri).',
        icon: Languages,
        tag: 'Toggle'
      },
      {
        title: 'Search & Category Filters',
        description: 'Search fonts by name or filter English fonts by Sans-Serif, Serif, Monospace, and Handwriting.',
        icon: Search,
        tag: 'Filter'
      },
      {
        title: '1-Click Font Activation',
        description: 'Tap any font card to download and apply it instantly to your document and preview.',
        icon: CheckCircle2,
        tag: 'Catalog'
      },
      {
        title: 'Dual-Font System',
        description: 'English text uses your selected English font, while Bangla text renders seamlessly with your chosen Bangla font.',
        icon: Type,
        tag: 'Dual Font'
      }
    ],
    tips: 'Fonts are embedded directly into your exported PDF for universal compatibility.'
  },

  // STEP 4: PREVIEW & EXPORT
  {
    id: 'preview-tab',
    tab: 'preview',
    stepNumber: '5 of 5',
    category: 'Preview & Export',
    title: 'Live Preview & Download',
    summary: 'Check the real-time proof of your document and download your final PDF.',
    icon: Eye,
    gradient: 'from-cyan-600 to-blue-600',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    subsections: [
      {
        title: 'Live Proof Card',
        description: 'Visualizes exact margins, multi-column flow, pagination counters, and watermark overlays in real time.',
        icon: Eye,
        tag: 'Live Proof'
      },
      {
        title: 'Desktop Side-by-Side View',
        description: 'On desktop screens, the proof card remains visible side-by-side as you type or adjust layout settings.',
        icon: Maximize2,
        tag: 'Responsive'
      },
      {
        title: 'Export PDF Button',
        description: 'Tap Export in the top header, choose an optional filename, and instantly download your PDF document.',
        icon: Download,
        tag: 'Export'
      }
    ],
    tips: 'No sign-up needed. Fast, private, and works completely offline.'
  }
];

interface PdfEditorTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: BottomTabType) => void;
}

export function PdfEditorTutorial({ isOpen, onClose, onTabChange }: PdfEditorTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Sync active tab in PDF editor when step changes
  useEffect(() => {
    if (isOpen) {
      const step = TUTORIAL_STEPS[currentStepIndex];
      if (step?.tab) {
        onTabChange(step.tab);
      }
    }
  }, [isOpen, currentStepIndex, onTabChange]);

  // Keyboard navigation
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

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
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
      {/* Bottom Sheet Container */}
      <div 
        className="relative w-full max-w-2xl mx-auto rounded-t-3xl border-t border-x border-[#1F2937] bg-[#0E131F] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] transition-transform animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-600/60" />
        </div>

        {/* Top Header */}
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
          {/* Summary */}
          <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
            {currentStep.summary}
          </p>

          {/* Subsections Cards */}
          <div className="space-y-2">
            {currentStep.subsections.map((sub, idx) => {
              const SubIcon = sub.icon;
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-[#1F2937] bg-[#111827]/80 p-3 transition-colors hover:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
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

          {/* Pro-Tip Box */}
          {currentStep.tips && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-950/20 border border-blue-900/40 px-3.5 py-2.5 text-xs text-blue-300">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="leading-relaxed">{currentStep.tips}</span>
            </div>
          )}

          {/* Step Progress Indicators */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pb-1.5">
              <span>Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}</span>
              <span className="text-gray-500">Tap Next or use arrows</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TUTORIAL_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  title={`${step.stepNumber}: ${step.title}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-blue-500 scale-y-125'
                      : idx < currentStepIndex
                      ? 'bg-blue-500/40 hover:bg-blue-400'
                      : 'bg-[#1F2937] hover:bg-[#374151]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sheet Footer Navigation Bar */}
        <div className="flex items-center justify-between border-t border-[#1F2937] bg-[#0A0D16] px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#9CA3AF] hover:text-white px-2 py-1.5 transition-colors cursor-pointer"
          >
            Skip Guide
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
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * First-Time User Welcome Bottom Sheet Prompt
 */
interface FirstTimePromptProps {
  onStartTutorial: () => void;
  onDismiss: () => void;
}

export function FirstTimeTutorialPrompt({ onStartTutorial, onDismiss }: FirstTimePromptProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div 
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-blue-500/30 bg-[#0E131F] p-6 shadow-2xl text-center space-y-4 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-center sm:hidden pb-1 -mt-2">
          <div className="h-1.5 w-12 rounded-full bg-gray-600/60" />
        </div>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30 shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white">Welcome to PDFBRO</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Take a 1-minute visual tour to see how to write text with instant markup, customize layout geometry, choose fonts, and export PDFs offline.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={onStartTutorial}
            className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>I'm new, guide me!</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-full h-9 rounded-xl text-xs font-semibold text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-all cursor-pointer"
          >
            I know this already
          </button>
        </div>
      </div>
    </div>
  );
}
