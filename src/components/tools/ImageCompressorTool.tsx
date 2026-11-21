/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Minimize2,
  Download,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Archive,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';
import { compressImage, CompressedImageResult, detectImageFormat } from '../../utils/imageTools';
import JSZip from 'jszip';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  detectedFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  detectedExt: 'jpg' | 'png' | 'webp';
  result?: CompressedImageResult;
}

export function ImageCompressorTool({ initialFiles }: { initialFiles?: File[] | null } = {}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState<number>(0.75); // 0.1 to 0.95
  const [scale, setScale] = useState<number>(1.0); // 0.2 to 1.0
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      const validFiles = initialFiles.filter(isSupportedImage);
      if (validFiles.length > 0) {
        const uniqueFiles: File[] = [];
        const seen = new Set<string>();
        for (const f of validFiles) {
          const key = `${f.name}-${f.size}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFiles.push(f);
          }
        }

        const items: ImageItem[] = uniqueFiles.map((f) => {
          const { format, extension } = detectImageFormat(f);
          return {
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            previewUrl: URL.createObjectURL(f),
            detectedFormat: format,
            detectedExt: extension,
          };
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

  const isSupportedImage = (file: File) => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    return (
      type === 'image/jpeg' ||
      type === 'image/jpg' ||
      type === 'image/png' ||
      type === 'image/webp' ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      name.endsWith('.webp')
    );
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const validFiles = Array.from(fileList).filter(isSupportedImage);

    if (validFiles.length === 0 && fileList.length > 0) {
      alert('Supported formats: JPG, PNG, or WebP.');
      return;
    }

    const newItems: ImageItem[] = validFiles.map((f) => {
      const { format, extension } = detectImageFormat(f);
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
        detectedFormat: format,
        detectedExt: extension,
      };
    });

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

  const compressItem = useCallback(
    async (item: ImageItem, q: number, s: number): Promise<CompressedImageResult> => {
      return await compressImage(item.file, q, item.detectedFormat, s);
    },
    []
  );

  // Auto-update single image compression on quality or scale change
  useEffect(() => {
    if (images.length === 1) {
      let isCancelled = false;
      const targetItem = images[0];

      const timer = setTimeout(async () => {
        try {
          const res = await compressItem(targetItem, quality, scale);
          if (!isCancelled) {
            setImages((prev) => {
              if (prev.length === 1 && prev[0].id === targetItem.id) {
                return [{ ...prev[0], result: res }];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('Compression error:', err);
        }
      }, 120);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [images.length, images[0]?.id, quality, scale, compressItem]);

  const handleCompressAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);
    try {
      const updated: ImageItem[] = [];
      for (const item of images) {
        const res = await compressItem(item, quality, scale);
        updated.push({ ...item, result: res });
      }
      setImages(updated);
      setSuccessMsg(`Compressed ${images.length} ${images.length === 1 ? 'image' : 'images'}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (item: ImageItem) => {
    if (!item.result) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement('a');
    a.href = url;
    const base = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${base}_compressed.${item.result.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = async () => {
    const readyItems = images.filter((i) => i.result);
    if (readyItems.length === 0) return;

    const zip = new JSZip();
    readyItems.forEach((item) => {
      if (item.result) {
        const base = item.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_compressed.${item.result.extension}`, item.result.blob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Dynamic Color Indicator for Quality (Red -> Yellow -> Green)
  const qualityPct = Math.round(quality * 100);
  const qualityColorClass = useMemo(() => {
    if (qualityPct < 40) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (qualityPct < 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  }, [qualityPct]);

  // Dynamic Color Indicator for Scale (Red -> Yellow -> Green)
  const scalePct = Math.round(scale * 100);
  const scaleColorClass = useMemo(() => {
    if (scalePct < 50) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (scalePct < 85) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  }, [scalePct]);

  const totalOrigSize = images.reduce((acc, i) => acc + i.file.size, 0);
  const totalCompSize = images.reduce(
    (acc, i) => acc + (i.result ? i.result.compressedSize : i.file.size),
    0
  );
  const totalSaved =
    totalOrigSize > 0 && totalCompSize < totalOrigSize
      ? Math.round(((totalOrigSize - totalCompSize) / totalOrigSize) * 100)
      : 0;

  const compressedCount = images.filter((i) => i.result).length;
  const singleImage = images.length === 1 ? images[0] : null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleAddFiles(e.target.files)}
        className="hidden"
      />

      {/* Initial Drop Area (only shown when empty) */}
      {images.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAddFiles(e.dataTransfer.files);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-emerald-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop images here or choose files</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">JPG, PNG, WebP</p>
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
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono">
                  Total: <strong className="text-white">{formatSize(totalOrigSize)}</strong>
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Add more files"
                    className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer"
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
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {images.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-emerald-500/30 transition-colors"
                >
                  <img
                    src={item.result ? item.result.dataUrl : item.previewUrl}
                    alt={item.file.name}
                    className="h-10 w-10 rounded object-cover border border-[#1F2937] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                      <span className="rounded bg-blue-500/10 px-1 py-0.2 text-[8px] font-bold text-blue-400 uppercase shrink-0">
                        {item.detectedExt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                      <span>{formatSize(item.file.size)}</span>
                      {item.result ? (
                        <>
                          <span>→</span>
                          <span className="text-emerald-400 font-bold">
                            {formatSize(item.result.compressedSize)} (-{item.result.savingsPercent}%)
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-400/80">Ready to compress</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.result && (
                      <button
                        onClick={() => downloadSingle(item)}
                        title="Download"
                        className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
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

          {/* Settings & Actions Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Compression Settings</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {singleImage ? singleImage.detectedExt : 'Original format'}
              </span>
            </div>

            {/* Quality Slider with Dynamic Red-Yellow-Green Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#D1D5DB] font-medium">Quality</span>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${qualityColorClass}`}>
                  {qualityPct}%
                </span>
              </div>

              {/* Dynamic Gradient Range Track (Red -> Yellow -> Green) */}
              <div className="relative py-1">
                <input
                  type="range"
                  min={10}
                  max={95}
                  step={1}
                  value={qualityPct}
                  onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 accent-white shadow-inner"
                />
              </div>
              <div className="flex justify-between text-[9px] text-[#9CA3AF]">
                <span className="text-red-400">Smaller Size</span>
                <span className="text-amber-400">Balanced</span>
                <span className="text-emerald-400">High Quality</span>
              </div>
            </div>

            {/* Resolution Scale Slider with Dynamic Red-Yellow-Green Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#D1D5DB] font-medium">Resolution Scale</span>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${scaleColorClass}`}>
                  {scalePct}%
                </span>
              </div>

              {/* Dynamic Gradient Range Track */}
              <div className="relative py-1">
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={scalePct}
                  onChange={(e) => setScale(parseInt(e.target.value) / 100)}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 accent-white shadow-inner"
                />
              </div>
              <div className="flex justify-between text-[9px] text-[#9CA3AF]">
                <span className="text-red-400">20% Downscale</span>
                <span className="text-emerald-400">100% Original</span>
              </div>
            </div>

            {/* Size Summary */}
            {images.some((i) => i.result) && (
              <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937] p-2.5 text-[11px] space-y-1">
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Original:</span>
                  <span className="font-mono text-white">{formatSize(totalOrigSize)}</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Compressed:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatSize(totalCompSize)}</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF] border-t border-[#1F2937] pt-1">
                  <span>Savings:</span>
                  <span className="font-mono text-emerald-400 font-bold">-{totalSaved}%</span>
                </div>
              </div>
            )}

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
                  onClick={handleCompressAll}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Compressing...</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Compress All ({images.length})</span>
                    </>
                  )}
                </button>
              )}

              {/* Single Image Direct Download */}
              {images.length === 1 && singleImage?.result && (
                <button
                  onClick={() => downloadSingle(singleImage)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    Download ({singleImage.result.extension.toUpperCase()} • {formatSize(singleImage.result.compressedSize)})
                  </span>
                </button>
              )}

              {/* Multiple Images Download ZIP */}
              {images.length > 1 && compressedCount > 0 && (
                <button
                  onClick={downloadAllZip}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] py-2.5 font-bold text-xs text-white border border-[#374151] transition-all cursor-pointer active:scale-98"
                >
                  <Archive className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download ZIP ({compressedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
