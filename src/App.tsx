/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, X } from 'lucide-react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import RouteA_PDFPlatform from './components/RouteA_PDFPlatform';
import RouteB_TXTEditor from './components/RouteB_TXTEditor';
import RouteC_InfoPage from './components/RouteC_InfoPage';
import RouteD_WordEliminator from './components/RouteD_WordEliminator';
import RouteE_Tools from './components/RouteE_Tools';
import LoadingScreen from './components/LoadingScreen';
import { TxtEditorTutorial } from './components/tutorials/TxtEditorTutorial';
import { VocabAnalyzerTutorial } from './components/tutorials/VocabAnalyzerTutorial';
import { ToolsHubTutorial } from './components/tutorials/ToolsHubTutorial';
import { RouteType, LayoutSettings, FontItem } from './types';
import { PRELOADED_FONTS, BANGLA_FONTS, downloadGoogleFont, injectFontFace } from './utils/fontLoader';
import { generatePDF } from './utils/pdfGenerator';

const DEFAULT_TUTORIAL_TEXT = `#PDFBRO MASTERCLASS#

Welcome to the PDFBRO mobile document formatting and vector compilation platform. This is a fully functional document editor designed to flow text into elegant, highly customized multi-column page layouts.

#I. INLINE FORMATTING ENGINE#
This system processes inline string expressions dynamically during PDF compilation. For example:
- Wrap text in hashes to render #bold font weight#.
- Wrap text in percent signs to render %italic font style%.
- Combine both to achieve #%bold and italic emphasis%#.

#II. ADVANCED PAGES FLOW LAYOUT#
The pages flow algorithm automatically measures text geometry using high-precision HTML5 canvas metrics. When content exceeds the printable column bounds, it seamlessly wraps or breaks across multiple columns or pages.

#III. ALIGNMENT & WORD SPACING#
Whether you select Left, Right, Center, or Justified, the PDF vector translation engine produces a perfect physical sheet layout matching your workspace configuration. When "Justified" is enabled, the layout engine computes proportional word-spacing gaps to fill columns perfectly.

#IV. HEADERS, FOOTERS & MARKERS#
Create up to 3 individual text markers (e.g., #PDFBRO CREATIONS#) with independent alignments and style flags. Use automated page counters to number pages dynamically.`;

export default function App() {
  // Startup Loading Screen State
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(true);

  // Navigation State (Starts at 'A' - PDF Editor)
  const [currentRoute, setCurrentRoute] = useState<RouteType>('A');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Loading Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  // PDF Platform States (Isolated from TXT Editor)
  const [textContent, setTextContent] = useState<string>('');
  const [settings, setSettings] = useState<LayoutSettings>({
    pageSizePreset: 'Letter',
    customWidth: '8.5',
    customHeight: '11.0',
    marginPreset: '0.5',
    customMarginTop: '0.5',
    customMarginBottom: '0.5',
    customMarginLeft: '0.5',
    customMarginRight: '0.5',
    columns: '1',
    fontSize: '11',
    lineSpacing: '1.4',
    alignment: 'Left',
    markerPlacement: 'Bottom Center',
    counterStyle: 'Page 1, Page 2',
    counterFontSize: '8',
    customTexts: [],
    compression: 'Balanced',
    documentTheme: 'White',
  });

  // Fonts state management
  const [fontsList, setFontsList] = useState<FontItem[]>(PRELOADED_FONTS);
  const [activeFont, setActiveFont] = useState<FontItem>({
    id: 'poppins',
    name: 'Poppins',
    category: 'Sans-Serif',
    status: 'Not Downloaded',
  });

  // Bangla Fonts state management
  const [banglaFontsList, setBanglaFontsList] = useState<FontItem[]>(BANGLA_FONTS);
  const [activeBanglaFont, setActiveBanglaFont] = useState<FontItem>({
    id: 'noto-sans-bengali',
    name: 'Noto Sans Bengali',
    category: 'Sans-Serif',
    status: 'Not Downloaded',
  });

  // Compiler state management
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationLogs, setCompilationLogs] = useState<string[]>([]);

  // Logger helper
  const addLog = (msg: string) => {
    setCompilationLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const clearLogs = () => {
    setCompilationLogs([]);
  };

  // Compile default startup fonts (Poppins & Noto Sans Bengali) in background on initial boot
  useEffect(() => {
    const loadDefaultFonts = async () => {
      // 1. Load English font (Poppins)
      try {
        const poppinsFont = PRELOADED_FONTS.find((f) => f.id === 'poppins');
        if (poppinsFont) {
          const fontData = await downloadGoogleFont('Poppins', 'normal');
          injectFontFace('Poppins', fontData.base64, fontData.format, 'normal');
          
          let italicBase64: string | undefined = undefined;
          try {
            const italicFontData = await downloadGoogleFont('Poppins', 'italic');
            italicBase64 = italicFontData.base64;
            injectFontFace('Poppins', italicFontData.base64, italicFontData.format, 'italic');
          } catch (e) {
            console.warn('Failed to load default italic Poppins on boot:', e);
          }
          
          const updatedFont: FontItem = {
            ...poppinsFont,
            base64: fontData.base64,
            italicBase64,
            status: 'Downloaded and Applied',
          };
          setFontsList((prev) => prev.map((f) => (f.id === 'poppins' ? updatedFont : f)));
          setActiveFont(updatedFont);
        }
      } catch (err) {
        console.error('Failed to load default font Poppins on boot:', err);
      }

      // 2. Load default Bangla font (Noto Sans Bengali)
      try {
        const defaultBangla = BANGLA_FONTS.find((f) => f.id === 'noto-sans-bengali');
        if (defaultBangla) {
          const fontData = await downloadGoogleFont('Noto Sans Bengali');
          injectFontFace('Noto Sans Bengali', fontData.base64, fontData.format);

          const updatedFont: FontItem = {
            ...defaultBangla,
            base64: fontData.base64,
            status: 'Downloaded and Applied',
          };
          setBanglaFontsList((prev) => prev.map((f) => (f.id === 'noto-sans-bengali' ? updatedFont : f)));
          setActiveBanglaFont(updatedFont);
        }
      } catch (err) {
        console.error('Failed to load default Bangla font Noto Sans Bengali on boot:', err);
      }
    };
    loadDefaultFonts();
  }, []);

  // Export Filename Popup State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFilename, setExportFilename] = useState<string>('');

  // PDF Editor Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [showFirstTimePrompt, setShowFirstTimePrompt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pdfbro_tutorial_seen') === null;
    } catch {
      return false;
    }
  });

  const handleStartTutorial = () => {
    try {
      localStorage.setItem('pdfbro_tutorial_seen', 'true');
    } catch (e) {
      console.warn(e);
    }
    setShowFirstTimePrompt(false);
    setIsTutorialOpen(true);
  };

  const handleDismissPrompt = () => {
    try {
      localStorage.setItem('pdfbro_tutorial_seen', 'true');
    } catch (e) {
      console.warn(e);
    }
    setShowFirstTimePrompt(false);
  };

  const handleOpenTutorial = () => {
    setIsTutorialOpen(true);
  };

  // Triggered when user clicks Export button in header
  const handleOpenExportModal = () => {
    setExportFilename('');
    setShowExportModal(true);
  };

  const handleConfirmExport = async () => {
    setShowExportModal(false);
    if (isCompiling) return;

    let cleanName = exportFilename.trim();
    if (cleanName.toLowerCase().endsWith('.pdf')) {
      cleanName = cleanName.slice(0, -4).trim();
    }
    if (!cleanName) {
      cleanName = 'Document';
    }
    const finalFileName = `${cleanName}.pdf`;

    setIsCompiling(true);
    setCompilationLogs([]);

    const logWriter = (msg: string) => {
      setCompilationLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    try {
      logWriter(`Loading layout grid settings...`);
      const doc = await generatePDF(textContent, settings, activeFont, activeBanglaFont, logWriter);
      logWriter(`Streaming file binary payload...`);
      doc.save(finalFileName);
      logWriter(`Export Completed successfully as ${finalFileName}.`);
    } catch (err: any) {
      logWriter(`Critical Compilation Error: ${err.message || 'System crash'}`);
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  // 1. Initial boot loading screen
  if (isLoadingScreen) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen flex-col bg-[#0B0F19] text-[#F9FAFB] overflow-hidden">
      
      {/* Persistent Header */}
      <Header
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onExport={handleOpenExportModal}
        isCompiling={isCompiling}
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenTutorial={handleOpenTutorial}
      />

      {/* Slideout navigation overlay menu */}
      <Navigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        onCompilationLogs={compilationLogs}
        clearLogs={clearLogs}
      />

      {/* Primary routing views containers */}
      <div className="flex-1 overflow-hidden min-h-0">
        {currentRoute === 'A' && (
          <RouteA_PDFPlatform
            textContent={textContent}
            setTextContent={setTextContent}
            settings={settings}
            setSettings={setSettings}
            activeFont={activeFont}
            setActiveFont={setActiveFont}
            fontsList={fontsList}
            setFontsList={setFontsList}
            activeBanglaFont={activeBanglaFont}
            setActiveBanglaFont={setActiveBanglaFont}
            banglaFontsList={banglaFontsList}
            setBanglaFontsList={setBanglaFontsList}
            isCompiling={isCompiling}
            onCompilationLogs={compilationLogs}
            clearLogs={clearLogs}
            addLog={addLog}
            isTutorialOpen={isTutorialOpen}
            setIsTutorialOpen={setIsTutorialOpen}
            showFirstTimePrompt={showFirstTimePrompt}
            onStartTutorial={handleStartTutorial}
            onDismissPrompt={handleDismissPrompt}
          />
        )}

        {currentRoute === 'B' && (
          <>
            <RouteB_TXTEditor />
            <TxtEditorTutorial 
              isOpen={isTutorialOpen} 
              onClose={() => setIsTutorialOpen(false)} 
            />
          </>
        )}

        {currentRoute === 'C' && (
          <RouteC_InfoPage onBack={() => setCurrentRoute('A')} />
        )}

        {currentRoute === 'D' && (
          <>
            <RouteD_WordEliminator />
            <VocabAnalyzerTutorial 
              isOpen={isTutorialOpen} 
              onClose={() => setIsTutorialOpen(false)} 
            />
          </>
        )}

        {currentRoute === 'E' && (
          <>
            <RouteE_Tools />
            <ToolsHubTutorial 
              isOpen={isTutorialOpen} 
              onClose={() => setIsTutorialOpen(false)} 
            />
          </>
        )}
      </div>

      {/* PDF Export Filename Popup Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-blue-500/10 p-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Export PDF
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-lg p-1 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="export-filename-input" className="block text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                File name:
              </label>
              <input
                id="export-filename-input"
                type="text"
                autoFocus
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmExport();
                  }
                }}
                placeholder="Enter file name (e.g. My Report)"
                className="w-full rounded-lg bg-[#0B0F19] border border-[#1F2937] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-gray-600 font-medium"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-[#F9FAFB] text-xs font-bold py-2.5 px-4 border border-[#374151]/50 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 transition-all active:scale-95 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
