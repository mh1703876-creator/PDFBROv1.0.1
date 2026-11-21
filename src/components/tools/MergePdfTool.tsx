/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { mergePDFs } from '../../utils/pdfTools';

interface FileItem {
  id: string;
  file: File;
  size: string;
}

export function MergePdfTool({ initialFiles }: { initialFiles?: File[] | null } = {}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [outputFilename, setOutputFilename] = useState<string>('merged_document');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      const valid = initialFiles.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (valid.length > 0) {
        const uniqueFiles: File[] = [];
        const seen = new Set<string>();
        for (const f of valid) {
          const key = `${f.name}-${f.size}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFiles.push(f);
          }
        }

        const items: FileItem[] = uniqueFiles.map((f) => ({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          size: formatSize(f.size),
        }));

        setFiles(items);
        setSuccess(false);
      }
    }
  }, [initialFiles]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (valid.length === 0 && fileList.length > 0) {
      alert('Please upload valid PDF files.');
      return;
    }

    const newItems: FileItem[] = valid.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      size: formatSize(f.size),
    }));

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      setSuccess(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSuccess(false);
  };

  const clearAll = () => {
    setFiles([]);
    setSuccess(false);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const tmp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const tmp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setSuccess(false);
    try {
      const mergedBytes = await mergePDFs(files.map((f) => f.file));
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let fname = outputFilename.trim() || 'merged_document';
      if (!fname.endsWith('.pdf')) fname += '.pdf';
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      alert(`Merge failed: ${err.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(e) => handleAddFiles(e.target.files)}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {files.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAddFiles(e.dataTransfer.files);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-indigo-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF files here or choose files</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Select 2 or more PDF files to combine</p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          {/* File Queue List */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1.5 border-b border-[#1F2937]">
              <span className="font-bold text-white">
                PDF Queue ({files.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Add more PDFs"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearAll}
                  title="Clear all"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-500/10 text-xs font-mono font-bold text-indigo-400">
                      {idx + 1}
                    </span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#1F2937] text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                      <p className="text-[10px] font-mono text-[#9CA3AF] mt-0.5">{item.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#374151] disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === files.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#374151] disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFile(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer ml-0.5"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Settings & Actions Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Merge Output Settings</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {files.length} {files.length === 1 ? 'file' : 'files'}
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
                placeholder="merged_document"
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {files.length < 2 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                Please add at least 2 PDF documents to enable merging.
              </p>
            )}

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Merged PDF created and downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={isMerging || files.length < 2}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 font-bold text-xs text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isMerging ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Merging {files.length} PDFs...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Merge &amp; Download PDF ({files.length} Files)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
