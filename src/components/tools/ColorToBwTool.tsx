/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  SunMedium,
  Download,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  loadPDFDocument,
  renderPDFPageToCanvas,
  applyBwFilterToCanvas,
} from '../../utils/pdfToolsHelper';
import { CustomSelect } from '../CustomSelect';

export function ColorToBwTool({ initialFile }: { initialFile?: File | null } = {}) {
  const [bwPdfFile, setBwPdfFile] = useState<File | null>(null);
  const [bwPdfDocProxy, setBwPdfDocProxy] = useState<any>(null);
  const [bwPdfTotalPages, setBwPdfTotalPages] = useState<number>(0);
  const [bwMode, setBwMode] = useState<'grayscale' | 'threshold' | 'inverted'>('grayscale');
  const [bwThreshold, setBwThreshold] = useState<number>(128);
  const [bwContrast, setBwContrast] = useState<number>(1.1);
  const [bwBrightness, setBwBrightness] = useState<number>(0);
  const [bwScale] = useState<number>(1.8);
  const [bwPreviewPage, setBwPreviewPage] = useState<number>(1);
  const [bwOriginalPreview, setBwOriginalPreview] = useState<string>('');
  const [bwFilteredPreview, setBwFilteredPreview] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isConvertingBw, setIsConvertingBw] = useState<boolean>(false);
  const [bwProgress, setBwProgress] = useState<string>('');
  const [bwOutputFilename, setBwOutputFilename] = useState<string>('document_bw');
  const [success, setSuccess] = useState<boolean>(false);
  const bwPdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile && (initialFile.type === 'application/pdf' || initialFile.name.toLowerCase().endsWith('.pdf'))) {
      handleBwPdfUpload(initialFile);
    }
  }, [initialFile]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleBwPdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF document.');
      return;
    }

    setBwPdfFile(file);
    setBwOutputFilename(`${file.name.replace(/\.[^/.]+$/, '')}_bw`);
    setIsPreviewLoading(true);
    setSuccess(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await loadPDFDocument(arrayBuffer);
      setBwPdfDocProxy(doc);
      setBwPdfTotalPages(doc.numPages);
      setBwPreviewPage(1);
      await generateBwPreview(doc, 1, bwMode, bwThreshold, bwContrast, bwBrightness);
    } catch (err: any) {
      alert(`Failed to load PDF: ${err.message || err}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const clearFile = () => {
    setBwPdfFile(null);
    setBwPdfDocProxy(null);
    setBwPdfTotalPages(0);
    setBwOriginalPreview('');
    setBwFilteredPreview('');
    setSuccess(false);
  };

  const generateBwPreview = async (
    doc: any,
    pageNum: number,
    mode: 'grayscale' | 'threshold' | 'inverted',
    thresh: number,
    cont: number,
    bright: number
  ) => {
    if (!doc) return;
    setIsPreviewLoading(true);
    try {
      const origCanvas = await renderPDFPageToCanvas(doc, pageNum, 1.2);
      setBwOriginalPreview(origCanvas.toDataURL('image/jpeg', 0.85));

      const filteredCanvas = applyBwFilterToCanvas(origCanvas, {
        mode,
        threshold: thresh,
        contrast: cont,
        brightness: bright,
      });

      setBwFilteredPreview(filteredCanvas.toDataURL('image/jpeg', 0.85));
    } catch (err: any) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (bwPdfDocProxy && bwPdfTotalPages > 0) {
      generateBwPreview(
        bwPdfDocProxy,
        bwPreviewPage,
        bwMode,
        bwThreshold,
        bwContrast,
        bwBrightness
      );
    }
  }, [bwMode, bwThreshold, bwContrast, bwBrightness, bwPreviewPage]);

  const handleConvertAndDownloadBwPdf = async () => {
    if (!bwPdfDocProxy || !bwPdfFile) return;
    setIsConvertingBw(true);
    setBwProgress('Starting PDF conversion...');
    setSuccess(false);

    try {
      let outputPdf: jsPDF | null = null;

      for (let p = 1; p <= bwPdfTotalPages; p++) {
        setBwProgress(`Rendering & converting page ${p} of ${bwPdfTotalPages}...`);
        const rawCanvas = await renderPDFPageToCanvas(bwPdfDocProxy, p, bwScale);

        const bwCanvas = applyBwFilterToCanvas(rawCanvas, {
          mode: bwMode,
          threshold: bwThreshold,
          contrast: bwContrast,
          brightness: bwBrightness,
        });

        const pxToMm = 0.264583;
        const pageW = (bwCanvas.width / bwScale) * pxToMm;
        const pageH = (bwCanvas.height / bwScale) * pxToMm;
        const orient = pageW > pageH ? 'l' : 'p';

        if (p === 1) {
          outputPdf = new jsPDF({
            orientation: orient,
            unit: 'mm',
            format: [pageW, pageH],
          });
        } else if (outputPdf) {
          outputPdf.addPage([pageW, pageH], orient);
        }

        if (outputPdf) {
          const imgData = bwCanvas.toDataURL('image/jpeg', 0.88);
          outputPdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
        }
      }

      if (outputPdf) {
        setBwProgress('Finalizing monochrome PDF...');
        const cleanName = bwOutputFilename.trim() || 'converted_bw_document';
        const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
        outputPdf.save(finalName);
        setSuccess(true);
      }
    } catch (err: any) {
      alert(`Conversion failed: ${err.message || err}`);
    } finally {
      setIsConvertingBw(false);
      setBwProgress('');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={bwPdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handleBwPdfUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {!bwPdfFile && (
        <div
          onClick={() => bwPdfInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleBwPdfUpload(e.dataTransfer.files[0]);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-rose-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop color PDF document here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Convert colored PDF pages into monochrome, grayscale, or dark mode</p>
          </div>
        </div>
      )}

      {bwPdfFile && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{bwPdfFile.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(bwPdfFile.size)}</span>
                  <span>·</span>
                  <span className="text-rose-400 font-semibold">{bwPdfTotalPages} total pages</span>
                </div>
              </div>
            </div>

            <button
              onClick={clearFile}
              className="flex h-7 px-2 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>

          {/* Live Page Preview Comparison Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937]">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span>Before &amp; After Comparison</span>
                {isPreviewLoading && <Loader2 className="h-3 w-3 animate-spin text-rose-400" />}
              </span>

              {/* Page Navigator */}
              <div className="flex items-center gap-1">
                <button
                  disabled={bwPreviewPage <= 1}
                  onClick={() => setBwPreviewPage((p) => Math.max(1, p - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded bg-[#0B0F19] text-[#9CA3AF] hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-[11px] font-bold text-white px-1.5">
                  {bwPreviewPage} / {bwPdfTotalPages}
                </span>
                <button
                  disabled={bwPreviewPage >= bwPdfTotalPages}
                  onClick={() => setBwPreviewPage((p) => Math.min(bwPdfTotalPages, p + 1))}
                  className="flex h-6 w-6 items-center justify-center rounded bg-[#0B0F19] text-[#9CA3AF] hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Original */}
              <div className="rounded-lg border border-[#1F2937] bg-[#0B0F19] overflow-hidden">
                <div className="px-2.5 py-1 text-[10px] font-bold font-mono text-[#9CA3AF] border-b border-[#1F2937]">
                  Original (Color)
                </div>
                <div className="relative aspect-3/4 w-full p-2 flex items-center justify-center">
                  {bwOriginalPreview ? (
                    <img
                      src={bwOriginalPreview}
                      alt="Original Color Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
                  )}
                </div>
              </div>

              {/* Filtered */}
              <div className="rounded-lg border border-rose-500/40 bg-[#0B0F19] overflow-hidden">
                <div className="px-2.5 py-1 text-[10px] font-bold font-mono text-rose-300 border-b border-rose-500/30 flex items-center justify-between">
                  <span className="uppercase">{bwMode}</span>
                  <Check className="h-3 w-3 text-rose-400" />
                </div>
                <div className="relative aspect-3/4 w-full p-2 flex items-center justify-center">
                  {bwFilteredPreview ? (
                    <img
                      src={bwFilteredPreview}
                      alt="B&W Converted Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings & Action Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" />
                <span>Monochrome Filter Controls</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {bwMode}
              </span>
            </div>

            <CustomSelect<'grayscale' | 'threshold' | 'inverted'>
              label="Conversion Mode"
              value={bwMode}
              onChange={(val) => setBwMode(val)}
              options={[
                { value: 'grayscale', label: 'Smooth Grayscale', subLabel: 'Natural tonal gradation' },
                { value: 'threshold', label: 'Pure Black & White', subLabel: 'High-contrast binary' },
                { value: 'inverted', label: 'Dark Mode (Inverted)', subLabel: 'High-contrast negative' },
              ]}
            />

            <div className="space-y-2 pt-1">
              {bwMode === 'threshold' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#D1D5DB]">
                    <span>B&amp;W Threshold Level</span>
                    <span className="font-mono text-rose-400 font-bold">{bwThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="220"
                    value={bwThreshold}
                    onChange={(e) => setBwThreshold(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Contrast Multiplier</span>
                  <span className="font-mono text-rose-400 font-bold">{bwContrast.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.05"
                  value={bwContrast}
                  onChange={(e) => setBwContrast(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Brightness Offset</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {bwBrightness > 0 ? `+${bwBrightness}` : bwBrightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={bwBrightness}
                  onChange={(e) => setBwBrightness(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#D1D5DB]">
                Output Filename (.pdf)
              </label>
              <input
                type="text"
                value={bwOutputFilename}
                onChange={(e) => setBwOutputFilename(e.target.value)}
                placeholder="document_bw"
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            {bwProgress && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2 text-center text-xs font-mono text-rose-300">
                {bwProgress}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Monochrome PDF converted and downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleConvertAndDownloadBwPdf}
              disabled={isConvertingBw || !bwPdfDocProxy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isConvertingBw ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Converting {bwPdfTotalPages} Pages...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Monochrome PDF ({bwPdfTotalPages} Pages)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
