/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Scissors,
  Download,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Archive,
  UploadCloud,
  SlidersHorizontal,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { splitPDFByRanges, splitPDFAllPages, SplitRange } from '../../utils/pdfTools';
import JSZip from 'jszip';

interface SplitRangeState {
  from: number | '';
  to: number | '';
}

export function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'ranges' | 'all'>('ranges');
  const [ranges, setRanges] = useState<SplitRangeState[]>([{ from: 1, to: 1 }]);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsAnalyzing(true);
    setFile(uploadedFile);
    setSuccessMsg(null);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setTotalPages(count);
      setRanges([{ from: 1, to: Math.min(count, 3) }]);
    } catch (err: any) {
      alert(`Could not parse PDF: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTotalPages(0);
    setRanges([{ from: 1, to: 1 }]);
    setSuccessMsg(null);
  };

  const addRange = () => {
    const lastTo =
      ranges.length > 0 && typeof ranges[ranges.length - 1].to === 'number'
        ? (ranges[ranges.length - 1].to as number)
        : 0;
    const from = Math.min(totalPages, lastTo + 1);
    const to = Math.min(totalPages, from + 1);
    setRanges((prev) => [...prev, { from, to }]);
  };

  const updateRange = (idx: number, field: 'from' | 'to', rawVal: string) => {
    setRanges((prev) => {
      const copy = [...prev];
      if (rawVal.trim() === '') {
        copy[idx] = { ...copy[idx], [field]: '' };
      } else {
        const parsed = parseInt(rawVal.replace(/[^0-9]/g, ''), 10);
        if (isNaN(parsed)) {
          copy[idx] = { ...copy[idx], [field]: '' };
        } else {
          const clamped = totalPages > 0 ? Math.min(totalPages, parsed) : parsed;
          copy[idx] = { ...copy[idx], [field]: clamped };
        }
      }
      return copy;
    });
  };

  const handleBlurRange = (idx: number, field: 'from' | 'to') => {
    setRanges((prev) => {
      const copy = [...prev];
      const current = copy[idx][field];
      if (current === '' || (typeof current === 'number' && current < 1)) {
        if (field === 'from') {
          copy[idx] = { ...copy[idx], from: 1 };
        } else {
          const fromVal = typeof copy[idx].from === 'number' ? copy[idx].from : 1;
          copy[idx] = { ...copy[idx], to: fromVal };
        }
      } else if (typeof current === 'number') {
        const clamped =
          totalPages > 0 ? Math.min(totalPages, Math.max(1, current)) : Math.max(1, current);
        copy[idx] = { ...copy[idx], [field]: clamped };
      }
      return copy;
    });
  };

  const removeRange = (idx: number) => {
    if (ranges.length <= 1) return;
    setRanges((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsSplitting(true);
    setSuccessMsg(null);

    try {
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      if (splitMode === 'all') {
        const pages = await splitPDFAllPages(file);
        const zip = new JSZip();
        pages.forEach((p) => {
          zip.file(p.name, p.bytes);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_all_pages_split.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMsg(`Extracted ${pages.length} single-page PDFs into a ZIP archive!`);
      } else {
        const effectiveRanges: SplitRange[] = ranges.map((r) => {
          const from = typeof r.from === 'number' && r.from >= 1 ? Math.min(totalPages, r.from) : 1;
          const to =
            typeof r.to === 'number' && r.to >= 1
              ? Math.min(totalPages, Math.max(from, r.to))
              : from;
          return { from, to };
        });

        const results = await splitPDFByRanges(file, effectiveRanges);
        if (results.length === 1) {
          const blob = new Blob([results[0].bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = results[0].name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccessMsg('Split PDF downloaded successfully!');
        } else {
          const zip = new JSZip();
          results.forEach((r) => {
            zip.file(r.name, r.bytes);
          });
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}_split_ranges.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccessMsg(`Created ${results.length} split PDFs bundled in a ZIP!`);
        }
      }
    } catch (err: any) {
      alert(`Split operation failed: ${err.message}`);
    } finally {
      setIsSplitting(false);
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
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-pink-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF file here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Split by custom page ranges or extract all pages</p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
          <span>Reading PDF document structure...</span>
        </div>
      )}

      {file && totalPages > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span className="text-pink-400 font-semibold">{totalPages} total pages</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change File"
                className="flex h-7 px-2.5 items-center justify-center rounded bg-[#1F2937] text-xs font-semibold text-[#D1D5DB] hover:text-white hover:bg-[#374151] transition-colors cursor-pointer"
              >
                Change
              </button>
              <button
                onClick={clearFile}
                title="Remove File"
                className="flex h-7 w-7 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Settings & Mode Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-pink-400" />
                <span>Split Mode</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {splitMode === 'ranges' ? 'Custom ranges' : 'Extract all'}
              </span>
            </div>

            {/* Mode Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSplitMode('ranges')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'ranges'
                    ? 'bg-pink-500/10 border-pink-500/60 text-white shadow-sm'
                    : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white hover:border-[#374151]'
                }`}
              >
                <span className="text-xs font-bold text-pink-300">Custom Page Ranges</span>
                <span className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">
                  Define specific brackets (e.g. 1-3, 4-6)
                </span>
              </button>

              <button
                onClick={() => setSplitMode('all')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'all'
                    ? 'bg-pink-500/10 border-pink-500/60 text-white shadow-sm'
                    : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white hover:border-[#374151]'
                }`}
              >
                <span className="text-xs font-bold text-pink-300">Split Every Page</span>
                <span className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">
                  Extract all {totalPages} pages into a ZIP
                </span>
              </button>
            </div>

            {/* Ranges Editor */}
            {splitMode === 'ranges' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span className="font-semibold text-white">Defined Ranges ({ranges.length})</span>
                  <button
                    onClick={addRange}
                    className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Range</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {ranges.map((range, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-pink-500/30 transition-colors"
                    >
                      <span className="text-[11px] font-mono font-bold text-pink-400 w-16 shrink-0">
                        Part {idx + 1}
                      </span>

                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[11px] text-[#9CA3AF]">From</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={range.from}
                            onChange={(e) => updateRange(idx, 'from', e.target.value)}
                            onBlur={() => handleBlurRange(idx, 'from')}
                            className="w-16 rounded-lg border border-[#1F2937] bg-[#111827] px-2 py-1 text-center font-mono text-xs font-semibold text-white focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[11px] text-[#9CA3AF]">To</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={range.to}
                            onChange={(e) => updateRange(idx, 'to', e.target.value)}
                            onBlur={() => handleBlurRange(idx, 'to')}
                            className="w-16 rounded-lg border border-[#1F2937] bg-[#111827] px-2 py-1 text-center font-mono text-xs font-semibold text-white focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeRange(idx)}
                        disabled={ranges.length <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Remove Range"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {splitMode === 'all' && (
              <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937] p-3 text-[11px] text-[#9CA3AF] flex items-center gap-2">
                <Archive className="h-4 w-4 text-pink-400 shrink-0" />
                <span>
                  All <strong className="text-white">{totalPages} pages</strong> will be converted into separate PDF files and packaged in a ZIP download.
                </span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleSplit}
              disabled={isSplitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-pink-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Splitting PDF...</span>
                </>
              ) : (
                <>
                  <Scissors className="h-3.5 w-3.5" />
                  <span>
                    {splitMode === 'all'
                      ? `Extract All ${totalPages} Pages (.zip)`
                      : `Split into ${ranges.length} Document(s)`}
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
