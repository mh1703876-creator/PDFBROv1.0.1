/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for pdfjs-dist with fallback CDN
try {
  // Try local worker if available or CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization warning:', e);
}

export interface PDFPageRenderResult {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF from ArrayBuffer and returns the PDFDocumentProxy
 */
export async function loadPDFDocument(arrayBuffer: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/cmaps/`,
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a specific page from a loaded PDFDocumentProxy to a Canvas
 */
export async function renderPDFPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not get 2D canvas context for rendering PDF page');
  }

  // Draw white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Apply Black & White / Grayscale filters to a Canvas
 */
export function applyBwFilterToCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: {
    mode: 'grayscale' | 'threshold' | 'inverted';
    threshold?: number; // 0 - 255 (default 128)
    contrast?: number; // 0.5 - 2.0 (default 1.0)
    brightness?: number; // -50 to +50 (default 0)
  }
): HTMLCanvasElement {
  const { mode, threshold = 128, contrast = 1.0, brightness = 0 } = options;

  const destCanvas = document.createElement('canvas');
  destCanvas.width = sourceCanvas.width;
  destCanvas.height = sourceCanvas.height;

  const ctx = destCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, destCanvas.width, destCanvas.height);
  const data = imgData.data;

  // Pre-calculate contrast factor
  // contrast formula: factor = (259 * (contrast + 255)) / (255 * (259 - contrast)) where contrast is -255 to 255
  // or simpler linear contrast: (color - 128) * contrast + 128
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Standard ITU-R BT.601 luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // 2. Apply Brightness
    if (brightness !== 0) {
      gray = Math.max(0, Math.min(255, gray + brightness));
    }

    // 3. Apply Contrast
    if (contrast !== 1.0) {
      gray = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
    }

    if (mode === 'grayscale') {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    } else if (mode === 'threshold') {
      // Pure binary black & white
      const val = gray >= threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    } else if (mode === 'inverted') {
      // Inverted dark grayscale
      const inv = 255 - gray;
      data[i] = inv;
      data[i + 1] = inv;
      data[i + 2] = inv;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Also update source canvas in-place in case caller re-uses sourceCanvas
  try {
    const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    if (srcCtx) {
      srcCtx.putImageData(imgData, 0, 0);
    }
  } catch (e) {
    // Non-fatal if source canvas context cannot be retrieved
  }

  return destCanvas;
}

/**
 * Parse page range string (e.g. "1-3, 5, 7-10") into an array of page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum);
      }
    }
  }

  if (pages.size === 0) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  return Array.from(pages).sort((a, b) => a - b);
}
