/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  Download,
  Loader2,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { rotatePDFPages } from '../../utils/pdfTools';

interface PagePreview {
  pageNum: number;
  dataUrl: string;
  rotationOffset: number; // in degrees: 0, 90, 180, 270
}

export function RotatePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [outputFilename, setOutputFilename] = useState<string>('rotated_document');
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
    setSuccess(false);
    setOutputFilename(`${uploadedFile.name.replace(/\.[^/.]+$/, '')}_rotated`);

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
            rotationOffset: 0,
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
    setSuccess(false);
  };

  const rotateSingle = (pageNum: number, delta: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNum === pageNum
          ? { ...p, rotationOffset: (p.rotationOffset + delta + 360) % 360 }
          : p
      )
    );
  };

  const rotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotationOffset: (p.rotationOffset + delta + 360) % 360,
      }))
    );
  };

  const resetAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotationOffset: 0 })));
  };

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const rotationsMap: { [p: number]: number } = {};
      pages.forEach((p) => {
        if (p.rotationOffset !== 0) {
          rotationsMap[p.pageNum] = p.rotationOffset;
        }
      });

      const rotatedBytes = await rotatePDFPages(file, rotationsMap);
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let fname = outputFilename.trim() || 'rotated_document';
      if (!fname.endsWith('.pdf')) fname += '.pdf';
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const modifiedCount = pages.filter((p) => p.rotationOffset !== 0).length;

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
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-amber-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF file here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Rotate single pages or the entire document</p>
          </div>
        </div>
      )}

      {isRendering && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <span>Generating visual page thumbnails...</span>
        </div>
      )}

      {file && pages.length > 0 && !isRendering && (
        <div className="space-y-4">
          {/* Active File & Global Batch Rotate Bar */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">{pages.length} pages</span>
                  {modifiedCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{modifiedCount} rotated</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                onClick={() => rotateAll(90)}
                className="flex items-center gap-1 rounded bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors cursor-pointer"
              >
                <RotateCw className="h-3 w-3 text-amber-400" />
                <span>All +90°</span>
              </button>
              <button
                onClick={() => rotateAll(-90)}
                className="flex items-center gap-1 rounded bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 text-amber-400" />
                <span>All -90°</span>
              </button>
              <button
                onClick={resetAll}
                title="Reset All Rotations"
                className="flex items-center gap-1 rounded bg-[#1F2937] hover:bg-[#374151] px-2 py-1 text-[11px] font-semibold text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={clearFile}
                title="Change File"
                className="flex h-7 px-2 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Pages Grid Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937]">
              <span className="font-semibold text-white">Pages Visual Preview</span>
              <span className="text-[10px] font-mono">Click rotate on any page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pages.map((p) => (
                <div
                  key={p.pageNum}
                  className={`group relative flex flex-col rounded-lg border p-2 bg-[#0B0F19] transition-all ${
                    p.rotationOffset !== 0 ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-[#1F2937]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono pb-1.5">
                    <span className="font-bold text-white">P. {p.pageNum}</span>
                    {p.rotationOffset !== 0 ? (
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                        {p.rotationOffset}°
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">0°</span>
                    )}
                  </div>

                  <div className="relative aspect-3/4 w-full overflow-hidden rounded bg-[#111827] flex items-center justify-center p-1">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNum}`}
                      style={{
                        transform: `rotate(${p.rotationOffset}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => rotateSingle(p.pageNum, -90)}
                      title="Rotate -90°"
                      className="flex h-6 flex-1 items-center justify-center rounded bg-[#1F2937] text-white hover:bg-amber-500/20 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => rotateSingle(p.pageNum, 90)}
                      title="Rotate +90°"
                      className="flex h-6 flex-1 items-center justify-center rounded bg-[#1F2937] text-white hover:bg-amber-500/20 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Settings Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                <span>Save Rotated PDF</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {modifiedCount > 0 ? `${modifiedCount} page(s) changed` : 'Original orientation'}
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
                placeholder="rotated_document"
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Rotated PDF downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Rotations...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Rotated PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
