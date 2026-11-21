/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Loader2, Download, Info, ArrowLeft, HelpCircle } from 'lucide-react';
import { RouteType } from '../types';

interface HeaderProps {
  onToggleMenu: () => void;
  onExport: () => void;
  isCompiling: boolean;
  currentRoute: RouteType;
  onNavigate: (route: RouteType) => void;
  onOpenTutorial?: () => void;
}

export default function Header({ onToggleMenu, onExport, isCompiling, currentRoute, onNavigate, onOpenTutorial }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-800/40 bg-[#0b0d11] px-4 md:px-6">
      {/* Left side: Hamburger and Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMenu}
          id="menu-toggle-btn"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-gray-800/50 active:scale-95 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={() => onNavigate('A')}
          id="header-home-logo-btn"
          className="flex items-center cursor-pointer select-none group"
          title="PDFBRO"
        >
          <span className="font-sans text-lg font-black tracking-wide text-white group-hover:opacity-90 transition-opacity">
            PDF<span className="text-[#2563eb] font-black">BRO</span>
          </span>
        </button>
      </div>

      {/* Right side: Tutorial, Info Guide & Export PDF */}
      <div className="flex items-center gap-1">
        {onOpenTutorial && currentRoute !== 'C' && (
          <button
            onClick={onOpenTutorial}
            id={`${currentRoute.toLowerCase()}-tutorial-header-btn`}
            title="Tutorial & Guide"
            aria-label="Tutorial & Guide"
            className="flex h-10 w-10 items-center justify-center text-gray-300 hover:text-blue-400 transition-colors active:scale-95 cursor-pointer"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        )}

        {currentRoute === 'A' && (
          <>
            <button
              onClick={() => onNavigate('C')}
              id="guide-info-header-btn"
              title="Guide of PDF Editor"
              aria-label="Guide of PDF Editor"
              className="flex h-10 w-10 items-center justify-center text-gray-300 hover:text-white transition-colors active:scale-95 cursor-pointer"
            >
              <Info className="h-6 w-6" />
            </button>

            <button
              onClick={onExport}
              disabled={isCompiling}
              id="export-pdf-header-btn"
              className="flex h-11 items-center justify-between gap-4 rounded-[1.25rem] bg-blue-600 pl-5 pr-1.5 font-sans transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-80 active:scale-95 text-white cursor-pointer ml-1"
            >
              {isCompiling ? (
                <>
                  <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">Compiling...</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-extrabold text-white tracking-wide">Export</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-white shadow-sm">
                    <Download className="h-4 w-4" strokeWidth={3} />
                  </div>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
