/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Custom Select Option Type
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: any;
}

/**
 * -------------------------------------------------------------
 * DOCX to PDF Converter Helper
 * -------------------------------------------------------------
 */
export interface DocxConvertedContent {
  title: string;
  html: string;
  rawText: string;
  paragraphs: string[];
}

export async function parseDocxFile(file: File): Promise<DocxConvertedContent> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawResult = await mammoth.extractRawText({ arrayBuffer });

  const rawText = rawResult.value || '';
  const paragraphs = rawText
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    title: file.name.replace(/\.[^/.]+$/, ''),
    html: result.value || '',
    rawText,
    paragraphs,
  };
}

export function buildDocxPDF(
  content: DocxConvertedContent,
  options: {
    pageSize?: 'a4' | 'letter';
    fontSize?: number;
    lineSpacing?: number;
    margin?: number;
    filename?: string;
  }
): jsPDF {
  const { pageSize = 'a4', fontSize = 11, lineSpacing = 1.4, margin = 40 } = options;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: pageSize,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * lineSpacing;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  let currentY = margin + fontSize;

  for (let i = 0; i < content.paragraphs.length; i++) {
    const para = content.paragraphs[i];

    const isHeading =
      para.length < 70 && (i === 0 || para.endsWith(':') || para.toUpperCase() === para);

    if (isHeading) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize + 3);
      if (currentY + lineHeight * 2 > pageHeight - margin) {
        doc.addPage(pageSize, 'p');
        currentY = margin + fontSize;
      }
      currentY += 6;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
    }

    const lines = doc.splitTextToSize(para, contentWidth);

    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - margin) {
        doc.addPage(pageSize, 'p');
        currentY = margin + fontSize;
      }
      doc.text(line, margin, currentY);
      currentY += lineHeight;
    }

    currentY += lineHeight * 0.4;
  }

  return doc;
}

export function generateDocxPDF(
  content: DocxConvertedContent,
  options: {
    pageSize: 'a4' | 'letter';
    fontSize: number;
    lineSpacing: number;
    margin: number;
    filename: string;
  }
) {
  const doc = buildDocxPDF(content, options);
  let finalName = options.filename.trim();
  if (finalName.toLowerCase().endsWith('.pdf')) {
    finalName = finalName.slice(0, -4).trim();
  }
  if (!finalName) finalName = 'document_converted';
  doc.save(`${finalName}.pdf`);
}

/**
 * -------------------------------------------------------------
 * Excel / XLSX / XLS to PDF Converter Helper
 * -------------------------------------------------------------
 */
export interface ExcelEmbeddedImage {
  name: string;
  dataUrl: string;
  format: string;
  sheetIndex?: number;
  sheetName?: string;
  rawRow: number; // 0-indexed row in raw worksheet
  rawCol: number; // 0-indexed column in raw worksheet
  widthPt?: number;
  heightPt?: number;
}

export interface ExcelSheetData {
  name: string;
  data: string[][];
  headers: string[];
  rows: string[][];
  usedCols: number;
  usedRows: number;
  totalRawRows: number;
  totalRawCols: number;
  trimmedEmptyCols: number;
  rawRowMapping: number[]; // maps each row index to raw row index
  rawColMapping: number[]; // maps each col index to raw col index
  cellImages: Record<string, ExcelEmbeddedImage>; // key: `${cleanRowIdx}_${cleanColIdx}`
  rowImages: Record<number, ExcelEmbeddedImage[]>; // key: cleanRowIdx (all images for that row)
}

/**
 * Checks if a cell value contains meaningful, non-filler data.
 */
function isMeaningfulData(val: any): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  if (
    str === '' ||
    str === '0' ||
    str === '0.0' ||
    str === '0.00' ||
    str === '-' ||
    str === 'N/A' ||
    str === '#N/A' ||
    str === '0%' ||
    str === '0.00%'
  ) {
    return false;
  }
  return true;
}

/**
 * Cleans and trims empty / all-zero columns and rows from an Excel matrix
 */
function cleanAndTrimExcelMatrix(
  rawData: any[][],
  imagesForSheet: ExcelEmbeddedImage[] = []
): {
  cleanedData: string[][];
  headers: string[];
  rows: string[][];
  usedCols: number;
  usedRows: number;
  totalRawRows: number;
  totalRawCols: number;
  trimmedEmptyCols: number;
  rawRowMapping: number[];
  rawColMapping: number[];
  cellImages: Record<string, ExcelEmbeddedImage>;
  rowImages: Record<number, ExcelEmbeddedImage[]>;
} {
  const totalRawRows = rawData.length;
  let totalRawCols = 0;
  rawData.forEach((r) => {
    if (r && r.length > totalRawCols) totalRawCols = r.length;
  });

  if (totalRawRows === 0 || totalRawCols === 0) {
    return {
      cleanedData: [],
      headers: [],
      rows: [],
      usedCols: 0,
      usedRows: 0,
      totalRawRows: 0,
      totalRawCols: 0,
      trimmedEmptyCols: 0,
      rawRowMapping: [],
      rawColMapping: [],
      cellImages: {},
      rowImages: {},
    };
  }

  // Convert all items to clean strings (preserving true empty as "")
  const stringGrid: string[][] = rawData.map((row) =>
    (row || []).map((cell) => {
      if (cell === null || cell === undefined) return '';
      return String(cell).trim();
    })
  );

  // Set of columns that have embedded images
  const colsWithImages = new Set<number>();
  const rowsWithImages = new Set<number>();
  imagesForSheet.forEach((img) => {
    if (img.rawCol >= 0) colsWithImages.add(img.rawCol);
    if (img.rawRow >= 0) rowsWithImages.add(img.rawRow);
  });

  // 1. Identify which columns have at least ONE meaningful text/number or embedded image
  const activeColIndices: number[] = [];
  for (let c = 0; c < totalRawCols; c++) {
    let colHasContent = colsWithImages.has(c);

    if (!colHasContent) {
      for (let r = 0; r < stringGrid.length; r++) {
        const cell = stringGrid[r]?.[c];
        if (isMeaningfulData(cell)) {
          colHasContent = true;
          break;
        }
      }
    }

    if (colHasContent) {
      activeColIndices.push(c);
    }
  }

  // Fallback: If no column had meaningful data, keep any columns that have non-empty strings
  if (activeColIndices.length === 0) {
    for (let c = 0; c < Math.min(totalRawCols, 15); c++) {
      activeColIndices.push(c);
    }
  }

  // 2. Filter rows: Keep rows that have at least one meaningful cell or image
  const cleanedRows: string[][] = [];
  const rawRowMapping: number[] = [];

  for (let r = 0; r < stringGrid.length; r++) {
    const rawRow = stringGrid[r] || [];
    const activeRow = activeColIndices.map((colIdx) => {
      const val = rawRow[colIdx];
      return val !== null && val !== undefined ? String(val) : '';
    });

    const hasContent =
      rowsWithImages.has(r) ||
      activeRow.some((val) => isMeaningfulData(val) || (val.length > 0 && val !== '0'));

    if (hasContent) {
      cleanedRows.push(activeRow);
      rawRowMapping.push(r);
    }
  }

  const usedRows = cleanedRows.length;
  const usedCols = activeColIndices.length;
  const trimmedEmptyCols = Math.max(0, totalRawCols - usedCols);

  let headers: string[] = [];
  let rows: string[][] = [];

  if (usedRows > 0) {
    headers = cleanedRows[0].map((h, i) => (h && h.trim().length > 0 ? h : `Col ${i + 1}`));
    rows = cleanedRows.slice(1);
  }

  // 3. Map images to cleaned row & column indices
  const cellImages: Record<string, ExcelEmbeddedImage> = {};
  const rowImages: Record<number, ExcelEmbeddedImage[]> = {};

  imagesForSheet.forEach((img) => {
    // Find closest or matching cleaned row
    let cleanRowIdx = -1;
    for (let i = 0; i < rawRowMapping.length; i++) {
      if (rawRowMapping[i] === img.rawRow) {
        cleanRowIdx = i;
        break;
      }
    }

    // If exact row was empty, find the next closest row
    if (cleanRowIdx === -1 && rawRowMapping.length > 0) {
      cleanRowIdx = rawRowMapping.reduce((prev, curr, idx) =>
        Math.abs(curr - img.rawRow) < Math.abs(rawRowMapping[prev] - img.rawRow) ? idx : prev
      , 0);
    }

    let cleanColIdx = activeColIndices.indexOf(img.rawCol);
    if (cleanColIdx === -1) cleanColIdx = 0;

    if (cleanRowIdx >= 0) {
      // Offset by 1 for body rows (since row 0 is headers)
      const bodyRowIdx = Math.max(0, cleanRowIdx - 1);
      const key = `${bodyRowIdx}_${cleanColIdx}`;
      cellImages[key] = img;

      if (!rowImages[bodyRowIdx]) rowImages[bodyRowIdx] = [];
      rowImages[bodyRowIdx].push(img);
    }
  });

  return {
    cleanedData: cleanedRows,
    headers,
    rows,
    usedCols,
    usedRows,
    totalRawRows,
    totalRawCols,
    trimmedEmptyCols,
    rawRowMapping,
    rawColMapping: activeColIndices,
    cellImages,
    rowImages,
  };
}

/**
 * Extracts embedded images and their cell coordinates (row/col) from an .xlsx file archive
 */
export async function extractExcelImages(file: File): Promise<ExcelEmbeddedImage[]> {
  const images: ExcelEmbeddedImage[] = [];
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Map media files
    const mediaFiles: Record<string, { dataUrl: string; format: string }> = {};
    const mediaPromises: Promise<void>[] = [];

    zip.forEach((relativePath) => {
      if (relativePath.startsWith('xl/media/')) {
        const filename = relativePath.replace('xl/media/', '');
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (['png', 'jpeg', 'jpg', 'webp', 'gif'].includes(ext)) {
          const promise = async () => {
            const base64 = await zip.file(relativePath)?.async('base64');
            if (base64) {
              const mimeExt = ext === 'jpg' ? 'jpeg' : ext;
              mediaFiles[filename] = {
                dataUrl: `data:image/${mimeExt};base64,${base64}`,
                format: mimeExt.toUpperCase(),
              };
            }
          };
          mediaPromises.push(promise());
        }
      }
    });

    await Promise.all(mediaPromises);

    // 2. Parse drawing relationships: xl/drawings/_rels/drawing*.xml.rels
    const drawingRels: Record<string, Record<string, string>> = {}; // drawingId -> { rId -> targetFilename }
    zip.forEach((relativePath) => {
      if (relativePath.match(/^xl\/drawings\/_rels\/drawing\d+\.xml\.rels$/)) {
        const drawingId = relativePath.replace('xl/drawings/_rels/', '').replace('.xml.rels', '');
        const fileContent = zip.file(relativePath)?.async('text');
        if (fileContent) {
          fileContent.then((xml) => {
            const map: Record<string, string> = {};
            const relMatches = xml.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g);
            for (const match of relMatches) {
              const rId = match[1];
              const target = match[2].replace(/^(\.\.\/)+media\//, '').replace('media/', '');
              map[rId] = target;
            }
            drawingRels[drawingId] = map;
          });
        }
      }
    });

    // Wait short tick for drawing relationships
    await new Promise((r) => setTimeout(r, 60));

    // 3. Parse drawing XML files: xl/drawings/drawing*.xml to locate <xdr:from><xdr:col> and <xdr:row>
    const drawingPromises: Promise<void>[] = [];
    zip.forEach((relativePath) => {
      if (relativePath.match(/^xl\/drawings\/drawing\d+\.xml$/)) {
        const drawingId = relativePath.replace('xl/drawings/', '').replace('.xml', '');
        const p = async () => {
          const xml = (await zip.file(relativePath)?.async('text')) || '';
          const rels = drawingRels[drawingId] || {};

          // Find twoCellAnchor and oneCellAnchor blocks
          const anchorMatches = xml.match(/<xdr:(?:twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g) || [];

          anchorMatches.forEach((anchorXml: string) => {
            const colMatch = anchorXml.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/);
            const rowMatch = anchorXml.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
            const blipMatch = anchorXml.match(/r:embed="([^"]+)"/);

            const col = colMatch ? parseInt(colMatch[1], 10) : 0;
            const row = rowMatch ? parseInt(rowMatch[1], 10) : 0;
            const rId = blipMatch ? blipMatch[1] : '';

            const mediaName = rels[rId] || Object.keys(mediaFiles)[images.length] || '';
            const media = mediaFiles[mediaName];

            if (media) {
              images.push({
                name: mediaName || `image_${images.length + 1}`,
                dataUrl: media.dataUrl,
                format: media.format,
                rawRow: row,
                rawCol: col,
              });
            }
          });
        };
        drawingPromises.push(p());
      }
    });

    await Promise.all(drawingPromises);

    // Fallback: If no drawing positions were parsed, add remaining raw media files
    if (images.length === 0) {
      let fallbackIdx = 0;
      for (const [name, media] of Object.entries(mediaFiles)) {
        images.push({
          name,
          dataUrl: media.dataUrl,
          format: media.format,
          rawRow: fallbackIdx * 2,
          rawCol: 0,
        });
        fallbackIdx++;
      }
    }
  } catch (err) {
    console.warn('Image extraction note:', err);
  }
  return images;
}

export async function parseExcelFile(
  file: File
): Promise<{
  sheetNames: string[];
  sheets: Record<string, ExcelSheetData>;
  embeddedImages: ExcelEmbeddedImage[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Extract all embedded images with their positions
  const embeddedImages = await extractExcelImages(file);

  const sheetNames = workbook.SheetNames;
  const sheets: Record<string, ExcelSheetData> = {};

  sheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) || []) as any[][];

    const cleanResult = cleanAndTrimExcelMatrix(rawData, embeddedImages);

    sheets[sheetName] = {
      name: sheetName,
      data: cleanResult.cleanedData,
      headers: cleanResult.headers,
      rows: cleanResult.rows,
      usedCols: cleanResult.usedCols,
      usedRows: cleanResult.usedRows,
      totalRawRows: cleanResult.totalRawRows,
      totalRawCols: cleanResult.totalRawCols,
      trimmedEmptyCols: cleanResult.trimmedEmptyCols,
      rawRowMapping: cleanResult.rawRowMapping,
      rawColMapping: cleanResult.rawColMapping,
      cellImages: cleanResult.cellImages,
      rowImages: cleanResult.rowImages,
    };
  });

  return { sheetNames, sheets, embeddedImages };
}

export function buildExcelPDF(
  sheet: ExcelSheetData,
  options: {
    orientation: 'portrait' | 'landscape' | 'auto';
    pageSize: 'a4' | 'letter';
    fontSize: number;
    showGridlines: boolean;
    headerRow: boolean;
    theme: 'striped' | 'grid' | 'plain';
    includeImages?: boolean;
    embeddedImages?: ExcelEmbeddedImage[];
    filename?: string;
  }
): jsPDF {
  const {
    orientation: orientChoice,
    pageSize = 'a4',
    fontSize = 8.5,
    showGridlines = true,
    headerRow = true,
    theme = 'grid',
    includeImages = true,
    embeddedImages = [],
  } = options;

  if (!sheet || sheet.usedCols === 0 || sheet.data.length === 0) {
    throw new Error('The selected sheet has no readable data rows.');
  }

  // Determine ideal orientation: If 5 or more columns, landscape prevents squishing
  const isWide = sheet.usedCols >= 5;
  const orient: 'p' | 'l' =
    orientChoice === 'auto' ? (isWide ? 'l' : 'p') : orientChoice === 'landscape' ? 'l' : 'p';

  const doc = new jsPDF({
    orientation: orient,
    unit: 'pt',
    format: pageSize,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 26;

  // Prepare table headers and body
  const tableHead = headerRow && sheet.headers.length > 0 ? [sheet.headers] : [];
  const tableBody = headerRow ? sheet.rows : sheet.data;

  // Calculate dynamic font size and cell padding so cells aren't too narrow
  let cellPadding = 4;
  let dynamicFontSize = fontSize;
  if (sheet.usedCols > 14) {
    dynamicFontSize = Math.max(6, fontSize - 2.5);
    cellPadding = 2;
  } else if (sheet.usedCols > 9) {
    dynamicFontSize = Math.max(7, fontSize - 1.5);
    cellPadding = 2.5;
  }

  // Draw Header Banner on Page 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Sheet: ${sheet.name}`, margin, margin + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Exported ${sheet.usedRows} rows • ${sheet.usedCols} active columns${
      sheet.trimmedEmptyCols > 0 ? ` (${sheet.trimmedEmptyCols} empty/unused columns removed)` : ''
    }`,
    margin,
    margin + 20
  );

  // AutoTable configuration with multi-page support (horizontalPageBreak = false prevents horizontal splitting!)
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: margin + 28,
    margin: { top: margin + 16, right: margin, bottom: margin + 16, left: margin },
    theme: showGridlines ? 'grid' : theme,
    tableWidth: 'auto',
    horizontalPageBreak: false, // ALL columns stay together on the same page!
    pageBreak: 'auto', // Rows automatically paginate downward
    styles: {
      font: 'helvetica',
      fontSize: dynamicFontSize,
      cellPadding,
      overflow: 'linebreak',
      lineColor: [203, 213, 225],
      lineWidth: showGridlines ? 0.5 : 0,
      textColor: [51, 65, 85],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [37, 99, 235], // Rich Blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: showGridlines ? 0.5 : 0,
      lineColor: [29, 78, 216],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // If cell has an embedded image, expand the cell/row min-height so the image fits!
      if (includeImages && data.section === 'body') {
        const key = `${data.row.index}_${data.column.index}`;
        if (sheet.cellImages[key]) {
          data.cell.styles.minCellHeight = 44;
        }
      }
    },
    didDrawCell: (data) => {
      // Draw embedded images at their EXACT corresponding cell position!
      if (includeImages && data.section === 'body') {
        const key = `${data.row.index}_${data.column.index}`;
        const img = sheet.cellImages[key];
        if (img) {
          try {
            const cellW = data.cell.width - 4;
            const cellH = data.cell.height - 4;
            const imgSize = Math.min(cellW, cellH, 40);
            doc.addImage(
              img.dataUrl,
              img.format,
              data.cell.x + 2,
              data.cell.y + 2,
              imgSize,
              imgSize,
              undefined,
              'FAST'
            );
          } catch (e) {
            console.warn('Error drawing image inside cell:', e);
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Subtle footer page numbering
      const totalPageCount = (doc.internal as any).getNumberOfPages
        ? (doc.internal as any).getNumberOfPages()
        : 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} • ${sheet.name}`,
        pageWidth - margin - 75,
        pageHeight - 10
      );
    },
  });

  // If there are unanchored embedded images, append them cleanly in an Embedded Media Appendix
  if (includeImages && embeddedImages.length > 0) {
    const anchoredKeys = Object.keys(sheet.cellImages);
    const unanchoredImages = embeddedImages.filter(
      (img) => !anchoredKeys.some((k) => sheet.cellImages[k]?.name === img.name)
    );

    if (unanchoredImages.length > 0) {
      let lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 25 : margin;

      unanchoredImages.forEach((img, idx) => {
        if (lastY + 160 > pageHeight - margin) {
          doc.addPage(pageSize, orient);
          lastY = margin + 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Workbook Image: ${img.name || `Image ${idx + 1}`}`, margin, lastY);
        lastY += 10;

        try {
          doc.addImage(img.dataUrl, img.format, margin, lastY, 180, 110, undefined, 'FAST');
          lastY += 125;
        } catch (e) {
          console.warn('Could not render image in appendix:', e);
        }
      });
    }
  }

  return doc;
}

export function generateExcelPDF(
  sheet: ExcelSheetData,
  options: {
    orientation: 'portrait' | 'landscape' | 'auto';
    pageSize: 'a4' | 'letter';
    fontSize: number;
    showGridlines: boolean;
    headerRow: boolean;
    theme: 'striped' | 'grid' | 'plain';
    includeImages?: boolean;
    embeddedImages?: ExcelEmbeddedImage[];
    filename: string;
  }
) {
  const doc = buildExcelPDF(sheet, options);
  let finalName = options.filename.trim();
  if (finalName.toLowerCase().endsWith('.pdf')) {
    finalName = finalName.slice(0, -4).trim();
  }
  if (!finalName) finalName = 'spreadsheet_converted';
  doc.save(`${finalName}.pdf`);
}

/**
 * -------------------------------------------------------------
 * PowerPoint / PPTX to PDF Converter Helper
 * -------------------------------------------------------------
 */
export interface PptxSlideData {
  slideNumber: number;
  title: string;
  texts: string[];
  rawText: string;
}

export async function parsePptxFile(
  file: File
): Promise<{ slides: PptxSlideData[]; totalSlides: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slides: PptxSlideData[] = [];
  const slideFiles: string[] = [];

  zip.forEach((relativePath) => {
    if (relativePath.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      slideFiles.push(relativePath);
    }
  });

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const xmlText = (await zip.file(slidePath)?.async('text')) || '';

    const textMatches = xmlText.match(/<a:t>([^<]+)<\/a:t>/g) || [];
    const textItems: string[] = [];

    textMatches.forEach((m: string) => {
      const clean = m.replace(/<\/?a:t>/g, '').trim();
      if (clean) textItems.push(clean);
    });

    const paragraphs: string[] = [];
    const pMatches = xmlText.match(/<a:p[\s\S]*?<\/a:p>/g) || [];
    if (pMatches.length > 0) {
      pMatches.forEach((pXml: string) => {
        const subTexts = (pXml.match(/<a:t>([^<]+)<\/a:t>/g) || []).map((t: string) =>
          t.replace(/<\/?a:t>/g, '')
        );
        const fullPara = subTexts.join('').trim();
        if (fullPara) paragraphs.push(fullPara);
      });
    } else {
      paragraphs.push(...textItems);
    }

    const title = paragraphs.length > 0 ? paragraphs[0] : `Slide ${i + 1}`;
    const bodyTexts = paragraphs.length > 1 ? paragraphs.slice(1) : [];

    slides.push({
      slideNumber: i + 1,
      title,
      texts: bodyTexts,
      rawText: paragraphs.join('\n'),
    });
  }

  return {
    slides,
    totalSlides: slides.length,
  };
}

export function buildPptxPDF(
  slides: PptxSlideData[],
  options: {
    aspectRatio?: '16:9' | '4:3';
    theme?: 'dark' | 'light' | 'corporate';
    filename?: string;
  }
): jsPDF {
  const { aspectRatio = '16:9', theme = 'light' } = options;

  const slideWidth = aspectRatio === '16:9' ? 792 : 720;
  const slideHeight = aspectRatio === '16:9' ? 445.5 : 540;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'pt',
    format: [slideWidth, slideHeight],
    compress: true,
  });

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([slideWidth, slideHeight], 'l');
    }

    // Draw Slide Background
    if (theme === 'dark') {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, slideWidth, slideHeight, 'F');
      doc.setFillColor(30, 41, 59);
      doc.rect(30, 30, slideWidth - 60, slideHeight - 60, 'F');
    } else if (theme === 'corporate') {
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, slideWidth, slideHeight, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, slideWidth, 12, 'F');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, slideWidth, slideHeight, 'F');
    }

    const marginX = 50;
    let currentY = 70;

    // Slide Number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(
      theme === 'dark' ? 148 : 100,
      theme === 'dark' ? 163 : 116,
      theme === 'dark' ? 184 : 139
    );
    doc.text(`SLIDE ${slide.slideNumber} OF ${slides.length}`, slideWidth - marginX - 90, 45);

    // Slide Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(
      theme === 'dark' ? 241 : 15,
      theme === 'dark' ? 245 : 23,
      theme === 'dark' ? 249 : 42
    );

    const titleLines = doc.splitTextToSize(slide.title, slideWidth - marginX * 2 - 100);
    doc.text(titleLines, marginX, currentY);
    currentY += titleLines.length * 26 + 15;

    // Divider
    doc.setDrawColor(
      theme === 'dark' ? 51 : 226,
      theme === 'dark' ? 65 : 232,
      theme === 'dark' ? 85 : 240
    );
    doc.setLineWidth(1);
    doc.line(marginX, currentY - 8, slideWidth - marginX, currentY - 8);
    currentY += 15;

    // Bullet Points
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(
      theme === 'dark' ? 203 : 51,
      theme === 'dark' ? 213 : 65,
      theme === 'dark' ? 225 : 85
    );

    const contentItems =
      slide.texts.length > 0
        ? slide.texts
        : slide.rawText
        ? [slide.rawText]
        : ['(Empty Slide Content)'];

    contentItems.forEach((text) => {
      if (currentY > slideHeight - 50) return;

      const bulletLines = doc.splitTextToSize(text, slideWidth - marginX * 2 - 25);

      doc.setFillColor(
        theme === 'corporate' ? 37 : 147,
        theme === 'corporate' ? 99 : 51,
        theme === 'corporate' ? 235 : 234
      );
      doc.circle(marginX + 6, currentY - 4, 3, 'F');

      doc.text(bulletLines, marginX + 20, currentY);
      currentY += bulletLines.length * 20 + 8;
    });
  });

  return doc;
}

export function generatePptxPDF(
  slides: PptxSlideData[],
  options: {
    aspectRatio: '16:9' | '4:3';
    theme: 'dark' | 'light' | 'corporate';
    filename: string;
  }
) {
  const doc = buildPptxPDF(slides, options);
  let finalName = options.filename.trim();
  if (finalName.toLowerCase().endsWith('.pdf')) {
    finalName = finalName.slice(0, -4).trim();
  }
  if (!finalName) finalName = 'presentation_converted';
  doc.save(`${finalName}.pdf`);
}
