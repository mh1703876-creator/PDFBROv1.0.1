/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  ClipboardCopy, 
  FileUp, 
  Plus, 
  Type, 
  Sliders, 
  PenLine, 
  Eye, 
  Search, 
  Check, 
  X, 
  ChevronDown, 
  Upload,
  Bookmark,
  Info,
  Download,
  Monitor,
  Briefcase,
  Feather,
  Zap,
  ShieldCheck,
  Droplet,
  Files
} from 'lucide-react';
import { 
  LayoutSettings, 
  FontItem, 
  BottomTabType, 
  SavedTemplate, 
  CustomTextOverlay,
  PageSizePreset,
  MarginPreset,
  ColumnLayout,
  AlignmentType,
  MarkerPlacementType,
  CounterStyleType,
  CompressionType,
  DocumentThemeType
} from '../types';
import { PRELOADED_FONTS, downloadGoogleFont, injectFontFace } from '../utils/fontLoader';
import { PdfEditorTutorial, FirstTimeTutorialPrompt } from './PdfEditorTutorial';

interface RouteAPDFPlatformProps {
  textContent: string;
  setTextContent: (text: string) => void;
  settings: LayoutSettings;
  setSettings: React.Dispatch<React.SetStateAction<LayoutSettings>>;
  activeFont: FontItem;
  setActiveFont: (font: FontItem) => void;
  fontsList: FontItem[];
  setFontsList: React.Dispatch<React.SetStateAction<FontItem[]>>;
  activeBanglaFont: FontItem;
  setActiveBanglaFont: (font: FontItem) => void;
  banglaFontsList: FontItem[];
  setBanglaFontsList: React.Dispatch<React.SetStateAction<FontItem[]>>;
  isCompiling: boolean;
  onCompilationLogs: string[];
  clearLogs: () => void;
  addLog: (msg: string) => void;
  isTutorialOpen?: boolean;
  setIsTutorialOpen?: (open: boolean) => void;
  showFirstTimePrompt?: boolean;
  onStartTutorial?: () => void;
  onDismissPrompt?: () => void;
}

const TEMPLATE_THEMES = [
  {
    border: 'border-blue-500/80 hover:border-blue-400',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    text: 'text-blue-400 hover:text-blue-300',
    iconBg: 'bg-blue-500/20',
    iconText: 'text-blue-400',
    icon: Monitor,
  },
  {
    border: 'border-emerald-500/80 hover:border-emerald-400',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400 hover:text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-400',
    icon: Briefcase,
  },
  {
    border: 'border-violet-500/80 hover:border-violet-400',
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    text: 'text-violet-400 hover:text-violet-300',
    iconBg: 'bg-violet-500/20',
    iconText: 'text-violet-400',
    icon: Feather,
  },
  {
    border: 'border-orange-500/80 hover:border-orange-400',
    bg: 'bg-orange-500/10 hover:bg-orange-500/20',
    text: 'text-orange-400 hover:text-orange-300',
    iconBg: 'bg-orange-500/20',
    iconText: 'text-orange-400',
    icon: Zap,
  },
  {
    border: 'border-indigo-500/80 hover:border-indigo-400',
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    text: 'text-indigo-400 hover:text-indigo-300',
    iconBg: 'bg-indigo-500/20',
    iconText: 'text-indigo-400',
    icon: ShieldCheck,
  },
  {
    border: 'border-cyan-500/80 hover:border-cyan-400',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    text: 'text-cyan-400 hover:text-cyan-300',
    iconBg: 'bg-cyan-500/20',
    iconText: 'text-cyan-400',
    icon: Droplet,
  },
];

export default function RouteA_PDFPlatform({
  textContent,
  setTextContent,
  settings,
  setSettings,
  activeFont,
  setActiveFont,
  fontsList,
  setFontsList,
  activeBanglaFont,
  setActiveBanglaFont,
  banglaFontsList,
  setBanglaFontsList,
  isCompiling,
  onCompilationLogs,
  clearLogs,
  addLog,
  isTutorialOpen = false,
  setIsTutorialOpen,
  showFirstTimePrompt = false,
  onStartTutorial,
  onDismissPrompt,
}: RouteAPDFPlatformProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<BottomTabType>('input');

  // Snapshots (Undo / Redo stack)
  const [snapshots, setSnapshots] = useState<string[]>([textContent]);
  const [snapshotIndex, setSnapshotIndex] = useState<number>(0);

  // Custom Font uploading state
  const [fontLanguageMode, setFontLanguageMode] = useState<'English' | 'Bangla'>('English');
  const [fontSearch, setFontSearch] = useState<string>('');
  const [selectedFontCategory, setSelectedFontCategory] = useState<string>('All');
  const [fontLoadingState, setFontLoadingState] = useState<string | null>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Template Save State
  const [templateName, setTemplateName] = useState<string>('');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateToDelete, setTemplateToDelete] = useState<SavedTemplate | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState<string>('');

  // Open custom dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Calculate real-time stats
  const charCount = textContent.length;
  const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length;
  const lineCount = textContent.split('\n').filter(line => line.length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Initialize templates from Local Storage
  useEffect(() => {
    const cached = localStorage.getItem('pdfbro_saved_templates');
    if (cached) {
      try {
        setSavedTemplates(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync snapshot tracking on external raw text update
  const updateTextAndHistory = (newText: string) => {
    setTextContent(newText);
    const newSnapshots = snapshots.slice(0, snapshotIndex + 1);
    if (newSnapshots[newSnapshots.length - 1] !== newText) {
      const updated = [...newSnapshots, newText].slice(-40); // Track max 40 snapshots
      setSnapshots(updated);
      setSnapshotIndex(updated.length - 1);
    }
  };

  // Undo / Redo triggers
  const handleUndo = () => {
    if (snapshotIndex > 0) {
      const idx = snapshotIndex - 1;
      setSnapshotIndex(idx);
      setTextContent(snapshots[idx]);
    }
  };

  const handleRedo = () => {
    if (snapshotIndex < snapshots.length - 1) {
      const idx = snapshotIndex + 1;
      setSnapshotIndex(idx);
      setTextContent(snapshots[idx]);
    }
  };

  // Cut to Clipboard & Clear
  const handleCut = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      updateTextAndHistory('');
    } catch (err) {
      // Fallback if browser permission is blocked
      updateTextAndHistory('');
    }
  };

  const handleClear = () => {
    updateTextAndHistory('');
  };

  // File Upload parser on Page 1
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readTxtFile(file);
    }
  };

  const readTxtFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || '';
      updateTextAndHistory(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleTextareaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTextareaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      readTxtFile(file);
    }
  };

  // Custom Font Selector & Compiler
  const handleFontSelect = async (font: FontItem) => {
    if (font.status === 'Downloaded and Applied') {
      setActiveFont(font);
      return;
    }

    // Toggle compilation progress state
    setFontLoadingState(`Downloading ${font.name}...`);
    setFontsList(prev => prev.map(f => f.id === font.id ? { ...f, status: 'Compiling...' } : f));

    try {
      const fontData = await downloadGoogleFont(font.name, 'normal');
      
      // Inject to client DOM @font-face style sheets
      injectFontFace(font.name, fontData.base64, fontData.format, 'normal');

      let italicBase64: string | undefined = undefined;
      try {
        const italicFontData = await downloadGoogleFont(font.name, 'italic');
        italicBase64 = italicFontData.base64;
        injectFontFace(font.name, italicFontData.base64, italicFontData.format, 'italic');
      } catch (err) {
        console.warn(`Could not load italic style for font ${font.name}:`, err);
      }
      
      const updatedFont: FontItem = {
        ...font,
        base64: fontData.base64,
        italicBase64,
        status: 'Downloaded and Applied'
      };

      setFontsList(prev => prev.map(f => f.id === font.id ? updatedFont : f));
      setActiveFont(updatedFont);
      setFontLoadingState(null);
      addLog(`Font '${font.name}' compiled and applied successfully.`);
    } catch (err: any) {
      const failedFont: FontItem = {
        ...font,
        status: 'Failed',
        error: err.message || 'Connection Timeout'
      };
      setFontsList(prev => prev.map(f => f.id === font.id ? failedFont : f));
      setFontLoadingState(null);
      addLog(`Error loading font '${font.name}': ${err.message || 'Fetch failure'}`);
    }
  };

  // Bangla Font Selector & Compiler
  const handleBanglaFontSelect = async (font: FontItem) => {
    if (font.status === 'Downloaded and Applied') {
      setActiveBanglaFont(font);
      return;
    }

    setFontLoadingState(`Downloading ${font.name}...`);
    setBanglaFontsList(prev => prev.map(f => f.id === font.id ? { ...f, status: 'Compiling...' } : f));

    try {
      const fontData = await downloadGoogleFont(font.name);
      
      injectFontFace(font.name, fontData.base64, fontData.format);
      
      const updatedFont: FontItem = {
        ...font,
        base64: fontData.base64,
        status: 'Downloaded and Applied'
      };

      setBanglaFontsList(prev => prev.map(f => f.id === font.id ? updatedFont : f));
      setActiveBanglaFont(updatedFont);
      setFontLoadingState(null);
      addLog(`Bangla Font '${font.name}' compiled and applied successfully.`);
    } catch (err: any) {
      const failedFont: FontItem = {
        ...font,
        status: 'Failed',
        error: err.message || 'Connection Timeout'
      };
      setBanglaFontsList(prev => prev.map(f => f.id === font.id ? failedFont : f));
      setFontLoadingState(null);
      addLog(`Error loading Bangla font '${font.name}': ${err.message || 'Fetch failure'}`);
    }
  };

  // Drag-and-drop Custom TTF/OTF File Upload
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff'].includes(fileExt || '')) {
      addLog(`Error: Incompatible font format. Please provide .ttf, .otf, or .woff files.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) return;

      try {
        // Convert arrayBuffer to base64
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        const fontFriendlyName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, '');

        // Inject font styles dynamically
        const formatMap: Record<string, string> = { ttf: 'truetype', otf: 'opentype', woff: 'woff' };
        injectFontFace(fontFriendlyName, base64, formatMap[fileExt || 'ttf'] || 'truetype');

        const newCustomFont: FontItem = {
          id: `custom-${Date.now()}`,
          name: fontFriendlyName,
          category: 'Custom',
          base64: base64,
          status: 'Downloaded and Applied'
        };

        setFontsList(prev => [newCustomFont, ...prev]);
        setActiveFont(newCustomFont);
        addLog(`Successfully uploaded and compiled custom font: ${fontFriendlyName}`);
      } catch (err: any) {
        addLog(`Font extraction failed: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Custom Dropdown Picker Component Wrapper
  const CustomDropdown = <T extends string>({
    id,
    label,
    value,
    options,
    onChange
  }: {
    id: string;
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (val: T) => void;
  }) => {
    const isOpen = openDropdownId === id;
    const selectedOption = options.find(o => o.value === value);

    return (
      <div className="relative flex flex-col gap-1.5 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          {label}
        </span>
        <button
          onClick={() => setOpenDropdownId(isOpen ? null : id)}
          className="flex h-11 items-center justify-between rounded-lg border border-[#1F2937] bg-[#0B0F19] px-4 font-sans text-sm text-[#F9FAFB] hover:border-[#4B5563]"
        >
          <span>{selectedOption?.label || value}</span>
          <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
        </button>

        {isOpen && (
          <>
            {/* Overlay click catcher to close dropdown */}
            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
            <div className="absolute top-[64px] left-0 z-20 w-full max-h-56 overflow-y-auto rounded-lg border border-[#1F2937] bg-[#111827] py-1 shadow-xl">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpenDropdownId(null);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="h-4 w-4 text-blue-500" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Manage custom global overlays texts
  const handleAddCustomText = () => {
    if (settings.customTexts.length >= 3) {
      addLog(`Maximum of 3 custom overlay items reached.`);
      return;
    }
    const newItem: CustomTextOverlay = {
      id: `text-overlay-${Date.now()}`,
      text: 'PDFBRO CREATIONS',
      placement: 'Top Left',
      bold: false,
      uppercase: true
    };
    setSettings(prev => ({
      ...prev,
      customTexts: [...prev.customTexts, newItem]
    }));
  };

  const handleUpdateCustomText = (id: string, updates: Partial<CustomTextOverlay>) => {
    setSettings(prev => ({
      ...prev,
      customTexts: prev.customTexts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleRemoveCustomText = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customTexts: prev.customTexts.filter(t => t.id !== id)
    }));
  };

  // Save current settings config to templates local storage
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      settings: { ...settings },
      fontId: activeFont.id,
      banglaFontId: activeBanglaFont?.id
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('pdfbro_saved_templates', JSON.stringify(updated));
    setTemplateName('');
    addLog(`Template '${newTemplate.name}' saved successfully.`);
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    setSettings({
      ...tpl.settings,
      documentTheme: tpl.settings.documentTheme || 'White'
    });
    const linkedFont = fontsList.find(f => f.id === tpl.fontId);
    if (linkedFont) {
      handleFontSelect(linkedFont);
    }
    if (tpl.banglaFontId) {
      const linkedBanglaFont = banglaFontsList.find(f => f.id === tpl.banglaFontId);
      if (linkedBanglaFont) {
        handleBanglaFontSelect(linkedBanglaFont);
      }
    }
    addLog(`Layout template '${tpl.name}' applied.`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tpl = savedTemplates.find(t => t.id === id);
    if (tpl) {
      setTemplateToDelete(tpl);
    }
  };

  const handleConfirmDelete = () => {
    if (!templateToDelete) return;
    const updated = savedTemplates.filter(t => t.id !== templateToDelete.id);
    setSavedTemplates(updated);
    localStorage.setItem('pdfbro_saved_templates', JSON.stringify(updated));
    addLog(`Template '${templateToDelete.name}' deleted successfully.`);
    setTemplateToDelete(null);
  };

  const handleCancelDelete = () => {
    setTemplateToDelete(null);
  };

  const handleStartRename = (tpl: SavedTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(tpl.id);
    setEditingTemplateName(tpl.name);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTemplateName.trim()) return;
    const updated = savedTemplates.map(t =>
      t.id === id ? { ...t, name: editingTemplateName.trim() } : t
    );
    setSavedTemplates(updated);
    localStorage.setItem('pdfbro_saved_templates', JSON.stringify(updated));
    setEditingTemplateId(null);
    addLog(`Template renamed successfully.`);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(null);
  };

  // Export templates as a portable backup JSON file
  const handleExportTemplates = (templatesToExport: SavedTemplate[], fileName: string) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templatesToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${fileName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addLog(`Successfully exported ${templatesToExport.length} template(s).`);
    } catch (err: any) {
      addLog(`Failed to export templates: ${err.message}`);
    }
  };

  // Package and export the current layout setup as a single template backup
  const handleExportCurrentLayout = () => {
    const exportName = templateName.trim() || 'Current_Active_Layout';
    const tempTpl: SavedTemplate = {
      id: `template-export-${Date.now()}`,
      name: exportName,
      settings: { ...settings },
      fontId: activeFont.id,
      banglaFontId: activeBanglaFont?.id
    };
    handleExportTemplates([tempTpl], `PDFBRO_TP_${exportName}`);
  };

  // Import previously saved templates into the existing browser storage system
  const handleImportTemplateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        if (!jsonContent) return;

        const parsed = JSON.parse(jsonContent);
        let importedList: SavedTemplate[] = [];

        if (Array.isArray(parsed)) {
          importedList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (parsed.name && parsed.settings) {
            importedList = [parsed];
          } else {
            throw new Error("Invalid template structure (missing name or settings)");
          }
        } else {
          throw new Error("Invalid file content format. Expected a JSON template file.");
        }

        const sanitizedList: SavedTemplate[] = [];
        for (const item of importedList) {
          if (!item.name || !item.settings) {
            continue;
          }
          const freshId = `template-import-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          sanitizedList.push({
            id: freshId,
            name: item.name,
            settings: {
              ...settings, // fallback defaults
              ...item.settings,
              customTexts: Array.isArray(item.settings.customTexts) ? item.settings.customTexts : []
            },
            fontId: item.fontId || activeFont.id,
            banglaFontId: item.banglaFontId
          });
        }

        if (sanitizedList.length === 0) {
          addLog("No valid templates found in the uploaded file.");
          return;
        }

        const newSaved = [...savedTemplates, ...sanitizedList];
        setSavedTemplates(newSaved);
        localStorage.setItem('pdfbro_saved_templates', JSON.stringify(newSaved));
        addLog(`Successfully imported ${sanitizedList.length} template(s).`);
        e.target.value = '';
      } catch (err: any) {
        addLog(`Failed to import template file: ${err.message || 'Malformed JSON'}`);
      }
    };
    reader.readAsText(file);
  };

  // Filter Font list
  const filteredFonts = fontsList.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(fontSearch.toLowerCase());
    const matchesCategory = selectedFontCategory === 'All' || font.category === selectedFontCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter Bangla Font list
  const filteredBanglaFonts = banglaFontsList.filter((font) => {
    return font.name.toLowerCase().includes(fontSearch.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col bg-[#0B0F19] font-sans">
      
      {/* Top Subpage Navigation Bar (Editor | Layout | Fonts | Preview) - Fixed directly below header */}
      <div className="w-full bg-[#0b0d11] px-4 py-2 border-b border-gray-800/50 flex-shrink-0 z-20">
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-1 flex items-center shadow-lg">
          {[
            { id: 'input' as BottomTabType, label: 'Editor' },
            { id: 'layout' as BottomTabType, label: 'Layout' },
            { id: 'font' as BottomTabType, label: 'Fonts' },
            { id: 'preview' as BottomTabType, label: 'Preview' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`top-tab-${tab.id}-btn`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all select-none active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-[#374151] text-white shadow-md border border-gray-600/30'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Core Viewport splits between settings layouts & proof cards */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full w-full">
          
          {/* Left panel / primary scroll content tab */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:max-w-xl xl:max-w-2xl border-r border-[#1F2937]/30">
            
            {/* =========================================================================
                TAB 1: DRAFT CONTENT WRITING EDITOR
                ========================================================================= */}
            {activeTab === 'input' && (
              <div className="flex flex-col gap-4">

                {/* Tactical Action Bar */}
                <div className="flex items-center justify-between rounded-xl bg-[#111827] p-2 border border-[#1F2937]">
                  {/* Left Side Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleUndo}
                      disabled={snapshotIndex <= 0}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-[#F9FAFB] hover:bg-[#1F2937] disabled:opacity-30"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={snapshotIndex >= snapshots.length - 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-[#F9FAFB] hover:bg-[#1F2937] disabled:opacity-30"
                      title="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCut}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 hover:bg-red-950/20"
                      title="Cut all text to clipboard"
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleClear}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                      title="Clear editor field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="h-5 w-px bg-[#1F2937]" />
                    <button
                      onClick={() => document.getElementById('text-file-picker')?.click()}
                      className="flex h-10 gap-2 items-center rounded-lg border border-blue-900/40 bg-blue-950/20 px-3 text-xs font-semibold text-blue-400 hover:bg-blue-950/40"
                    >
                      <FileUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload TXT</span>
                    </button>
                    <input
                      type="file"
                      id="text-file-picker"
                      accept=".txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                {/* Large Text Area */}
                <div>
                  <textarea
                    value={textContent}
                    onChange={(e) => updateTextAndHistory(e.target.value)}
                    onDragOver={handleTextareaDragOver}
                    onDrop={handleTextareaDrop}
                    style={{ fontFamily: `'${activeFont.name}', '${activeBanglaFont?.name || 'Noto Sans Bengali'}', sans-serif` }}
                    className="h-80 sm:h-96 w-full resize-none rounded-xl border border-[#1F2937] bg-[#111827] p-4 text-sm text-[#F9FAFB] placeholder-[#4B5563] outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    placeholder="Type or drop your TXT document block here. 

#This text is bold#

%This text is italic%

!This text is uppercase!

@This text is underlined@

#%Combine formatting markers for extreme emphasis!%#"
                  />
                </div>

                {/* Statistics Deck */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 text-left">
                    <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Characters</span>
                    <p className="mt-1 text-lg font-bold text-[#F9FAFB]">{charCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 text-left">
                    <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Words</span>
                    <p className="mt-1 text-lg font-bold text-[#F9FAFB]">{wordCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 text-left">
                    <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Lines</span>
                    <p className="mt-1 text-lg font-bold text-[#F9FAFB]">{lineCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-3 text-left">
                    <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Reading Time</span>
                    <p className="mt-1 text-lg font-bold text-[#F9FAFB]">{readingTimeMinutes} m</p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: DOCUMENT LAYOUT PARAMETERS
                ========================================================================= */}
            {activeTab === 'layout' && (
              <div className="space-y-6">

                {/* Templates Module */}
                <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4 sm:p-6 shadow-2xl space-y-5 min-w-0 w-full overflow-hidden">
                  <div className="flex items-center border-b border-[#1F2937]/60 pb-3">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                      <Files className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-400 flex-shrink-0" />
                      Templates Settings
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1.5">CREATE TEMPLATE WITH CURRENT SETUP</span>
                    <div className="flex gap-2 w-full items-center">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="h-10 flex-1 min-w-0 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-4 text-sm text-[#F9FAFB] placeholder-gray-500 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                        placeholder="Name template.."
                      />
                      <button
                        onClick={handleSaveTemplate}
                        className="h-10 rounded-lg bg-[#4F46E5] hover:bg-[#5A52FF] px-5 text-xs font-bold text-white shadow-md active:scale-95 transition-all flex-shrink-0"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => document.getElementById('template-import-picker')?.click()}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4F46E5] text-white shadow-md hover:bg-[#5A52FF] active:scale-95 transition-all flex-shrink-0"
                        title="Import templates from a backup JSON file"
                      >
                        <Upload className="h-4.5 w-4.5" strokeWidth={2.5} />
                      </button>
                      <input
                        type="file"
                        id="template-import-picker"
                        className="hidden"
                        onChange={handleImportTemplateFile}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 w-full">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-2.5">YOUR TEMPLETS</span>
                    {savedTemplates.length > 0 ? (
                      <div className="flex flex-col gap-2 min-w-0 w-full">
                        {savedTemplates.map((tpl) => (
                          <div key={tpl.id} className="min-w-0 w-full">
                            {editingTemplateId === tpl.id ? (
                              <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-[#4F46E5] bg-[#0B0F19] p-1 pl-4 pr-1 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTemplateName}
                                  onChange={(e) => setEditingTemplateName(e.target.value)}
                                  className="h-7 flex-1 rounded-lg bg-[#0B0F19] px-3 text-xs text-[#F9FAFB] outline-none border border-[#1F2937] focus:border-[#4F46E5] min-w-0"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveRename(tpl.id, e as any);
                                    } else if (e.key === 'Escape') {
                                      handleCancelRename(e as any);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2 bg-[#4F46E5] text-white rounded-lg px-3 py-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => handleSaveRename(tpl.id, e)}
                                    className="p-1 hover:scale-110 text-white hover:text-green-300 transition-all"
                                    title="Save name"
                                  >
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={handleCancelRename}
                                    className="p-1 hover:scale-110 text-white hover:text-red-300 transition-all"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleLoadTemplate(tpl)}
                                className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-[#1F2937] bg-[#0B0F19]/40 p-1 pl-4 pr-1 hover:bg-[#0B0F19] hover:border-[#1F2937] transition-all active:scale-98 w-full min-w-0"
                              >
                                <div className="flex items-center min-w-0 flex-1 py-1">
                                  <span className="font-sans text-xs sm:text-sm font-semibold text-white tracking-wide truncate pr-1" title={tpl.name}>
                                    {tpl.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#5A52FF] text-white rounded-lg px-3.5 py-1.5 transition-all shadow-md flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportTemplates([tpl], `PDFBRO_TP_${tpl.name}`);
                                    }}
                                    className="p-0.5 hover:scale-110 text-white hover:text-green-300 transition-all"
                                    title="Export this template"
                                  >
                                    <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={(e) => handleStartRename(tpl, e)}
                                    className="p-0.5 hover:scale-110 text-white hover:text-blue-300 transition-all"
                                    title="Rename template"
                                  >
                                    <PenLine className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                                    className="p-0.5 hover:scale-110 text-white hover:text-red-300 transition-all"
                                    title="Delete template"
                                  >
                                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#4B5563] italic pl-2">No custom templates yet. Configure any layouts and save above!</p>
                    )}
                  </div>
                </div>

                {/* 01. PAPER SIZE */}
                <div className="space-y-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-blue-500 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 text-xs font-bold">01</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Paper Size Preset</span>
                  </div>

                  <CustomDropdown<PageSizePreset>
                    id="page-size-picker"
                    label="Select Document Geometry"
                    value={settings.pageSizePreset}
                    options={[
                      { value: 'Letter', label: 'Letter Standard (8.5" × 11.0")' },
                      { value: 'A4', label: 'A4 Standard (8.27" × 11.69")' },
                      { value: 'A3', label: 'A3 Premium Layout (11.69" × 16.54")' },
                      { value: 'A5', label: 'A5 Mini Grid (5.83" × 8.27")' },
                      { value: 'Legal', label: 'Legal Tall Format (8.5" × 14.0")' },
                      { value: 'Executive', label: 'Executive Layout (7.25" × 10.5")' },
                      { value: 'Tabloid', label: 'Tabloid Newspaper (11.0" × 17.0")' },
                      { value: 'Custom', label: 'Custom Geometry Dimensions' },
                    ]}
                    onChange={(val) => setSettings(prev => ({ ...prev, pageSizePreset: val }))}
                  />

                  {settings.pageSizePreset === 'Custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Width (Inches)</span>
                        <input
                          type="text"
                          value={settings.customWidth}
                          onChange={(e) => setSettings(prev => ({ ...prev, customWidth: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 text-sm text-[#F9FAFB]"
                          placeholder="8.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Height (Inches)</span>
                        <input
                          type="text"
                          value={settings.customHeight}
                          onChange={(e) => setSettings(prev => ({ ...prev, customHeight: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 text-sm text-[#F9FAFB]"
                          placeholder="11.0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 02. COLUMN GRID */}
                <div className="space-y-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-green-500 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-green-500/10 text-xs font-bold">02</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Multi Column Flow</span>
                  </div>

                  <CustomDropdown<ColumnLayout>
                    id="column-grid-picker"
                    label="Layout Pattern"
                    value={settings.columns}
                    options={[
                      { value: '1', label: 'single' },
                      { value: '2', label: 'double' },
                      { value: '3', label: 'three' },
                      { value: '4', label: 'four' },
                    ]}
                    onChange={(val) => setSettings(prev => ({ ...prev, columns: val }))}
                  />
                </div>

                {/* 03. PAGE MARGINS */}
                <div className="space-y-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-yellow-500 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-yellow-500/10 text-xs font-bold">03</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Page Margins Preset</span>
                  </div>

                  <CustomDropdown<MarginPreset>
                    id="margins-preset-picker"
                    label="Margin Border Size"
                    value={settings.marginPreset}
                    options={[
                      { value: '0.2', label: '0.2' },
                      { value: '0.3', label: '0.3' },
                      { value: '0.5', label: '0.5 (recommended)' },
                      { value: '1.0', label: '1' },
                      { value: 'Custom', label: 'Custom' },
                    ]}
                    onChange={(val) => setSettings(prev => ({ ...prev, marginPreset: val }))}
                  />

                  {settings.marginPreset === 'Custom' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Top (in)</span>
                        <input
                          type="text"
                          value={settings.customMarginTop}
                          onChange={(e) => setSettings(prev => ({ ...prev, customMarginTop: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 text-xs text-[#F9FAFB]"
                          placeholder="0.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Bottom (in)</span>
                        <input
                          type="text"
                          value={settings.customMarginBottom}
                          onChange={(e) => setSettings(prev => ({ ...prev, customMarginBottom: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 text-xs text-[#F9FAFB]"
                          placeholder="0.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Left (in)</span>
                        <input
                          type="text"
                          value={settings.customMarginLeft}
                          onChange={(e) => setSettings(prev => ({ ...prev, customMarginLeft: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 text-xs text-[#F9FAFB]"
                          placeholder="0.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#9CA3AF]">Right (in)</span>
                        <input
                          type="text"
                          value={settings.customMarginRight}
                          onChange={(e) => setSettings(prev => ({ ...prev, customMarginRight: e.target.value }))}
                          className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-2 text-xs text-[#F9FAFB]"
                          placeholder="0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 04. WORD TYPOGRAPHY */}
                <div className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-red-500 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-xs font-bold">04</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Word Typography Details</span>
                  </div>

                  {/* Font Size & Line Spacing fields are completely unlocked (can be blank while typing) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Font Size (PT)
                      </span>
                      <input
                        type="text"
                        value={settings.fontSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                        className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 text-sm text-[#F9FAFB]"
                        placeholder="e.g. 11"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Line Spacing Multiplier
                      </span>
                      <input
                        type="text"
                        value={settings.lineSpacing}
                        onChange={(e) => setSettings(prev => ({ ...prev, lineSpacing: e.target.value }))}
                        className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 text-sm text-[#F9FAFB]"
                        placeholder="e.g. 1.4"
                      />
                    </div>
                  </div>

                  <CustomDropdown<AlignmentType>
                    id="alignment-picker"
                    label="Text Alignment Style"
                    value={settings.alignment}
                    options={[
                      { value: 'Left', label: 'left' },
                      { value: 'Right', label: 'right' },
                      { value: 'Center', label: 'Center' },
                      { value: 'Justified', label: 'justify' },
                      { value: 'Auto', label: 'auto adaptive' },
                    ]}
                    onChange={(val) => setSettings(prev => ({ ...prev, alignment: val }))}
                  />
                </div>

                {/* 05. PAGE COUNTERS */}
                <div className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-blue-400 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-400/10 text-xs font-bold">05</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Page Navigation Counters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomDropdown<MarkerPlacementType>
                      id="counter-placement"
                      label="Counter Position"
                      value={settings.markerPlacement}
                      options={[
                        { value: 'None', label: 'no counter' },
                        { value: 'Top Left', label: 'top left' },
                        { value: 'Top Right', label: 'top right' },
                        { value: 'Top Center', label: 'top center' },
                        { value: 'Bottom Left', label: 'bottom left' },
                        { value: 'Bottom Right', label: 'bottom right' },
                        { value: 'Bottom Center', label: 'bottom Center' },
                      ]}
                      onChange={(val) => setSettings(prev => ({ ...prev, markerPlacement: val }))}
                    />

                    <CustomDropdown<CounterStyleType>
                      id="counter-style"
                      label="Counter Decoration Design"
                      value={settings.counterStyle}
                      options={[
                        { value: 'Page 1, Page 2', label: 'Prefix (Page 1)' },
                        { value: '1, 2, 3', label: 'Plain integers (1)' },
                        { value: '1/4, 2/4, 3/4', label: 'Page fractions (1/4)' },
                        { value: '(1), (2), (3)', label: 'Parenthesised (1)' },
                        { value: '[1], [2], [3]', label: 'Bracketed [1]' },
                      ]}
                      onChange={(val) => setSettings(prev => ({ ...prev, counterStyle: val }))}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Pagination Label Size (PT)
                    </span>
                    <input
                      type="text"
                      value={settings.counterFontSize}
                      onChange={(e) => setSettings(prev => ({ ...prev, counterFontSize: e.target.value }))}
                      className="h-10 rounded-lg border border-[#1F2937] bg-[#0B0F19] px-3 text-sm text-[#F9FAFB]"
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                {/* 06. CUSTOM OVERLAYS */}
                <div className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-green-400/10 text-xs font-bold">06</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Meta Text Overlays</span>
                    </div>

                    {settings.customTexts.length < 3 && (
                      <button
                        onClick={handleAddCustomText}
                        className="flex h-8 items-center gap-1 rounded-full bg-green-500/10 px-3 text-xs font-semibold text-green-400 hover:bg-green-500/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add (Max 3)</span>
                      </button>
                    )}
                  </div>

                  {settings.customTexts.length > 0 ? (
                    <div className="space-y-4">
                      {settings.customTexts.map((item, idx) => (
                        <div key={item.id} className="relative rounded-lg border border-[#1F2937] bg-[#0B0F19] p-3 space-y-3">
                          
                          {/* Close indicator */}
                          <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-1.5">
                            <span className="text-[10px] font-mono text-[#4B5563]">OVERLAY #{idx + 1}</span>
                            <button
                              onClick={() => handleRemoveCustomText(item.id)}
                              className="text-[#4B5563] hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-[#9CA3AF] uppercase">Text Overlay Marker</span>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleUpdateCustomText(item.id, { text: e.target.value })}
                              className="h-9 rounded-lg border border-[#1F2937] bg-[#111827] px-3 text-xs text-[#F9FAFB]"
                              placeholder="PDFBRO CREATIONS"
                            />
                          </div>

                          <CustomDropdown<any>
                            id={`overlay-placement-${item.id}`}
                            label="Target Grid Alignment"
                            value={item.placement}
                            options={[
                              { value: 'Top Left', label: 'top left' },
                              { value: 'Top Right', label: 'top right' },
                              { value: 'Top Center', label: 'top center' },
                              { value: 'Bottom Left', label: 'bottom left' },
                              { value: 'Bottom Right', label: 'bottom right' },
                              { value: 'Bottom Center', label: 'bottom Center' },
                            ]}
                            onChange={(val) => handleUpdateCustomText(item.id, { placement: val })}
                          />

                          {/* Formatting modifiers */}
                          <div className="flex items-center gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9CA3AF]">
                              <input
                                type="checkbox"
                                checked={item.uppercase}
                                onChange={(e) => handleUpdateCustomText(item.id, { uppercase: e.target.checked })}
                                className="h-4 w-4 rounded border-[#1F2937] bg-[#111827] accent-green-500 text-green-500"
                              />
                              <span>Force Uppercase</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#9CA3AF]">
                              <input
                                type="checkbox"
                                checked={item.bold}
                                onChange={(e) => handleUpdateCustomText(item.id, { bold: e.target.checked })}
                                className="h-4 w-4 rounded border-[#1F2937] bg-[#111827] accent-green-500 text-green-500"
                              />
                              <span>Force Bold</span>
                            </label>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#4B5563] italic">No meta overlays added. Inject custom watermark alignments above!</p>
                  )}
                </div>

                {/* 07. COMPRESSION PIPELINE QUALITY */}
                <div className="space-y-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-purple-400 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-400/10 text-xs font-bold">07</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Compression Pipeline Quality</span>
                  </div>

                  {/* Horizontal Segmented Switch */}
                  <div className="flex rounded-lg bg-[#0B0F19] p-1 border border-[#1F2937]">
                    {(['Maximum', 'Balanced', 'High Quality'] as CompressionType[]).map((level) => {
                      const isActive = settings.compression === level;
                      return (
                        <button
                          key={level}
                          onClick={() => setSettings(prev => ({ ...prev, compression: level }))}
                          className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition-all ${
                            isActive
                              ? 'bg-[#F9FAFB] text-[#0B0F19]'
                              : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                          }`}
                        >
                          {level === 'Maximum' ? 'Maximum' : level === 'High Quality' ? 'High' : 'Balanced'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 08. DOCUMENT THEME */}
                <div className="space-y-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  <div className="flex items-center gap-2 text-pink-400 border-b border-[#1F2937]/50 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-400/10 text-xs font-bold">08</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Document Theme</span>
                  </div>

                  {/* Horizontal Segmented Switch */}
                  <div className="flex rounded-lg bg-[#0B0F19] p-1 border border-[#1F2937]">
                    {(['White', 'Cream', 'Charcoal Black'] as DocumentThemeType[]).map((themeOption) => {
                      const isActive = (settings.documentTheme || 'White') === themeOption;
                      return (
                        <button
                          key={themeOption}
                          onClick={() => setSettings(prev => ({ ...prev, documentTheme: themeOption }))}
                          className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition-all ${
                            isActive
                              ? 'bg-[#F9FAFB] text-[#0B0F19]'
                              : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                          }`}
                        >
                          {themeOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
                     {/* =========================================================================
                TAB 3: PRELOADED & CUSTOM FONTS CATALOG
                ========================================================================= */}
            {activeTab === 'font' && (
              <div className="space-y-6">

                {/* Upload & Search tools */}
                <div className="flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111827] p-4">
                  {/* Search */}
                  <div className="relative w-full">
                    <Search className="absolute top-[11px] left-3 h-4 w-4 text-[#4B5563]" />
                    <input
                      type="text"
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      className="h-10 w-full rounded-lg border border-[#1F2937] bg-[#0B0F19] pl-9 pr-4 text-sm text-[#F9FAFB] outline-none focus:border-blue-500"
                      placeholder={fontLanguageMode === 'English' ? 'Search English fonts...' : 'Search Bangla fonts...'}
                    />
                  </div>

                  {/* English | Bangla Switching Capsule Toggle */}
                  <div className="flex rounded-lg bg-[#0B0F19] p-1 border border-[#1F2937] w-full">
                    <button
                      type="button"
                      onClick={() => setFontLanguageMode('English')}
                      className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition-all ${
                        fontLanguageMode === 'English'
                          ? 'bg-[#F9FAFB] text-[#0B0F19]'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontLanguageMode('Bangla')}
                      className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition-all ${
                        fontLanguageMode === 'Bangla'
                          ? 'bg-[#F9FAFB] text-[#0B0F19]'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                      }`}
                    >
                      Bangla
                    </button>
                  </div>

                  {/* Categories Horiz-scroll list - Only shown for English mode */}
                  {fontLanguageMode === 'English' && (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-800 border-t border-[#1F2937]/50 pt-2.5">
                      {['All', 'Sans-Serif', 'Serif', 'Monospace', 'Handwriting'].map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedFontCategory(category)}
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                            selectedFontCategory === category
                              ? 'bg-[#F9FAFB] text-[#0B0F19]'
                              : 'bg-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB]'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Font Indicator (Dynamic per Language Mode) */}
                <div className="rounded-xl border border-blue-900/40 bg-blue-950/10 p-4">
                  {fontLanguageMode === 'English' ? (
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active English Font</span>
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white">{activeFont.name}</h4>
                          <span className="text-[10px] text-[#9CA3AF] uppercase">{activeFont.category}</span>
                        </div>
                        <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                          Active
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Bangla Font</span>
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white">{activeBanglaFont?.name || 'Noto Sans Bengali'}</h4>
                          <span className="text-[10px] text-[#9CA3AF] uppercase">Bengali Script</span>
                        </div>
                        <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                          Active
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loading Status Overlay */}
                {fontLoadingState && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-yellow-900/40 bg-yellow-950/15 p-3 text-xs text-yellow-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    <span>{fontLoadingState}</span>
                  </div>
                )}

                {/* Font Catalog Deck (Conditional depending on Mode) */}
                {fontLanguageMode === 'English' ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                      English / Latin Fonts ({filteredFonts.length} families found)
                    </span>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredFonts.map((font) => {
                        const isSelected = activeFont.id === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => handleFontSelect(font)}
                            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                              isSelected
                                ? 'border-[#F9FAFB] bg-[#111827]'
                                : 'border-[#1F2937] bg-[#111827]/60 hover:border-[#4B5563]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#F9FAFB]">{font.name}</h4>
                                <span className="text-[9px] text-[#4B5563] uppercase tracking-wider">{font.category}</span>
                              </div>
                              
                              {/* Short preview line */}
                              <p
                                style={{ fontFamily: `'${font.name}', sans-serif` }}
                                className="mt-3 text-xs text-[#9CA3AF] truncate"
                              >
                                The quick brown fox jumps over the lazy dog.
                              </p>
                            </div>

                            <div className="mt-4 border-t border-[#1F2937]/50 pt-2 flex items-center justify-between text-[10px]">
                              {font.status === 'Downloaded and Applied' ? (
                                <span className="text-green-400 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Vector compiled & registered
                                </span>
                              ) : font.status === 'Compiling...' ? (
                                <span className="text-yellow-500 animate-pulse">Compiling...</span>
                              ) : font.status === 'Failed' ? (
                                <span className="text-red-400">Failed: {font.error || 'Timeout'}</span>
                              ) : (
                                <span className="text-[#4B5563]">Click to download & verify</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        Bangla Font Catalog (Dual Font System)
                      </span>
                      <p className="text-xs text-[#9CA3AF]">
                        Select a premium Bangla font. English segments will continue using {activeFont.name}, while Bangla segments will render using this font.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredBanglaFonts.map((font) => {
                        const isSelected = activeBanglaFont?.id === font.id;
                        return (
                          <div
                            key={font.id}
                            onClick={() => handleBanglaFontSelect(font)}
                            className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                              isSelected
                                ? 'border-[#F9FAFB] bg-[#111827]'
                                : 'border-[#1F2937] bg-[#111827]/60 hover:border-[#4B5563]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#F9FAFB]">{font.name}</h4>
                                <span className="text-[9px] text-blue-400 uppercase tracking-wider">Bengali</span>
                              </div>
                              
                              {/* Short preview line */}
                              <p
                                style={{ fontFamily: `'${font.name}', sans-serif` }}
                                className="mt-3 text-sm text-[#9CA3AF] truncate"
                              >
                                আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।
                              </p>
                            </div>

                            <div className="mt-4 border-t border-[#1F2937]/50 pt-2 flex items-center justify-between text-[10px]">
                              {font.status === 'Downloaded and Applied' ? (
                                <span className="text-green-400 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Vector compiled & registered
                                </span>
                              ) : font.status === 'Compiling...' ? (
                                <span className="text-yellow-500 animate-pulse">Compiling...</span>
                              ) : font.status === 'Failed' ? (
                                <span className="text-red-400">Failed: {font.error || 'Timeout'}</span>
                              ) : (
                                <span className="text-[#4B5563]">Click to download & verify</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* =========================================================================
                TAB 4: DEDICATED PROOF PREVIEW
                ========================================================================= */}
            {activeTab === 'preview' && (
              <div className="w-full min-h-[75vh] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <LiveLayoutProofCard settings={settings} activeFont={activeFont} text={textContent} />
              </div>
            )}

          </div>

          {/* Right panel / Split view display for Desktop displays */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#0F1422] p-6 overflow-hidden">
            <LiveLayoutProofCard settings={settings} activeFont={activeFont} text={textContent} />
          </div>

        </div>
      </main>

      {/* Template Deletion Confirmation Popup Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl transition-all duration-200">
            <h3 className="text-base font-bold text-white mb-2">Delete Saved Template</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Are you sure you want to delete the saved template <span className="text-white font-semibold">"{templateToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-lg border border-[#1F2937] bg-transparent text-sm font-semibold text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors"
              >
                No
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First Time User Welcome Prompt Modal */}
      {showFirstTimePrompt && onStartTutorial && onDismissPrompt && (
        <FirstTimeTutorialPrompt
          onStartTutorial={onStartTutorial}
          onDismiss={onDismissPrompt}
        />
      )}

      {/* Step-by-Step Visual Tutorial Walkthrough Modal */}
      {isTutorialOpen && setIsTutorialOpen && (
        <PdfEditorTutorial
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      )}

    </div>
  );
}

/**
 * Highly interactive, visual structural preview mapping canvas card
 */
function LiveLayoutProofCard({ settings, activeFont, text }: { settings: LayoutSettings; activeFont: FontItem; text: string }) {
  // Translate margin options
  let mTop = 0.5, mBottom = 0.5, mLeft = 0.5, mRight = 0.5;
  if (settings.marginPreset === 'Custom') {
    mTop = parseFloat(settings.customMarginTop) || 0.5;
    mBottom = parseFloat(settings.customMarginBottom) || 0.5;
    mLeft = parseFloat(settings.customMarginLeft) || 0.5;
    mRight = parseFloat(settings.customMarginRight) || 0.5;
  } else {
    const val = parseFloat(settings.marginPreset) || 0.5;
    mTop = val;
    mBottom = val;
    mLeft = val;
    mRight = val;
  }

  // Sizing matrix (letter default: 8.5 x 11.0)
  let aspectWidth = 8.5;
  let aspectHeight = 11.0;
  if (settings.pageSizePreset === 'Custom') {
    aspectWidth = parseFloat(settings.customWidth) || 8.5;
    aspectHeight = parseFloat(settings.customHeight) || 11.0;
  } else {
    const dims = {
      Letter: { w: 8.5, h: 11.0 },
      A4: { w: 8.27, h: 11.69 },
      A3: { w: 11.69, h: 16.54 },
      A5: { w: 5.83, h: 8.27 },
      Legal: { w: 8.5, h: 14.0 },
      Executive: { w: 7.25, h: 10.5 },
      Tabloid: { w: 11.0, h: 17.0 },
    }[settings.pageSizePreset] || { w: 8.5, h: 11.0 };
    aspectWidth = dims.w;
    aspectHeight = dims.h;
  }

  // Calculate proportional percentages for layout mirroring
  const percentLeft = (mLeft / aspectWidth) * 100;
  const percentRight = (mRight / aspectWidth) * 100;
  const percentTop = (mTop / aspectHeight) * 100;
  const percentBottom = (mBottom / aspectHeight) * 100;

  // Compile column count
  const cols = parseInt(settings.columns) || 1;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 sm:p-4">
      {/* Visual aspect card frame */}
      <div
        style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}
        className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[540px] max-h-[74vh] sm:max-h-[82vh] rounded-xl border border-gray-700/60 bg-white p-4 sm:p-6 shadow-2xl select-none flex-shrink-0 transition-all"
      >
        {/* Margin Guide Borders */}
        <div
          style={{
            left: `${percentLeft}%`,
            right: `${percentRight}%`,
            top: `${percentTop}%`,
            bottom: `${percentBottom}%`
          }}
          className="absolute border border-dashed border-blue-400/35 pointer-events-none"
        />

        {/* Header watermark indicators */}
        <div className="absolute top-2 left-4 right-4 flex justify-between text-[6px] font-mono text-[#9CA3AF] pointer-events-none">
          {/* Custom overlays top items */}
          <div className="flex flex-col text-left gap-0.5">
            {settings.customTexts.filter(t => t.placement.startsWith('Top')).map((t, i) => (
              <span key={i} className={t.bold ? 'font-bold' : ''}>
                {t.text.trim() ? (t.uppercase ? t.text.toUpperCase() : t.text) : 'WATERMARK'}
              </span>
            ))}
          </div>
          {settings.markerPlacement.startsWith('Top') && (
            <span className="font-semibold text-blue-500">Page 1</span>
          )}
        </div>

        {/* Main Printable column boxes container */}
        <div
          style={{
            marginLeft: `${percentLeft}%`,
            marginRight: `${percentRight}%`,
            marginTop: `${percentTop}%`,
            marginBottom: `${percentBottom}%`
          }}
          className="absolute inset-0 flex gap-1 pointer-events-none p-1"
        >
          {Array.from({ length: cols }).map((_, index) => (
            <div
              key={index}
              className="h-full flex-1 rounded bg-[#EBF5FF]/50 border border-blue-100/30 flex flex-col gap-1.5 p-1.5 overflow-hidden"
            >
              <span className="text-[4px] font-bold text-blue-400/70">COL {index + 1}</span>
              
              {/* Dummy lines matching alignment styles */}
              <div className="space-y-1">
                {Array.from({ length: 6 }).map((_, lIdx) => {
                  let alignClass = 'w-full';
                  if (settings.alignment === 'Center') {
                    alignClass = 'w-4/5 mx-auto';
                  } else if (settings.alignment === 'Right') {
                    alignClass = 'w-3/4 ml-auto';
                  } else if (lIdx === 5) {
                    alignClass = 'w-2/3'; // Last line shorter
                  }
                  return (
                    <div
                      key={lIdx}
                      className={`h-[2px] rounded bg-gray-300/65 ${alignClass}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer overlays indicators */}
        <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[6px] font-mono text-[#9CA3AF] pointer-events-none">
          <div className="flex flex-col text-left gap-0.5">
            {settings.customTexts.filter(t => t.placement.startsWith('Bottom')).map((t, i) => (
              <span key={i} className={t.bold ? 'font-bold' : ''}>
                {t.text.trim() ? (t.uppercase ? t.text.toUpperCase() : t.text) : 'WATERMARK'}
              </span>
            ))}
          </div>
          {settings.markerPlacement.startsWith('Bottom') && (
            <span className="font-semibold text-blue-500">Page 1</span>
          )}
        </div>

      </div>
    </div>
  );
}
