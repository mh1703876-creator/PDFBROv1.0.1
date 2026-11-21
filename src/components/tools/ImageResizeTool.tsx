/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Scaling,
  Download,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  Archive,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';
import { resizeImage, ResizedImageResult } from '../../utils/imageTools';
import JSZip from 'jszip';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  origWidth?: number;
  origHeight?: number;
  result?: ResizedImageResult;
}

export function ImageResizeTool({ initialFiles }: { initialFiles?: File[] | null } = {}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<'px' | 'percentage'>('px');
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [percentage, setPercentage] = useState<number>(50);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
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

        const items: ImageItem[] = uniqueFiles.map((f) => {
          const item: ImageItem = {
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            previewUrl: URL.createObjectURL(f),
          };
          const img = new Image();
          img.onload = () => {
            setImages((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, origWidth: img.width, origHeight: img.height } : i
              )
            );
          };
          img.src = item.previewUrl;
          return item;
        });

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

    const newItems: ImageItem[] = valid.map((f) => {
      const item: ImageItem = {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
      };
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, origWidth: img.width, origHeight: img.height } : i
          )
        );
        if (images.length === 0) {
          setTargetWidth(img.width);
          setTargetHeight(img.height);
        }
      };
      img.src = item.previewUrl;
      return item;
    });

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      setSuccessMsg(null);
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (keepAspect && images[0]?.origWidth && images[0]?.origHeight) {
      const ratio = images[0].origHeight / images[0].origWidth;
      setTargetHeight(Math.max(1, Math.round(val * ratio)));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (keepAspect && images[0]?.origWidth && images[0]?.origHeight) {
      const ratio = images[0].origWidth / images[0].origHeight;
      setTargetWidth(Math.max(1, Math.round(val * ratio)));
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

  const handleResizeAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    try {
      const updated: ImageItem[] = [];
      for (const item of images) {
        let w = targetWidth;
        let h = targetHeight;

        if (mode === 'percentage') {
          const factor = percentage / 100;
          w = Math.max(1, Math.round((item.origWidth || 1000) * factor));
          h = Math.max(1, Math.round((item.origHeight || 1000) * factor));
        } else if (keepAspect && item.origWidth && item.origHeight) {
          const ratio = item.origHeight / item.origWidth;
          h = Math.max(1, Math.round(targetWidth * ratio));
        }

        const res = await resizeImage(item.file, w, h, format, 0.9);
        updated.push({ ...item, result: res });
      }
      setImages(updated);
      setSuccessMsg(`Resized ${images.length} ${images.length === 1 ? 'image' : 'images'}`);
    } catch (err: any) {
      alert(`Resize failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.result) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const base = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${base}_${item.result.newWidth}x${item.result.newHeight}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = async () => {
    const readyItems = images.filter((i) => i.result);
    if (readyItems.length === 0) return;

    const zip = new JSZip();
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

    readyItems.forEach((item) => {
      if (item.result) {
        const base = item.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_${item.result.newWidth}x${item.result.newHeight}.${ext}`, item.result.blob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resized_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resizedCount = images.filter((i) => i.result).length;
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
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-sky-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop images here or choose files</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Resize dimensions by pixels or scale percentage</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          {/* File Queue List */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1.5 border-b border-[#1F2937]">
              <span className="font-bold text-white">
                Image Queue ({images.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Add more files"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-colors cursor-pointer"
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
                  className="flex items-center gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-sky-500/30 transition-colors"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-10 w-10 rounded object-cover border border-[#1F2937] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                      <span>{formatSize(item.file.size)}</span>
                      {item.origWidth && item.origHeight && (
                        <span>· {item.origWidth}×{item.origHeight}px</span>
                      )}
                      {item.result && (
                        <>
                          <span>→</span>
                          <span className="text-sky-400 font-bold">
                            {item.result.newWidth}×{item.result.newHeight}px ({formatSize(item.result.newSize)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.result && (
                      <button
                        onClick={() => downloadSingle(item)}
                        title="Download"
                        className="flex h-7 w-7 items-center justify-center rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer"
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

          {/* Resize Settings Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
                <span>Dimension Controls</span>
              </span>
              <div className="flex items-center gap-1 bg-[#0B0F19] rounded-lg p-0.5 border border-[#1F2937]">
                <button
                  onClick={() => setMode('px')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    mode === 'px' ? 'bg-sky-500 text-white' : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  Pixels (px)
                </button>
                <button
                  onClick={() => setMode('percentage')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    mode === 'percentage' ? 'bg-sky-500 text-white' : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  Scale (%)
                </button>
              </div>
            </div>

            {mode === 'px' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-[#D1D5DB]">Width (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-mono font-semibold text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setKeepAspect(!keepAspect)}
                    title={keepAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                    className={`mt-5 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
                      keepAspect
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                        : 'border-[#1F2937] bg-[#0B0F19] text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {keepAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-[#D1D5DB]">Height (px)</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-mono font-semibold text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
                    { label: 'Square (1080×1080)', w: 1080, h: 1080 },
                    { label: 'HD (1280×720)', w: 1280, h: 720 },
                    { label: 'Thumbnail (600×400)', w: 600, h: 400 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setTargetWidth(preset.w);
                        setTargetHeight(preset.h);
                      }}
                      className="rounded bg-[#0B0F19] px-2 py-1 text-[10px] font-mono text-[#9CA3AF] hover:text-white border border-[#1F2937] cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#D1D5DB] font-medium">Scale Multiplier</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border border-sky-500/30 text-sky-400 bg-sky-500/10">
                    {percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[#9CA3AF]">
                  <span>10% (Micro)</span>
                  <span>50% (Half)</span>
                  <span>100% (Original)</span>
                  <span>200% (Double)</span>
                </div>
              </div>
            )}

            {/* Target Output Format */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-[#D1D5DB]">Output Format</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`rounded-lg py-1.5 text-xs font-semibold uppercase border transition-all cursor-pointer ${
                      format === fmt
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
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
                  onClick={handleResizeAll}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Resizing...</span>
                    </>
                  ) : (
                    <>
                      <Scaling className="h-3.5 w-3.5" />
                      <span>Resize All ({images.length})</span>
                    </>
                  )}
                </button>
              )}

              {images.length === 1 && singleImage?.result && (
                <button
                  onClick={() => downloadSingle(singleImage)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 font-bold text-xs text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    Download ({singleImage.result.newWidth}×{singleImage.result.newHeight}px · {formatSize(singleImage.result.newSize)})
                  </span>
                </button>
              )}

              {images.length === 1 && !singleImage?.result && (
                <button
                  onClick={handleResizeAll}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Resizing...</span>
                    </>
                  ) : (
                    <>
                      <Scaling className="h-3.5 w-3.5" />
                      <span>Resize Image</span>
                    </>
                  )}
                </button>
              )}

              {images.length > 1 && resizedCount > 0 && (
                <button
                  onClick={downloadAllZip}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] py-2.5 font-bold text-xs text-white border border-[#374151] transition-all cursor-pointer active:scale-98"
                >
                  <Archive className="h-3.5 w-3.5 text-sky-400" />
                  <span>Download ZIP ({resizedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
