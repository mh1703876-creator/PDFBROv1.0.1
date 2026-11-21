/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0F19] text-white select-none animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* LOGO: PDF (crisp white) + BRO (vibrant blue #3B82F6) */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center">
          <span className="text-white drop-shadow-sm">PDF</span>
          <span className="text-blue-500 font-black drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">BRO</span>
        </h1>

        {/* 8-spoke radiating spinner with high contrast white/slate spokes */}
        <div className="relative h-8 w-8 animate-spin mt-2" aria-label="Loading...">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 -ml-[1.5px] h-2.5 w-[3px] rounded-full bg-white shadow-xs"
              style={{
                transform: `rotate(${i * 45}deg)`,
                transformOrigin: '50% 16px',
                opacity: 0.25 + (i / 8) * 0.75,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
