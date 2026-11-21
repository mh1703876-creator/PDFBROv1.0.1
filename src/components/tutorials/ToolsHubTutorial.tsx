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
  Search, 
  Layers, 
  Filter, 
  ShieldAlert, 
  FileImage, 
  FileText, 
  FileOutput, 
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  Stamp
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

const TOOLS_TUTORIAL_STEPS: TutorialStep[] = [
  // STEP 1: TOOLS HUB OVERVIEW & SEARCH
  {
    id: 'tools-overview',
    stepNumber: '1 of 3',
    category: 'Tools Hub Overview',
    title: '16 Fast & Private PDF Tools',
    summary: 'Process, convert, organize, and edit documents completely in your browser without uploading to any server.',
    icon: Sparkles,
    gradient: 'from-indigo-600 to-purple-600',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    subsections: [
      {
        title: 'Instant Search Bar',
        description: 'Type keywords to instantly filter through all 16 tools in real time.',
        icon: Search,
        tag: 'Search'
      },
      {
        title: 'Category Quick-Filter Tabs',
        description: 'Filter tools by Organize PDF (6), Security & Optimize (3), Image Tools (3), and Converters.',
        icon: Filter,
        tag: 'Categories'
      },
      {
        title: '100% Client-Side Privacy',
        description: 'All document rendering, page manipulation, and conversions occur entirely inside your browser memory.',
        icon: Lock,
        tag: 'Private'
      }
    ],
    tips: 'Works offline as an installed PWA on mobile and desktop.'
  },

  // STEP 2: TOOL CATEGORIES BREAKDOWN
  {
    id: 'tool-categories',
    stepNumber: '2 of 3',
    category: 'Available Tool Suites',
    title: 'Organize, Convert & Edit',
    summary: 'Explore the 5 specialized tool suites designed for quick everyday PDF tasks:',
    icon: Layers,
    gradient: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    subsections: [
      {
        title: 'Organize PDF (6 Tools)',
        description: 'Merge multiple PDFs, Split into chapters/ranges, Rotate pages, Delete unwanted pages, Reorder, and Extract pages.',
        icon: Layers,
        tag: 'Organize'
      },
      {
        title: 'Convert to PDF (3 Tools)',
        description: 'Convert Image galleries (JPG/PNG/WEBP), Microsoft Word (.docx), and PowerPoint (.pptx) directly to PDF.',
        icon: FileText,
        tag: 'To PDF'
      },
      {
        title: 'Security & Optimization (3 Tools)',
        description: 'Remove sensitive author metadata, stamp custom text watermarks, and compress document file sizes.',
        icon: Stamp,
        tag: 'Security'
      },
      {
        title: 'Image Tools & PDF Export',
        description: 'Compress images, resize image dimensions, convert photos to grayscale, and extract PDF pages to high-res PNGs.',
        icon: FileImage,
        tag: 'Images'
      }
    ],
    tips: 'Easily drag and drop files or select whole folders to batch process.'
  },

  // STEP 3: WORKFLOW & EXPORT
  {
    id: 'workflow-export',
    stepNumber: '3 of 3',
    category: 'Tool Workflow',
    title: 'Open Studio, Edit & Export',
    summary: 'Using any tool is straightforward with live interactive previews and instant downloads:',
    icon: CheckCircle2,
    gradient: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    subsections: [
      {
        title: '1. Select & Open Studio',
        description: 'Click "Open" on any tool card to enter its dedicated processing studio.',
        icon: CheckCircle2,
        tag: 'Step 1'
      },
      {
        title: '2. Upload & Configure Settings',
        description: 'Drop your files and configure visual options like page selection, rotation, or watermark text.',
        icon: SlidersHorizontal,
        tag: 'Step 2'
      },
      {
        title: '3. Process & Download',
        description: 'Click Download or Export to save your processed PDF or ZIP archive immediately.',
        icon: FileOutput,
        tag: 'Step 3'
      }
    ],
    tips: 'Use the "Back to Tools" button in the top left of any tool studio to return to the hub anytime.'
  }
];

interface ToolsHubTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolsHubTutorial({ isOpen, onClose }: ToolsHubTutorialProps) {
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

  const currentStep = TOOLS_TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOOLS_TUTORIAL_STEPS.length - 1;
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
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
            <div className="flex items-center gap-2 rounded-xl bg-indigo-950/20 border border-indigo-900/40 px-3.5 py-2.5 text-xs text-indigo-300">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
              <span className="leading-relaxed">{currentStep.tips}</span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pb-1.5">
              <span>Step {currentStepIndex + 1} of {TOOLS_TUTORIAL_STEPS.length}</span>
              <span className="text-gray-500">Tap Next or use arrows</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOLS_TUTORIAL_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-indigo-500 scale-y-125'
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
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
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
