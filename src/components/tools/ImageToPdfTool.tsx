/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileImage,
  Download,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { CustomSelect } from '../CustomSelect';

interface UploadedImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  width: number;
  height: number;
}

export function ImageToPdfTool({ initialFiles }: { initialFiles?: File[] | null } = {}) {
  const [imagesList, setImagesList] = useState<UploadedImageItem[]>([]);
  const [imgPageSize, setImgPageSize] = useState<'a4' | 'letter' | 'a3' | 'fit'>('a4');
  const [imgOrientation, setImgOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imgMargin, setImgMargin] = useState<'none' | 'small' | 'medium'>('none');
  const [imgFit, setImgFit] = useState<'contain' | 'cover'>('contain');
  const [imgPdfFilename, setImgPdfFilename] = useState<string>('converted_images');
  const [isGeneratingImgPdf, setIsGeneratingImgPdf] = useState<boolean>(false);
  const [imgProgress, setImgProgress] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const imgFileInputRef = useRef<HTMLInputElement>(null);
  const initialProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      const valid = initialFiles.filter((f) => f.type.startsWith('image/'));
      if (valid.length > 0) {
        // Direct set with no duplicates
        const uniqueFiles: File[] = [];
        const seen = new Set<string>();
        for (const f of valid) {
          const key = `${f.name}-${f.size}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFiles.push(f);
          }
        }

        const items: UploadedImageItem[] = uniqueFiles.map((file) => {
          const id = Math.random().toString(36).substring(2, 9);
          const previewUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            setImagesList((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, width: img.width, height: img.height } : item
              )
            );
          };
          img.src = previewUrl;
          return {
            id,
            file,
            name: file.name,
            size: file.size,
            previewUrl,
            width: 0,
            height: 0,
          };
        });

        setImagesList(items);
        setSuccess(false);
      }
    }
  }, [initialFiles]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleImageFilesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (incoming.length === 0) return;

    setImagesList((prev) => {
      const existingKeys = new Set(prev.map((i) => `${i.name}-${i.size}`));
      const newItems: UploadedImageItem[] = [];

      incoming.forEach((file) => {
        const key = `${file.name}-${file.size}`;
        if (existingKeys.has(key)) return;
        existingKeys.add(key);

        const id = Math.random().toString(36).substring(2, 9);
        const previewUrl = URL.createObjectURL(file);

        const img = new Image();
        img.onload = () => {
          setImagesList((curr) =>
            curr.map((item) =>
              item.id === id ? { ...item, width: img.width, height: img.height } : item
            )
          );
        };
        img.src = previewUrl;

        newItems.push({
          id,
          file,
          name: file.name,
          size: file.size,
          previewUrl,
          width: 0,
          height: 0,
        });
      });

      return [...prev, ...newItems];
    });
    setSuccess(false);
  };

  const removeImageItem = (id: string) => {
    setImagesList((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setSuccess(false);
  };

  const clearAll = () => {
    imagesList.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImagesList([]);
    setSuccess(false);
  };

  const moveImageItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imagesList.length) return;

    setImagesList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleGenerateImagePdf = async () => {
    if (imagesList.length === 0) return;
    setIsGeneratingImgPdf(true);
    setImgProgress('Initializing PDF generation...');
    setSuccess(false);

    try {
      const pageSizeDimensions: { [key: string]: [number, number] } = {
        a4: [210, 297],
        letter: [215.9, 279.4],
        a3: [297, 420],
      };

      const marginValues = { none: 0, small: 8, medium: 16 };
      const selectedMargin = marginValues[imgMargin];

      let pdfDoc: jsPDF | null = null;

      for (let i = 0; i < imagesList.length; i++) {
        setImgProgress(`Processing image ${i + 1} of ${imagesList.length}...`);
        const item = imagesList[i];

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });

        const imgWidth = item.width || 1000;
        const imgHeight = item.height || 1000;
        const isLandscape = imgWidth > imgHeight;

        let pageW = 210;
        let pageH = 297;
        let orient: 'p' | 'l' = 'p';

        if (imgPageSize === 'fit') {
          const pxToMm = 0.264583;
          pageW = imgWidth * pxToMm;
          pageH = imgHeight * pxToMm;
          orient = pageW > pageH ? 'l' : 'p';
        } else {
          const dims = pageSizeDimensions[imgPageSize];
          if (imgOrientation === 'auto') {
            orient = isLandscape ? 'l' : 'p';
            pageW = isLandscape ? dims[1] : dims[0];
            pageH = isLandscape ? dims[0] : dims[1];
          } else if (imgOrientation === 'landscape') {
            orient = 'l';
            pageW = dims[1];
            pageH = dims[0];
          } else {
            orient = 'p';
            pageW = dims[0];
            pageH = dims[1];
          }
        }

        if (i === 0) {
          pdfDoc = new jsPDF({
            orientation: orient,
            unit: 'mm',
            format: imgPageSize === 'fit' ? [pageW, pageH] : [pageW, pageH],
          });
        } else if (pdfDoc) {
          pdfDoc.addPage([pageW, pageH], orient);
        }

        if (!pdfDoc) continue;

        const usableW = pageW - selectedMargin * 2;
        const usableH = pageH - selectedMargin * 2;

        let drawW = usableW;
        let drawH = usableH;
        let drawX = selectedMargin;
        let drawY = selectedMargin;

        const imgRatio = imgWidth / imgHeight;
        const pageRatio = usableW / usableH;

        if (imgFit === 'contain') {
          if (imgRatio > pageRatio) {
            drawW = usableW;
            drawH = usableW / imgRatio;
            drawY = selectedMargin + (usableH - drawH) / 2;
          } else {
            drawH = usableH;
            drawW = usableH * imgRatio;
            drawX = selectedMargin + (usableW - drawW) / 2;
          }
        }

        const formatType = item.file.type.includes('png') ? 'PNG' : 'JPEG';
        pdfDoc.addImage(base64Data, formatType, drawX, drawY, drawW, drawH, undefined, 'FAST');
      }

      if (pdfDoc) {
        setImgProgress('Finalizing PDF download...');
        const cleanName = imgPdfFilename.trim() || 'converted_images';
        const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
        pdfDoc.save(finalName);
        setSuccess(true);
      }
    } catch (err: any) {
      alert(`Error generating PDF: ${err.message || err}`);
    } finally {
      setIsGeneratingImgPdf(false);
      setImgProgress('');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={imgFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleImageFilesUpload(e.target.files)}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {imagesList.length === 0 && (
        <div
          onClick={() => imgFileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImageFilesUpload(e.dataTransfer.files);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-purple-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop images here or choose files</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">JPG, PNG, WebP, GIF, BMP into a single PDF</p>
          </div>
        </div>
      )}

      {imagesList.length > 0 && (
        <div className="space-y-4">
          {/* File Queue List */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1.5 border-b border-[#1F2937]">
              <span className="font-bold text-white">
                Images to Convert ({imagesList.length} pages)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => imgFileInputRef.current?.click()}
                  title="Add more images"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors cursor-pointer"
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
              {imagesList.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-500/10 text-xs font-mono font-bold text-purple-400">
                      {index + 1}
                    </span>
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-10 w-10 rounded object-cover border border-[#1F2937] shrink-0"
                    />
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                        {formatSize(item.size)}
                        {item.width > 0 && ` · ${item.width}×${item.height}px`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveImageItem(index, 'up')}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#374151] disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveImageItem(index, 'down')}
                      disabled={index === imagesList.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded bg-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#374151] disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeImageItem(item.id)}
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

          {/* Settings & Action Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
                <span>PDF Page Layout Settings</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {imgPageSize} · {imgOrientation}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect<'a4' | 'letter' | 'a3' | 'fit'>
                label="Page Format"
                value={imgPageSize}
                onChange={(val) => setImgPageSize(val)}
                options={[
                  { value: 'a4', label: 'A4 (210 × 297 mm)', subLabel: 'Standard International' },
                  { value: 'letter', label: 'Letter (8.5 × 11 in)', subLabel: 'Standard US' },
                  { value: 'a3', label: 'A3 (297 × 420 mm)', subLabel: 'Large Sheet' },
                  { value: 'fit', label: 'Fit to Image Dimensions', subLabel: 'Match original aspect' },
                ]}
              />

              <CustomSelect<'auto' | 'portrait' | 'landscape'>
                label="Orientation"
                value={imgOrientation}
                onChange={(val) => setImgOrientation(val)}
                options={[
                  { value: 'auto', label: 'Auto Detect per Image', subLabel: 'Best fit orientation' },
                  { value: 'portrait', label: 'Portrait Only', subLabel: 'Vertical layout' },
                  { value: 'landscape', label: 'Landscape Only', subLabel: 'Horizontal layout' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect<'none' | 'small' | 'medium'>
                label="Page Margins"
                value={imgMargin}
                onChange={(val) => setImgMargin(val)}
                options={[
                  { value: 'none', label: 'No Margin (Edge-to-Edge)', subLabel: 'Full bleed' },
                  { value: 'small', label: 'Small Margin (8 mm)', subLabel: 'Clean border' },
                  { value: 'medium', label: 'Medium Margin (16 mm)', subLabel: 'Spacious frame' },
                ]}
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#D1D5DB]">
                  Output Filename (.pdf)
                </label>
                <input
                  type="text"
                  value={imgPdfFilename}
                  onChange={(e) => setImgPdfFilename(e.target.value)}
                  placeholder="converted_images"
                  className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {imgProgress && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-2.5 text-center text-xs font-mono text-purple-300">
                {imgProgress}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>PDF generated and downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleGenerateImagePdf}
              disabled={isGeneratingImgPdf || imagesList.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isGeneratingImgPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Generate &amp; Download PDF ({imagesList.length} Pages)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
