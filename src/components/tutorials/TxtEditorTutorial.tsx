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
  FileCode, 
  Trash2, 
  Download, 
  FileUp, 
  ArrowRightLeft, 
  ChevronUp, 
  ChevronDown, 
  BarChart3, 
  FileText,
  Layers
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

const TXT_TUTORIAL_STEPS: TutorialStep[] = [
  // STEP 1: TEXT EDITOR
  {
    id: 'txt-editor',
    stepNumber: '1 of 2',
    category: 'Plain Text Editor',
    title: 'Write & Export Raw TXT',
    summary: 'A fast, distraction-free plain text editor with live word counting and instant file download.',
    icon: FileCode,
    gradient: 'from-emerald-600 to-green-600',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    subsections: [
      {
        title: 'Plain Text Area',
        description: 'Type or paste raw unformatted text. Any formatting markup (#bold#, *italic*) remains pure text.',
        icon: FileCode,
        tag: 'Editor'
      },
      {
        title: 'Live Character & Word Counters',
        description: 'Monitors exact character count and word count in real time at the top right of the editor.',
        icon: BarChart3,
        tag: 'Counters'
      },
      {
        title: 'Custom File Name',
        description: 'Set your preferred filename in the input box before downloading (defaults to "document.txt").',
        icon: FileText,
        tag: 'Filename'
      },
      {
        title: 'Clear Button (Trash)',
        description: 'Resets the editor, filename, and file queues with a safe confirmation dialog.',
        icon: Trash2,
        tag: 'Actions'
      },
      {
        title: 'Download TXT',
        description: 'Saves your text document immediately to your device as a standard UTF-8 .txt file.',
        icon: Download,
        tag: 'Export'
      }
    ],
    tips: 'Works 100% offline in your browser. No data is sent to external servers.'
  },

  // STEP 2: TXT MERGER
  {
    id: 'txt-merger',
    stepNumber: '2 of 2',
    category: 'TXT Merger',
    title: 'Combine Multiple .TXT Files',
    summary: 'Merge multiple text files into a single consolidated text document in your exact preferred order.',
    icon: ArrowRightLeft,
    gradient: 'from-green-600 to-teal-600',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    subsections: [
      {
        title: 'Drag & Drop / Browse Loader',
        description: 'Drag and drop multiple .txt files at once, or click the zone to browse and select files.',
        icon: FileUp,
        tag: 'Upload'
      },
      {
        title: 'Uploaded TXT Queue',
        description: 'Displays all queued text files with their sequence numbers and file sizes in kilobytes.',
        icon: Layers,
        tag: 'Queue'
      },
      {
        title: 'Reorder Hierarchy (Move Up / Down)',
        description: 'Use the arrow buttons to shift documents up or down to set the exact merge sequence.',
        icon: ChevronUp,
        tag: 'Sort'
      },
      {
        title: 'Remove Individual Files (X)',
        description: 'Easily discard unwanted files from the merge queue with one tap.',
        icon: X,
        tag: 'Remove'
      },
      {
        title: 'Merge & Download',
        description: 'Combines all documents separated by clean line breaks and downloads the merged file.',
        icon: ArrowRightLeft,
        tag: 'Compile'
      }
    ],
    tips: 'Merged documents are cleanly separated with two empty lines between each file.'
  }
];

interface TxtEditorTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TxtEditorTutorial({ isOpen, onClose }: TxtEditorTutorialProps) {
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

  const currentStep = TXT_TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TXT_TUTORIAL_STEPS.length - 1;
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
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
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 border border-emerald-900/40 px-3.5 py-2.5 text-xs text-emerald-300">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="leading-relaxed">{currentStep.tips}</span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pb-1.5">
              <span>Step {currentStepIndex + 1} of {TXT_TUTORIAL_STEPS.length}</span>
              <span className="text-gray-500">Tap Next or use arrows</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TXT_TUTORIAL_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'bg-emerald-500 scale-y-125'
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
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
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
