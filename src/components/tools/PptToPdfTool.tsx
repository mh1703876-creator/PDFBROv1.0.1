/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Presentation,
  Download,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  parsePptxFile,
  generatePptxPDF,
  buildPptxPDF,
  PptxSlideData,
} from '../../utils/docConverters';
import { CustomSelect } from '../CustomSelect';

export function PptToPdfTool() {
  const [pptxFile, setPptxFile] = useState<File | null>(null);
  const [pptxSlides, setPptxSlides] = useState<PptxSlideData[]>([]);
  const [isParsingPptx, setIsParsingPptx] = useState<boolean>(false);
  const [pptxTheme, setPptxTheme] = useState<'dark' | 'light' | 'corporate'>('dark');
  const [pptxFilename, setPptxFilename] = useState<string>('presentation_converted');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const pptxInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handlePptxUpload = async (file: File) => {
    if (!file) return;
    setIsParsingPptx(true);
    setPptxFile(file);
    setPptxFilename(`${file.name.replace(/\.[^/.]+$/, '')}_slides`);
    setSuccess(false);

    try {
      const parsedSlides = await parsePptxFile(file);
      setPptxSlides(parsedSlides);
    } catch (err: any) {
      alert(`Failed to parse PowerPoint presentation: ${err.message}`);
    } finally {
      setIsParsingPptx(false);
    }
  };

  const clearFile = () => {
    setPptxFile(null);
    setPptxSlides([]);
    setSuccess(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleExportPptxPDF = () => {
    if (pptxSlides.length === 0) return;
    const cleanName = pptxFilename.trim() || 'presentation_converted';
    const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    generatePptxPDF(pptxSlides, {
      aspectRatio: '16:9',
      theme: pptxTheme,
      filename: finalName,
    });
    setSuccess(true);
  };

  const handlePreviewPptxPDF = () => {
    if (pptxSlides.length === 0) return;
    const cleanName = pptxFilename.trim() || 'presentation_converted';
    const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    const doc = buildPptxPDF(pptxSlides, {
      aspectRatio: '16:9',
      theme: pptxTheme,
      filename: finalName,
    });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewPdfUrl(url);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={pptxInputRef}
        type="file"
        accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
        onChange={(e) => {
          if (e.target.files?.[0]) handlePptxUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {!pptxFile && (
        <div
          onClick={() => pptxInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handlePptxUpload(e.dataTransfer.files[0]);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-amber-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PowerPoint presentation (.pptx) here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Exports high-resolution landscape presentation slide decks into PDF</p>
          </div>
        </div>
      )}

      {isParsingPptx && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <span>Extracting presentation slides and bullet content...</span>
        </div>
      )}

      {pptxSlides.length > 0 && !isParsingPptx && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Presentation className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{pptxFile?.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{pptxFile ? formatSize(pptxFile.size) : ''}</span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">{pptxSlides.length} slides extracted</span>
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

          {/* Slides Deck Grid Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937]">
              <span className="font-semibold text-white">Extracted Slide Decks</span>
              <span className="text-[10px] font-mono text-[#9CA3AF]">
                {pptxSlides.length} slides
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {pptxSlides.map((slide) => (
                <div
                  key={slide.slideNumber}
                  className="rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-amber-400">Slide {slide.slideNumber}</span>
                    <span className="text-[#9CA3AF]">{slide.bodyLines.length} points</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{slide.title || 'Untitled Slide'}</h4>
                  <div className="space-y-0.5 pt-0.5">
                    {slide.bodyLines.slice(0, 2).map((line, lIdx) => (
                      <p key={lIdx} className="text-[11px] text-[#9CA3AF] truncate">
                        • {line}
                      </p>
                    ))}
                    {slide.bodyLines.length > 2 && (
                      <p className="text-[10px] text-[#6B7280]">
                        + {slide.bodyLines.length - 2} more...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Export Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                <span>Presentation Theme &amp; Output</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                16:9 Landscape
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect<'dark' | 'light' | 'corporate'>
                label="Slide Color Theme"
                value={pptxTheme}
                onChange={(val) => setPptxTheme(val)}
                options={[
                  { value: 'dark', label: 'Dark Charcoal Deck', subLabel: 'High-contrast modern' },
                  { value: 'light', label: 'Clean White Deck', subLabel: 'Print-friendly clean' },
                  { value: 'corporate', label: 'Executive Navy Deck', subLabel: 'Professional corporate' },
                ]}
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#D1D5DB]">
                  Output Filename (.pdf)
                </label>
                <input
                  type="text"
                  value={pptxFilename}
                  onChange={(e) => setPptxFilename(e.target.value)}
                  placeholder="presentation_converted"
                  className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Presentation PDF generated and downloaded successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePreviewPptxPDF}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] border border-[#374151] py-2.5 font-bold text-xs text-white transition-all active:scale-98 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>View Live Preview</span>
              </button>

              <button
                onClick={handleExportPptxPDF}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 font-bold text-xs text-white shadow-md shadow-amber-600/20 transition-all active:scale-98 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export &amp; Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live PDF Modal */}
      {previewPdfUrl && (
        <div
          onClick={() => {
            URL.revokeObjectURL(previewPdfUrl);
            setPreviewPdfUrl(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-[#1F2937] bg-[#111827] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] px-4 py-3 bg-[#0B0F19]">
              <div className="flex items-center gap-2">
                <Presentation className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white">PowerPoint Slide Deck Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPptxPDF}
                  className="flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }}
                  className="rounded-lg p-1 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-[#1F2937]/30 p-2">
              <iframe
                src={`${previewPdfUrl}#toolbar=1&navpanes=0`}
                title="Live PDF Document Preview"
                className="h-full w-full rounded-xl border border-[#1F2937] bg-white shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
