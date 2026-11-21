/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Type, List, AlignLeft, Table, Copy, Check, Sparkles, ArrowLeft, FileText } from 'lucide-react';

type CategoryType = 'formatting' | 'listing' | 'alignment' | 'table';

interface RouteCProps {
  onBack?: () => void;
}

const AI_PROMPT_GUIDE = `# PDFBRO SYNTAX & FORMATTING GUIDE (AI FORMATTING SYSTEM PROMPT)

You are an expert document formatter specialized in converting unformatted, draft, or structured text into the PDFBRO document markup format.

Please follow these exact syntax specifications:

---
## 1. TEXT STYLING / RICH TEXT MARKERS
Wrap target text with matching opening and closing symbols:
- Bold: #text# (Hashtag)
- Italic: $text$ (Dollar Sign)
- UPPERCASE: !text! (Exclamation Mark)
- Underline: @text@ (At Sign)

### Double Combinations:
- Bold + Italic: #$text$#
- Bold + UPPERCASE: #!text!#
- Bold + Underline: #@text@#
- Italic + UPPERCASE: $!text!$
- Italic + Underline: $@text@$
- UPPERCASE + Underline: !@text@!

### Triple Combinations:
- Bold + Italic + UPPERCASE: #!$text$!#
- Bold + UPPERCASE + Underline: #!@text@!#
- Bold + Italic + Underline: #$@text@$#
- Italic + UPPERCASE + Underline: $!@text@!$

### All Four Combinations:
- Bold + Italic + UPPERCASE + Underline: #!$@text@$!#

### Strict Rules for Styling:
1. Formatting ONLY applies if BOTH opening and closing symbols are present (e.g. #hello# works, #hello does not).
2. Symbols must wrap the text completely.
3. If unclosed or unopened, text remains as normal plain text.

---
## 2. 3-LEVEL LIST FORMATTING SYSTEM
Place the marker at the VERY BEGINNING of a line.

### Level 1 Lists:
- <.> Dot / Bullet List (outputs: • Item)
- <=> Roman Numeral List (outputs: i. Item, ii. Item, ...)
- <~> Numeric List (outputs: 1. Item, 2. Item, ...)

### Level 2 Sub-Lists (Indented):
- {.} Dot Sub-List (outputs:     • Item)
- {=} Roman Sub-List (outputs:     i. Item)
- {~} Numeric Sub-List (outputs:     1.1 Item, 1.2 Item, ...)

### Level 3 Sub-Sub-Lists (Deep Indented):
- [.] Dot Sub-Sub-List (outputs:         • Item)
- [=] Roman Sub-Sub-List (outputs:         i. Item)
- [~] Numeric Sub-Sub-List (outputs:         1.1.1 Item)

### List Rules:
1. Markers MUST start at the beginning of the line.
2. Consecutive items of the same marker belong to the same list.
3. Blank lines (empty lines) break and reset list sequence numbering.
4. Rich text markers (#, $, !, @) work seamlessly inside any list item.

---
## 3. INLINE ALIGNMENT & PAGE BREAKS
Wrap paragraphs or text lines with inline alignment tags:
- Center Alignment: <c>Your text here<c>
- Right Alignment: <r>Your text here<r>
- Left Alignment: <l>Your text here<l>
- Justify Alignment: <j>Your text here<j>

### Page Break:
- <p>next<p> -> Immediately forces the document to start content on a new page.

---
## 4. TABLE FORMATTING
Tables use opening and closing tags with pipe (|) separated columns.

### Default Table (Left Aligned):
<t>
Column 1 | Column 2 | Column 3
Data 1 | Data 2 | Data 3
Data 4 | Data 5 | Data 6
</t>

### Table Alignments:
- Left-Aligned: <t> ... </t>
- Center-Aligned: <tc> ... </tc>
- Right-Aligned: <tr> ... </tr>

### Header Row:
Add <h> at the beginning of the header row (automatically bold and uppercase):
<t>
<h>Name | Age | Department
John Doe | 28 | Engineering
Jane Smith | 32 | Marketing
</t>

### Automatic Serial Columns:
Add <s1> for numbers (1, 2, 3...) or <sA> for letters (A, B, C...) on a separate line inside the table block:
<t>
<s1>
<h>Product | Price | Stock
Laptop | $1,200 | In Stock
Phone | $800 | Low Stock
</t>

---
## 5. EXAMPLE FORMATTED DOCUMENT
<c>#Company Quarterly Report#<c>
<c>$Published July 2026$<c>

#1. Key Highlights#
<~> Revenue grew by #25%# year-over-year.
<~> Expansion into #3 new markets#.
{~} Southeast Asia region
{~} European Union territory
<~> Customer satisfaction index reached !98%!.

#2. Financial Breakdown#
<t>
<s1>
<h>Quarter | Target ($M) | Actual ($M) | Status
Q1 | 12.5 | 13.1 | #Exceeded#
Q2 | 14.0 | 14.8 | #Exceeded#
Q3 | 15.0 | 15.2 | #Exceeded#
</t>

<p>next<p>

#3. Next Steps & Conclusion#
<.> Finalize annual strategic review.
<.> Complete infrastructure upgrades by #$Q4 2026$#.
`;

export default function RouteC_InfoPage({ onBack }: RouteCProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('formatting');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_GUIDE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy AI prompt:', err);
    }
  };

  const categories = [
    { id: 'formatting' as CategoryType, label: 'Formatting', icon: Type },
    { id: 'listing' as CategoryType, label: 'Listing', icon: List },
    { id: 'alignment' as CategoryType, label: 'Alignment', icon: AlignLeft },
    { id: 'table' as CategoryType, label: 'Table', icon: Table },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0B0F19] px-4 py-6 md:px-8 font-sans pb-24">
      <div className="mx-auto w-full max-w-2xl space-y-5">

        {/* Top Header / Back Button */}
        <div className="flex items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to PDF Editor"
              aria-label="Back to PDF Editor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1F2937] bg-[#111827] text-gray-300 hover:text-white hover:bg-[#1F2937] transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] whitespace-nowrap overflow-x-auto ml-auto">
            <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">PDF Editor</span>
            <span className="text-gray-600">/</span>
            <span className="font-bold text-white whitespace-nowrap">Guide of PDF Editor</span>
          </div>
        </div>

        {/* AI Prompt Copy Banner */}
        <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-[#111827] to-[#111827] p-4 md:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 shrink-0 text-yellow-400" />
                <span>AI Prompt &amp; Syntax Guide</span>
              </div>
              <p className="text-xs text-[#9CA3AF] max-w-md">
                Copy the complete formatting instructions to paste into AI tools (ChatGPT, Gemini, Claude) so they format your text automatically with PDFBRO syntax.
              </p>
            </div>

            <button
              onClick={handleCopyPrompt}
              id="copy-ai-prompt-btn"
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-[#0B0F19] shadow-yellow-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied AI Prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy AI Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Spec Card containing Special Character Guide */}
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">FORMATTING SYMBOLS GUIDE</h2>
            </div>
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors font-medium cursor-pointer"
              title="Copy prompt guide"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>

          {/* Top Category Segmented Switcher */}
          <div className="rounded-xl border border-[#1F2937]/80 bg-[#0B0F19] p-1 flex gap-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all ${
                    isActive
                      ? 'bg-yellow-500 text-[#0B0F19] shadow-sm font-extrabold'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-6 text-sm text-[#9CA3AF]">
            
            {/* Formatting Category */}
            {activeCategory === 'formatting' && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">FORMATTING SYMBOLS &amp; PURPOSE</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-white">
                    <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F2937]">
                      <span className="text-yellow-400">#</span> (Hashtag) &rarr; <span className="font-bold text-white">Bold</span>
                      <p className="font-sans text-[11px] text-[#9CA3AF] mt-0.5">Emphasizes headings, titles, and important keywords.</p>
                    </div>
                    <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F2937]">
                      <span className="text-yellow-400">$</span> (Dollar Sign) &rarr; <span className="italic text-white">Italic</span>
                      <p className="font-sans text-[11px] text-[#9CA3AF] mt-0.5">Used for subtitles, quotes, dates, and terminology.</p>
                    </div>
                    <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F2937]">
                      <span className="text-yellow-400">!</span> (Exclamation Mark) &rarr; <span className="uppercase text-white font-bold">UPPERCASE</span>
                      <p className="font-sans text-[11px] text-[#9CA3AF] mt-0.5">Converts wrapped letters directly to ALL-CAPS.</p>
                    </div>
                    <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F2937]">
                      <span className="text-yellow-400">@</span> (At Sign) &rarr; <span className="underline text-white">Underline</span>
                      <p className="font-sans text-[11px] text-[#9CA3AF] mt-0.5">Draws a clean underline below the selected phrase.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">SINGLE FORMATTING</h3>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between bg-[#0B0F19]/60 px-3 py-2 rounded">
                      <span><span className="text-yellow-400">#</span>text<span className="text-yellow-400">#</span></span>
                      <span className="font-bold text-white">Bold</span>
                    </div>
                    <div className="flex justify-between bg-[#0B0F19]/60 px-3 py-2 rounded">
                      <span><span className="text-yellow-400">$</span>text<span className="text-yellow-400">$</span></span>
                      <span className="italic text-white">Italic</span>
                    </div>
                    <div className="flex justify-between bg-[#0B0F19]/60 px-3 py-2 rounded">
                      <span><span className="text-yellow-400">!</span>text<span className="text-yellow-400">!</span></span>
                      <span className="uppercase text-white">UPPERCASE</span>
                    </div>
                    <div className="flex justify-between bg-[#0B0F19]/60 px-3 py-2 rounded">
                      <span><span className="text-yellow-400">@</span>text<span className="text-yellow-400">@</span></span>
                      <span className="underline text-white">Underline</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">DOUBLE COMBINATIONS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#$</span>text<span className="text-yellow-400">$#</span></span>
                      <span className="font-bold italic text-white">Bold + Italic</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#!</span>text<span className="text-yellow-400">!#</span></span>
                      <span className="font-bold uppercase text-white">Bold + UPPERCASE</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#@</span>text<span className="text-yellow-400">@#</span></span>
                      <span className="font-bold underline text-white">Bold + Underline</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">$!</span>text<span className="text-yellow-400">!$</span></span>
                      <span className="italic uppercase text-white">Italic + UPPERCASE</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">$@</span>text<span className="text-yellow-400">@$</span></span>
                      <span className="italic underline text-white">Italic + Underline</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">!@</span>text<span className="text-yellow-400">@!</span></span>
                      <span className="uppercase underline text-white">UPPERCASE + Underline</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">TRIPLE COMBINATIONS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#!$</span>text<span className="text-yellow-400">$!#</span></span>
                      <span className="font-bold italic uppercase text-white">Bold + Italic + UPPERCASE</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#!@</span>text<span className="text-yellow-400">@!#</span></span>
                      <span className="font-bold uppercase underline text-white">Bold + UPPERCASE + Underline</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">#$@</span>text<span className="text-yellow-400">@$#</span></span>
                      <span className="font-bold italic underline text-white">Bold + Italic + Underline</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">$!@</span>text<span className="text-yellow-400">!@$</span></span>
                      <span className="italic uppercase underline text-white">Italic + UPPERCASE + Underline</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">ALL FOUR FORMATTING</h3>
                  <div className="bg-[#0B0F19]/60 px-3 py-2.5 rounded flex justify-between font-mono text-xs">
                    <span><span className="text-yellow-400">#!$@</span>text<span className="text-yellow-400">@$!#</span></span>
                    <span className="font-bold italic uppercase underline text-white">Bold + Italic + UPPERCASE + Underline</span>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">STRICT RULES</h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Formatting works ONLY when the opening and closing symbols are both present.</li>
                    <li>If either the opening or closing symbol is missing, do NOT apply formatting.</li>
                    <li>Symbols must wrap the text completely.</li>
                    <li>Normal text must remain unchanged if the formatting syntax is incomplete.</li>
                  </ul>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">EXAMPLES</h3>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50"><span className="text-yellow-400">#</span>hello<span className="text-yellow-400">#</span> &rarr; <span className="font-bold text-white">Bold</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50"><span className="text-yellow-400">$</span>hello<span className="text-yellow-400">$</span> &rarr; <span className="italic text-white">Italic</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50"><span className="text-yellow-400">!</span>hello<span className="text-yellow-400">!</span> &rarr; <span className="uppercase text-white">UPPERCASE</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50"><span className="text-yellow-400">@</span>hello<span className="text-yellow-400">@</span> &rarr; <span className="underline text-white">Underline</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50 col-span-2"><span className="text-yellow-400">#</span>hello &rarr; <span className="text-[#9CA3AF]">No formatting (unclosed)</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50 col-span-2">hello<span className="text-yellow-400">#</span> &rarr; <span className="text-[#9CA3AF]">No formatting (unopened)</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50 font-mono"><span className="text-yellow-400">$@</span>hello<span className="text-yellow-400">@$</span> &rarr; <span className="italic underline text-white">Italic + Underline</span></div>
                    <div className="bg-[#0B0F19]/40 p-2.5 rounded border border-[#1F2937]/50 font-mono"><span className="text-yellow-400">#!$@</span>hello<span className="text-yellow-400">@$!#</span> &rarr; <span className="font-bold italic uppercase underline text-white">All Four</span></div>
                  </div>
                </div>
              </>
            )}

            {/* Listing Category */}
            {activeCategory === 'listing' && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">3-LEVEL LIST FORMATTING SYSTEM</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    Prepend special list markers at the beginning of each line to automatically compile bullet and numbered lists with automatic hierarchical counters.
                  </p>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-[#0B0F19]/60 p-3 rounded border border-[#1F2937] space-y-1">
                      <span className="text-white font-bold">LEVEL 1 LISTS</span>
                      <div className="text-[11px] text-white pt-1 space-y-1">
                        <div><span className="text-yellow-400">&lt;.&gt;</span> Dot List &rarr; • Item (Main Bullet Points)</div>
                        <div><span className="text-yellow-400">&lt;=&gt;</span> Roman List &rarr; i. Item (Roman Numerals: i, ii, iii...)</div>
                        <div><span className="text-yellow-400">&lt;~&gt;</span> Numeric List &rarr; 1. Item (Standard Numbering: 1, 2, 3...)</div>
                      </div>
                    </div>

                    <div className="bg-[#0B0F19]/60 p-3 rounded border border-[#1F2937] space-y-1">
                      <span className="text-white font-bold">LEVEL 2 SUB-LISTS (INDENTED)</span>
                      <div className="text-[11px] text-white pt-1 space-y-1">
                        <div><span className="text-yellow-400">{`{.}`}</span> Dot Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;• Item (Indented Bullets)</div>
                        <div><span className="text-yellow-400">{`{=}`}</span> Roman Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;i. Item (Indented Roman)</div>
                        <div><span className="text-yellow-400">{`{~}`}</span> Numeric Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;1.1 Item (Sub-Numbering: 1.1, 1.2...)</div>
                      </div>
                    </div>

                    <div className="bg-[#0B0F19]/60 p-3 rounded border border-[#1F2937] space-y-1">
                      <span className="text-white font-bold">LEVEL 3 SUB-SUB-LISTS (DEEP INDENTED)</span>
                      <div className="text-[11px] text-white pt-1 space-y-1">
                        <div><span className="text-yellow-400">[.]</span> Dot Sub-Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Item (Deep Nested Bullets)</div>
                        <div><span className="text-yellow-400">[=]</span> Roman Sub-Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i. Item (Deep Nested Roman)</div>
                        <div><span className="text-yellow-400">[~]</span> Numeric Sub-Sub List &rarr; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.1.1 Item (Deep Sub-Numbering: 1.1.1, 1.1.2...)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">LIST SPECIFIC RULES</h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[#9CA3AF]">
                    <li>List formatting triggers only if the marker is at the <span className="text-white font-semibold">beginning of a line</span>.</li>
                    <li>Consecutive list items of the same type belong to the same list.</li>
                    <li>Blank lines (empty lines) or switching list markers terminates the current list and restarts the counters on subsequent lists.</li>
                    <li>Nested Numeric lists automatically generate <span className="text-white">hierarchical numbering</span> (e.g. 1.1, 1.1.1).</li>
                    <li>Sub-lists can work independently without a parent (the lowest level used is treated as level 1).</li>
                    <li>Existing rich-text symbol styling (<span className="text-white font-mono"><span className="text-yellow-400">#</span> <span className="text-yellow-400">$</span> <span className="text-yellow-400">!</span> <span className="text-yellow-400">@</span></span>) works beautifully inside any list item!</li>
                  </ul>
                </div>
              </>
            )}

            {/* Alignment Category */}
            {activeCategory === 'alignment' && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">INLINE ALIGNMENT SYNTAX</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    Use these syntax tags to apply specific text alignment to targeted headings or paragraphs.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">&lt;c&gt;</span>Text<span className="text-yellow-400">&lt;c&gt;</span></span>
                      <span className="text-white">&rarr; Center alignment</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">&lt;r&gt;</span>Text<span className="text-yellow-400">&lt;r&gt;</span></span>
                      <span className="text-white">&rarr; Right alignment</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">&lt;l&gt;</span>Text<span className="text-yellow-400">&lt;l&gt;</span></span>
                      <span className="text-white">&rarr; Left alignment</span>
                    </div>
                    <div className="bg-[#0B0F19]/60 px-3 py-2 rounded flex justify-between">
                      <span><span className="text-yellow-400">&lt;j&gt;</span>Text<span className="text-yellow-400">&lt;j&gt;</span></span>
                      <span className="text-white">&rarr; Justify alignment</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F2937] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">PAGE BREAK SYNTAX</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    Starts the following content from a brand new PDF page.
                  </p>
                  <div className="bg-[#0B0F19]/60 px-3 py-2 rounded font-mono text-xs flex justify-between">
                    <span><span className="text-yellow-400">&lt;p&gt;next&lt;p&gt;</span></span>
                    <span className="text-white">&rarr; Starts content on a new page</span>
                  </div>
                </div>
              </>
            )}

            {/* Table Category */}
            {activeCategory === 'table' && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">TABLE FORMATTING SYNTAX</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    Create clean tables with vector lines, text wrapping, and alignment options. Table width automatically fits the available document space.
                  </p>
                  
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="text-white font-medium mb-1.5">Default Table (Left-Aligned)</h4>
                      <pre className="bg-[#0B0F19]/60 px-3 py-2 rounded font-mono text-[#F9FAFB] overflow-x-auto">
                        <span className="text-yellow-400">&lt;t&gt;</span>{`\n`}
                        Name <span className="text-yellow-400">|</span> Age <span className="text-yellow-400">|</span> City{`\n`}
                        John <span className="text-yellow-400">|</span> 25 <span className="text-yellow-400">|</span> London{`\n`}
                        Alice <span className="text-yellow-400">|</span> 30 <span className="text-yellow-400">|</span> Paris{`\n`}
                        <span className="text-yellow-400">&lt;/t&gt;</span>
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-1.5">Table with Header Row</h4>
                      <p className="text-[#9CA3AF] mb-1.5">Add <code className="text-[#F9FAFB] font-mono"><span className="text-yellow-400">&lt;h&gt;</span></code> before the first row to make it a header. Cells in the header row are automatically formatted as <strong className="text-white">Bold</strong> and converted to <span className="uppercase text-white">UPPERCASE</span>.</p>
                      <pre className="bg-[#0B0F19]/60 px-3 py-2 rounded font-mono text-[#F9FAFB] overflow-x-auto">
                        <span className="text-yellow-400">&lt;t&gt;</span>{`\n`}
                        <span className="text-yellow-400">&lt;h&gt;</span>Name <span className="text-yellow-400">|</span> Age <span className="text-yellow-400">|</span> City{`\n`}
                        John <span className="text-yellow-400">|</span> 25 <span className="text-yellow-400">|</span> London{`\n`}
                        Alice <span className="text-yellow-400">|</span> 30 <span className="text-yellow-400">|</span> Paris{`\n`}
                        <span className="text-yellow-400">&lt;/t&gt;</span>
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-1.5">Table with Automatic Serial Columns</h4>
                      <p className="text-[#9CA3AF] mb-1.5">Insert <code className="text-[#F9FAFB] font-mono"><span className="text-yellow-400">&lt;s1&gt;</span></code> or <code className="text-[#F9FAFB] font-mono"><span className="text-yellow-400">&lt;sA&gt;</span></code> on its own line inside the table block to generate a compact, automatic serial column.</p>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold text-white block mb-1">Numeric Serial <span className="text-yellow-400">(&lt;s1&gt;)</span></span>
                          <pre className="bg-[#0B0F19]/60 px-3 py-2 rounded font-mono text-[#F9FAFB] overflow-x-auto">
                            <span className="text-yellow-400">&lt;t&gt;</span>{`\n`}
                            <span className="text-yellow-400">&lt;s1&gt;</span>{`\n`}
                            <span className="text-yellow-400">&lt;h&gt;</span>Name <span className="text-yellow-400">|</span> Age <span className="text-yellow-400">|</span> City{`\n`}
                            John <span className="text-yellow-400">|</span> 25 <span className="text-yellow-400">|</span> London{`\n`}
                            <span className="text-yellow-400">&lt;/t&gt;</span>
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block mb-1">Alphabetic Serial <span className="text-yellow-400">(&lt;sA&gt;)</span></span>
                          <pre className="bg-[#0B0F19]/60 px-3 py-2 rounded font-mono text-[#F9FAFB] overflow-x-auto">
                            <span className="text-yellow-400">&lt;t&gt;</span>{`\n`}
                            <span className="text-yellow-400">&lt;sA&gt;</span>{`\n`}
                            <span className="text-yellow-400">&lt;h&gt;</span>Name <span className="text-yellow-400">|</span> Age <span className="text-yellow-400">|</span> City{`\n`}
                            John <span className="text-yellow-400">|</span> 25 <span className="text-yellow-400">|</span> London{`\n`}
                            <span className="text-yellow-400">&lt;/t&gt;</span>
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-1.5">Table Alignment Controls</h4>
                      <p className="text-[#9CA3AF] mb-1.5">Control the alignment of the table and text cells with distinct tag markers.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-[#0B0F19]/60 px-3 py-2 rounded">
                          <span className="text-[#F9FAFB] font-mono font-medium"><span className="text-yellow-400">&lt;tc&gt;</span>...<span className="text-yellow-400">&lt;/tc&gt;</span></span>
                          <p className="text-[#9CA3AF] mt-1">Center alignment for the table cells.</p>
                        </div>
                        <div className="bg-[#0B0F19]/60 px-3 py-2 rounded">
                          <span className="text-[#F9FAFB] font-mono font-medium"><span className="text-yellow-400">&lt;tr&gt;</span>...<span className="text-yellow-400">&lt;/tr&gt;</span></span>
                          <p className="text-[#9CA3AF] mt-1">Right alignment for the table cells.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded text-amber-300">
                      <strong className="block text-sm font-semibold mb-1">⚠️ Columns Warning (3 &amp; 4 Columns)</strong>
                      Tables are fully supported in 1-column and 2-column layouts. Using tables in narrow 3-column and 4-column layouts is not recommended as it may reduce text readability and lead to excessive wrapping.
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
