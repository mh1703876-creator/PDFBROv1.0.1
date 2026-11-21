/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, FileText, ClipboardList, ListFilter, Wrench } from 'lucide-react';
import { RouteType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: RouteType;
  onNavigate: (route: RouteType) => void;
  onCompilationLogs: string[];
  clearLogs: () => void;
}

export default function Navigation({ isOpen, onClose, activeRoute, onNavigate, onCompilationLogs, clearLogs }: NavigationProps) {
  if (!isOpen) return null;

  const routesList = [
    {
      id: 'A' as RouteType,
      label: 'PDF Editor',
      description: '',
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      id: 'B' as RouteType,
      label: 'TXT Editor',
      description: '',
      icon: ClipboardList,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      id: 'D' as RouteType,
      label: 'Vocab Analyzer',
      description: '',
      icon: ListFilter,
      color: 'text-pink-500 bg-pink-500/10',
    },
    {
      id: 'E' as RouteType,
      label: 'Tools',
      description: '',
      icon: Wrench,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-start font-sans">
      {/* Dimmed backdrop background click handler to close */}
      <div 
        onClick={onClose}
        id="nav-backdrop"
        className="absolute inset-0 bg-[#000000]/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer menu panel */}
      <div 
        id="nav-menu-panel"
        className="relative flex h-full w-full max-w-[280px] flex-col border-r border-[#1F2937] bg-[#111827] p-5 shadow-2xl transition-transform"
      >
        {/* Title & Close */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
            Navigation Menu
          </span>
          <button 
            onClick={onClose}
            id="close-nav-btn"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#1F2937] hover:text-[#F9FAFB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Routes buttons */}
        <nav className="flex flex-col gap-2">
          {routesList.map((route) => {
            const IconComponent = route.icon;
            const isActive = activeRoute === route.id;
            return (
              <button
                key={route.id}
                id={`nav-route-${route.id.toLowerCase()}-btn`}
                onClick={() => {
                  onNavigate(route.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition-all active:scale-98 ${
                  isActive
                    ? 'bg-[#F9FAFB] text-[#0B0F19]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${route.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex flex-col">
                  <span className={`font-semibold leading-none ${isActive ? 'text-[#0B0F19]' : 'text-[#F9FAFB]'}`}>
                    {route.label}
                  </span>
                  {route.description && (
                    <span className="mt-1 text-[11px] opacity-75 leading-none">
                      {route.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* PWA App Install Button */}
        <div className="mt-4">
          <PWAInstallButton onInstalled={onClose} />
        </div>

        {/* Recent Logs Card */}
        {onCompilationLogs.length > 0 && (
          <div className="mt-4 rounded-lg border border-[#1F2937] bg-[#111827]/60 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
              <span className="font-mono text-blue-400">Recent logs</span>
              <button onClick={clearLogs} className="text-[#4B5563] hover:text-[#9CA3AF]">
                Dismiss
              </button>
            </div>
            <div className="mt-1.5 max-h-36 overflow-y-auto font-mono text-[10px] text-[#9CA3AF] space-y-1">
              {onCompilationLogs.map((logLine, index) => (
                <p key={index}>{logLine}</p>
              ))}
            </div>
          </div>
        )}

        {/* Footer info brand */}
        <div className="mt-auto border-t border-[#1F2937] pt-4 text-center">
          <p className="text-xs text-[#4B5563]">
            PDFBRO v10
          </p>
        </div>
      </div>
    </div>
  );
}
