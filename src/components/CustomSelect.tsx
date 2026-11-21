/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (val: T) => void;
  options: CustomSelectOption<T>[];
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function CustomSelect<T = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option...',
  className = '',
  id,
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative flex flex-col space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[#1F2937] bg-[#0B0F19] px-3.5 py-2.5 text-left text-xs font-semibold text-white shadow-inner transition-all hover:border-purple-500/50 hover:bg-[#111827] focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
          isOpen ? 'border-purple-500 ring-1 ring-purple-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-400' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 w-full overflow-y-auto rounded-xl border border-[#1F2937] bg-[#111827] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/20 text-purple-300 font-bold'
                    : 'text-[#D1D5DB] hover:bg-[#1F2937] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.subLabel && (
                      <div className="text-[10px] text-[#9CA3AF] font-normal">{opt.subLabel}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-mono text-purple-300">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
