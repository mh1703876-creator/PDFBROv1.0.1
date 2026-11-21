/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { LayoutSettings, FontItem } from '../types';
import { isValidTTF } from './fontLoader';

export interface FormattedToken {
  text: string;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  underline: boolean;
}

export interface WordToken {
  text: string;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  underline: boolean;
  hasSpace: boolean;
}

/**
 * Splits text into segments based on whether they contain Bangla characters or English/other characters.
 */
export function splitByLanguage(text: string): { text: string; isBangla: boolean }[] {
  if (!text) return [];
  const result: { text: string; isBangla: boolean }[] = [];
  const regex = /([\u0980-\u09FF]+)/g;
  const parts = text.split(regex);
  for (const part of parts) {
    if (!part) continue;
    const isBangla = /[\u0980-\u09FF]/.test(part);
    result.push({ text: part, isBangla });
  }
  return result;
}

/**
 * 1. Matches all formatting combinations from longest to shortest
 * Symmetrical tags: # for bold, $ for italic, ! for uppercase, @ for underline.
 */
export function parseFormattedText(text: string): FormattedToken[] {
  if (!text) return [];

  // Patterns to check, ordered from quadruple to single
  const patterns: { regex: RegExp; flags: Omit<FormattedToken, 'text'> }[] = [
    // Quadruple
    { regex: /#!\$@([^@]+)@\$!#/g, flags: { bold: true, italic: true, uppercase: true, underline: true } },
    
    // Triple
    { regex: /#!\$([^\$]+)\$!#/g, flags: { bold: true, italic: true, uppercase: true, underline: false } },
    { regex: /#!@([^@]+)@!#/g, flags: { bold: true, italic: false, uppercase: true, underline: true } },
    { regex: /#\$@([^@]+)@\$#/g, flags: { bold: true, italic: true, uppercase: false, underline: true } },
    { regex: /\$!@([^@]+)@!\$/g, flags: { bold: false, italic: true, uppercase: true, underline: true } },
    { regex: /\$!@([^!@]+)!@\$/g, flags: { bold: false, italic: true, uppercase: true, underline: true } },
    
    // Double
    { regex: /#\$([^\$]+)\$#/g, flags: { bold: true, italic: true, uppercase: false, underline: false } },
    { regex: /#!([^!]+)!#/g, flags: { bold: true, italic: false, uppercase: true, underline: false } },
    { regex: /#@([^@]+)@#/g, flags: { bold: true, italic: false, uppercase: false, underline: true } },
    { regex: /\$!([^!]+)!\$/g, flags: { bold: false, italic: true, uppercase: true, underline: false } },
    { regex: /\$@([^@]+)@\$/g, flags: { bold: false, italic: true, uppercase: false, underline: true } },
    { regex: /!@([^@]+)@!/g, flags: { bold: false, italic: false, uppercase: true, underline: true } },
    
    // Single
    { regex: /#([^#]+)#/g, flags: { bold: true, italic: false, uppercase: false, underline: false } },
    { regex: /\$([^\$]+)\$/g, flags: { bold: false, italic: true, uppercase: false, underline: false } },
    { regex: /!([^!]+)!/g, flags: { bold: false, italic: false, uppercase: true, underline: false } },
    { regex: /@([^@]+)@/g, flags: { bold: false, italic: false, uppercase: false, underline: true } },
  ];

  let currentString = text;
  const tokenMap: Record<string, FormattedToken> = {};
  let tokenCounter = 0;

  // Sequentially replace formatted strings with unique placeholders
  for (const { regex, flags } of patterns) {
    currentString = currentString.replace(regex, (match, innerText) => {
      const placeholder = `__PDFBRO_TKN_${tokenCounter}__`;
      tokenMap[placeholder] = {
        text: innerText,
        ...flags,
      };
      tokenCounter++;
      return placeholder;
    });
  }

  // Split by the placeholder regex to reconstruct tokens
  const splitRegex = /(__PDFBRO_TKN_\d+__)/g;
  const parts = currentString.split(splitRegex);
  const result: FormattedToken[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('__PDFBRO_TKN_') && part.endsWith('__')) {
      const token = tokenMap[part];
      if (token) {
        result.push(token);
        continue;
      }
    }
    // Plain text
    result.push({
      text: part,
      bold: false,
      italic: false,
      uppercase: false,
      underline: false,
    });
  }

  return result;
}

/**
 * Splits a paragraph into printable words preserving spacing and styles.
 */
export function getWordTokens(paragraphText: string): WordToken[] {
  const formatted = parseFormattedText(paragraphText);
  const words: WordToken[] = [];

  for (const token of formatted) {
    let txt = token.text;
    if (token.uppercase) {
      txt = txt.toUpperCase();
    }
    
    // Split by spacing blocks but capture them to determine word boundaries
    const parts = txt.split(/(\s+)/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        if (words.length > 0) {
          words[words.length - 1].hasSpace = true;
        }
      } else {
        words.push({
          text: part,
          bold: token.bold,
          italic: token.italic,
          uppercase: token.uppercase,
          underline: token.underline,
          hasSpace: false,
        });
      }
    }
    
    if (txt.endsWith(' ') && words.length > 0) {
      words[words.length - 1].hasSpace = true;
    }
  }
  
  return words;
}

/**
 * Page Size Definitions in Inches
 */
export const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 8.27, height: 11.69 },
  A3: { width: 11.69, height: 16.54 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11.0 },
  Legal: { width: 8.5, height: 14.0 },
  Executive: { width: 7.25, height: 10.5 },
  Tabloid: { width: 11.0, height: 17.0 },
};

/**
 * Margin presets in Inches
 */
export const MARGINS: Record<string, number> = {
  '0.2': 0.2,
  '0.3': 0.3,
  '0.4': 0.4,
  '0.5': 0.5,
  '0.6': 0.6,
  '0.7': 0.7,
  '1.0': 1.0,
  '1.5': 1.5,
  '2.0': 2.0,
};

export interface TextBlock {
  type: 'paragraph' | 'list-item' | 'blank-line' | 'page-break' | 'table';
  listType?: 'DOT' | 'NUMBERED' | 'ROMAN';
  listLevel?: number;
  listCount?: number;
  listPrefix?: string;
  text: string;
  alignment?: 'Left' | 'Center' | 'Right' | 'Justified' | 'Auto';
  tableRows?: string[][];
  hasHeader?: boolean;
  isS1?: boolean;
  isSA?: boolean;
}

interface Segment {
  text: string;
  alignment?: 'Left' | 'Center' | 'Right' | 'Justified';
  isPageBreak?: boolean;
}

export function parseAlignmentAndPageBreaks(text: string): Segment[] {
  // Normalize and replace page breaks with a unique token
  let processed = text.replace(/<p>\s*next\s*<p>/gi, ' __PDF_PAGE_BREAK__ ');
  processed = processed.replace(/<p>\s*next\s*<\/p>/gi, ' __PDF_PAGE_BREAK__ ');

  const segments: Segment[] = [];
  let index = 0;

  while (index < processed.length) {
    const nextC = processed.indexOf('<c>', index);
    const nextR = processed.indexOf('<r>', index);
    const nextL = processed.indexOf('<l>', index);
    const nextJ = processed.indexOf('<j>', index);
    const nextPB = processed.indexOf('__PDF_PAGE_BREAK__', index);

    const candidates = [
      { type: 'c', pos: nextC },
      { type: 'r', pos: nextR },
      { type: 'l', pos: nextL },
      { type: 'j', pos: nextJ },
      { type: 'pb', pos: nextPB }
    ].filter(c => c.pos !== -1);

    if (candidates.length === 0) {
      const rest = processed.substring(index);
      if (rest) {
        segments.push({ text: rest });
      }
      break;
    }

    candidates.sort((a, b) => a.pos - b.pos);
    const first = candidates[0];

    if (first.pos > index) {
      segments.push({ text: processed.substring(index, first.pos) });
    }

    if (first.type === 'pb') {
      segments.push({ text: '', isPageBreak: true });
      index = first.pos + '__PDF_PAGE_BREAK__'.length;
    } else {
      const tagOpen = `<${first.type}>`;
      const tagClose1 = `</${first.type}>`;
      const tagClose2 = `<${first.type}>`;

      const startOfContent = first.pos + tagOpen.length;
      let closePos = processed.indexOf(tagClose1, startOfContent);
      let closeLen = tagClose1.length;

      const closePos2 = processed.indexOf(tagClose2, startOfContent);
      if (closePos === -1 || (closePos2 !== -1 && closePos2 < closePos)) {
        closePos = closePos2;
        closeLen = tagClose2.length;
      }

      const alignValue = first.type === 'c' ? 'Center' : first.type === 'r' ? 'Right' : first.type === 'l' ? 'Left' : 'Justified';

      if (closePos === -1) {
        const content = processed.substring(startOfContent);
        segments.push({
          text: content,
          alignment: alignValue
        });
        break;
      } else {
        const content = processed.substring(startOfContent, closePos);
        segments.push({
          text: content,
          alignment: alignValue
        });
        index = closePos + closeLen;
      }
    }
  }

  return segments;
}

export function toRoman(num: number): string {
  const lookup: [string, number][] = [
    ['m', 1000],
    ['cm', 900],
    ['d', 500],
    ['cd', 400],
    ['c', 100],
    ['xc', 90],
    ['l', 50],
    ['xl', 40],
    ['x', 10],
    ['ix', 9],
    ['v', 5],
    ['iv', 4],
    ['i', 1]
  ];
  let roman = '';
  let temp = num;
  for (const [letter, value] of lookup) {
    while (temp >= value) {
      roman += letter;
      temp -= value;
    }
  }
  return roman || 'i';
}

export function getListMarker(line: string): { type: 'DOT' | 'NUMBERED' | 'ROMAN'; level: number; indent: string; content: string } | null {
  // Dot list: <.>, {.}, [.]
  const dot1 = line.match(/^(\s*)<\.>\s*(.*)$/);
  if (dot1) return { type: 'DOT', level: 1, indent: dot1[1], content: dot1[2] };
  const dot2 = line.match(/^(\s*)\{\.\}\s*(.*)$/);
  if (dot2) return { type: 'DOT', level: 2, indent: dot2[1], content: dot2[2] };
  const dot3 = line.match(/^(\s*)\[\.\]\s*(.*)$/);
  if (dot3) return { type: 'DOT', level: 3, indent: dot3[1], content: dot3[2] };

  // Numbered list: <~>, {~}, [~]
  const num1 = line.match(/^(\s*)<~>\s*(.*)$/);
  if (num1) return { type: 'NUMBERED', level: 1, indent: num1[1], content: num1[2] };
  const num2 = line.match(/^(\s*)\{\~\}\s*(.*)$/);
  if (num2) return { type: 'NUMBERED', level: 2, indent: num2[1], content: num2[2] };
  const num3 = line.match(/^(\s*)\[\~\]\s*(.*)$/);
  if (num3) return { type: 'NUMBERED', level: 3, indent: num3[1], content: num3[2] };

  // Roman list: <=>, {=}, [=]
  const rom1 = line.match(/^(\s*)<=>\s*(.*)$/);
  if (rom1) return { type: 'ROMAN', level: 1, indent: rom1[1], content: rom1[2] };
  const rom2 = line.match(/^(\s*)\{=\}\s*(.*)$/);
  if (rom2) return { type: 'ROMAN', level: 2, indent: rom2[1], content: rom2[2] };
  const rom3 = line.match(/^(\s*)\[=\]\s*(.*)$/);
  if (rom3) return { type: 'ROMAN', level: 3, indent: rom3[1], content: rom3[2] };

  return null;
}

interface TextOrTableSection {
  type: 'text' | 'table';
  text: string;
  tableAlign?: 'Left' | 'Center' | 'Right';
}

export function splitTablesAndText(text: string): TextOrTableSection[] {
  const sections: TextOrTableSection[] = [];
  let index = 0;
  let precededByTable = false;
  
  while (index < text.length) {
    const nextT = text.toLowerCase().indexOf('<t>', index);
    const nextTc = text.toLowerCase().indexOf('<tc>', index);
    const nextTr = text.toLowerCase().indexOf('<tr>', index);
    
    // Find the closest opening tag
    const positions = [
      { type: 't', pos: nextT },
      { type: 'tc', pos: nextTc },
      { type: 'tr', pos: nextTr }
    ].filter(p => p.pos !== -1);
    
    if (positions.length === 0) {
      let rest = text.substring(index);
      if (rest) {
        if (precededByTable) {
          if (rest.startsWith('\r\n')) {
            rest = rest.substring(2);
          } else if (rest.startsWith('\n')) {
            rest = rest.substring(1);
          }
        }
        sections.push({ type: 'text', text: rest });
      }
      break;
    }
    
    // Sort to get the earliest opening tag
    positions.sort((a, b) => a.pos - b.pos);
    const first = positions[0];
    
    // Add text before the tag
    if (first.pos > index) {
      let content = text.substring(index, first.pos);
      
      if (precededByTable) {
        if (content.startsWith('\r\n')) {
          content = content.substring(2);
        } else if (content.startsWith('\n')) {
          content = content.substring(1);
        }
      }
      
      // Since this content is immediately followed by a table, strip exactly one trailing newline
      if (content.endsWith('\n')) {
        content = content.slice(0, -1);
      }
      if (content.endsWith('\r')) {
        content = content.slice(0, -1);
      }
      
      sections.push({ type: 'text', text: content });
      precededByTable = false;
    }
    
    const tagOpen = `<${first.type}>`;
    const tagClose = `</${first.type}>`;
    const startOfContent = first.pos + tagOpen.length;
    let closePos = text.toLowerCase().indexOf(tagClose, startOfContent);
    
    const alignValue: 'Left' | 'Center' | 'Right' = first.type === 'tc' ? 'Center' : first.type === 'tr' ? 'Right' : 'Left';
    
    if (closePos === -1) {
      // No closing tag - take rest of text as table content
      const content = text.substring(startOfContent);
      sections.push({
        type: 'table',
        text: content,
        tableAlign: alignValue
      });
      precededByTable = true;
      break;
    } else {
      const content = text.substring(startOfContent, closePos);
      sections.push({
        type: 'table',
        text: content,
        tableAlign: alignValue
      });
      precededByTable = true;
      index = closePos + tagClose.length;
    }
  }
  
  return sections;
}

function toAlphaSerial(num: number): string {
  let s = '';
  let temp = num;
  while (temp > 0) {
    const m = (temp - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    temp = Math.floor((temp - 1) / 26);
  }
  return s;
}

export function parseTextToBlocks(text: string): TextBlock[] {
  const sections = splitTablesAndText(text);
  const blocks: TextBlock[] = [];

  for (const section of sections) {
    if (section.type === 'table') {
      const rawLines = section.text.replace(/\r\n/g, '\n').split('\n');
      const rows: string[][] = [];
      let hasHeader = false;

      // Determine if serial columns are requested
      const isS1 = /<s1>/i.test(section.text);
      const isSA = /<sA>/i.test(section.text);
      let serialIndex = 1;

      for (const rLine of rawLines) {
        let trimmed = rLine.trim();
        if (!trimmed) continue;

        // Skip the serial tags themselves
        if (trimmed.toLowerCase() === '<s1>' || trimmed.toLowerCase() === '<sa>') {
          continue;
        }

        let isCurrentHeader = false;
        if (trimmed.toLowerCase().startsWith('<h>')) {
          hasHeader = true;
          isCurrentHeader = true;
          trimmed = trimmed.substring(3).trim();
        }

        // Detect full-row formatting
        const prefixMarkers: string[] = [];
        let formatText = trimmed;
        let changed = true;
        while (changed && formatText.length >= 2) {
          changed = false;
          const first = formatText[0];
          const last = formatText[formatText.length - 1];
          if (first === last && ['#', '@', '$', '!'].includes(first)) {
            const tempCells = formatText.split('|').map(cell => cell.trim());
            if (tempCells.length > 1) {
              const firstCell = tempCells[0];
              const lastCell = tempCells[tempCells.length - 1];
              if (firstCell.endsWith(first) || lastCell.startsWith(first)) {
                // Either the first cell's opening marker is closed inside the first cell,
                // or the last cell's closing marker is opened inside the last cell.
                // In either case, it's not a single row-level wrapper.
                break;
              }
            }
            prefixMarkers.push(first);
            formatText = formatText.substring(1, formatText.length - 1).trim();
            changed = true;
          }
        }

        const cells = formatText.split('|').map(cell => cell.trim());
        
        // Re-wrap cells if row-level formatting was detected
        if (prefixMarkers.length > 0) {
          const pref = prefixMarkers.join('');
          const suff = [...prefixMarkers].reverse().join('');
          for (let idx = 0; idx < cells.length; idx++) {
            if (cells[idx]) {
              cells[idx] = pref + cells[idx] + suff;
            }
          }
        }

        // Apply automatic serial columns if requested
        if (isS1 || isSA) {
          if (isCurrentHeader) {
            cells.unshift('NO');
          } else {
            const serialVal = isS1 ? serialIndex.toString() : toAlphaSerial(serialIndex);
            cells.unshift(serialVal);
            serialIndex++;
          }
        }

        rows.push(cells);
      }

      if (rows.length > 0) {
        blocks.push({
          type: 'table',
          text: '',
          tableRows: rows,
          hasHeader: hasHeader,
          alignment: section.tableAlign,
          isS1: isS1,
          isSA: isSA
        });
      }
      continue;
    }

    // It's a text section
    const segments = parseAlignmentAndPageBreaks(section.text);
    for (let sIdx = 0; sIdx < segments.length; sIdx++) {
      const seg = segments[sIdx];
      if (seg.isPageBreak) {
        blocks.push({
          type: 'page-break',
          text: ''
        });
        continue;
      }

      let segText = seg.text;

      // Trim boundary newlines and spaces that are created around tags to prevent unwanted blank lines
      if (sIdx > 0) {
        const match = segText.match(/^([ \t\r]*\n)/);
        if (match) {
          segText = segText.substring(match[1].length);
        }
      }
      if (sIdx < segments.length - 1) {
        const match = segText.match(/(\n\r*[ \t]*)$/);
        if (match) {
          segText = segText.substring(0, segText.length - match[1].length);
        }
      }

      const lines = segText.replace(/\r\n/g, '\n').split('\n');
      
      // First, parse each line of this segment into a raw block
      interface RawBlock {
        type: 'paragraph' | 'list-item' | 'blank-line';
        listType?: 'DOT' | 'NUMBERED' | 'ROMAN';
        rawLevel?: number; // 1, 2, 3
        text: string;
      }
      
      const raws: RawBlock[] = lines.map(line => {
        const isBlank = line.trim() === '';
        if (isBlank) {
          return { type: 'blank-line', text: '' };
        }
        const marker = getListMarker(line);
        if (marker) {
          return {
            type: 'list-item',
            listType: marker.type,
            rawLevel: marker.level,
            text: marker.content
          };
        }
        return {
          type: 'paragraph',
          text: line
        };
      });
      
      // Now, find and process contiguous list-item segments of the same type
      let i = 0;
      while (i < raws.length) {
        const startRaw = raws[i];
        if (startRaw.type !== 'list-item') {
          blocks.push({
            type: startRaw.type,
            text: startRaw.text,
            alignment: seg.alignment
          });
          i++;
          continue;
        }
        
        const segment: RawBlock[] = [];
        const targetType = startRaw.listType;
        while (i < raws.length && raws[i].type === 'list-item' && raws[i].listType === targetType) {
          segment.push(raws[i]);
          i++;
        }
        
        let minLevel = 3;
        for (const item of segment) {
          if (item.rawLevel !== undefined && item.rawLevel < minLevel) {
            minLevel = item.rawLevel;
          }
        }
        
        const shiftAmount = minLevel > 1 ? minLevel - 1 : 0;
        const counters = [0, 0, 0, 0];
        
        for (const item of segment) {
          const rawLvl = item.rawLevel || 1;
          let effLvl = rawLvl - shiftAmount;
          if (effLvl < 1) effLvl = 1;
          if (effLvl > 3) effLvl = 3;
          
          counters[effLvl]++;
          for (let l = effLvl + 1; l <= 3; l++) {
            counters[l] = 0;
          }
          
          let listCount = counters[effLvl];
          let listPrefix = '';
          if (targetType === 'DOT') {
            listPrefix = '•';
          } else if (targetType === 'ROMAN') {
            listPrefix = `${toRoman(listCount)}.`;
          } else if (targetType === 'NUMBERED') {
            if (effLvl === 1) {
              listPrefix = `${counters[1]}.`;
            } else if (effLvl === 2) {
              listPrefix = `${counters[1]}.${counters[2]}`;
            } else if (effLvl === 3) {
              listPrefix = `${counters[1]}.${counters[2]}.${counters[3]}`;
            }
          }
          
          blocks.push({
            type: 'list-item',
            listType: targetType,
            listLevel: effLvl,
            listCount: listCount,
            listPrefix: listPrefix,
            text: item.text,
            alignment: seg.alignment
          });
        }
      }
    }
  }

  return blocks;
}

interface BanglaRenderResult {
  dataUrl: string;
  widthPt: number;
}

/**
 * Uses HTML5 Canvas to shape and render Bangla text using the loaded Google Font.
 * This utilizes the browser's native HarfBuzz/Uniscribe script shaping engine,
 * guaranteeing 100% correct conjunct letters, ligatures, and vowel signs placement.
 */
function renderBanglaToImage(
  text: string,
  fontName: string,
  fontSizePt: number,
  bold: boolean,
  italic: boolean,
  textColorHex: string = '#111827'
): BanglaRenderResult {
  if (typeof document === 'undefined') {
    return { dataUrl: '', widthPt: text.length * fontSizePt * 0.5 };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', widthPt: text.length * fontSizePt * 0.5 };
  }

  // Use an optimized high-DPI scaling factor (4.5 for 324 DPI) to ensure pristine, razor-sharp Bangla text with clean edges and superb zoom legibility, while keeping file size efficiently optimized
  const scale = 4.5;
  const pixelSize = fontSizePt * scale;

  // Set style with fallback to sans-serif
  const styleStr = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${pixelSize}px "${fontName}", sans-serif`;
  ctx.font = styleStr;

  // Measure text with the shaped font
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  
  if (textWidth <= 0) {
    return { dataUrl: '', widthPt: text.length * fontSizePt * 0.5 };
  }

  // Setup canvas geometry with some side safety margins to prevent character clipping
  const xPadding = 2 * scale;
  canvas.width = Math.ceil(textWidth + xPadding * 2);
  canvas.height = Math.ceil(pixelSize * 1.4);

  // Apply properties to the clean canvas
  ctx.font = styleStr;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textColorHex; // Matches standard text hex color or chosen theme color

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the text aligned with standard baseline rules
  const yBaseline = Math.ceil(pixelSize * 1.0);
  ctx.fillText(text, xPadding, yBaseline);

  const dataUrl = canvas.toDataURL('image/png');
  const widthPt = (textWidth / scale);

  return { dataUrl, widthPt };
}

/**
 * Main compilation and generation orchestrator for jsPDF
 */
export async function generatePDF(
  text: string,
  settings: LayoutSettings,
  activeFont: FontItem,
  activeBanglaFont?: FontItem,
  onLog?: (msg: string) => void
): Promise<jsPDF> {
  const log = (msg: string) => onLog?.(msg);
  log(`Starting PDF layout flow compilation...`);

  // Ensure all browser-loaded Google Fonts are fully ready before measuring or drawing
  if (typeof document !== 'undefined' && (document as any).fonts) {
    try {
      await (document as any).fonts.ready;
    } catch (fontErr) {
      console.warn('Font loading check failed:', fontErr);
    }
  }

  // Resolve Theme Colors
  const isCream = settings.documentTheme === 'Cream';
  const isCharcoal = settings.documentTheme === 'Charcoal Black';

  const bgHex = isCream ? '#FAF4E6' : isCharcoal ? '#1A1A1A' : null;
  const textHex = isCream ? '#000000' : isCharcoal ? '#FFFFFF' : '#111827';
  const elementHex = isCream ? '#000000' : isCharcoal ? '#FFFFFF' : '#111827';
  const metaTextHex = isCream ? '#000000' : isCharcoal ? '#FFFFFF' : '#4B5563';

  const borderRGB = isCream ? [0, 0, 0] : isCharcoal ? [255, 255, 255] : [209, 213, 219];
  const tableHeaderBgRGB = isCream ? [235, 225, 205] : isCharcoal ? [40, 40, 40] : [243, 244, 246];

  // Cache of shaped high-DPI canvas renderings of Bangla words/segments
  const banglaCache = new Map<string, { dataUrl: string; widthPt: number; key: string }>();
  const getBanglaRender = (textStr: string, fontNameStr: string, sizePt: number, boldFlag: boolean, italicFlag: boolean) => {
    const key = `${textStr}_${fontNameStr}_${sizePt}_${boldFlag}_${italicFlag}_${textHex}`;
    if (banglaCache.has(key)) {
      return banglaCache.get(key)!;
    }
    const result = renderBanglaToImage(textStr, fontNameStr, sizePt, boldFlag, italicFlag, textHex);
    const cachedResult = { ...result, key };
    banglaCache.set(key, cachedResult);
    return cachedResult;
  };

  // Compute paper geometry (in points: 1 inch = 72 points)
  let paperWidth = 8.5;
  let paperHeight = 11.0;

  if (settings.pageSizePreset === 'Custom') {
    const w = parseFloat(settings.customWidth);
    const h = parseFloat(settings.customHeight);
    paperWidth = isNaN(w) || w <= 0 ? 8.5 : w;
    paperHeight = isNaN(h) || h <= 0 ? 11.0 : h;
  } else {
    const dims = PAGE_SIZES[settings.pageSizePreset] || PAGE_SIZES.Letter;
    paperWidth = dims.width;
    paperHeight = dims.height;
  }

  log(`Paper metrics: ${paperWidth} in x ${paperHeight} in`);

  // Compute margins
  let mTop = 0.5, mBottom = 0.5, mLeft = 0.5, mRight = 0.5;
  if (settings.marginPreset === 'Custom') {
    const mt = parseFloat(settings.customMarginTop);
    const mb = parseFloat(settings.customMarginBottom);
    const ml = parseFloat(settings.customMarginLeft);
    const mr = parseFloat(settings.customMarginRight);
    mTop = isNaN(mt) ? 0.5 : mt;
    mBottom = isNaN(mb) ? 0.5 : mb;
    mLeft = isNaN(ml) ? 0.5 : ml;
    mRight = isNaN(mr) ? 0.5 : mr;
  } else {
    const val = MARGINS[settings.marginPreset] ?? 0.5;
    mTop = val;
    mBottom = val;
    mLeft = val;
    mRight = val;
  }

  log(`Margin borders: Left ${mLeft} in, Right ${mRight} in, Top ${mTop} in, Bottom ${mBottom} in`);

  // Convert to points for jsPDF
  const ptW = paperWidth * 72;
  const ptH = paperHeight * 72;
  const ptL = mLeft * 72;
  const ptR = mRight * 72;
  const ptT = mTop * 72;
  const ptB = mBottom * 72;

  const printableW = ptW - ptL - ptR;
  const printableH = ptH - ptT - ptB;

  log(`Printable grid: Width ${printableW.toFixed(1)} pt, Height ${printableH.toFixed(1)} pt`);

  // Define compression
  const compress = settings.compression === 'Maximum';

  // Instantiate jsPDF
  const doc = new jsPDF({
    orientation: paperWidth > paperHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [ptW, ptH],
    compress: compress,
  });

  const addNewPage = () => {
    doc.addPage([ptW, ptH]);
    if (bgHex) {
      doc.setFillColor(bgHex);
      doc.rect(0, 0, ptW, ptH, 'F');
    }
  };

  // Fill background for page 1
  if (bgHex) {
    doc.setFillColor(bgHex);
    doc.rect(0, 0, ptW, ptH, 'F');
  }

  // Setup Font Family
  let fontName = 'helvetica';
  let fallbackToHelvetica = false;

  if (activeFont.base64 && activeFont.status === 'Downloaded and Applied') {
    if (!isValidTTF(activeFont.base64)) {
      log(`Warning: Custom font "${activeFont.name}" binary format failed validation. Falling back to standard Helvetica.`);
      fallbackToHelvetica = true;
    } else {
      try {
        const filename = `${activeFont.id}.ttf`;
        doc.addFileToVFS(filename, activeFont.base64);
        doc.addFont(filename, activeFont.name, 'normal');
        fontName = activeFont.name;
        log(`Successfully embedded and activated custom font: ${activeFont.name}`);

        // Register italic variant if present
        if (activeFont.italicBase64) {
          if (isValidTTF(activeFont.italicBase64)) {
            const italicFilename = `${activeFont.id}-italic.ttf`;
            doc.addFileToVFS(italicFilename, activeFont.italicBase64);
            doc.addFont(italicFilename, activeFont.name, 'italic');
            log(`Successfully embedded italic variant for custom font: ${activeFont.name}`);
          } else {
            log(`Warning: Italic variant for custom font "${activeFont.name}" failed validation.`);
          }
        }
      } catch (err) {
        log(`Warning: Failed to compile custom font into jsPDF VFS, falling back to standard Helvetica.`);
        fallbackToHelvetica = true;
        console.error(err);
      }
    }
  } else {
    log(`Using standard vector font: Helvetica`);
  }

  // Setup Bangla Font Family
  let banglaFontName = '';
  let fallbackBanglaToHelvetica = false;

  if (activeBanglaFont && activeBanglaFont.base64 && activeBanglaFont.status === 'Downloaded and Applied') {
    if (!isValidTTF(activeBanglaFont.base64)) {
      log(`Warning: Bangla font "${activeBanglaFont.name}" binary format failed validation. Falling back to standard Helvetica.`);
      fallbackBanglaToHelvetica = true;
    } else {
      try {
        const filename = `${activeBanglaFont.id}.ttf`;
        doc.addFileToVFS(filename, activeBanglaFont.base64);
        doc.addFont(filename, activeBanglaFont.name, 'normal');
        banglaFontName = activeBanglaFont.name;
        log(`Successfully embedded and activated Bangla font: ${activeBanglaFont.name}`);
      } catch (err) {
        log(`Warning: Failed to compile Bangla font into jsPDF VFS, falling back to standard Helvetica.`);
        fallbackBanglaToHelvetica = true;
        console.error(err);
      }
    }
  } else {
    log(`No active Bangla font or standard system fallback will be used.`);
  }

  // Parse font settings
  const fontSize = parseFloat(settings.fontSize) || 11;
  const lineSpacing = parseFloat(settings.lineSpacing) || 1.4;
  const linePtHeight = fontSize * lineSpacing;

  log(`Typography parameters: Font Size ${fontSize} pt, Line Spacing multiplier ${lineSpacing}, Line Height ${linePtHeight.toFixed(1)} pt`);

  // Compute multi-column geometry
  const colCount = parseInt(settings.columns) || 1;
  const colGap = 15; // Point-based gap between newspaper columns
  const colW = (printableW - (colCount - 1) * colGap) / colCount;

  log(`Columns: ${colCount} Column(s) of width ${colW.toFixed(1)} pt`);

  // Layout Flow cursor state
  let currentPage = 1;
  let currentCol = 0;
  let cursorY = ptT + fontSize; // Start at top margin + baseline of first line

  // Get font style mappings supporting segments
  const selectFontForSegment = (isBangla: boolean, bold: boolean, italic: boolean) => {
    const activeFontToUse = isBangla ? (banglaFontName || 'helvetica') : fontName;
    const isFallback = isBangla ? fallbackBanglaToHelvetica : fallbackToHelvetica;

    if (activeFontToUse === 'helvetica' || isFallback) {
      if (bold && italic) return doc.setFont('helvetica', 'bolditalic');
      if (bold) return doc.setFont('helvetica', 'bold');
      if (italic) return doc.setFont('helvetica', 'italic');
      return doc.setFont('helvetica', 'normal');
    } else {
      try {
        if (isBangla) {
          return doc.setFont(activeFontToUse, 'normal');
        } else {
          if (italic && activeFont.italicBase64) {
            return doc.setFont(activeFontToUse, 'italic');
          }
          return doc.setFont(activeFontToUse, 'normal');
        }
      } catch (err) {
        console.warn(`Font selection failed for custom font "${activeFontToUse}". Reverting to Helvetica.`, err);
        if (isBangla) {
          fallbackBanglaToHelvetica = true;
        } else {
          fallbackToHelvetica = true;
        }
        return doc.setFont('helvetica', 'normal');
      }
    }
  };

  // Legacy selectFont mapping for backward compatibility
  const selectFont = (bold: boolean, italic: boolean) => {
    return selectFontForSegment(false, bold, italic);
  };

  // Helper to measure word length supporting mixed languages
  const measureWord = (word: WordToken): number => {
    const segments = splitByLanguage(word.text);
    let totalW = 0;
    for (const seg of segments) {
      if (seg.isBangla) {
        const currentBanglaFont = banglaFontName || 'Noto Sans Bengali';
        const renderResult = getBanglaRender(seg.text, currentBanglaFont, fontSize, word.bold, word.italic);
        totalW += renderResult.widthPt;
      } else {
        try {
          selectFontForSegment(false, word.bold, word.italic);
          doc.setFontSize(fontSize);
          totalW += doc.getTextWidth(seg.text);
        } catch (err) {
          console.error(`Font measurement crash for segment "${seg.text}":`, err);
          totalW += seg.text.length * (fontSize * 0.5);
        }
      }
    }
    return totalW;
  };

  // Helper to draw underlines & fake bold for custom fonts if needed, supporting mixed languages
  const drawWord = (word: WordToken, x: number, y: number, wordW: number) => {
    const segments = splitByLanguage(word.text);
    let currentX = x;

    for (const seg of segments) {
      let segW = 0;
      if (seg.isBangla) {
        const currentBanglaFont = banglaFontName || 'Noto Sans Bengali';
        const renderResult = getBanglaRender(seg.text, currentBanglaFont, fontSize, word.bold, word.italic);
        segW = renderResult.widthPt;
        if (renderResult.dataUrl) {
          try {
            // Write invisible text layer to make Bangla selectable and searchable
            try {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(fontSize);
              doc.text(seg.text, currentX, y, { renderingMode: 'invisible' });
            } catch (invErr) {
              // ignore fallback
            }

            // Draw high-fidelity shaped image utilizing identical-resource deduplication (alias) and PDF compression stream
            doc.addImage(
              renderResult.dataUrl,
              'PNG',
              currentX,
              y - fontSize,
              segW,
              fontSize * 1.4,
              renderResult.key,
              'FAST'
            );
          } catch (addImgErr) {
            console.error('jsPDF addImage failed for Bangla segment, falling back to basic text:', addImgErr);
            try {
              selectFontForSegment(true, word.bold, word.italic);
              doc.setFontSize(fontSize);
              doc.text(seg.text, currentX, y);
            } catch (fbErr) {
              // ignore
            }
          }
        }
      } else {
        try {
          selectFontForSegment(false, word.bold, word.italic);
          doc.setFontSize(fontSize);
          segW = doc.getTextWidth(seg.text);

          const currentFontToUse = fontName;
          const currentFallback = fallbackToHelvetica;

          doc.setTextColor(textHex);
          
          // Simulated Bold for Custom Fonts (Since custom single-file TTF doesn't have native bold weights inside jsPDF)
          if (word.bold && currentFontToUse !== 'helvetica' && !currentFallback) {
            doc.text(seg.text, currentX, y);
            doc.text(seg.text, currentX + 0.2, y);
            doc.text(seg.text, currentX + 0.4, y);
          } else {
            doc.text(seg.text, currentX, y);
          }
        } catch (err) {
          console.error(`Font rendering crash for segment "${seg.text}":`, err);
          try {
            doc.setFont('helvetica', word.bold ? 'bold' : 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(textHex);
            doc.text(seg.text, currentX, y);
            segW = doc.getTextWidth(seg.text);
          } catch (fallbackErr) {
            console.error('Fatal Helvetica draw failure:', fallbackErr);
          }
        }
      }
      currentX += segW;
    }

    // Underline renderer
    if (word.underline) {
      try {
        const underlineOffset = fontSize * 0.15;
        const thickness = Math.max(0.5, fontSize * 0.05);
        doc.setLineWidth(thickness);
        doc.setDrawColor(elementHex);
        doc.line(x, y + underlineOffset, x + wordW, y + underlineOffset);
      } catch (err) {
        console.error('Underline line rendering failed:', err);
      }
    }
  };

  // Helper to measure any text string with the correct segment fonts
  const measureTextWithFonts = (textStr: string, bold: boolean, italic: boolean, size: number): number => {
    const segments = splitByLanguage(textStr);
    let totalW = 0;
    for (const seg of segments) {
      if (seg.isBangla) {
        const currentBanglaFont = banglaFontName || 'Noto Sans Bengali';
        const renderResult = getBanglaRender(seg.text, currentBanglaFont, size, bold, italic);
        totalW += renderResult.widthPt;
      } else {
        try {
          selectFontForSegment(false, bold, italic);
          doc.setFontSize(size);
          totalW += doc.getTextWidth(seg.text);
        } catch (err) {
          totalW += seg.text.length * (size * 0.5);
        }
      }
    }
    return totalW;
  };

  // Helper to draw any text string with the correct segment fonts supporting alignments
  const drawTextWithFonts = (textStr: string, x: number, y: number, bold: boolean, italic: boolean, size: number, align: 'left' | 'center' | 'right' = 'left') => {
    const segments = splitByLanguage(textStr);
    let totalW = 0;
    if (align !== 'left') {
      totalW = measureTextWithFonts(textStr, bold, italic, size);
    }

    let startX = x;
    if (align === 'center') {
      startX = x - totalW / 2;
    } else if (align === 'right') {
      startX = x - totalW;
    }

    let currentX = startX;
    for (const seg of segments) {
      let segW = 0;
      if (seg.isBangla) {
        const currentBanglaFont = banglaFontName || 'Noto Sans Bengali';
        const renderResult = getBanglaRender(seg.text, currentBanglaFont, size, bold, italic);
        segW = renderResult.widthPt;
        if (renderResult.dataUrl) {
          try {
            // Write invisible text layer to make Bangla selectable and searchable
            try {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(size);
              doc.text(seg.text, currentX, y, { renderingMode: 'invisible' });
            } catch (invErr) {
              // ignore fallback
            }

            // Draw high-fidelity shaped image utilizing identical-resource deduplication (alias) and PDF compression stream
            doc.addImage(
              renderResult.dataUrl,
              'PNG',
              currentX,
              y - size,
              segW,
              size * 1.4,
              renderResult.key,
              'FAST'
            );
          } catch (addImgErr) {
            console.error('jsPDF addImage failed for Bangla segment in drawTextWithFonts:', addImgErr);
            try {
              selectFontForSegment(true, bold, italic);
              doc.setFontSize(size);
              doc.text(seg.text, currentX, y);
            } catch (fbErr) {
              // ignore
            }
          }
        }
      } else {
        try {
          selectFontForSegment(false, bold, italic);
          doc.setFontSize(size);
          segW = doc.getTextWidth(seg.text);

          const currentFontToUse = fontName;
          const currentFallback = fallbackToHelvetica;

          // Simulated Bold
          if (bold && currentFontToUse !== 'helvetica' && !currentFallback) {
            doc.text(seg.text, currentX, y);
            doc.text(seg.text, currentX + 0.2, y);
            doc.text(seg.text, currentX + 0.4, y);
          } else {
            doc.text(seg.text, currentX, y);
          }
        } catch (err) {
          try {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setFontSize(size);
            doc.text(seg.text, currentX, y);
            segW = doc.getTextWidth(seg.text);
          } catch (fallbackErr) {
            // ignore
          }
        }
      }
      currentX += segW;
    }
  };

  // Parse input text into structural paragraph & list blocks
  const blocks = parseTextToBlocks(text);
  
  for (let pIdx = 0; pIdx < blocks.length; pIdx++) {
    const block = blocks[pIdx];

    // Handle manual page break blocks
    if (block.type === 'page-break') {
      addNewPage();
      currentPage++;
      currentCol = 0;
      cursorY = ptT + fontSize;
      continue;
    }

    // Handle blank-line blocks
    if (block.type === 'blank-line') {
      if (cursorY + fontSize > ptH - ptB) {
        currentCol++;
        if (currentCol >= colCount) {
          addNewPage();
          currentPage++;
          currentCol = 0;
        }
        cursorY = ptT + fontSize;
      } else {
        cursorY += linePtHeight;
      }
      continue;
    }

    // Handle table blocks
    if (block.type === 'table') {
      const rows = block.tableRows || [];
      if (rows.length > 0) {
        let numCols = 0;
        for (const r of rows) {
          if (r.length > numCols) numCols = r.length;
        }

        if (numCols > 0) {
          const cellPadding = 6;
          const cellPaddingY = 5;
          const tableW = colW;

          // Compute column widths proportionally based on natural widths of cells, but ensuring minimum widths to avoid overflow
          const minColWidths = Array(numCols).fill(0);
          const maxColWidths = Array(numCols).fill(0);

          for (let c = 0; c < numCols; c++) {
            const isSerial = c === 0 && (block.isS1 || block.isSA);
            let maxWordW = 0;
            let maxLineW = 0;
            for (let rIdx = 0; rIdx < rows.length; rIdx++) {
              const row = rows[rIdx];
              const cellText = row[c] || '';
              const isHeaderCell = block.hasHeader && rIdx === 0;

              const lines = cellText.split('\n');
              for (const line of lines) {
                const lineTokens = getWordTokens(line);
                if (isHeaderCell) {
                  for (const t of lineTokens) {
                    t.bold = true;
                    t.text = t.text.toUpperCase();
                  }
                }
                let lineW = 0;
                const spaceW = doc.getTextWidth(' ');
                for (let tIdx = 0; tIdx < lineTokens.length; tIdx++) {
                  const t = lineTokens[tIdx];
                  const wordW = measureWord(t);
                  if (wordW > maxWordW) maxWordW = wordW;
                  const spacingW = tIdx > 0 ? spaceW : 0;
                  lineW += spacingW + wordW;
                }
                if (lineW > maxLineW) maxLineW = lineW;
              }
            }
            if (isSerial) {
              const pad = 4;
              const exactW = Math.max(15, maxLineW + 2 * pad);
              minColWidths[c] = exactW;
              maxColWidths[c] = exactW; // No demand to expand
            } else {
              // Give a safe fallback minimum width for a column or longest word + cellPadding * 2
              minColWidths[c] = Math.max(35, maxWordW + 2 * cellPadding);
              maxColWidths[c] = Math.max(minColWidths[c], maxLineW + 2 * cellPadding);
            }
          }

          const sumMinW = minColWidths.reduce((a, b) => a + b, 0);
          const colWidths = Array(numCols).fill(0);

          if (sumMinW >= tableW) {
            // Scale proportionally if we absolutely have to (extremely narrow available area or too many columns)
            for (let c = 0; c < numCols; c++) {
              colWidths[c] = (minColWidths[c] / sumMinW) * tableW;
            }
          } else {
            const serialIndices: number[] = [];
            for (let c = 0; c < numCols; c++) {
              if (c === 0 && (block.isS1 || block.isSA)) {
                serialIndices.push(c);
              }
            }

            // Assign exact minimum width to serial columns
            for (const sIdx of serialIndices) {
              colWidths[sIdx] = minColWidths[sIdx];
            }

            const nonSerialCols = numCols - serialIndices.length;
            if (nonSerialCols > 0) {
              const remainingSpace = tableW - sumMinW;

              // Compute non-serial demands
              const nonSerialDemands = Array(numCols).fill(0);
              for (let c = 0; c < numCols; c++) {
                if (!serialIndices.includes(c)) {
                  nonSerialDemands[c] = maxColWidths[c] - minColWidths[c];
                }
              }
              const totalNonSerialDemand = nonSerialDemands.reduce((a, b) => a + b, 0);

              if (totalNonSerialDemand > 0) {
                for (let c = 0; c < numCols; c++) {
                  if (serialIndices.includes(c)) {
                    // Already assigned
                  } else {
                    colWidths[c] = minColWidths[c] + (nonSerialDemands[c] / totalNonSerialDemand) * remainingSpace;
                  }
                }
              } else {
                // Distribute remaining space equally among non-serial columns
                for (let c = 0; c < numCols; c++) {
                  if (serialIndices.includes(c)) {
                    // Already assigned
                  } else {
                    colWidths[c] = minColWidths[c] + remainingSpace / nonSerialCols;
                  }
                }
              }
            } else {
              // Fallback if there are only serial columns
              for (let c = 0; c < numCols; c++) {
                colWidths[c] = minColWidths[c] + (tableW - sumMinW) / numCols;
              }
            }
          }

          const wrapCellText = (textStr: string, maxW: number, isHeaderCell: boolean): { words: WordToken[]; width: number }[] => {
            const wrapped: { words: WordToken[]; width: number }[] = [];
            const rawLines = textStr.split('\n');
            
            for (const rawLine of rawLines) {
              const tokens = getWordTokens(rawLine);
              if (isHeaderCell) {
                for (const t of tokens) {
                  t.bold = true;
                  t.text = t.text.toUpperCase();
                }
              }
              
              if (tokens.length === 0) {
                wrapped.push({ words: [], width: 0 });
                continue;
              }
              
              let currentLineWords: WordToken[] = [];
              let currentLineW = 0;
              const spaceW = doc.getTextWidth(' ');
              
              for (let wIdx = 0; wIdx < tokens.length; wIdx++) {
                const word = tokens[wIdx];
                const wordW = measureWord(word);
                const spacingW = currentLineWords.length > 0 ? spaceW : 0;
                
                if (currentLineWords.length === 0 || currentLineW + spacingW + wordW <= maxW) {
                  currentLineWords.push(word);
                  currentLineW += spacingW + wordW;
                } else {
                  wrapped.push({ words: currentLineWords, width: currentLineW });
                  currentLineWords = [word];
                  currentLineW = wordW;
                }
              }
              if (currentLineWords.length > 0) {
                wrapped.push({ words: currentLineWords, width: currentLineW });
              }
            }
            return wrapped.length > 0 ? wrapped : [{ words: [], width: 0 }];
          };

          const wrapRow = (rowCells: string[], isHeaderRow: boolean): { words: WordToken[]; width: number }[][] => {
            return Array.from({ length: numCols }).map((_, c) => {
              const cellText = rowCells[c] || '';
              const textW = colWidths[c] - 2 * cellPadding;
              return wrapCellText(cellText, textW, isHeaderRow);
            });
          };

          const getRowHeight = (wrappedRow: { words: WordToken[]; width: number }[][]): number => {
            let maxL = 1;
            for (const cell of wrappedRow) {
              if (cell.length > maxL) maxL = cell.length;
            }
            return maxL * (fontSize * 1.3) + 2 * cellPaddingY;
          };

          const headerRow = block.hasHeader ? rows[0] : null;
          const dataRows = block.hasHeader ? rows.slice(1) : rows;

          const wrappedHeader = headerRow ? wrapRow(headerRow, true) : null;
          const headerHeight = wrappedHeader ? getRowHeight(wrappedHeader) : 0;

          const wrappedDataRows = dataRows.map(row => {
            const wrapped = wrapRow(row, false);
            const height = getRowHeight(wrapped);
            return { wrapped, height };
          });

          const drawRow = (wrappedCells: { words: WordToken[]; width: number }[][], y: number, rowH: number, isHeader: boolean) => {
            const colXOrigin = ptL + currentCol * (colW + colGap);

            // Draw header background
            if (isHeader) {
              doc.setFillColor(tableHeaderBgRGB[0], tableHeaderBgRGB[1], tableHeaderBgRGB[2]);
              doc.rect(colXOrigin, y, tableW, rowH, 'F');
            }

            // Draw cell text
            let currentX = colXOrigin;
            for (let c = 0; c < numCols; c++) {
              const cellLines = wrappedCells[c];
              if (!cellLines) {
                currentX += colWidths[c];
                continue;
              }

              const textW = colWidths[c] - 2 * cellPadding;

              const isSerial = c === 0 && (block.isS1 || block.isSA);
              const alignOption = isSerial ? 'Center' : (block.alignment || 'Left');
              const alignLower = alignOption.toLowerCase() as 'left' | 'center' | 'right';

              const lineHeight = fontSize * 1.3;
              cellLines.forEach((line, lineIdx) => {
                const lineY = y + cellPaddingY + fontSize + lineIdx * lineHeight;

                let startX = currentX + cellPadding;
                if (alignLower === 'center') {
                  startX = currentX + cellPadding + (textW - line.width) / 2;
                } else if (alignLower === 'right') {
                  startX = currentX + cellPadding + (textW - line.width);
                }

                let wordX = startX;
                const spaceW = doc.getTextWidth(' ');

                line.words.forEach((word, wIdx) => {
                  const spacingW = wIdx > 0 ? spaceW : 0;
                  wordX += spacingW;
                  const wordW = measureWord(word);
                  drawWord(word, wordX, lineY, wordW);
                  wordX += wordW;
                });
              });

              currentX += colWidths[c];
            }

            // Draw cell borders
            doc.setDrawColor(borderRGB[0], borderRGB[1], borderRGB[2]);
            doc.setLineWidth(0.5);

            // Horizontal borders
            doc.line(colXOrigin, y, colXOrigin + tableW, y);
            doc.line(colXOrigin, y + rowH, colXOrigin + tableW, y + rowH);

            // Vertical borders
            let borderX = colXOrigin;
            for (let c = 0; c <= numCols; c++) {
              doc.line(borderX, y, borderX, y + rowH);
              if (c < numCols) borderX += colWidths[c];
            }
          };

          const advanceColumnOrPage = () => {
            currentCol++;
            if (currentCol >= colCount) {
              addNewPage();
              currentPage++;
              currentCol = 0;
            }
            cursorY = ptT;
          };

          // Render Header Row first (if present)
          if (wrappedHeader) {
            if (cursorY + headerHeight > ptH - ptB) {
              advanceColumnOrPage();
            }
            drawRow(wrappedHeader, cursorY, headerHeight, true);
            cursorY += headerHeight;
          }

          // Render Data Rows
          for (const dataRow of wrappedDataRows) {
            if (cursorY + dataRow.height > ptH - ptB) {
              advanceColumnOrPage();
              // Repeat Header row if present
              if (wrappedHeader) {
                drawRow(wrappedHeader, cursorY, headerHeight, true);
                cursorY += headerHeight;
              }
            }
            drawRow(dataRow.wrapped, cursorY, dataRow.height, false);
            cursorY += dataRow.height;
          }

          // Add spacing below table block
          cursorY += linePtHeight * 0.5;
        }
      }
      continue;
    }

    const isList = block.type === 'list-item';
    const listLevel = block.listLevel || 1;
    const levelShift = (listLevel - 1) * 24;
    const listMarkerIndent = 8 + levelShift;
    const listTextIndent = 28 + levelShift;
    const blockColW = isList ? (colW - listTextIndent) : colW;

    // Determine prefix and block text to wrap
    let blockText = block.text;
    let prefix = '';
    if (isList) {
      if (block.listType === 'DOT') {
        prefix = '•';
      } else if (block.listType === 'NUMBERED') {
        prefix = `${block.listCount}.`;
      } else if (block.listType === 'ROMAN') {
        prefix = `${toRoman(block.listCount!)}.`;
      }
    }

    // Split block into Word tokens (with nested styling metadata)
    const words = getWordTokens(blockText);
    if (words.length === 0) continue;

    // Wrap word tokens to fit column width `blockColW`
    const wrappedLines: { words: WordToken[]; width: number }[] = [];
    let currentLineWords: WordToken[] = [];
    let currentLineW = 0;

    doc.setFontSize(fontSize);
    const spaceW = doc.getTextWidth(' ');

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const wordW = measureWord(word);

      // Width of space before word if it's not the start of a line
      const spacingW = currentLineWords.length > 0 ? spaceW : 0;

      if (currentLineW + spacingW + wordW <= blockColW) {
        currentLineWords.push(word);
        currentLineW += spacingW + wordW;
      } else {
        // Line full - push to lines
        if (currentLineWords.length > 0) {
          wrappedLines.push({ words: currentLineWords, width: currentLineW });
        }
        // Next line starts with this word
        currentLineWords = [word];
        currentLineW = wordW;
      }
    }

    // Push final remaining words in paragraph
    if (currentLineWords.length > 0) {
      wrappedLines.push({ words: currentLineWords, width: currentLineW });
    }

    // Now flow wrapped lines of paragraph into our pages/columns grid
    for (let lIdx = 0; lIdx < wrappedLines.length; lIdx++) {
      const line = wrappedLines[lIdx];
      const isParagraphLastLine = lIdx === wrappedLines.length - 1;

      // Check vertical page overflow boundaries
      // (Leaving room for bottom header/footer spacing)
      if (cursorY + fontSize > ptH - ptB) {
        // Move to next column
        currentCol++;
        if (currentCol >= colCount) {
          // Columns exhausted - Add new physical page
          addNewPage();
          currentPage++;
          currentCol = 0;
        }
        cursorY = ptT + fontSize;
      }

      // Compute column left origin coordinate
      const colXOrigin = ptL + currentCol * (colW + colGap);

      // Perform Alignment Style
      const currentIndent = isList ? listTextIndent : 0;
      let xCursor = colXOrigin + currentIndent;
      let justifyExtraSpace = 0;
      
      const align = block.alignment || settings.alignment;
      const remainingW = blockColW - line.width;

      if (align === 'Center') {
        xCursor = colXOrigin + currentIndent + Math.max(0, remainingW / 2);
      } else if (align === 'Right') {
        xCursor = colXOrigin + currentIndent + Math.max(0, remainingW);
      } else if (align === 'Justified' || align === 'Auto') {
        // If Justified, or Auto (which defaults to Justified for column layouts)
        // Note: do not justify the last line of a paragraph
        if (!isParagraphLastLine && line.words.length > 1 && remainingW > 0) {
          justifyExtraSpace = remainingW / (line.words.length - 1);
        }
      }

      // Draw prefix if this is the first line of the list-item block
      if (isList && lIdx === 0) {
        doc.setTextColor(textHex);
        const prefixStr = block.listPrefix || '';
        const prefixX = colXOrigin + listMarkerIndent;
        drawTextWithFonts(prefixStr, prefixX, cursorY, false, false, fontSize, 'left');
      }

      // Render all words in the line
      for (let i = 0; i < line.words.length; i++) {
        const word = line.words[i];
        const wordW = measureWord(word);

        drawWord(word, xCursor, cursorY, wordW);

        // Advance cursor
        xCursor += wordW + spaceW + justifyExtraSpace;
      }

      // Move vertical cursor to next text row
      cursorY += linePtHeight;
    }
  }

  log(`Layout flow complete. Total pages compiled: ${currentPage}`);

  // ------------------------------------------------------------------------
  // PAGE DECORATIONS PASS (HEADERS, FOOTERS, PAGE NUMBERS, CUSTOM OVERLAYS)
  // ------------------------------------------------------------------------
  log(`Executing static meta layers decoration pass...`);
  const totalPagesCount = doc.getNumberOfPages();

  for (let pNum = 1; pNum <= totalPagesCount; pNum++) {
    doc.setPage(pNum);

    // 1. Draw Page Counter
    if (settings.markerPlacement !== 'None') {
      const counterVal = formatCounter(pNum, totalPagesCount, settings.counterStyle);
      const cFontSize = parseFloat(settings.counterFontSize) || 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(cFontSize);
      doc.setTextColor(metaTextHex); // Neutral gray color or theme-aware color for pagination

      const counterW = doc.getTextWidth(counterVal);
      const coords = getOverlayCoordinates(
        settings.markerPlacement as any,
        counterW,
        ptW,
        ptH,
        ptL,
        ptR,
        ptT,
        ptB,
        cFontSize
      );

      doc.text(counterVal, coords.x, coords.y, { align: coords.align });
    }

    // 2. Draw Custom Meta Overlay Text Items (up to 3)
    if (settings.customTexts && settings.customTexts.length > 0) {
      settings.customTexts.forEach((overlay) => {
        if (!overlay.text.trim()) return;

        let displayVal = overlay.text;
        if (overlay.uppercase) {
          displayVal = displayVal.toUpperCase();
        }

        const overlayFontSize = 8;
        doc.setTextColor(metaTextHex);

        const textW = measureTextWithFonts(displayVal, overlay.bold, false, overlayFontSize);
        const coords = getOverlayCoordinates(
          overlay.placement,
          textW,
          ptW,
          ptH,
          ptL,
          ptR,
          ptT,
          ptB,
          overlayFontSize
        );

        // Draw overlay text
        drawTextWithFonts(displayVal, coords.x, coords.y, overlay.bold, false, overlayFontSize, coords.align as any);
      });
    }
  }

  log(`Document compilation successful.`);
  return doc;
}

/**
 * Formats the current page number into chosen decoration style
 */
function formatCounter(current: number, total: number, style: string): string {
  switch (style) {
    case 'Page 1, Page 2':
      return `Page ${current}`;
    case '1, 2, 3':
      return `${current}`;
    case '1/4, 2/4, 3/4':
      return `${current}/${total}`;
    case '(1), (2), (3)':
      return `(${current})`;
    case '[1], [2], [3]':
      return `[${current}]`;
    default:
      return `${current}`;
  }
}

/**
 * Calculates correct coordinate systems (x, y) and alignments based on placement configurations
 */
function getOverlayCoordinates(
  placement: 'Top Left' | 'Top Center' | 'Top Right' | 'Bottom Left' | 'Bottom Center' | 'Bottom Right',
  textWidth: number,
  pageW: number,
  pageH: number,
  mL: number,
  mR: number,
  mT: number,
  mB: number,
  fontSize: number
): { x: number; y: number; align: 'left' | 'center' | 'right' } {
  // Vertically place inside standard headers/footers buffers
  const headerY = mT - 15; // 15 points above the text margins bounds
  const footerY = pageH - mB + 15; // 15 points below margins bounds

  switch (placement) {
    case 'Top Left':
      return { x: mL, y: headerY, align: 'left' };
    case 'Top Center':
      return { x: pageW / 2, y: headerY, align: 'center' };
    case 'Top Right':
      return { x: pageW - mR, y: headerY, align: 'right' };
    case 'Bottom Left':
      return { x: mL, y: footerY + fontSize, align: 'left' };
    case 'Bottom Center':
      return { x: pageW / 2, y: footerY + fontSize, align: 'center' };
    case 'Bottom Right':
      return { x: pageW - mR, y: footerY + fontSize, align: 'right' };
  }
}
