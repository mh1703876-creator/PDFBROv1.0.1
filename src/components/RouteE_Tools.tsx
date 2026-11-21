/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileImage,
  FileText,
  SunMedium,
  Trash2,
  Layers,
  Search,
  ArrowLeft,
  Presentation,
  ChevronRight,
  ShieldAlert,
  Stamp,
  SlidersHorizontal,
  Minimize,
  Scaling,
  Scissors,
  RotateCw,
  ArrowLeftRight,
  FileOutput,
  X,
} from 'lucide-react';

// Tool Subcomponents (16 tools)
import { MergePdfTool } from './tools/MergePdfTool';
import { SplitPdfTool } from './tools/SplitPdfTool';
import { RotatePdfTool } from './tools/RotatePdfTool';
import { DeletePagesTool } from './tools/DeletePagesTool';
import { ReorderPagesTool } from './tools/ReorderPagesTool';
import { ExtractPagesTool } from './tools/ExtractPagesTool';
import { RemoveMetadataTool } from './tools/RemoveMetadataTool';
import { AddWatermarkTool } from './tools/AddWatermarkTool';
import { ImageCompressorTool } from './tools/ImageCompressorTool';
import { ImageResizeTool } from './tools/ImageResizeTool';
import { ImageGrayscaleTool } from './tools/ImageGrayscaleTool';
import { ImageToPdfTool } from './tools/ImageToPdfTool';
import { DocxToPdfTool } from './tools/DocxToPdfTool';
import { PptToPdfTool } from './tools/PptToPdfTool';
import { PdfToImagesTool } from './tools/PdfToImagesTool';
import { ColorToBwTool } from './tools/ColorToBwTool';

export type ToolSubPage =
  | 'hub'
  | 'image-to-pdf'
  | 'docx-to-pdf'
  | 'ppt-to-pdf'
  | 'pdf-to-images'
  | 'color-to-bw'
  | 'remove-metadata'
  | 'add-watermark'
  | 'image-grayscale'
  | 'image-compressor'
  | 'image-resize'
  | 'merge-pdf'
  | 'split-pdf'
  | 'rotate-pdf'
  | 'delete-pages'
  | 'reorder-pages'
  | 'extract-pages';

type ToolCategory = 'all' | 'to-pdf' | 'from-pdf' | 'organize-pdf' | 'security-pdf' | 'image-tools';

interface ToolItem {
  id: ToolSubPage;
  title: string;
  shortName: string;
  category: ToolCategory;
  categoryName: string;
  description: string;
  badge: string;
  formats: string[];
  icon: React.ReactNode;
  accentColor: string;
  borderHoverColor: string;
}

export interface RouteE_ToolsProps {
  initialSubPage?: ToolSubPage;
  initialFiles?: File[] | null;
  onClearInitialFiles?: () => void;
}

export default function RouteE_Tools({
  initialSubPage,
  initialFiles,
  onClearInitialFiles,
}: RouteE_ToolsProps = {}) {
  const [subPage, setSubPage] = useState<ToolSubPage>(initialSubPage || 'hub');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');

  useEffect(() => {
    if (initialSubPage) {
      setSubPage(initialSubPage);
    }
  }, [initialSubPage]);

  // ==========================================
  // TOOL DEFINITIONS LIST (16 TOOLS)
  // ==========================================
  const toolsList: ToolItem[] = [
    // 1. Merge PDF
    {
      id: 'merge-pdf',
      title: 'Merge PDF',
      shortName: 'Merge PDF',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Combine multiple PDF documents into a single file in your preferred order.',
      badge: 'Merge',
      formats: ['PDF', 'Multi-Doc'],
      icon: <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />,
      accentColor: 'from-indigo-500/20 to-blue-500/10 text-indigo-400',
      borderHoverColor: 'hover:border-indigo-500/60',
    },
    // 2. Split PDF
    {
      id: 'split-pdf',
      title: 'Split PDF',
      shortName: 'Split PDF',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Split pages into separate files or custom ranges saved as a ZIP archive.',
      badge: 'Split',
      formats: ['PDF', 'Ranges', 'ZIP'],
      icon: <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />,
      accentColor: 'from-pink-500/20 to-rose-500/10 text-pink-400',
      borderHoverColor: 'hover:border-pink-500/60',
    },
    // 3. Rotate PDF
    {
      id: 'rotate-pdf',
      title: 'Rotate PDF',
      shortName: 'Rotate PDF',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Rotate single pages or the entire document by 90, 180, or 270 degrees.',
      badge: 'Rotate',
      formats: ['PDF', '90°/180°/270°'],
      icon: <RotateCw className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />,
      accentColor: 'from-amber-500/20 to-yellow-500/10 text-amber-400',
      borderHoverColor: 'hover:border-amber-500/60',
    },
    // 4. Delete PDF Pages
    {
      id: 'delete-pages',
      title: 'Delete Pages',
      shortName: 'Delete Pages',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Select and remove unwanted or blank pages with visual previews.',
      badge: 'Remove',
      formats: ['PDF', 'Page Stripper'],
      icon: <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />,
      accentColor: 'from-red-500/20 to-rose-500/10 text-red-400',
      borderHoverColor: 'hover:border-red-500/60',
    },
    // 5. Reorder PDF Pages
    {
      id: 'reorder-pages',
      title: 'Reorder Pages',
      shortName: 'Reorder Pages',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Rearrange and reorder pages by dragging or using quick move buttons.',
      badge: 'Reorder',
      formats: ['PDF', 'Custom Order'],
      icon: <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />,
      accentColor: 'from-violet-500/20 to-purple-500/10 text-violet-400',
      borderHoverColor: 'hover:border-violet-500/60',
    },
    // 6. Extract PDF Pages
    {
      id: 'extract-pages',
      title: 'Extract Pages',
      shortName: 'Extract Pages',
      category: 'organize-pdf',
      categoryName: 'Organize PDF',
      description: 'Pick specific pages or enter page ranges to export as a new PDF.',
      badge: 'Extract',
      formats: ['PDF', 'Selective'],
      icon: <FileOutput className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400" />,
      accentColor: 'from-teal-500/20 to-emerald-500/10 text-teal-400',
      borderHoverColor: 'hover:border-teal-500/60',
    },
    // 7. Remove PDF Metadata
    {
      id: 'remove-metadata',
      title: 'Remove Metadata',
      shortName: 'Remove Metadata',
      category: 'security-pdf',
      categoryName: 'Security & Optimize',
      description: 'Inspect and strip author tags, creation dates, and metadata properties.',
      badge: 'Privacy',
      formats: ['PDF', 'Sanitize'],
      icon: <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />,
      accentColor: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
      borderHoverColor: 'hover:border-emerald-500/60',
    },
    // 8. Add Watermark to PDF
    {
      id: 'add-watermark',
      title: 'Add Watermark',
      shortName: 'Add Watermark',
      category: 'security-pdf',
      categoryName: 'Security & Optimize',
      description: 'Stamp custom text watermarks with opacity, angle, and layout controls.',
      badge: 'Watermark',
      formats: ['PDF', 'Watermark Stamp'],
      icon: <Stamp className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />,
      accentColor: 'from-cyan-500/20 to-sky-500/10 text-cyan-400',
      borderHoverColor: 'hover:border-cyan-500/60',
    },
    // 9. Image Compressor
    {
      id: 'image-compressor',
      title: 'Compress Image',
      shortName: 'Compress Image',
      category: 'image-tools',
      categoryName: 'Image Tools',
      description: 'Compress JPG, PNG, and WebP images with custom quality and resolution scale.',
      badge: 'Compress',
      formats: ['JPG', 'PNG', 'WEBP'],
      icon: <Minimize className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />,
      accentColor: 'from-emerald-500/20 to-green-500/10 text-emerald-400',
      borderHoverColor: 'hover:border-emerald-500/60',
    },
    // 10. Resize Image
    {
      id: 'image-resize',
      title: 'Resize Image',
      shortName: 'Resize Image',
      category: 'image-tools',
      categoryName: 'Image Tools',
      description: 'Resize image dimensions by exact pixels or percentage scale factor.',
      badge: 'Resize',
      formats: ['JPG', 'PNG', 'WEBP', 'Scale'],
      icon: <Scaling className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400" />,
      accentColor: 'from-sky-500/20 to-blue-500/10 text-sky-400',
      borderHoverColor: 'hover:border-sky-500/60',
    },
    // 11. Convert Image to Grayscale
    {
      id: 'image-grayscale',
      title: 'Grayscale Image',
      shortName: 'Grayscale Image',
      category: 'image-tools',
      categoryName: 'Image Tools',
      description: 'Convert color pictures to grayscale, black and white, or vintage sepia.',
      badge: 'Filter',
      formats: ['JPG', 'PNG', 'Grayscale', 'Sepia'],
      icon: <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300" />,
      accentColor: 'from-slate-500/20 to-zinc-500/10 text-slate-300',
      borderHoverColor: 'hover:border-slate-400',
    },
    // 12. Image to PDF
    {
      id: 'image-to-pdf',
      title: 'Image to PDF',
      shortName: 'Image to PDF',
      category: 'to-pdf',
      categoryName: 'Convert to PDF',
      description: 'Convert JPG, PNG, and WebP pictures into a paginated PDF document.',
      badge: 'Convert',
      formats: ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP'],
      icon: <FileImage className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />,
      accentColor: 'from-purple-500/20 to-pink-500/10 text-purple-400',
      borderHoverColor: 'hover:border-purple-500/60',
    },
    // 13. DOCX to PDF
    {
      id: 'docx-to-pdf',
      title: 'Word to PDF',
      shortName: 'Word to PDF',
      category: 'to-pdf',
      categoryName: 'Convert to PDF',
      description: 'Convert Word DOCX and DOC documents into clean, paginated PDF files.',
      badge: 'Convert',
      formats: ['DOCX', 'DOC'],
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />,
      accentColor: 'from-blue-500/20 to-indigo-500/10 text-blue-400',
      borderHoverColor: 'hover:border-blue-500/60',
    },
    // 14. PowerPoint to PDF
    {
      id: 'ppt-to-pdf',
      title: 'PowerPoint to PDF',
      shortName: 'PowerPoint to PDF',
      category: 'to-pdf',
      categoryName: 'Convert to PDF',
      description: 'Convert presentation slide decks into landscape PDF slide documents.',
      badge: 'Convert',
      formats: ['PPTX', 'PPT'],
      icon: <Presentation className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />,
      accentColor: 'from-amber-500/20 to-orange-500/10 text-amber-400',
      borderHoverColor: 'hover:border-amber-500/60',
    },
    // 15. PDF to Images
    {
      id: 'pdf-to-images',
      title: 'PDF to Images',
      shortName: 'PDF to Images',
      category: 'from-pdf',
      categoryName: 'Convert from PDF',
      description: 'Extract all pages into high-resolution JPG or PNG image files.',
      badge: 'Extract',
      formats: ['PDF', 'JPG', 'PNG', 'ZIP'],
      icon: <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />,
      accentColor: 'from-cyan-500/20 to-blue-500/10 text-cyan-400',
      borderHoverColor: 'hover:border-cyan-500/60',
    },
    // 16. Color PDF to Black & White
    {
      id: 'color-to-bw',
      title: 'Color to B&W',
      shortName: 'Color to B&W',
      category: 'security-pdf',
      categoryName: 'Security & Optimize',
      description: 'Convert color PDF pages to monochrome black and white or grayscale.',
      badge: 'Enhance',
      formats: ['PDF', 'Grayscale', 'B&W'],
      icon: <SunMedium className="h-5 w-5 sm:h-6 sm:w-6 text-rose-400" />,
      accentColor: 'from-rose-500/20 to-pink-500/10 text-rose-400',
      borderHoverColor: 'hover:border-rose-500/60',
    },
  ];

  // Category Filter Options
  const categoriesList: { id: ToolCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Tools', count: toolsList.length },
    { id: 'organize-pdf', label: 'Organize PDF', count: toolsList.filter((t) => t.category === 'organize-pdf').length },
    { id: 'security-pdf', label: 'Security & Optimize', count: toolsList.filter((t) => t.category === 'security-pdf').length },
    { id: 'image-tools', label: 'Image Tools', count: toolsList.filter((t) => t.category === 'image-tools').length },
    { id: 'to-pdf', label: 'Convert to PDF', count: toolsList.filter((t) => t.category === 'to-pdf').length },
    { id: 'from-pdf', label: 'Convert from PDF', count: toolsList.filter((t) => t.category === 'from-pdf').length },
  ];

  // Filter tools based on category and search query
  const filteredTools = toolsList.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch =
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.formats.some((fmt) => fmt.toLowerCase().includes(query)) ||
      tool.categoryName.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const currentActiveTool = toolsList.find((t) => t.id === subPage);

  return (
    <div className="flex h-full flex-col bg-[#0B0F19] text-slate-100 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        {/* ========================================================================= */}
        {/* MAIN TOOL HUB VIEW                                                        */}
        {/* ========================================================================= */}
        {subPage === 'hub' ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Tools Hub
              </h1>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Fast, private document and image tools running 100% in your browser.
              </p>
            </div>

            {/* Search and Category Filter Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full rounded-xl border border-[#1F2937] bg-[#111827] py-2.5 pl-10 pr-10 text-xs font-semibold text-white placeholder-[#9CA3AF] shadow-sm transition-all focus:border-indigo-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'bg-[#111827] text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white border border-[#1F2937]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-[#1F2937] text-[#9CA3AF]'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-COLUMN TOOL CARDS GRID */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => setSubPage(tool.id)}
                  className={`group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-[#1F2937] bg-[#111827]/80 p-3 sm:p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111827] ${tool.borderHoverColor} cursor-pointer`}
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`rounded-xl bg-gradient-to-br ${tool.accentColor} p-2 sm:p-3 ring-1 ring-white/10 group-hover:scale-105 transition-transform shrink-0`}
                      >
                        {tool.icon}
                      </div>

                      <span className="rounded-full bg-[#1F2937] border border-[#374151] px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-semibold text-[#D1D5DB] whitespace-nowrap">
                        {tool.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-2.5 sm:mt-3.5">
                      <h3 className="text-xs sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-[10px] sm:text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Formats & Launch button */}
                  <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-[#1F2937]/70 pt-2 sm:pt-3">
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {tool.formats.slice(0, 2).map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded bg-[#0B0F19] px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#9CA3AF]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform ml-auto sm:ml-0">
                      <span>Open</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1F2937] bg-[#111827] p-12 text-center">
                <Search className="h-8 w-8 text-[#9CA3AF]" />
                <h3 className="mt-3 text-sm font-bold text-white">No matching tools found</h3>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Try adjusting your search query or select another category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* DEDICATED SUB-PAGE TOOL ROUTER                                            */
          /* ========================================================================= */
          <div className="space-y-5">
            {/* Back Navigation Bar */}
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSubPage('hub');
                    if (onClearInitialFiles) onClearInitialFiles();
                  }}
                  className="flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] hover:bg-[#1F2937] hover:text-white transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Hub</span>
                </button>
              </div>

              {currentActiveTool && (
                <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                  <span>Tools</span>
                  <span>/</span>
                  <span className="font-semibold text-white">{currentActiveTool.shortName}</span>
                </div>
              )}
            </div>

            {/* Subpage Header Banner */}
            {currentActiveTool && (
              <div className="flex items-center gap-3 rounded-xl border border-[#1F2937] bg-[#111827]/80 p-3 sm:p-4 max-w-3xl mx-auto shadow-md">
                <div className={`rounded-lg bg-gradient-to-br ${currentActiveTool.accentColor} p-2 ring-1 ring-white/10 shrink-0`}>
                  {currentActiveTool.icon}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-snug">{currentActiveTool.title}</h2>
                  <p className="text-[11px] sm:text-xs text-[#9CA3AF] leading-tight mt-0.5">
                    {currentActiveTool.description}
                  </p>
                </div>
              </div>
            )}

            {/* SUB-PAGE: MERGE PDF */}
            {subPage === 'merge-pdf' && <MergePdfTool initialFiles={initialFiles} />}

            {/* SUB-PAGE: SPLIT PDF */}
            {subPage === 'split-pdf' && <SplitPdfTool />}

            {/* SUB-PAGE: ROTATE PDF */}
            {subPage === 'rotate-pdf' && <RotatePdfTool />}

            {/* SUB-PAGE: DELETE PAGES */}
            {subPage === 'delete-pages' && <DeletePagesTool />}

            {/* SUB-PAGE: REORDER PAGES */}
            {subPage === 'reorder-pages' && <ReorderPagesTool />}

            {/* SUB-PAGE: EXTRACT PAGES */}
            {subPage === 'extract-pages' && <ExtractPagesTool />}

            {/* SUB-PAGE: REMOVE METADATA */}
            {subPage === 'remove-metadata' && <RemoveMetadataTool />}

            {/* SUB-PAGE: ADD WATERMARK */}
            {subPage === 'add-watermark' && <AddWatermarkTool />}

            {/* SUB-PAGE: IMAGE COMPRESSOR */}
            {subPage === 'image-compressor' && <ImageCompressorTool initialFiles={initialFiles} />}

            {/* SUB-PAGE: RESIZE IMAGE */}
            {subPage === 'image-resize' && <ImageResizeTool initialFiles={initialFiles} />}

            {/* SUB-PAGE: IMAGE GRAYSCALE */}
            {subPage === 'image-grayscale' && <ImageGrayscaleTool initialFiles={initialFiles} />}

            {/* SUB-PAGE: IMAGE TO PDF */}
            {subPage === 'image-to-pdf' && <ImageToPdfTool initialFiles={initialFiles} />}

            {/* SUB-PAGE: DOCX TO PDF */}
            {subPage === 'docx-to-pdf' && <DocxToPdfTool />}

            {/* SUB-PAGE: PPT TO PDF */}
            {subPage === 'ppt-to-pdf' && <PptToPdfTool />}

            {/* SUB-PAGE: PDF TO IMAGES */}
            {subPage === 'pdf-to-images' && <PdfToImagesTool initialFile={initialFiles?.[0]} />}

            {/* SUB-PAGE: COLOR PDF TO B&W */}
            {subPage === 'color-to-bw' && <ColorToBwTool initialFile={initialFiles?.[0]} />}
          </div>
        )}
      </div>
    </div>
  );
}
