/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ListFilter, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  ArrowDownAZ, 
  ArrowUpAZ, 
  ArrowRightLeft, 
  BarChart3,
  Upload
} from 'lucide-react';

type SortOptionType = 'original' | 'az' | 'za';

export default function RouteD_WordEliminator() {
  const [inputText, setInputText] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOptionType>('original');
  const [copied, setCopied] = useState<boolean>(false);
  const [showDuplicatePreview, setShowDuplicatePreview] = useState<boolean>(true);
  const [isFilterEnabled, setIsFilterEnabled] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [showFilenameModal, setShowFilenameModal] = useState<boolean>(false);
  const [customFilename, setCustomFilename] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'comma' | 'line'>('comma');

  // Capitalize word with first-letter uppercase and rest lowercase
  const capitalize = (word: string): string => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  // Parse user-defined filter list of ignored words
  const filterWordsSet = useMemo(() => {
    if (!isFilterEnabled || !filterText.trim()) return new Set<string>();
    
    // Accept words separated by newlines, commas, or spaces.
    const cleanFilterText = filterText.replace(/[,;\n\r]/g, ' ');
    const tokens = cleanFilterText.match(/[a-zA-Z]+/g) || [];
    
    const set = new Set<string>();
    for (const t of tokens) {
      set.add(t.toLowerCase());
    }
    return set;
  }, [isFilterEnabled, filterText]);

  // Process and analyze the input text
  const analysis = useMemo(() => {
    // Split input text by whitespace or common whitespace-like tokens
    const rawTokens = inputText.match(/[^\s]+/g) || [];
    
    // Filter and extract valid English vocabulary words
    const validEnglishWords: string[] = [];
    const freqMap = new Map<string, number>();

    for (const token of rawTokens) {
      // Strip any leading or trailing non-alphanumeric punctuation/symbols of any language
      const cleaned = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      
      // Filter rules:
      // 1. Must only contain English letters [a-zA-Z] (removes numbers, symbols, and non-English characters)
      // 2. Must not be a single-letter entry (length >= 2)
      if (/^[a-zA-Z]+$/.test(cleaned) && cleaned.length >= 2) {
        validEnglishWords.push(cleaned);
        const lower = cleaned.toLowerCase();
        freqMap.set(lower, (freqMap.get(lower) || 0) + 1);
      }
    }

    // Total raw word count of valid English tokens extracted from input (before deduplication)
    const totalWords = validEnglishWords.length;

    // Total unique words
    const totalUniqueWords = freqMap.size;

    // Count duplicate words (words that appeared > 1 times)
    let totalDuplicateWords = 0;
    // Count total removed duplicate occurrences
    let totalRemovedOccurrences = 0;

    for (const [_, count] of freqMap) {
      if (count > 1) {
        totalDuplicateWords++;
        totalRemovedOccurrences += (count - 1);
      }
    }

    // Build duplicates preview list
    // Sorted by duplicate count descending (highest first)
    const removedDuplicatesPreview = Array.from(freqMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([word, count]) => ({
        original: capitalize(word),
        count: count
      }))
      .sort((a, b) => b.count - a.count);

    // Build cleaned vocabulary list in original order of appearance
    const uniqueLowerSet = new Set<string>();
    const originalOrderList: string[] = [];
    
    for (const w of validEnglishWords) {
      const lower = w.toLowerCase();
      if (!uniqueLowerSet.has(lower)) {
        uniqueLowerSet.add(lower);
        originalOrderList.push(capitalize(w));
      }
    }

    // Apply optional Word Filter if enabled
    let filteredList = [...originalOrderList];
    if (isFilterEnabled && filterWordsSet.size > 0) {
      filteredList = filteredList.filter(word => !filterWordsSet.has(word.toLowerCase()));
    }

    // Apply sorting controls
    let sortedList = [...filteredList];
    if (sortOption === 'az') {
      sortedList.sort((a, b) => a.localeCompare(b));
    } else if (sortOption === 'za') {
      sortedList.sort((a, b) => b.localeCompare(a));
    }

    // Format output
    const outputText = outputFormat === 'comma' ? sortedList.join(', ') : sortedList.join('\n');

    // Calculate filter statistics
    let filterWordsCount = 0;
    let matchedAndRemovedCount = 0;
    if (isFilterEnabled) {
      filterWordsCount = filterWordsSet.size;
      for (const filterWord of filterWordsSet) {
        if (uniqueLowerSet.has(filterWord)) {
          matchedAndRemovedCount++;
        }
      }
    }

    return {
      totalWords,
      totalUniqueWords,
      totalDuplicateWords,
      totalRemovedOccurrences,
      outputText,
      removedDuplicatesPreview,
      finalWordsCount: sortedList.length,
      characterCount: outputText.length,
      filterWordsCount,
      matchedAndRemovedCount
    };
  }, [inputText, sortOption, isFilterEnabled, filterWordsSet, outputFormat]);

  const handleCopy = async () => {
    if (!analysis.outputText) return;
    try {
      await navigator.clipboard.writeText(analysis.outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const filenamePreview = useMemo(() => {
    let cleanName = customFilename.trim();
    if (cleanName.toLowerCase().endsWith('.txt')) {
      cleanName = cleanName.slice(0, -4).trim();
    }
    cleanName = cleanName.replace(/\s+/g, '-');

    if (!cleanName) {
      cleanName = 'Vocabulary';
    }

    return `${cleanName}(${analysis.finalWordsCount}vocab).txt`;
  }, [customFilename, analysis.finalWordsCount]);

  const handleDownloadTXT = () => {
    if (!analysis.outputText) return;
    setCustomFilename('');
    setShowFilenameModal(true);
  };

  const triggerActualDownload = () => {
    if (!analysis.outputText) return;
    
    let cleanName = customFilename.trim();
    if (cleanName.toLowerCase().endsWith('.txt')) {
      cleanName = cleanName.slice(0, -4).trim();
    }
    cleanName = cleanName.replace(/\s+/g, '-');

    if (!cleanName) {
      cleanName = 'Vocabulary';
    }

    const finalFilename = `${cleanName}(${analysis.finalWordsCount}vocab).txt`;

    const blob = new Blob([analysis.outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(url);
    
    setShowFilenameModal(false);
  };

  const handleClear = () => {
    setShowConfirmClear(true);
  };

  const confirmClearAll = () => {
    setInputText('');
    setFilterText('');
    setIsFilterEnabled(false);
    setSortOption('original');
    setShowConfirmClear(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setInputText(text);
      }
    };
    reader.readAsText(file);
    
    // Clear value to allow uploading the same file again if desired
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0B0F19] px-4 py-6 md:px-8 font-sans pb-24">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        
        {/* Header Introduction */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-[#1F2937]/50 pb-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-pink-500" />
              Vocab Analyzer
            </h1>
          </div>
        </div>

        {/* Core Layout Grid - 3 Columns on desktop for sequential workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Box 1: Input Box */}
          <div className="flex flex-col rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1F2937]/50 bg-[#111827]/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-500/10 text-xs font-bold text-pink-400">01</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Input text</span>
              </div>
              <div className="flex items-center gap-2">
                <label 
                  id="upload-txt-btn-label"
                  className="flex items-center gap-1 cursor-pointer rounded bg-[#1F2937] px-2.5 py-1 text-[10px] font-semibold text-[#9CA3AF] transition-all hover:bg-pink-500/10 hover:text-pink-400"
                >
                  <Upload className="h-3 w-3" />
                  Upload TXT
                  <input
                    type="file"
                    id="upload-txt-file-input"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {inputText && (
                  <button
                    onClick={handleClear}
                    id="clear-input-btn"
                    className="flex items-center gap-1 rounded bg-[#1F2937] px-2 py-1 text-[10px] font-semibold text-[#9CA3AF] transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your text here... (Example: Computer Vocabulary PDFBRO Document café résumé বাংলা 123abc)"
                id="vocab-analyzer-textarea"
                className="w-full min-h-[180px] md:min-h-[220px] flex-1 resize-none rounded-lg border border-[#1F2937] bg-[#0B0F19] p-3 font-mono text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none transition-colors focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20"
              />
            </div>

            {/* Input Statistics Bar */}
            <div className="border-t border-[#1F2937]/50 bg-[#111827]/30 px-4 py-3">
              <div className="flex items-center gap-1.5 text-pink-400 text-[10px] font-bold uppercase tracking-wider mb-2.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Input Statistics
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                  <div className="text-sm font-black text-white">{analysis.totalWords}</div>
                  <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Total Words</div>
                </div>
                <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                  <div className="text-sm font-black text-white">{analysis.totalUniqueWords}</div>
                  <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Unique Words</div>
                </div>
                <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                  <div className="text-sm font-black text-white">{analysis.totalDuplicateWords}</div>
                  <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Duplicate Types</div>
                </div>
                <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                  <div className="text-sm font-black text-pink-400">{analysis.totalRemovedOccurrences}</div>
                  <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Removed Occur.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Optional Word Filter Section */}
          <div className="flex flex-col rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1F2937]/50 bg-[#111827]/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-500/10 text-xs font-bold text-pink-400">02</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Word Filter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  {isFilterEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => setIsFilterEnabled(!isFilterEnabled)}
                  id="toggle-word-filter"
                  className={`relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFilterEnabled ? 'bg-pink-500' : 'bg-[#1F2937]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#9CA3AF] transition duration-200 ease-in-out ${
                      isFilterEnabled ? 'translate-x-4 bg-white' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col">
              {/* Content wrapper */}
              <div className={`p-4 flex-1 flex flex-col space-y-3 transition-all duration-200 ${!isFilterEnabled ? 'opacity-20 blur-[0.5px] select-none pointer-events-none' : ''}`}>
                <div className="flex-1 flex flex-col">
                  <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                    Ignored Words List
                  </div>
                  <textarea
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    disabled={!isFilterEnabled}
                    placeholder="e.g. the, is, are, was, were, have, has"
                    id="filter-words-textarea"
                    className="w-full min-h-[140px] flex-1 resize-none rounded-lg border border-[#1F2937] bg-[#0B0F19] p-3 font-mono text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none transition-colors focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20"
                  />
                </div>
                
                <p className="text-[10px] text-[#9CA3AF] leading-normal">
                  Matches words case-insensitively. Separation by commas, spaces, or newlines is accepted.
                </p>

                {isFilterEnabled && filterWordsSet.size > 0 && (
                  <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-2 max-h-[85px] overflow-hidden flex flex-col">
                    <div className="text-[9px] font-bold text-pink-400 uppercase tracking-wider mb-1">
                      Active Filters ({filterWordsSet.size})
                    </div>
                    <div className="flex flex-wrap gap-1 overflow-y-auto flex-1 pr-1">
                      {Array.from(filterWordsSet).map((word, i) => (
                        <span key={i} className="inline-block bg-[#1F2937] text-white text-[9px] font-medium px-1.5 py-0.5 rounded border border-[#374151]/30">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Overlay when disabled */}
              {!isFilterEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111827]/75 p-4 text-center select-none z-10">
                  <div className="rounded-full bg-pink-500/10 p-2.5 mb-2 text-pink-400">
                    <ListFilter className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    Word Filter is Inactive
                  </h3>
                  <p className="text-[10px] text-[#9CA3AF] max-w-[200px] leading-relaxed mb-3">
                    Optionally filter out specific vocabulary from the final output list.
                  </p>
                  <button
                    onClick={() => setIsFilterEnabled(true)}
                    className="text-[10px] font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-lg border border-pink-500/20 transition-all active:scale-98"
                  >
                    Enable Filter
                  </button>
                </div>
              )}
            </div>

            {/* Word Filter Statistics Footer (only when enabled) */}
            {isFilterEnabled && (
              <div className="border-t border-[#1F2937]/50 bg-[#111827]/30 px-4 py-3">
                <div className="flex items-center gap-1.5 text-pink-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Filter Statistics
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                    <div className="text-sm font-black text-white">{analysis.filterWordsCount}</div>
                    <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Filter Words</div>
                  </div>
                  <div className="rounded-lg bg-[#0B0F19] border border-[#1F2937]/60 p-1.5 text-center">
                    <div className="text-sm font-black text-pink-400">{analysis.matchedAndRemovedCount}</div>
                    <div className="text-[8px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Matched & Removed</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Box 3: Result Box */}
          <div className="flex flex-col rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1F2937]/50 bg-[#111827]/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-500/10 text-xs font-bold text-pink-400">03</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Cleaned Vocabulary Result</span>
              </div>
            </div>

            {/* Sorting Controls Section */}
            <div className="border-b border-[#1F2937]/50 bg-[#111827]/20 p-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">Sorting Order</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setSortOption('original')}
                  id="sort-original-btn"
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all ${
                    sortOption === 'original'
                      ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#1F2937]'
                  }`}
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Original</span>
                </button>
                <button
                  onClick={() => setSortOption('az')}
                  id="sort-az-btn"
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all ${
                    sortOption === 'az'
                      ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#1F2937]'
                  }`}
                >
                  <ArrowDownAZ className="h-3 w-3" />
                  <span>A to Z</span>
                </button>
                <button
                  onClick={() => setSortOption('za')}
                  id="sort-za-btn"
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all ${
                    sortOption === 'za'
                      ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#1F2937]'
                  }`}
                >
                  <ArrowUpAZ className="h-3 w-3" />
                  <span>Z to A</span>
                </button>
              </div>
            </div>

            {/* Output Format Controls Section */}
            <div className="border-b border-[#1F2937]/50 bg-[#111827]/20 p-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">Output Format</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setOutputFormat('comma')}
                  id="format-comma-btn"
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    outputFormat === 'comma'
                      ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#1F2937]'
                  }`}
                >
                  <span>Comma</span>
                </button>
                <button
                  onClick={() => setOutputFormat('line')}
                  id="format-line-btn"
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    outputFormat === 'line'
                      ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-[#0B0F19] border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#1F2937]'
                  }`}
                >
                  <span>Line</span>
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col space-y-4">
              <div className="flex-1 flex flex-col min-h-[140px] md:min-h-[180px]">
                <div className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Output Text</span>
                  <span className="text-[9px] font-mono lowercase normal-case text-pink-400">
                    {outputFormat === 'comma' ? 'comma separated' : 'one per line'}
                  </span>
                </div>
                <div className="w-full flex-1 rounded-lg border border-[#1F2937] bg-[#0B0F19] p-3 font-sans text-xs text-[#F9FAFB] overflow-y-auto max-h-[150px] md:max-h-[190px] whitespace-pre-wrap select-text break-words">
                  {analysis.outputText ? (
                    analysis.outputText
                  ) : (
                    <span className="text-[#4B5563] italic">Output will be displayed automatically once you enter text.</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  disabled={!analysis.outputText}
                  id="copy-result-btn"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold py-2.5 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadTXT}
                  disabled={!analysis.outputText}
                  id="download-txt-btn"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-[#F9FAFB] text-xs font-bold py-2.5 px-4 border border-[#374151]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  <Download className="h-4 w-4" />
                  <span>Download TXT</span>
                </button>
              </div>
            </div>

            {/* Output Statistics Footer */}
            <div className="border-t border-[#1F2937]/50 bg-[#111827]/30 px-4 py-3 flex items-center justify-center text-xs text-[#9CA3AF]">
              <div className="font-semibold text-[#F9FAFB]">
                Total Vocabulary: <span className="font-extrabold text-pink-400 font-mono text-sm ml-1">{analysis.finalWordsCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Duplicate Preview Collapsible Section */}
        {analysis.removedDuplicatesPreview.length > 0 && (
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
            <button
              onClick={() => setShowDuplicatePreview(!showDuplicatePreview)}
              id="toggle-duplicates-btn"
              className="w-full flex items-center justify-between border-b border-[#1F2937]/50 bg-[#111827]/40 px-4 py-3 text-left transition-colors hover:bg-[#111827]"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-pink-500/10 text-xs font-bold text-pink-400">04</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Duplicate Word Frequency Preview</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#0B0F19] border border-[#1F2937] px-2 py-0.5 rounded">
                {showDuplicatePreview ? 'Hide' : 'Show'} ({analysis.removedDuplicatesPreview.length} items)
              </span>
            </button>

            {showDuplicatePreview && (
              <div className="p-4 bg-[#0B0F19]/40">
                <p className="text-[11px] text-[#9CA3AF] mb-3">
                  These words had duplicate entries in the raw input and were simplified to their first-letter-capital format:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[180px] overflow-y-auto pr-2">
                  {analysis.removedDuplicatesPreview.map((dup, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded bg-[#0B0F19] border border-[#1F2937] px-3 py-1.5"
                    >
                      <span className="text-xs font-medium text-white truncate mr-2" title={dup.original}>
                        {dup.original}
                      </span>
                      <span className="text-[10px] font-black text-pink-400 shrink-0 bg-pink-500/10 px-1.5 py-0.5 rounded">
                        ×{dup.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Clear everything?
              </h3>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              This will remove all input text, filter words, output, duplicate preview, and reset all statistics.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-[#F9FAFB] text-xs font-bold py-2 px-4 border border-[#374151]/50 transition-all active:scale-98"
              >
                No
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 transition-all active:scale-98"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#1F2937] bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-500/10 p-2 text-pink-400">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Download Vocabulary TXT
              </h3>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="custom-filename-input" className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                File Name
              </label>
              <input
                id="custom-filename-input"
                type="text"
                autoFocus
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    triggerActualDownload();
                  }
                }}
                placeholder="Vocabulary"
                className="w-full rounded-lg bg-[#0B0F19] border border-[#1F2937] px-3 py-2 text-xs text-white focus:border-pink-500/70 focus:outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            <div className="rounded-lg bg-[#0B0F19]/60 border border-[#1F2937]/50 p-3 space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Final Download File Name:
              </div>
              <div className="text-xs font-mono text-pink-400 break-all select-all font-semibold">
                {filenamePreview}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFilenameModal(false)}
                className="flex-1 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-[#F9FAFB] text-xs font-bold py-2 px-4 border border-[#374151]/50 transition-all active:scale-98"
              >
                Cancel
              </button>
              <button
                onClick={triggerActualDownload}
                className="flex-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold py-2 px-4 transition-all active:scale-98"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
