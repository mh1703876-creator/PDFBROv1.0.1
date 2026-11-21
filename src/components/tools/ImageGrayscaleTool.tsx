/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Download,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Archive,
  UploadCloud,
  Eye,
} from 'lucide-react';
import { convertImageToGrayscale, GrayscaleImageResult } from '../../utils/imageTools';
import JSZip from 'jszip';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  result?: GrayscaleImageResult;
}

export function ImageGrayscaleTool({ initialFiles }: { initialFiles?: File[] | null } = {}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<'grayscale' | 'bw' | 'sepia'>('grayscale');
  const [contrast, setContrast] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(128);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      const valid = initialFiles.filter((f) => f.type.startsWith('image/'));
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

        const items: ImageItem[] = uniqueFiles.map((f) => ({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          previewUrl: URL.createObjectURL(f),
        }));

        setImages(items);
        setSuccessMsg(null);
      }
    }
  }, [initialFiles]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = Array.from(fileList).filter((f) => f.type.startsWith('image/'));

    if (valid.length === 0 && fileList.length > 0) {
      alert('Please upload valid image files (JPG, PNG, WebP).');
      return;
    }

    const newItems: ImageItem[] = valid.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      setSuccessMsg(null);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setSuccessMsg(null);
  };

  const handleConvertAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    try {
      const updated: ImageItem[] = [];
      for (const item of images) {
        const res = await convertImageToGrayscale(
          item.file,
          mode,
          contrast,
          brightness,
          threshold,
          format
        );
        updated.push({ ...item, result: res });
      }
      setImages(updated);
      setSuccessMsg(`Converted ${images.length} ${images.length === 1 ? 'image' : 'images'} to ${mode}!`);
    } catch (err: any) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.result) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'image/jpeg' ? '.jpg' : '.png';
    const base = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${base}_${mode}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = async () => {
    const readyItems = images.filter((i) => i.result);
    if (readyItems.length === 0) return;

    const zip = new JSZip();
    const ext = format === 'image/jpeg' ? '.jpg' : '.png';

    readyItems.forEach((item) => {
      if (item.result) {
        const base = item.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_${mode}${ext}`, item.result.blob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grayscale_${mode}_images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertedCount = images.filter((i) => i.result).length;
  const singleImage = images.length === 1 ? images[0] : null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleAddFiles(e.target.files)}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {images.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAddFiles(e.dataTransfer.files);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-slate-400/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-300 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop images here or choose files</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Convert photos to smooth grayscale, monochrome, or sepia</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          {/* File Queue List */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1.5 border-b border-[#1F2937]">
              <span className="font-bold text-white">
                Queue ({images.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Add more files"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-slate-300 hover:bg-slate-500/20 hover:text-white transition-colors cursor-pointer"
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

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {images.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-slate-500/30 transition-colors"
                >
                  <img
                    src={item.result ? item.result.dataUrl : item.previewUrl}
                    alt={item.file.name}
                    className="h-10 w-10 rounded object-cover border border-[#1F2937] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                      <span>{formatSize(item.file.size)}</span>
                      {item.result ? (
                        <>
                          <span>→</span>
                          <span className="text-slate-200 font-semibold capitalize">
                            {mode} ({formatSize(item.result.size)})
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-400/80">Pending filter</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.result && (
                      <button
                        onClick={() => downloadSingle(item)}
                        title="Download"
                        className="flex h-7 w-7 items-center justify-center rounded bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(item.id)}
                      title="Remove"
                      className="flex h-7 w-7 items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Settings Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-300" />
                <span>Filter Tone Settings</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {mode}
              </span>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#D1D5DB]">Tonal Filter Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'grayscale', label: 'Grayscale', sub: 'Tonal shades' },
                  { id: 'bw', label: 'B&W Binary', sub: 'Pure threshold' },
                  { id: 'sepia', label: 'Sepia', sub: 'Vintage warmth' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`rounded-lg p-2 text-left border transition-all cursor-pointer ${
                      mode === item.id
                        ? 'bg-slate-700/60 border-slate-400 text-white shadow-sm'
                        : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[9px] text-[#9CA3AF]">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-2 pt-1">
              {mode === 'bw' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#D1D5DB]">
                    <span>B&amp;W Threshold</span>
                    <span className="font-mono text-slate-300 font-bold">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    className="w-full accent-slate-300 cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Contrast Multiplier</span>
                  <span className="font-mono text-slate-300 font-bold">{contrast.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full accent-slate-300 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Brightness Offset</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {brightness > 0 ? `+${brightness}` : brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-slate-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Output Format */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-[#D1D5DB]">Output Format</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['image/png', 'image/jpeg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`rounded-lg py-1.5 text-xs font-semibold uppercase border transition-all cursor-pointer ${
                      format === fmt
                        ? 'bg-slate-700/60 border-slate-400 text-white'
                        : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {fmt.replace('image/', '')}
                  </button>
                ))}
              </div>
            </div>

            {successMsg && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {images.length > 1 && (
                <button
                  onClick={handleConvertAll}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md transition-all cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Convert All ({images.length})</span>
                    </>
                  )}
                </button>
              )}

              {images.length === 1 && singleImage?.result && (
                <button
                  onClick={() => downloadSingle(singleImage)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 py-2.5 font-bold text-xs text-white shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    Download ({mode.toUpperCase()} · {formatSize(singleImage.result.size)})
                  </span>
                </button>
              )}

              {images.length === 1 && !singleImage?.result && (
                <button
                  onClick={handleConvertAll}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md transition-all cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying Filter...</span>
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Convert Image</span>
                    </>
                  )}
                </button>
              )}

              {images.length > 1 && convertedCount > 0 && (
                <button
                  onClick={downloadAllZip}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] py-2.5 font-bold text-xs text-white border border-[#374151] transition-all cursor-pointer active:scale-98"
                >
                  <Archive className="h-3.5 w-3.5 text-slate-300" />
                  <span>Download ZIP ({convertedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
