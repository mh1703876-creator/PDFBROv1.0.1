/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Download, Check, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onInstalled }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledSuccess(true);
        if (onInstalled) onInstalled();
      }
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled || installedSuccess) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>PWA Installed</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="pwa-install-app-btn"
        onClick={handleInstallClick}
        className="flex w-full items-center gap-3.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 px-3.5 py-3 text-left font-semibold text-blue-400 transition-all hover:border-blue-500 hover:bg-blue-600/30 active:scale-98 cursor-pointer shadow-lg shadow-blue-500/10"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-tight">Install App</span>
          <span className="text-[10px] text-blue-300/80 font-normal">Offline PWA Mobile & Desktop</span>
        </div>
      </button>

      {/* Guide Modal for iOS Safari / Manual Installation */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#1F2937] bg-[#111827] p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install PDFBRO App</h3>
                  <p className="text-[11px] text-[#9CA3AF]">Install to your home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-[#D1D5DB]">
                <p className="text-gray-300">To install PDFBRO on your iPhone or iPad:</p>
                <div className="space-y-2 rounded-xl bg-[#0B0F19] p-3 border border-[#1F2937]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
                    <span className="flex items-center gap-1.5">
                      Tap the <Share className="inline h-3.5 w-3.5 text-blue-400" /> <strong>Share</strong> button in Safari.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">3</span>
                    <span>Tap <strong>Add</strong> in the top-right corner.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#D1D5DB]">
                <p className="text-gray-300">To install PDFBRO on your device:</p>
                <div className="space-y-2 rounded-xl bg-[#0B0F19] p-3 border border-[#1F2937]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
                    <span>Click the <strong>Install icon (⊕)</strong> in your browser address bar, or tap browser menu (⋮).</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">2</span>
                    <span>Select <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
