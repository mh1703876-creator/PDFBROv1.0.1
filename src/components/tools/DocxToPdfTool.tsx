/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  parseDocxFile,
  generateDocxPDF,
  buildDocxPDF,
  DocxConvertedContent,
} from '../../utils/docConverters';
import { CustomSelect } from '../CustomSelect';

export function DocxToPdfTool() {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [docxData, setDocxData] = useState<DocxConvertedContent | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState<boolean>(false);
  const [docxPageSize, setDocxPageSize] = useState<'a4' | 'letter'>('a4');
  const [docxFontSize, setDocxFontSize] = useState<number>(11);
  const [docxFilename, setDocxFilename] = useState<string>('document_converted');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const docxInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDocxUpload = async (file: File) => {
    if (!file) return;
    setIsParsingDocx(true);
    setDocxFile(file);
    setDocxFilename(`${file.name.replace(/\.[^/.]+$/, '')}_converted`);
    setSuccess(false);

    try {
      const parsed = await parseDocxFile(file);
      setDocxData(parsed);
    } catch (err: any) {
      alert(`Failed to parse Word document: ${err.message}`);
    } finally {
      setIsParsingDocx(false);
    }
  };

  const clearFile = () => {
    setDocxFile(null);
    setDocxData(null);
    setSuccess(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleExportDocxPDF = () => {
    if (!docxData) return;
    const cleanName = docxFilename.trim() || 'document_converted';
    const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    generateDocxPDF(docxData, {
      pageSize: docxPageSize,
      fontSize: docxFontSize,
      lineSpacing: 1.4,
      margin: 15,
      filename: finalName,
    });
    setSuccess(true);
  };

  const handlePreviewDocxPDF = () => {
    if (!docxData) return;
    const cleanName = docxFilename.trim() || 'document_converted';
    const finalName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
    const doc = buildDocxPDF(docxData, {
      pageSize: docxPageSize,
      fontSize: docxFontSize,
      lineSpacing: 1.4,
      margin: 15,
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
        ref={docxInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        onChange={(e) => {
          if (e.target.files?.[0]) handleDocxUpload(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Initial Drop Area */}
      {!docxFile && (
        <div
          onClick={() => docxInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleDocxUpload(e.dataTransfer.files[0]);
          }}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-blue-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop Word document (.docx) here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Converts formatted Word document into crisp PDF pages</p>
          </div>
        </div>
      )}

      {isParsingDocx && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span>Parsing Word document paragraphs and formatting...</span>
        </div>
      )}

      {docxData && !isParsingDocx && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{docxFile?.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{docxFile ? formatSize(docxFile.size) : ''}</span>
                  <span>·</span>
                  <span className="text-blue-400 font-semibold">{docxData.paragraphs.length} paragraphs parsed</span>
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

          {/* Document Preview Snippet Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] pb-1 border-b border-[#1F2937]">
              <span className="font-semibold text-white">Extracted Content Preview</span>
              <span className="text-[10px] font-mono text-[#9CA3AF]">
                First {Math.min(5, docxData.paragraphs.length)} paragraphs
              </span>
            </div>

            <div className="max-h-[180px] overflow-y-auto space-y-2 rounded-lg bg-[#0B0F19] p-3 text-xs text-[#D1D5DB] leading-relaxed font-serif">
              {docxData.paragraphs.slice(0, 6).map((para, idx) => (
                <p key={idx} className={para.length < 50 ? 'font-sans font-bold text-white text-[13px]' : ''}>
                  {para}
                </p>
              ))}
              {docxData.paragraphs.length > 6 && (
                <p className="text-[11px] font-sans text-[#6B7280] italic">
                  + {docxData.paragraphs.length - 6} more paragraphs...
                </p>
              )}
            </div>
          </div>

          {/* Settings & Actions Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                <span>Word to PDF Typography &amp; Page</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase font-mono">
                {docxPageSize} · {docxFontSize}pt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect<'a4' | 'letter'>
                label="Page Format"
                value={docxPageSize}
                onChange={(val) => setDocxPageSize(val)}
                options={[
                  { value: 'a4', label: 'A4 (210 × 297 mm)', subLabel: 'Standard International' },
                  { value: 'letter', label: 'Letter (8.5 × 11 in)', subLabel: 'Standard US' },
                ]}
              />

              <CustomSelect<number>
                label="Base Font Size"
                value={docxFontSize}
                onChange={(val) => setDocxFontSize(val)}
                options={[
                  { value: 9, label: 'Small (9 pt)', subLabel: 'Compact density' },
                  { value: 11, label: 'Standard (11 pt)', subLabel: 'Optimal readability' },
                  { value: 13, label: 'Large (13 pt)', subLabel: 'Spacious text' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#D1D5DB]">
                Output Filename (.pdf)
              </label>
              <input
                type="text"
                value={docxFilename}
                onChange={(e) => setDocxFilename(e.target.value)}
                placeholder="document_converted"
                className="w-full rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Word document converted and exported to PDF!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePreviewDocxPDF}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] border border-[#374151] py-2.5 font-bold text-xs text-white transition-all active:scale-98 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-blue-400" />
                <span>View Live Preview</span>
              </button>

              <button
                onClick={handleExportDocxPDF}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 font-bold text-xs text-white shadow-md shadow-blue-600/20 transition-all active:scale-98 cursor-pointer"
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
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Live PDF Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDocxPDF}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
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
