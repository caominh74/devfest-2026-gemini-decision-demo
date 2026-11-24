"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import type { EvaluationMode } from "@/lib/types";

interface TopBarProps {
  mode: EvaluationMode;
  onModeChange: (mode: EvaluationMode) => void;
  onClear: () => void;
  onCopySdk: () => void;
  copiedSdk: boolean;
}

export function TopBar({
  mode,
  onModeChange,
  onClear,
  onCopySdk,
  copiedSdk,
}: TopBarProps) {
  return (
    <header
      className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-20 shrink-0"
      data-purpose="application-header"
    >
      {/* Left: GDG 4-color squares + title */}
      <div className="flex items-center space-x-2 min-w-0">
        <div
          className="flex items-center space-x-1.5 mr-1 shrink-0"
          aria-hidden="true"
        >
          <span className="w-3 h-3 bg-[#4285f4] inline-block" />
          <span className="w-3 h-3 bg-[#ea4335] inline-block" />
          <span className="w-3 h-3 bg-[#fbbc04] inline-block" />
          <span className="w-3 h-3 bg-[#34a853] inline-block" />
        </div>
        <span className="text-sm font-bold text-[#1e1e1e] font-sans tracking-tight truncate">
          Google Developer Group
        </span>
        <span className="text-slate-400 text-sm px-0.5 font-mono">/</span>
        <span className="text-sm font-medium text-slate-700 truncate">
          Playground
        </span>
        <span className="px-2 py-0.5 text-xs font-mono bg-[#e8f0fe] text-[#1967d2] border border-[#c3ecf6] ml-1 font-semibold shrink-0">
          GDG Edition
        </span>
      </div>

      {/* Right: Clear, Live / Mock toggle, Copy SDK */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-[#1e1e1e] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          title="Clear state and question inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        {/* Live / Mock Segmented Toggle */}
        <div
          className="inline-flex items-center border border-slate-300 bg-slate-50 text-xs font-mono"
          role="group"
          aria-label="Evaluation mode"
        >
          <button
            type="button"
            onClick={() => onModeChange("live")}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 transition-colors cursor-pointer ${
              mode === "live"
                ? "bg-[#e6f4ea] text-[#137333] font-semibold border-r border-slate-300"
                : "text-slate-500 hover:text-slate-800 border-r border-slate-200"
            }`}
            title="Call live gemini-decision-1 API (auto-falls back to Mock if GEMINI_API_KEY is unset)"
          >
            <span
              className={`w-2 h-2 inline-block ${
                mode === "live" ? "bg-[#34a853]" : "bg-slate-300"
              }`}
            />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("mock")}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 transition-colors cursor-pointer ${
              mode === "mock"
                ? "bg-[#fef7e0] text-[#b06000] font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Deterministic offline Mock Mode for stage resilience"
          >
            <span
              className={`w-2 h-2 inline-block ${
                mode === "mock" ? "bg-[#fbbc04]" : "bg-slate-300"
              }`}
            />
            <span>Mock</span>
          </button>
        </div>

        {/* Copy SDK */}
        <button
          type="button"
          onClick={onCopySdk}
          className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
            copiedSdk
              ? "bg-[#e6f4ea] text-[#137333] border-[#34a853]"
              : "bg-white text-slate-700 hover:text-[#1e1e1e] hover:bg-slate-50 border-slate-300"
          }`}
          title="Copy generated @google/genai TypeScript SDK snippet"
        >
          {copiedSdk ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#34a853]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy SDK</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
