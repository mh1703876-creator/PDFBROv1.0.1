/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Stamp,
  Download,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { addWatermarkToPDF, WatermarkOptions } from '../../utils/pdfTools';

export function AddWatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotation, setRotation] = useState<number>(45);
  const [colorHex, setColorHex] = useState<string>('#dc2626');
  const [position, setPosition] = useState<'center' | 'top' | 'bottom' | 'tile'>('center');
  const [pagesOption, setPagesOption] = useState<'all' | 'first' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1-5');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const hexToRgb01 = (hex: string) => {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) / 255 || 0.8;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255 || 0.1;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255 || 0.1;
    return { r, g, b };
  };

  const handleFileUpload = (uploadedFile: File) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setSuccess(false);
  };

  const clearFile = () => {
    setFile(null);
    setSuccess(false);
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    setIsProcessing(true);
    setSuccess(false);
    try {
      const options: WatermarkOptions = {
        text,
        fontSize,
        opacity,
        rotation,
        color: hexToRgb01(colorHex),
        position,
        pages: pagesOption,
        customPageRange: customRange,
      };

      const watermarkedBytes = await addWatermarkToPDF(file, options);
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_watermarked.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      alert(`Watermark failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const presetTexts = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'INTERNAL ONLY', 'COPY'];
  const presetColors = [
    { label: 'Red', hex: '#dc2626' },
    { label: 'Slate', hex: '#64748b' },
    { label: 'Blue', hex: '#2563eb' },
    { label: 'Amber', hex: '#d97706' },
    { label: 'Black', hex: '#000000' },
  ];

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
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-cyan-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF file here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Stamp custom text watermarks with opacity and angle controls</p>
          </div>
        </div>
      )}

      {file && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span className="text-cyan-400 font-semibold">Watermark Ready</span>
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

          {/* Watermark Configuration Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Watermark Text &amp; Style</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {position.toUpperCase()} · {rotation}°
              </span>
            </div>

            {/* Text Input & Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#D1D5DB]">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text..."
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {presetTexts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setText(preset)}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer ${
                      text === preset
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#0B0F19] text-[#9CA3AF] hover:text-white border border-[#1F2937]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Position and Color Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#D1D5DB]">
                  Layout Position
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['center', 'top', 'bottom', 'tile'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => {
                        setPosition(pos);
                        if (pos === 'center' || pos === 'tile') setRotation(45);
                        else setRotation(0);
                      }}
                      className={`rounded-lg py-1.5 text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        position === pos
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {pos === 'center' ? 'Center 45°' : pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#D1D5DB]">
                  Stamp Color
                </label>
                <div className="flex items-center gap-1.5">
                  {presetColors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColorHex(c.hex)}
                      className={`h-7 flex-1 rounded-lg border transition-all cursor-pointer ${
                        colorHex === c.hex ? 'border-white scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="h-7 w-8 rounded cursor-pointer bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>
            </div>

            {/* Opacity & Font Size Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Opacity</span>
                  <span className="font-mono text-cyan-400 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D1D5DB]">
                  <span>Font Size</span>
                  <span className="font-mono text-cyan-400 font-bold">{fontSize} pt</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="90"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Target Pages Option */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-[#D1D5DB]">
                Apply To Pages
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['all', 'first', 'custom'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPagesOption(opt)}
                    className={`rounded-lg py-1.5 text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      pagesOption === opt
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {opt === 'all' ? 'All Pages' : opt === 'first' ? 'First Page' : 'Custom Range'}
                  </button>
                ))}
              </div>
              {pagesOption === 'custom' && (
                <input
                  type="text"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 py-1.5 font-mono text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none mt-1.5"
                />
              )}
            </div>

            {/* Live Watermark Preview Pill */}
            <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937] p-3 flex items-center justify-center overflow-hidden">
              <span
                style={{
                  color: colorHex,
                  opacity: Math.max(0.4, opacity),
                  fontSize: `${Math.min(24, Math.max(12, fontSize / 2.5))}px`,
                  fontWeight: 700,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="font-sans tracking-widest select-none uppercase"
              >
                {text || 'WATERMARK'}
              </span>
            </div>

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Watermarked PDF generated and downloaded!</span>
              </div>
            )}

            <button
              onClick={handleApplyWatermark}
              disabled={isProcessing || !text.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Stamping Watermarks...</span>
                </>
              ) : (
                <>
                  <Stamp className="h-3.5 w-3.5" />
                  <span>Apply Watermark &amp; Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
