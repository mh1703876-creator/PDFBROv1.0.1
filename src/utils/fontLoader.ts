/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FontItem } from '../types';

// The 20 preloaded fonts exactly as described or from standard Google Fonts
export const PRELOADED_FONTS: FontItem[] = [
  { id: 'poppins', name: 'Poppins', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'inter', name: 'Inter', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'roboto', name: 'Roboto', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'open-sans', name: 'Open Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'lato', name: 'Lato', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'montserrat', name: 'Montserrat', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'nunito', name: 'Nunito', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'source-sans-pro', name: 'Source Sans Pro', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'work-sans', name: 'Work Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'noto-sans', name: 'Noto Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'space-grotesk', name: 'Space Grotesk', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'merriweather', name: 'Merriweather', category: 'Serif', status: 'Not Downloaded' },
  { id: 'playfair-display', name: 'Playfair Display', category: 'Serif', status: 'Not Downloaded' },
  { id: 'lora', name: 'Lora', category: 'Serif', status: 'Not Downloaded' },
  { id: 'cardo', name: 'Cardo', category: 'Serif', status: 'Not Downloaded' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', category: 'Monospace', status: 'Not Downloaded' },
  { id: 'fira-code', name: 'Fira Code', category: 'Monospace', status: 'Not Downloaded' },
  { id: 'pacifico', name: 'Pacifico', category: 'Handwriting', status: 'Not Downloaded' },
  { id: 'caveat', name: 'Caveat', category: 'Handwriting', status: 'Not Downloaded' },
  { id: 'sacramento', name: 'Sacramento', category: 'Handwriting', status: 'Not Downloaded' },
  // Newly added English fonts
  { id: 'mukta-mahee', name: 'Mukta Mahee', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'average-sans', name: 'Average Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'arvo', name: 'Arvo', category: 'Serif', status: 'Not Downloaded' },
  { id: 'jost', name: 'Jost', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'ibm-plex-mono', name: 'IBM Plex Mono', category: 'Monospace', status: 'Not Downloaded' },
  { id: 'ubuntu-sans', name: 'Ubuntu Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'cabin', name: 'Cabin', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'cormorant-garamond', name: 'Cormorant Garamond', category: 'Serif', status: 'Not Downloaded' },
  { id: 'josefin-sans', name: 'Josefin Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'dm-sans', name: 'DM Sans', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'roboto-mono', name: 'Roboto Mono', category: 'Monospace', status: 'Not Downloaded' },
];

// The 4 requested Bangla fonts + newly added Bangla fonts
export const BANGLA_FONTS: FontItem[] = [
  { id: 'noto-sans-bengali', name: 'Noto Sans Bengali', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'noto-serif-bengali', name: 'Noto Serif Bengali', category: 'Serif', status: 'Not Downloaded' },
  { id: 'hind-siliguri', name: 'Hind Siliguri', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'vrinda', name: 'Vrinda', category: 'Sans-Serif', status: 'Not Downloaded' },
  // Newly added Bangla fonts
  { id: 'anek-bangla', name: 'Anek Bangla', category: 'Sans-Serif', status: 'Not Downloaded' },
  { id: 'baloo-da-2', name: 'Baloo Da 2', category: 'Sans-Serif', status: 'Not Downloaded' },
];

/**
 * Converts an ArrayBuffer to a Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Dynamically injects a @font-face style rule into the browser DOM
 */
export function injectFontFace(
  fontName: string,
  base64Data: string,
  format: string = 'truetype',
  fontStyle: 'normal' | 'italic' = 'normal'
): void {
  const styleId = `font-face-${fontName.toLowerCase().replace(/\s+/g, '-')}-${fontStyle}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('data:font/${format === 'truetype' ? 'ttf' : format};base64,${base64Data}') format('${format}');
      font-weight: normal;
      font-style: ${fontStyle};
      font-display: swap;
    }
  `;
}

/**
 * Validates whether a base64 encoded file starts with TTF or OTF magic headers.
 */
export function isValidTTF(base64: string): boolean {
  try {
    const binaryString = window.atob(base64);
    if (binaryString.length < 4) return false;
    const b0 = binaryString.charCodeAt(0);
    const b1 = binaryString.charCodeAt(1);
    const b2 = binaryString.charCodeAt(2);
    const b3 = binaryString.charCodeAt(3);
    
    // TTF: 0x00 0x01 0x00 0x00 or 'true' (0x74 0x72 0x75 0x65)
    // OTF: 'OTTO' (0x4F 0x54 0x54 0x4F)
    const isTTF = (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) ||
                  (b0 === 0x74 && b1 === 0x72 && b2 === 0x75 && b3 === 0x65);
    const isOTF = (b0 === 0x4F && b1 === 0x54 && b2 === 0x54 && b3 === 0x4F);
    
    return isTTF || isOTF;
  } catch (e) {
    return false;
  }
}

// ==========================================
// IndexedDB Font Caching System
// ==========================================
const DB_NAME = 'pdfbro-font-cache';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getCachedFont(
  fontName: string,
  style: 'normal' | 'italic' = 'normal'
): Promise<{ base64: string; format: string } | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const key = `${fontName.toLowerCase()}_${style}`;
      const request = store.get(key);
      request.onsuccess = (event: any) => {
        const result = event.target.result;
        if (result && result.base64 && result.format) {
          resolve({ base64: result.base64, format: result.format });
        } else {
          resolve(null);
        }
      };
      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB getCachedFont error:', err);
    return null;
  }
}

export async function cacheFont(
  fontName: string,
  style: 'normal' | 'italic' = 'normal',
  base64: string,
  format: string
): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const key = `${fontName.toLowerCase()}_${style}`;
      const request = store.put({ key, base64, format, updatedAt: Date.now() });
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB cacheFont error:', err);
  }
}

/**
 * Fetches a Google Font and parses it to Base64 (with Caching)
 */
export async function downloadGoogleFont(
  fontName: string,
  style: 'normal' | 'italic' = 'normal'
): Promise<{ base64: string; format: string }> {
  // Check local cache first
  try {
    const cached = await getCachedFont(fontName, style);
    if (cached && cached.base64 && isValidTTF(cached.base64)) {
      return cached;
    }
  } catch (err) {
    console.warn(`Failed to read cache for ${fontName} (${style}):`, err);
  }

  // Download from server if not cached
  const fetched = await fetchGoogleFontFromServer(fontName, style);

  // Cache downloaded font
  try {
    await cacheFont(fontName, style, fetched.base64, fetched.format);
  } catch (err) {
    console.warn(`Failed to cache ${fontName} (${style}):`, err);
  }

  return fetched;
}

/**
 * Performs actual network downloading of Google Fonts
 */
async function fetchGoogleFontFromServer(
  fontName: string,
  style: 'normal' | 'italic' = 'normal'
): Promise<{ base64: string; format: string }> {
  // Special handling for Vrinda font (Microsoft proprietary, fallback Noto Sans Bengali if inaccessible)
  if (fontName.toLowerCase() === 'vrinda') {
    const vrindaUrl = 'https://cdn.jsdelivr.net/gh/samit73/vrinda@master/vrinda.ttf';
    try {
      const res = await fetch(vrindaUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        if (isValidTTF(base64)) {
          return { base64, format: 'truetype' };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Vrinda from CDN, falling back to Noto Sans Bengali:', e);
    }
    // Fallback to Noto Sans Bengali
    return downloadGoogleFont('Noto Sans Bengali', style);
  }

  const cleanPascal = fontName.replace(/[\s-]+/g, '');
  const cleanLower = fontName.toLowerCase().replace(/[\s-]+/g, '');
  
  // Support Source Sans Pro falling back to Source Sans 3 as a direct successor
  const namesToTry = [{ lower: cleanLower, pascal: cleanPascal, id: fontName.toLowerCase().replace(/\s+/g, '-') }];
  if (cleanLower === 'sourcesanspro') {
    namesToTry.push({ lower: 'sourcesans3', pascal: 'SourceSans3', id: 'source-sans-3' });
  }

  // Method 1: Query Google Webfonts Helper API (extremely robust, serves direct CORS-enabled TTF URLs from gstatic)
  const idCandidates: string[] = [];
  for (const n of namesToTry) {
    idCandidates.push(n.id, n.lower);
  }
  const uniqueIds = Array.from(new Set(idCandidates));

  const hostCandidates = [
    'https://gwfh.micromanya.de/api/fonts',
    'https://google-webfonts-helper.herokuapp.com/api/fonts'
  ];

  for (const host of hostCandidates) {
    for (const id of uniqueIds) {
      try {
        const gwfhUrl = `${host}/${id}`;
        const gwfhRes = await fetch(gwfhUrl);
        if (gwfhRes.ok) {
          const data = await gwfhRes.json();
          // Find target variant ID
          const targetVariantId = style === 'italic' ? 'italic' : 'regular';
          const variant = data.variants?.find((v: any) => v.id === targetVariantId) || 
                          data.variants?.find((v: any) => v.id === 'regular') || 
                          data.variants?.[0];
          if (variant && variant.ttf) {
            const ttfUrl = variant.ttf.replace(/^http:/, 'https:');
            const ttfRes = await fetch(ttfUrl);
            if (ttfRes.ok) {
              const arrayBuffer = await ttfRes.arrayBuffer();
              const base64 = arrayBufferToBase64(arrayBuffer);
              if (isValidTTF(base64)) {
                return { base64, format: 'truetype' };
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Method 1 (gwfh host: ${host}, id: ${id}) failed for ${fontName} (${style}):`, err);
      }
    }
  }

  // Method 2: Fetch directly from google/fonts official GitHub repository via jsDelivr CDN & raw GitHub content
  const relativePaths: string[] = [];
  for (const n of namesToTry) {
    if (style === 'italic') {
      relativePaths.push(
        `ofl/${n.lower}/static/${n.pascal}-Italic.ttf`,
        `ofl/${n.lower}/${n.pascal}-Italic.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bital,opsz,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bopsz,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}-Italic%5Bopsz,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bital,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}-Italic%5Bwght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bwght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bslnt,wght%5D.ttf`,
        `apache/${n.lower}/${n.pascal}-Italic.ttf`
      );
    } else {
      relativePaths.push(
        `ofl/${n.lower}/${n.pascal}%5Bopsz,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bwght%5D.ttf`,
        `ofl/${n.lower}/static/${n.pascal}-Regular.ttf`,
        `ofl/${n.lower}/${n.pascal}-Regular.ttf`,
        `ofl/${n.lower}/${n.pascal}.ttf`,
        `ofl/${n.lower}/static/${n.pascal}.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bwdth,wght%5D.ttf`,
        `ofl/${n.lower}/${n.pascal}%5Bslnt,wght%5D.ttf`,
        `apache/${n.lower}/${n.pascal}-Regular.ttf`,
        `apache/${n.lower}/${n.pascal}.ttf`
      );
    }
  }

  const uniquePaths = Array.from(new Set(relativePaths));
  const jsdelivrCandidates: string[] = [];
  for (const p of uniquePaths) {
    jsdelivrCandidates.push(
      `https://cdn.jsdelivr.net/gh/google/fonts@main/${p}`,
      `https://cdn.jsdelivr.net/gh/google/fonts@master/${p}`,
      `https://raw.githubusercontent.com/google/fonts/main/${p}`,
      `https://raw.githubusercontent.com/google/fonts/master/${p}`
    );
  }

  for (const url of jsdelivrCandidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        if (isValidTTF(base64)) {
          return { base64, format: 'truetype' };
        }
      }
    } catch (err) {
      console.warn(`Method 2 CDN URL (${url}) failed for ${fontName} (${style}):`, err);
    }
  }

  // Method 3: Fallback CSS parse
  try {
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(fontName)}:${style === 'italic' ? 'italic' : 'regular'}`;
    const cssResponse = await fetch(cssUrl);
    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch font CSS stylesheet from Google Fonts API.`);
    }
    const cssText = await cssResponse.text();
    
    const urlMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.(ttf|woff|woff2))\)/i);
    if (!urlMatch || !urlMatch[1]) {
      throw new Error(`Could not find a valid binary font URL in the Google Fonts CSS descriptor.`);
    }
    
    const fontFileUrl = urlMatch[1];
    const fileExtension = urlMatch[2]?.toLowerCase() || 'ttf';
    const format = fileExtension === 'ttf' ? 'truetype' : fileExtension;
    
    const fontFileResponse = await fetch(fontFileUrl);
    if (!fontFileResponse.ok) {
      throw new Error(`Failed to fetch the binary font file.`);
    }
    
    const arrayBuffer = await fontFileResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    if (!isValidTTF(base64)) {
      throw new Error(`Downloaded font is not a valid TrueType/OpenType font (it might be a .woff2 file).`);
    }
    
    return { base64, format };
  } catch (error: any) {
    console.error(`Error loading Google Font '${fontName}' (${style}):`, error);
    // If italic fails, fallback to normal
    if (style === 'italic') {
      try {
        return await downloadGoogleFont(fontName, 'normal');
      } catch (innerErr) {
        throw error;
      }
    }
    throw error;
  }
}
