/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileOutput,
  Download,
  Loader2,
  CheckCircle2,
  CheckSquare,
  Square,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { extractPDFPages } from '../../utils/pdfTools';

interface PagePreview {
  pageNum: number;
  dataUrl: string;
}

export function ExtractPagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [outputFilename, setOutputFilename] = useState<string>('extracted_pages');
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsRendering(true);
    setFile(uploadedFile);
    setSelectedPages(new Set([1]));
    setRangeInput('1');
    setSuccess(false);
    setOutputFilename(`${uploadedFile.name.replace(/\.[^/.]+$/, '')}_extracted`);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const count = pdf.numPages;

      const previews: PagePreview[] = [];
      for (let p = 1; p <= count; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          previews.push({
            pageNum: p,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
      }
      setPages(previews);
    } catch (err: any) {
      alert(`Failed to load PDF preview: ${err.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPages([]);
    setSelectedPages(new Set());
    setRangeInput('');
    setSuccess(false);
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      const arr = Array.from(next).sort((a: number, b: number) => a - b);
      setRangeInput(arr.join(', '));
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<number>(pages.map((p) => p.pageNum));
    setSelectedPages(all);
    setRangeInput(Array.from(all).join(', '));
  };

  const clearAll = () => {
    setSelectedPages(new Set<number>());
    setRangeInput('');
  };

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    const newSet = new Set<number>();
    const parts = val.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [sStr, eStr] = trimmed.split('-');
        const s = parseInt(sStr, 10);
        const e = parseInt(eStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let p = Math.min(s, e); p <= Math.max(s, e); p++) {
            if (p >= 1 && p <= pages.length) newSet.add(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= pages.length) {
          newSet.add(p);
        }
      }
    }
    setSelectedPages(newSet);
  };

  const handleSave = async () => {
    if (!file || selectedPages.size === 0) return;
    setIsSaving(true);
    try {
      const sorted: number[] = (Array.from(selectedPages) as number[]).sort((a, b) => a - b);
      const newPdfBytes = await extractPDFPages(file, sorted);
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let fname = outputFilename.trim() || 'extracted_pages';
      if (!fname.endsWith('.pdf')) fname += '.pdf';
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      alert(`Failed to extract pages: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-teal-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF file here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Select specific pages to extract into a clean new PDF</p>
          </div>
        </div>
      )}

      {isRendering && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
          <span>Generating visual page thumbnails...</span>
        </div>
      )}

      {file && pages.length > 0 && !isRendering && (
        <div className="space-y-4">
          {/* Active File & Quick Select Bar */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span className="text-white font-semibold">{pages.length} total</span>
                  <span>·</span>
                  <span className="text-teal-400 font-bold">{selectedPages.size} selected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={selectAll}
                className="flex items-center gap-1 rounded bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors cursor-pointer"
              >
                <CheckSquare className="h-3 w-3 text-teal-400" />
                <span>All</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <Square className="h-3 w-3" />
                <span>None</span>
              </button>
              <button
                onClick={clearFile}
                className="flex h-7 px-2 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Quick Range Input Helper */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center gap-3">
            <span className="text-xs font-medium text-[#9CA3AF] whitespace-nowrap">Page Range:</span>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInputChange(e.target.value)}
              placeholder="e.g. 1-3, 5, 7"
              className="flex-1 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 py-1.5 font-mono text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Pages Grid Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937]">
              <span className="font-semibold text-white">Click pages to toggle selection</span>
              <span className="text-[10px] font-mono text-teal-400">
                {selectedPages.size} / {pages.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pages.map((p) => {
                const isSelected = selectedPages.has(p.pageNum);
                return (
                  <div
                    key={p.pageNum}
                    onClick={() => togglePage(p.pageNum)}
                    className={`group relative flex flex-col rounded-lg border p-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40'
                        : 'border-[#1F2937] bg-[#0B0F19] hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono pb-1.5">
                      <span className="font-bold text-white">P. {p.pageNum}</span>
                      {isSelected ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded border border-[#374151] text-[#9CA3AF]" />
                      )}
                    </div>

                    <div className="relative aspect-3/4 w-full overflow-hidden rounded bg-[#111827] flex items-center justify-center p-1">
                      <img
                        src={p.dataUrl}
                        alt={`Page ${p.pageNum}`}
                        className={`max-h-full max-w-full object-contain transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-40'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-teal-400" />
                <span>Export Extracted PDF</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {selectedPages.size} page(s) selected
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#D1D5DB]">
                Output Filename (.pdf)
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                placeholder="extracted_pages"
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            {selectedPages.size === 0 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                Please select at least 1 page above to extract.
              </p>
            )}

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Extracted PDF downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || selectedPages.size === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 font-bold text-xs text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Extracting Pages...</span>
                </>
              ) : (
                <>
                  <FileOutput className="h-3.5 w-3.5" />
                  <span>
                    Extract {selectedPages.size} Page{selectedPages.size === 1 ? '' : 's'} to New PDF
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
