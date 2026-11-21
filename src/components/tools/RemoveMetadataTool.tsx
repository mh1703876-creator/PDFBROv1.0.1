/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Loader2,
  CheckCircle2,
  FileText,
  UploadCloud,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { readPDFMetadata, removePDFMetadata, PDFMetadataInfo } from '../../utils/pdfTools';

export function RemoveMetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [metaInfo, setMetaInfo] = useState<PDFMetadataInfo | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsReading(true);
    setFile(uploadedFile);
    setSuccess(false);

    try {
      const meta = await readPDFMetadata(uploadedFile);
      setMetaInfo(meta);
    } catch (err: any) {
      alert(`Failed to inspect metadata: ${err.message}`);
    } finally {
      setIsReading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setMetaInfo(null);
    setSuccess(false);
  };

  const handleClean = async () => {
    if (!file) return;
    setIsCleaning(true);
    try {
      const { bytes } = await removePDFMetadata(file);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_cleaned_no_metadata.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      alert(`Failed to remove metadata: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const metadataFields = metaInfo
    ? [
        { label: 'Title', value: metaInfo.title },
        { label: 'Author', value: metaInfo.author },
        { label: 'Subject', value: metaInfo.subject },
        { label: 'Keywords', value: metaInfo.keywords },
        { label: 'Creator App', value: metaInfo.creator },
        { label: 'PDF Producer', value: metaInfo.producer },
        {
          label: 'Creation Date',
          value: metaInfo.creationDate ? new Date(metaInfo.creationDate).toLocaleString() : null,
        },
        {
          label: 'Modification Date',
          value: metaInfo.modificationDate
            ? new Date(metaInfo.modificationDate).toLocaleString()
            : null,
        },
      ]
    : [];

  const foundCount = metadataFields.filter((f) => f.value).length;

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
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#374151] hover:border-emerald-500/80 bg-[#111827]/80 hover:bg-[#111827] p-8 transition-all cursor-pointer shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">Drop PDF file here or choose file</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Inspect and strip author, dates, and software metadata</p>
          </div>
        </div>
      )}

      {isReading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-xs text-white">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Analyzing PDF document metadata headers...</span>
        </div>
      )}

      {file && metaInfo && !isReading && (
        <div className="space-y-4">
          {/* Active File Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                  <span>{formatSize(file.size)}</span>
                  <span>·</span>
                  <span className={foundCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {foundCount} metadata item{foundCount === 1 ? '' : 's'} identified
                  </span>
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

          {/* Inspected Metadata Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                <span>Document Metadata Breakdown</span>
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {foundCount > 0 ? 'Hidden data present' : 'Clean document'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metadataFields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[#1F2937] bg-[#0B0F19] p-2 text-xs"
                >
                  <span className="text-[#9CA3AF] font-medium text-[11px]">{field.label}:</span>
                  {field.value ? (
                    <span className="font-mono text-white text-[11px] truncate max-w-[160px] text-right font-medium" title={field.value}>
                      {field.value}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6B7280] italic">Not set</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clean Action Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Sanitization Options</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Privacy</span>
            </div>

            <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937] p-3 text-[11px] text-[#9CA3AF] space-y-1">
              <p className="text-white font-medium">What will be removed:</p>
              <p>• Creator, Author, Title, Subject, Keywords tags</p>
              <p>• Operating system &amp; software application footprints</p>
              <p>• Creation and modification timestamp records</p>
            </div>

            {success && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Sanitized PDF with all metadata stripped downloaded successfully!</span>
              </div>
            )}

            <button
              onClick={handleClean}
              disabled={isCleaning}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2.5 font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
            >
              {isCleaning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sanitizing Metadata...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Strip Metadata &amp; Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
