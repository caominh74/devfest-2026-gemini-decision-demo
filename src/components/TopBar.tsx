"use client";

import { Check, Copy, RotateCcw } from "lucide-react";

interface TopBarProps {
  onClear: () => void;
  onCopySdk: () => void;
  copiedSdk: boolean;
}

export function TopBar({
  onClear,
  onCopySdk,
  copiedSdk,
}: TopBarProps) {
  return (
    <header
      className="min-h-12 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 sm:px-4 py-1.5 sm:py-0 z-20 shrink-0 pt-[max(0.375rem,env(safe-area-inset-top,0px))]"
      data-purpose="application-header"
    >
      {/* Left: GDG 4-color squares + title */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
        <div
          className="flex items-center space-x-1 sm:space-x-1.5 mr-0.5 sm:mr-1 shrink-0"
          aria-hidden="true"
        >
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#4285f4] inline-block" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ea4335] inline-block" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#fbbc04] inline-block" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#34a853] inline-block" />
        </div>
        <span className="text-sm font-bold text-[#1e1e1e] font-sans tracking-tight hidden md:inline">
          Google Developer Group
        </span>
        <span className="text-sm font-bold text-[#1e1e1e] font-sans tracking-tight md:hidden">
          GDG
        </span>
        <span className="text-slate-400 text-sm px-0.5 font-mono">/</span>
        <span className="text-sm font-medium text-slate-700">
          Playground
        </span>
        <span className="hidden lg:inline-block px-2 py-0.5 text-xs font-mono bg-[#e8f0fe] text-[#1967d2] border border-[#c3ecf6] ml-1 font-semibold shrink-0">
          GDG Edition
        </span>
      </div>

      {/* Right: Clear, Copy SDK */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="touch-target inline-flex items-center justify-center space-x-1.5 px-2 sm:px-2.5 py-1 text-xs text-slate-600 hover:text-[#1e1e1e] hover:bg-slate-100 border border-slate-200 sm:border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          title="Clear state and question inputs"
          aria-label="Clear state and question inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        {/* Copy SDK */}
        <button
          type="button"
          onClick={onCopySdk}
          className={`touch-target inline-flex items-center justify-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
            copiedSdk
              ? "bg-[#e6f4ea] text-[#137333] border-[#34a853]"
              : "bg-white text-slate-700 hover:text-[#1e1e1e] hover:bg-slate-50 border-slate-300"
          }`}
          title="Copy generated @google/genai TypeScript SDK snippet"
          aria-label={copiedSdk ? "SDK snippet copied" : "Copy SDK snippet"}
        >
          {copiedSdk ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#34a853]" aria-hidden="true" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="sm:hidden">SDK</span>
              <span className="hidden sm:inline">Copy SDK</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
