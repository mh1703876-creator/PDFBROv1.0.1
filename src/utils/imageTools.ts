import UPNG from 'upng-js';

/**
 * Helper to load an image file into HTMLImageElement
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image file.'));
    };
    img.src = url;
  });
}

/**
 * 1. COMPRESS IMAGE
 */
export interface CompressedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
}

export function detectImageFormat(file: File): { format: 'image/jpeg' | 'image/png' | 'image/webp'; extension: 'jpg' | 'png' | 'webp' } {
  const type = file.type?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  if (type.includes('png') || name.endsWith('.png')) {
    return { format: 'image/png', extension: 'png' };
  }
  if (type.includes('webp') || name.endsWith('.webp')) {
    return { format: 'image/webp', extension: 'webp' };
  }
  return { format: 'image/jpeg', extension: 'jpg' };
}

export async function compressImage(
  file: File,
  quality: number = 0.75, // 0.1 to 0.95
  formatOverride?: 'image/jpeg' | 'image/png' | 'image/webp',
  scaleFactor: number = 1.0
): Promise<CompressedImageResult> {
  const detected = detectImageFormat(file);
  const targetFormat = formatOverride || detected.format;
  const extension = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/png' ? 'png' : 'jpg';

  const img = await loadImageFromFile(file);
  const targetWidth = Math.max(1, Math.round(img.width * scaleFactor));
  const targetHeight = Math.max(1, Math.round(img.height * scaleFactor));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not available');

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let blob: Blob;
  let dataUrl: string;

  if (targetFormat === 'image/png') {
    // High-performance PNG color quantization & indexing via UPNG
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const cnum = Math.max(8, Math.min(256, Math.round(quality * 256)));
    const buffer = imgData.data.buffer as ArrayBuffer;
    let pngBuffer = UPNG.encode([buffer], targetWidth, targetHeight, cnum);
    
    // Fallback quantization if output is larger than original file
    if (pngBuffer.byteLength >= file.size && cnum > 24) {
      const reducedBuffer = UPNG.encode([buffer], targetWidth, targetHeight, Math.max(16, Math.round(cnum * 0.6)));
      if (reducedBuffer.byteLength < pngBuffer.byteLength) {
        pngBuffer = reducedBuffer;
      }
    }

    blob = new Blob([pngBuffer], { type: 'image/png' });
    dataUrl = URL.createObjectURL(blob);
  } else {
    // JPEG / WebP with adaptive quality clamp
    const safeQ = Math.min(0.95, Math.max(0.05, quality));
    dataUrl = canvas.toDataURL(targetFormat, safeQ);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    blob = new Blob([ab], { type: targetFormat });

    // If result inflated compared to original input at 100% scale, try slightly lower compression
    if (blob.size >= file.size && scaleFactor >= 0.99 && safeQ > 0.3) {
      const retryUrl = canvas.toDataURL(targetFormat, safeQ * 0.75);
      const retryBytes = atob(retryUrl.split(',')[1]);
      const retryAb = new ArrayBuffer(retryBytes.length);
      const retryIa = new Uint8Array(retryAb);
      for (let i = 0; i < retryBytes.length; i++) {
        retryIa[i] = retryBytes.charCodeAt(i);
      }
      if (retryAb.byteLength < blob.size) {
        blob = new Blob([retryAb], { type: targetFormat });
        dataUrl = retryUrl;
      }
    }
  }

  const savings = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

  return {
    file,
    blob,
    dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    savingsPercent: savings,
    width: targetWidth,
    height: targetHeight,
    format: targetFormat,
    extension,
  };
}

/**
 * 2. RESIZE IMAGE
 */
export interface ResizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  newSize: number;
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  quality: number = 0.92
): Promise<ResizedImageResult> {
  const img = await loadImageFromFile(file);
  const originalWidth = img.width;
  const originalHeight = img.height;

  const w = Math.max(1, Math.round(targetWidth));
  const h = Math.max(1, Math.round(targetHeight));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL(format, quality);
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: format });

  return {
    file,
    blob,
    dataUrl,
    originalWidth,
    originalHeight,
    newWidth: w,
    newHeight: h,
    newSize: blob.size,
  };
}

/**
 * 3. CONVERT IMAGE TO GRAYSCALE / B&W / SEPIA
 */
export interface GrayscaleImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  mode: 'grayscale' | 'bw' | 'sepia';
}

export async function convertImageToGrayscale(
  file: File,
  mode: 'grayscale' | 'bw' | 'sepia' = 'grayscale',
  contrast: number = 1.0, // 0.5 to 2.0
  brightness: number = 0, // -100 to +100
  threshold: number = 128, // 0 to 255 (for high-contrast B&W)
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<GrayscaleImageResult> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  // Contrast factor calculation
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];
    const a = d[i + 3];

    if (a === 0) continue;

    // Apply brightness
    r = Math.min(255, Math.max(0, r + brightness));
    g = Math.min(255, Math.max(0, g + brightness));
    b = Math.min(255, Math.max(0, b + brightness));

    // Apply contrast
    r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

    if (mode === 'grayscale') {
      // Standard Luminance (ITU-R BT.601)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    } else if (mode === 'bw') {
      // Pure 1-bit Black and White threshold
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const val = gray >= threshold ? 255 : 0;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    } else if (mode === 'sepia') {
      // Warm Vintage Sepia
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      d[i] = Math.min(255, tr);
      d[i + 1] = Math.min(255, tg);
      d[i + 2] = Math.min(255, tb);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const dataUrl = canvas.toDataURL(format, 0.95);
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: format });

  return {
    file,
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    mode,
  };
}
