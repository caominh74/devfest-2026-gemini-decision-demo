"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { generatePythonCode, generateTypeScriptCode } from "@/lib/codegen";
import type {
  DecisionApiResponse,
  QuestionBlock,
  StateBlock,
} from "@/lib/types";

interface SdkCodePanelProps {
  stateBlocks: StateBlock[];
  questions: QuestionBlock[];
  response: DecisionApiResponse | null;
}

export function SdkCodePanel({
  stateBlocks,
  questions,
  response,
}: SdkCodePanelProps) {
  const [lang, setLang] = useState<"typescript" | "python">("typescript");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const code = useMemo(() => {
    return lang === "typescript"
      ? generateTypeScriptCode(stateBlocks, questions)
      : generatePythonCode(stateBlocks, questions);
  }, [lang, stateBlocks, questions]);

  const rawJson = useMemo(() => {
    if (!response) return null;
    return JSON.stringify(response, null, 2);
  }, [response]);

  const copyText = async (
    text: string,
    setFlag: (val: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1800);
    } catch {
      setFlag(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generated SDK Code Terminal Panel */}
      <div className="bg-[#1e1e1e] text-[#f0f0f0] border border-[#1e1e1e]">
        <div className="px-3.5 py-2.5 border-b border-[#333333] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <Terminal className="w-4 h-4 text-[#57caff] shrink-0" />
            <span className="text-[#57caff]">
              {lang === "typescript"
                ? "~/gdg-console/decisions.ts"
                : "~/gdg-console/decisions.py"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            <div
              className="inline-flex border border-[#444444] text-xs font-mono"
              role="group"
              aria-label="SDK language"
            >
              <button
                type="button"
                onClick={() => setLang("typescript")}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  lang === "typescript"
                    ? "bg-[#4285f4] text-white font-semibold"
                    : "bg-[#262626] text-slate-300 hover:text-white"
                }`}
              >
                TypeScript
              </button>
              <button
                type="button"
                onClick={() => setLang("python")}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  lang === "python"
                    ? "bg-[#4285f4] text-white font-semibold"
                    : "bg-[#262626] text-slate-300 hover:text-white"
                }`}
              >
                Python
              </button>
            </div>

            {/* Copy SDK Button */}
            <button
              type="button"
              onClick={() => void copyText(code, setCopiedCode)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono border border-[#444444] bg-[#262626] hover:bg-[#333333] text-[#f0f0f0] transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#5cdb6d]" />
                  <span className="text-[#5cdb6d]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto code-editor text-[#f0f0f0]">
          <code>{code}</code>
        </pre>
      </div>

      {/* Raw API Response JSON Terminal Panel */}
      <div className="bg-[#1e1e1e] text-[#f0f0f0] border border-[#1e1e1e]">
        <div className="px-3.5 py-2.5 border-b border-[#333333] flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-[#57caff]">~/gdg-console/response.json</span>
            {response && (
              <span className="text-xs text-[#5cdb6d]">
                · {response.latencyMs}ms · {response.usage.total_output_tokens}{" "}
                out tokens
              </span>
            )}
          </div>

          {rawJson && (
            <button
              type="button"
              onClick={() => void copyText(rawJson, setCopiedJson)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono border border-[#444444] bg-[#262626] hover:bg-[#333333] text-[#f0f0f0] transition-colors cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#5cdb6d]" />
                  <span className="text-[#5cdb6d]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          )}
        </div>

        {rawJson ? (
          <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto code-editor text-[#f0f0f0]">
            <code>{rawJson}</code>
          </pre>
        ) : (
          <div className="p-4 text-sm font-mono text-slate-400">
            {"// Run a request (Ctrl+Enter) to inspect the raw JSON response."}
          </div>
        )}
      </div>
    </div>
  );
}
