/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCode, 
  Trash2, 
  Download, 
  FileUp, 
  ChevronUp, 
  ChevronDown, 
  ArrowRightLeft,
  X,
  Plus
} from 'lucide-react';
import { TXTMergeItem } from '../types';

interface RouteB_TXTEditorProps {
  initialText?: string;
  initialFileName?: string;
}

export default function RouteB_TXTEditor({ initialText, initialFileName }: RouteB_TXTEditorProps = {}) {
  // Plain TXT editor states
  const [textContent, setTextContent] = useState<string>(initialText || '');
  const [fileName, setFileName] = useState<string>(initialFileName || 'document');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (initialText !== undefined && initialText !== '') {
      setTextContent(initialText);
    }
    if (initialFileName) {
      handleFileNameChange(initialFileName);
    }
  }, [initialText, initialFileName]);

  // TXT Merge states
  const [mergeQueue, setMergeQueue] = useState<TXTMergeItem[]>([]);
  const [mergeOutputName, setMergeOutputName] = useState<string>('merged_document');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to update filename while stripping the .txt extension for display
  const handleFileNameChange = (val: string) => {
    let cleaned = val;
    if (cleaned.toLowerCase().endsWith('.txt')) {
      cleaned = cleaned.slice(0, -4);
    }
    setFileName(cleaned);
  };

  const handleMergeOutputNameChange = (val: string) => {
    let cleaned = val;
    if (cleaned.toLowerCase().endsWith('.txt')) {
      cleaned = cleaned.slice(0, -4);
    }
    setMergeOutputName(cleaned);
  };

  // Stats for the raw txt field
  const charCount = textContent.length;
  const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length;

  // 1. Download primary raw TXT file
  const handleDownloadTxt = () => {
    const trimmed = fileName.trim();
    const baseName = trimmed === '' ? 'document' : trimmed;
    const finalName = baseName.toLowerCase().endsWith('.txt') ? baseName : `${baseName}.txt`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Clear entire primary text, filename and merge queues
  const handleWipeEverything = () => {
    setTextContent('');
    setFileName('document');
    setMergeQueue([]);
    setMergeOutputName('merged_document');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Handle Local Files upload in Merge section
  const handleMergeFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processSelectedMergeFiles(e.target.files);
  };

  const processSelectedMergeFiles = async (files: FileList) => {
    const list: TXTMergeItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const content = await readFileAsText(file);
          list.push({
            id: `merge-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            content: content,
            size: file.size,
          });
        } catch (err) {
          console.error(`Failed to read file: ${file.name}`, err);
        }
      }
    }
    setMergeQueue((prev) => [...prev, ...list]);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'UTF-8');
    });
  };

  // 4. Queue sorting hierarchy methods
  const moveItemUp = (idx: number) => {
    if (idx === 0) return;
    setMergeQueue((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  };

  const moveItemDown = (idx: number) => {
    if (idx === mergeQueue.length - 1) return;
    setMergeQueue((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  };

  const removeQueueItem = (id: string) => {
    setMergeQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // 5. Compile and Merge downloads
  const handleMergeCompile = () => {
    if (mergeQueue.length === 0) return;
    
    // Reads every document and joins them with EXACTLY two empty lines
    // Meaning content1 + "\n\n\n" + content2 + "\n\n\n" + ...
    const mergedContent = mergeQueue
      .map((item) => item.content)
      .join('\n\n\n');

    const trimmed = mergeOutputName.trim();
    const baseName = trimmed === '' ? 'merged_document' : trimmed;
    const finalFileName = baseName.toLowerCase().endsWith('.txt') ? baseName : `${baseName}.txt`;

    const blob = new Blob([mergedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedMergeFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0B0F19] p-4 font-sans md:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">

        {/* Editor Block */}
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              Text Editor
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#4B5563]">
                Chars: <strong className="text-green-400">{charCount.toLocaleString()}</strong>
              </span>
              <span className="h-3 w-px bg-[#1F2937]" />
              <span className="text-[11px] text-[#4B5563]">
                Words: <strong className="text-green-400">{wordCount.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            id="standalone-txt-textarea"
            className="h-64 w-full rounded-lg border border-[#1F2937] bg-[#0B0F19] p-3 font-mono text-sm text-[#F9FAFB] placeholder-[#4B5563] outline-none transition-colors focus:border-green-500"
            placeholder="Type or paste plain text here. Formatting syntax (#bold#, *italic*) is ignored in this plain editor module..."
          />

          {/* Download Config Bar */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#1F2937] pt-4">
            <div className="flex flex-col gap-1.5 sm:w-1/2">
              <label htmlFor="filename-input" className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                File Name
              </label>
              <input
                type="text"
                id="filename-input"
                value={fileName}
                onChange={(e) => handleFileNameChange(e.target.value)}
                className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 font-sans text-sm text-[#F9FAFB] outline-none focus:border-green-500"
                placeholder="document"
              />
            </div>

            <div className="flex gap-2 self-end sm:self-auto">
              <button
                onClick={() => setShowClearConfirm(true)}
                id="wipe-standalone-btn"
                className="flex h-10 items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 text-xs font-semibold text-red-400 hover:bg-red-950/40 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                <span>CLEAR</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                id="download-standalone-txt-btn"
                className="flex h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-xs font-semibold text-white hover:bg-green-500 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Download TXT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Core TXT Merge Section */}
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="mb-4 flex items-center gap-2.5 border-b border-[#1F2937] pb-3 text-green-500">
            <ArrowRightLeft className="h-5 w-5" />
            <h2 className="text-base font-bold text-[#F9FAFB]">TXT Merger</h2>
          </div>

          {/* Drag & Drop File Loader Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
              isDragging
                ? 'border-green-500 bg-green-500/5'
                : 'border-[#1F2937] bg-[#0B0F19] hover:border-[#4B5563]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMergeFilesSelected}
              multiple
              accept=".txt"
              className="hidden"
            />
            <FileUp className="h-8 w-8 text-[#9CA3AF]" />
            <p className="mt-2 text-xs font-semibold text-[#F9FAFB]">
              Drag and drop text files here or <span className="text-green-500">Browse files</span>
            </p>
            <p className="mt-1 text-[10px] text-[#4B5563]">
              Supports multiple .txt files simultaneously
            </p>
          </div>

          {/* Merge Queue List */}
          {mergeQueue.length > 0 && (
            <div className="mt-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                UPLOADED TXT ({mergeQueue.length})
              </span>

              <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2">
                {mergeQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#1F2937] bg-[#111827] p-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/10 text-xs font-bold text-green-500">
                        {index + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-[#F9FAFB]">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#4B5563]">
                        ({(item.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    {/* Hierarchy Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#1F2937] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveItemDown(index)}
                        disabled={index === mergeQueue.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#1F2937] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeQueueItem(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-500/10"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compile Merger Controls */}
              <div className="mt-4 flex flex-col gap-3 border-t border-[#1F2937] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1.5 sm:w-1/2">
                  <label htmlFor="merge-outname-input" className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    FILE NAME
                  </label>
                  <input
                    type="text"
                    id="merge-outname-input"
                    value={mergeOutputName}
                    onChange={(e) => handleMergeOutputNameChange(e.target.value)}
                    className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 font-sans text-sm text-[#F9FAFB] outline-none focus:border-green-500"
                    placeholder="merged_document"
                  />
                </div>

                <button
                  onClick={handleMergeCompile}
                  id="compile-merge-txt-btn"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 text-xs font-semibold text-white hover:bg-green-500 active:scale-95 sm:self-end"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Merge & Download</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Dialog for Clearing Text */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB] mb-3">
              Clear Text
            </h3>
            <p className="text-xs text-[#9CA3AF] mb-6">
              Are you sure you want to clear the text?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg bg-[#1F2937] px-4 py-2 text-xs font-semibold text-[#F9FAFB] hover:bg-[#374151]"
              >
                NO
              </button>
              <button
                onClick={() => {
                  handleWipeEverything();
                  setShowClearConfirm(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
