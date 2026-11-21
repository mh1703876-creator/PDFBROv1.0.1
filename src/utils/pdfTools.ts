import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { encryptPdfBytes } from './pdfEncryption';
import JSZip from 'jszip';

// Configure pdfjs worker if not already configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * 1. MERGE MULTIPLE PDFs
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 2. SPLIT PDF BY RANGES OR ALL PAGES
 */
export interface SplitRange {
  from: number; // 1-indexed
  to: number;   // 1-indexed
  name?: string;
}

export async function splitPDFByRanges(
  file: File,
  ranges: SplitRange[]
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const results: { name: string; bytes: Uint8Array }[] = [];

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const start = Math.max(1, Math.min(r.from, totalPages));
    const end = Math.max(start, Math.min(r.to, totalPages));

    const newPdf = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let p = start - 1; p <= end - 1; p++) {
      pageIndices.push(p);
    }

    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const bytes = await newPdf.save();
    const rangeName = r.name || `${baseName}_part_${i + 1}_pages_${start}-${end}.pdf`;
    results.push({ name: rangeName, bytes });
  }

  return results;
}

export async function splitPDFAllPages(
  file: File
): Promise<{ pageNum: number; name: string; bytes: Uint8Array }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const results: { pageNum: number; name: string; bytes: Uint8Array }[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let p = 0; p < totalPages; p++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(srcPdf, [p]);
    newPdf.addPage(copiedPage);
    const bytes = await newPdf.save();
    results.push({
      pageNum: p + 1,
      name: `${baseName}_page_${p + 1}.pdf`,
      bytes
    });
  }

  return results;
}

/**
 * 3. EXTRACT SPECIFIC PAGES TO NEW PDF
 */
export async function extractPDFPages(
  file: File,
  pageNumbers: number[] // 1-indexed
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  const newPdf = await PDFDocument.create();
  const validIndices = pageNumbers
    .filter((n) => n >= 1 && n <= totalPages)
    .map((n) => n - 1);

  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * 4. DELETE SPECIFIC PAGES FROM PDF
 */
export async function deletePDFPages(
  file: File,
  pagesToDelete: number[] // 1-indexed
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  const deleteSet = new Set(pagesToDelete);
  const keepIndices: number[] = [];

  for (let p = 1; p <= totalPages; p++) {
    if (!deleteSet.has(p)) {
      keepIndices.push(p - 1);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete all pages. At least one page must remain.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, keepIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * 5. ROTATE PDF PAGES
 */
export async function rotatePDFPages(
  file: File,
  rotations: { [pageNumber1Indexed: number]: number } // degree adjustment: +90, +180, +270
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    const additionalRotation = rotations[pageNum] || 0;
    if (additionalRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + additionalRotation) % 360;
      page.setRotation(degrees(newRotation));
    }
  });

  return await pdfDoc.save();
}

/**
 * 6. REORDER PDF PAGES
 */
export async function reorderPDFPages(
  file: File,
  newOrder1Indexed: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  const validIndices = newOrder1Indexed
    .filter((p) => p >= 1 && p <= totalPages)
    .map((p) => p - 1);

  if (validIndices.length === 0) {
    throw new Error('Invalid page order provided.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * 7. REMOVE PDF METADATA
 */
export interface PDFMetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export async function readPDFMetadata(file: File): Promise<PDFMetadataInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() || '',
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toISOString() : '',
    modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toISOString() : '',
  };
}

export async function removePDFMetadata(
  file: File
): Promise<{ bytes: Uint8Array; removedInfo: PDFMetadataInfo }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const removedInfo: PDFMetadataInfo = {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() || '',
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toISOString() : '',
    modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toISOString() : '',
  };

  // Strip all standard document metadata
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));

  const bytes = await pdfDoc.save();
  return { bytes, removedInfo };
}

/**
 * 8. ADD WATERMARK TO PDF
 */
export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number; // 0.05 to 1.0
  rotation?: number; // degrees
  color?: { r: number; g: number; b: number }; // 0 to 1
  position?: 'center' | 'top' | 'bottom' | 'tile';
  pages?: 'all' | 'first' | 'custom';
  customPageRange?: string; // e.g. "1, 3-5"
}

export async function addWatermarkToPDF(
  file: File,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const text = options.text || 'CONFIDENTIAL';
  const fontSize = options.fontSize || 42;
  const opacity = options.opacity !== undefined ? options.opacity : 0.25;
  const rotationDegrees = options.rotation !== undefined ? options.rotation : 45;
  const color = options.color || { r: 0.8, g: 0.1, b: 0.1 };
  const position = options.position || 'center';

  // Determine target pages
  const targetPages = new Set<number>();
  if (options.pages === 'first') {
    targetPages.add(1);
  } else if (options.pages === 'custom' && options.customPageRange) {
    const parts = options.customPageRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let p = Math.min(s, e); p <= Math.max(s, e); p++) {
            if (p >= 1 && p <= totalPages) targetPages.add(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) targetPages.add(p);
      }
    }
  } else {
    for (let p = 1; p <= totalPages; p++) targetPages.add(p);
  }

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    if (!targetPages.has(pageNum)) return;

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    if (position === 'tile') {
      const stepX = Math.max(200, textWidth + 80);
      const stepY = Math.max(140, textHeight + 60);
      for (let x = 40; x < width + 50; x += stepX) {
        for (let y = 40; y < height + 50; y += stepY) {
          page.drawText(text, {
            x,
            y,
            size: fontSize * 0.75,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity,
            rotate: degrees(rotationDegrees),
          });
        }
      }
    } else if (position === 'top') {
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height - textHeight - 40,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(0),
      });
    } else if (position === 'bottom') {
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: 40,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(0),
      });
    } else {
      // Center diagonal
      const rad = (rotationDegrees * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const centerX = width / 2;
      const centerY = height / 2;
      const drawX = centerX - (textWidth / 2) * cos + (textHeight / 2) * sin;
      const drawY = centerY - (textWidth / 2) * sin - (textHeight / 2) * cos;

      page.drawText(text, {
        x: drawX,
        y: drawY,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotationDegrees),
      });
    }
  });

  return await pdfDoc.save();
}

/**
 * 9. COMPRESS PDF
 * Smart multi-tier optimization with adaptive raster downsampling and stream compression
 */
export async function compressPDF(
  file: File,
  quality: 'extreme' | 'recommended' | 'high',
  onProgress?: (msg: string) => void
): Promise<{ bytes: Uint8Array; originalSize: number; compressedSize: number; ratioPercent: number }> {
  const originalSize = file.size;
  const arrayBuffer = await file.arrayBuffer();

  // Step 1: Try structural stream compression first
  let structuralBytes: Uint8Array | null = null;
  try {
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    structuralBytes = await srcDoc.save({ useObjectStreams: true });
  } catch {
    structuralBytes = null;
  }

  // Step 2: Adaptive raster optimization with smart DPI scaling
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDocProxy = await loadingTask.promise;
  const totalPages = pdfDocProxy.numPages;

  // Calibrated scale and quality to ensure real size reduction
  let scale = 0.90;
  let imgQuality = 0.55;
  if (quality === 'extreme') {
    scale = 0.70;
    imgQuality = 0.40;
  } else if (quality === 'high') {
    scale = 1.05;
    imgQuality = 0.65;
  }

  const renderAndBuildPdf = async (renderScale: number, renderQuality: number): Promise<Uint8Array> => {
    const outDoc = await PDFDocument.create();

    for (let p = 1; p <= totalPages; p++) {
      if (onProgress) {
        onProgress(`Optimizing page ${p} of ${totalPages}...`);
      }
      const page = await pdfDocProxy.getPage(p);
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) continue;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const jpegDataUrl = canvas.toDataURL('image/jpeg', renderQuality);
      const base64Data = jpegDataUrl.split(',')[1];
      const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const embeddedImage = await outDoc.embedJpg(imgBytes);

      // Get original page size to preserve PDF page dimensions
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = outDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });
    }

    return await outDoc.save({ useObjectStreams: true });
  };

  let resultBytes = await renderAndBuildPdf(scale, imgQuality);

  // If raster result is larger than original, try aggressive pass
  if (resultBytes.length >= originalSize) {
    if (onProgress) onProgress('Applying aggressive compression pass...');
    const aggressiveBytes = await renderAndBuildPdf(0.60, 0.35);
    if (aggressiveBytes.length < originalSize) {
      resultBytes = aggressiveBytes;
    } else if (structuralBytes && structuralBytes.length < originalSize) {
      resultBytes = structuralBytes;
    } else {
      // If even aggressive pass is larger (e.g. tiny pure text vector file), use structural stream version or original
      resultBytes = structuralBytes && structuralBytes.length < originalSize ? structuralBytes : new Uint8Array(arrayBuffer);
    }
  }

  const compressedSize = Math.min(originalSize, resultBytes.length);
  const ratioPercent = originalSize > 0 && compressedSize < originalSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return {
    bytes: resultBytes,
    originalSize,
    compressedSize,
    ratioPercent,
  };
}

/**
 * 10. PROTECT PDF WITH PASSWORD
 */
export async function protectPDFWithPassword(
  file: File,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  // Apply standard PDF 128-bit encryption handler
  const encrypted = encryptPdfBytes(rawBytes, userPassword, ownerPassword);
  return encrypted;
}
