/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Download,
  Loader2,
  FileArchive,
  RefreshCw,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  ZoomIn,
  X,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  loadPDFDocument,
  renderPDFPageToCanvas,
  parsePageRange,
} from '../../utils/pdfToolsHelper';
import { CustomSelect } from '../CustomSelect';

export function PdfToImagesTool({ initialFile }: { initialFile?: File | null } = {}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png'>('png');
  const [imgQuality, setImgQuality] = useState<number>(92);
  const [imgScale, setImgScale] = useState<number>(2.0);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRangeStr, setCustomRangeStr] = useState<string>('');
  const [renderedPages, setRenderedPages] = useState<
    { pageNumber: number; dataUrl: string; width: number; height: number }[]
  >([]);
  const [isRenderingPdf, setIsRenderingPdf] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [previewModalImg, setPreviewModalImg] = useState<{
    page: number;
    dataUrl: string;
  } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile && (initialFile.type === 'application/pdf' || initialFile.name.toLowerCase().endsWith('.pdf'))) {
      handlePdfUpload(initialFile);
    }
  }, [initialFile]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF document.');
      return;
    }

    setPdfFile(file);
    setRenderedPages([]);
    setIsRenderingPdf(true);
    setRenderProgress('Loading PDF document...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const docProxy = await loadPDFDocument(arrayBuffer);
      setPdfDocProxy(docProxy);
      setPdfTotalPages(docProxy.numPages);
      await renderPages(
        docProxy,
        docProxy.numPages,
        pageRangeMode === 'custom' ? customRangeStr : ''
      );
    } catch (err: any) {
      alert(`Failed to load PDF: ${err.message || err}`);
    } finally {
      setIsRenderingPdf(false);
      setRenderProgress('');
    }
  };

  const clearFile = () => {
    setPdfFile(null);
    setPdfDocProxy(null);
    setPdfTotalPages(0);
    setRenderedPages([]);
  };

  const renderPages = async (doc: any, total: number, rangeStr: string) => {
    if (!doc) return;
    setIsRenderingPdf(true);
    setRenderProgress('Extracting and rendering pages...');
    setRenderedPages([]);

    try {
      let pageNumbers: number[] = [];
      if (rangeStr && rangeStr.trim()) {
        pageNumbers = parsePageRange(rangeStr, total);
      } else {
        pageNumbers = Array.from({ length: total }, (_, i) => i + 1);
      }

      if (pageNumbers.length === 0) {
        alert('No valid pages found in selected range.');
        return;
      }

      const results: {
        pageNumber: number;
        dataUrl: string;
        width: number;
        height: number;
      }[] = [];

      for (let i = 0; i < pageNumbers.length; i++) {
        const pNum = pageNumbers[i];
        setRenderProgress(`Rendering page ${pNum} (${i + 1}/${pageNumbers.length})...`);
        const canvas = await renderPDFPageToCanvas(doc, pNum, imgScale);
        const mime = imgFormat === 'png' ? 'image/png' : 'image/jpeg';
        const quality = imgQuality / 100;
        const dataUrl = canvas.toDataURL(mime, quality);

        results.push({
          pageNumber: pNum,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        });
      }

      setRenderedPages(results);
    } catch (err: any) {
      alert(`Error rendering pages: ${err.message || err}`);
    } finally {
      setIsRenderingPdf(false);
      setRenderProgress('');
    }
  };

  const handleDownloadSingleImage = (pageNumber: number, dataUrl: string) => {
    const ext = imgFormat === 'png' ? 'png' : 'jpg';
    const baseName = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, '') : 'document';
    const filename = `${baseName}_page_${pageNumber}.${ext}`;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (renderedPages.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const ext = imgFormat === 'png' ? 'png' : 'jpg';
      const baseName = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, '') : 'document';

      renderedPages.forEach((item) => {
        const base64Data = item.dataUrl.split(',')[1];
        zip.file(`${baseName}_page_${item.pageNumber}.${ext}`, base64Data, {
          base64: true,
        });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_images_extracted.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to create ZIP: ${err.message || err}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handlePdfUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {!pdfFile && (
        <div
          onClick={() => pdfInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handlePdfUpload(e.dataTransfer.files[0]);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-cyan-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF document here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Extract PDF pages into JPG or PNG images with ZIP bundling</p>
          </div>
        </div>
      )}

      {pdfFile && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{pdfFile.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(pdfFile.size)}</span>
                  <span>·</span>
                  <span className="text-cyan-400 font-semibold">{pdfTotalPages} total pages</span>
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

          {/* Extraction Settings Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg min-w-0">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 min-w-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 min-w-0">
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Extraction &amp; Resolution</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono shrink-0 ml-2">
                {imgFormat} · {imgScale}x DPI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect<'jpeg' | 'png'>
                label="Image Format"
                value={imgFormat}
                onChange={(val) => setImgFormat(val)}
                options={[
                  { value: 'png', label: 'PNG (Lossless Sharp)', subLabel: 'Highest visual crispness' },
                  { value: 'jpeg', label: 'JPG (Compressed)', subLabel: 'Compact file size' },
                ]}
              />

              <CustomSelect<number>
                label="Resolution DPI Scale"
                value={imgScale}
                onChange={(val) => setImgScale(val)}
                options={[
                  { value: 1.5, label: 'Standard (150 DPI)', subLabel: 'Fast extraction' },
                  { value: 2.0, label: 'High (200 DPI)', subLabel: 'Optimal sharpness' },
                  { value: 3.0, label: 'Ultra (300 DPI)', subLabel: 'Print quality definition' },
                ]}
              />
            </div>

            {/* Target Pages Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#D1D5DB]">Target Pages</label>
                <button
                  type="button"
                  onClick={() =>
                    renderPages(
                      pdfDocProxy,
                      pdfTotalPages,
                      pageRangeMode === 'custom' ? customRangeStr : ''
                    )
                  }
                  disabled={isRenderingPdf}
                  title="Re-render with current settings"
                  className="flex items-center gap-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 text-xs font-bold text-cyan-300 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isRenderingPdf ? 'animate-spin' : ''}`} />
                  <span>{isRenderingPdf ? 'Rendering...' : 'Re-render'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="grid grid-cols-2 bg-[#0B0F19] rounded-lg p-0.5 border border-[#1F2937] shrink-0 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPageRangeMode('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors text-center whitespace-nowrap ${
                      pageRangeMode === 'all'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    All Pages ({pdfTotalPages})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageRangeMode('custom')}
                    className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors text-center whitespace-nowrap ${
                      pageRangeMode === 'custom'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {pageRangeMode === 'custom' && (
                  <input
                    type="text"
                    value={customRangeStr}
                    onChange={(e) => setCustomRangeStr(e.target.value)}
                    placeholder={`e.g. 1-3, 5 (up to ${pdfTotalPages})`}
                    className="w-full flex-1 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 py-1.5 font-mono text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none min-w-0"
                  />
                )}
              </div>
            </div>

            {renderProgress && (
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-2 text-center text-xs font-mono text-cyan-300">
                {renderProgress}
              </div>
            )}

            {/* Download All ZIP Action */}
            {renderedPages.length > 0 && (
              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 py-2.5 px-3 font-bold text-xs text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-98"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Creating ZIP Archive...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Download All ({renderedPages.length}) Images as ZIP</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Rendered Previews Grid Card */}
          {renderedPages.length > 0 && (
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-3 shadow-lg min-w-0">
              <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937] min-w-0">
                <span className="font-semibold text-white truncate mr-2">Converted Previews ({renderedPages.length})</span>
                <span className="text-[10px] font-mono text-cyan-400 shrink-0">Click to enlarge</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {renderedPages.map((item) => (
                  <div
                    key={item.pageNumber}
                    className="group relative flex flex-col rounded-lg border border-[#1F2937] bg-[#0B0F19] overflow-hidden hover:border-cyan-500/50 transition-all min-w-0"
                  >
                    <div
                      onClick={() =>
                        setPreviewModalImg({ page: item.pageNumber, dataUrl: item.dataUrl })
                      }
                      className="relative aspect-3/4 w-full bg-[#111827] p-1.5 flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={item.dataUrl}
                        alt={`Page ${item.pageNumber}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute top-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white font-mono">
                        P. {item.pageNumber}
                      </div>
                    </div>

                    <div className="p-1.5 border-t border-[#1F2937] flex items-center justify-between gap-1 min-w-0">
                      <span className="text-[9px] font-mono text-[#9CA3AF] truncate" title={`${item.width}×${item.height}`}>
                        {item.width}×{item.height}
                      </span>
                      <button
                        onClick={() => handleDownloadSingleImage(item.pageNumber, item.dataUrl)}
                        className="flex items-center gap-1 rounded bg-cyan-600/20 hover:bg-cyan-600 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0"
                        title={`Download ${imgFormat.toUpperCase()}`}
                      >
                        <Download className="h-2.5 w-2.5" />
                        <span>{imgFormat.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#1F2937] bg-[#111827] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1F2937] px-3.5 py-2.5 bg-[#0B0F19] min-w-0">
              <span className="text-xs font-bold text-white truncate mr-2">
                Page {previewModalImg.page} High-Resolution Preview
              </span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="rounded-lg p-1 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto p-2 sm:p-4 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewModalImg.dataUrl}
                alt={`Page ${previewModalImg.page}`}
                className="max-h-[70vh] w-auto rounded-lg object-contain shadow-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#1F2937] px-3.5 py-2.5 bg-[#0B0F19]">
              <button
                onClick={() =>
                  handleDownloadSingleImage(previewModalImg.page, previewModalImg.dataUrl)
                }
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Page {previewModalImg.page}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
