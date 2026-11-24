"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { StateBuilder } from "@/components/StateBuilder";
import { QuestionBuilder } from "@/components/QuestionBuilder";
import {
  serializeQuestionBlocks,
  serializeStateBlocksToInput,
} from "@/lib/serialize";
import type {
  DecisionApiResponse,
  DecisionQuestionType,
  EvaluationMode,
  QuestionBlock,
  StateBlock,
} from "@/lib/types";

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function createInitialStateBlocks(): StateBlock[] {
  return [
    {
      id: "state_1",
      kind: "variable",
      key: "context",
      valueType: "string",
      value: "Add any structured context or text for gemini-decision-1 to evaluate.",
    },
  ];
}

function createInitialQuestions(): QuestionBlock[] {
  return [
    {
      id: "q_noul_1",
      key: "is_actionable",
      type: "noul",
      instructions: "Does the provided state contain an actionable request?",
      criteria: {
        true_description: "Contains a clear, concrete action or decision trigger.",
        false_description: "Purely informational or lacks a clear action.",
      },
    },
    {
      id: "q_choice_1",
      key: "category",
      type: "choice",
      instructions: "Which category best matches the provided state?",
      options: [
        {
          id: "opt_1",
          key: "technical",
          description: "Engineering, code, or architecture topic.",
        },
        {
          id: "opt_2",
          key: "product",
          description: "Feature request, UX, or roadmap topic.",
        },
        {
          id: "opt_3",
          key: "other",
          description: "Does not fit any listed category.",
        },
      ],
    },
    {
      id: "q_score_1",
      key: "clarity_score",
      type: "score",
      instructions: "How clear and self-contained is the provided context?",
      levels: [
        "Unclear or missing essential details",
        "Partially clear but requires follow-up",
        "Clear, specific, and immediately actionable",
      ],
    },
  ];
}

function buildQuickTsSnippet(
  stateBlocks: StateBlock[],
  questions: QuestionBlock[]
): string {
  const input = serializeStateBlocksToInput(stateBlocks).map((item) =>
    item.type === "text"
      ? item
      : { ...item, data: "<BASE64_DATA>" }
  );
  const serializedQuestions = serializeQuestionBlocks(questions);

  return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
});

const result = await ai.decisions.create({
  model: "gemini-decision-1",
  input: ${JSON.stringify(input, null, 2)},
  questions: ${JSON.stringify(serializedQuestions, null, 2)},
});

console.log(result.answers);`;
}

export default function PlaygroundPage() {
  const [mode, setMode] = useState<EvaluationMode>("live");
  const [stateBlocks, setStateBlocks] = useState<StateBlock[]>(
    createInitialStateBlocks
  );
  const [questions, setQuestions] = useState<QuestionBlock[]>(
    createInitialQuestions
  );
  const [response, setResponse] = useState<DecisionApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);

  const quickUploadRef = useRef<HTMLInputElement>(null);

  const serializedInput = useMemo(
    () => serializeStateBlocksToInput(stateBlocks),
    [stateBlocks]
  );
  const serializedQuestions = useMemo(
    () => serializeQuestionBlocks(questions),
    [questions]
  );

  const handleAddVariable = () => {
    const nextIdx =
      stateBlocks.filter((b) => b.kind === "variable").length + 1;
    setStateBlocks((prev) => [
      ...prev,
      {
        id: makeId("state"),
        kind: "variable",
        key: `field_${nextIdx}`,
        valueType: "string",
        value: "",
      },
    ]);
  };

  const handleAddAsset = () => {
    const nextIdx = stateBlocks.filter((b) => b.kind === "asset").length + 1;
    setStateBlocks((prev) => [
      ...prev,
      {
        id: makeId("asset"),
        kind: "asset",
        key: `asset_${nextIdx}`,
        fileName: "",
        mimeType: "",
        sizeBytes: 0,
        data: "",
        resolution: "low",
      },
    ]);
  };

  const handleQuickAssetUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIdx = result.indexOf(",");
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      setStateBlocks((prev) => {
        const nextIdx = prev.filter((b) => b.kind === "asset").length + 1;
        return [
          ...prev,
          {
            id: makeId("asset"),
            kind: "asset",
            key: `asset_${nextIdx}`,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            data: base64,
            resolution: file.type === "application/pdf" ? undefined : "low",
          },
        ];
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddQuestion = (type: DecisionQuestionType) => {
    const countOfType = questions.filter((q) => q.type === type).length + 1;
    if (type === "noul") {
      setQuestions((prev) => [
        ...prev,
        {
          id: makeId("q_noul"),
          key: `check_${countOfType}`,
          type: "noul",
          instructions: "",
          criteria: { true_description: "", false_description: "" },
        },
      ]);
    } else if (type === "choice") {
      setQuestions((prev) => [
        ...prev,
        {
          id: makeId("q_choice"),
          key: `classify_${countOfType}`,
          type: "choice",
          instructions: "",
          options: [
            { id: makeId("opt"), key: "option_a", description: "" },
            { id: makeId("opt"), key: "option_b", description: "" },
            {
              id: makeId("opt"),
              key: "other",
              description: "None of the listed options apply.",
            },
          ],
        },
      ]);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          id: makeId("q_score"),
          key: `rubric_${countOfType}`,
          type: "score",
          instructions: "",
          levels: [
            "Level 0 — lowest",
            "Level 1 — moderate",
            "Level 2 — highest",
          ],
        },
      ]);
    }
  };

  const handleClear = () => {
    setStateBlocks([
      {
        id: makeId("state"),
        kind: "variable",
        key: "context",
        valueType: "string",
        value: "",
      },
    ]);
    setQuestions([]);
    setResponse(null);
    setError(null);
  };

  const handleCopySdk = async () => {
    const snippet = buildQuickTsSnippet(stateBlocks, questions);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 1800);
    } catch {
      setCopiedSdk(false);
    }
  };

  const handleRunRequest = useCallback(async () => {
    if (isRunning) return;
    if (questions.length === 0) {
      setError("Add at least one question block (+ noul, + choice, or + score) before running.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          input: serializedInput,
          questions: serializedQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Request failed with status ${res.status}`);
      } else {
        setResponse(data as DecisionApiResponse);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error while calling /api/decision."
      );
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, mode, questions.length, serializedInput, serializedQuestions]);

  // Global Ctrl+Enter / Cmd+Enter shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleRunRequest();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRunRequest]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fbfbfc] text-[#1e1e1e]">
      <TopBar
        mode={mode}
        onModeChange={setMode}
        onClear={handleClear}
        onCopySdk={handleCopySdk}
        copiedSdk={copiedSdk}
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Input Builder (State + Questions + Pinned Bottom Bar) */}
        <section
          className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-white h-1/2 lg:h-full relative overflow-hidden"
          data-purpose="input-builder-pane"
        >
          <div className="flex-1 overflow-y-auto">
            <StateBuilder
              blocks={stateBlocks}
              onChange={setStateBlocks}
              onAddVariable={handleAddVariable}
              onAddAsset={handleAddAsset}
            />
            <QuestionBuilder
              questions={questions}
              onChange={setQuestions}
              onAddQuestion={handleAddQuestion}
            />
          </div>

          {/* Quick Asset Upload Strip */}
          <div className="border-t border-slate-200 px-3 py-1.5 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
            <button
              type="button"
              onClick={() => quickUploadRef.current?.click()}
              className="flex items-center space-x-2 text-slate-400 hover:text-[#1e1e1e] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="font-sans text-[11px]">
                Click to upload image or PDF asset
              </span>
            </button>
            <input
              ref={quickUploadRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                handleQuickAssetUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="text-[10px] font-mono text-slate-400">
              max 1,000 parallel questions
            </span>
          </div>

          {/* Pinned Bottom Action Bar */}
          <div className="border-t border-slate-200 px-3 py-2 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold text-[#1e1e1e] bg-slate-100 border border-slate-300">
                gemini-decision-1
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#1967d2] bg-[#e8f0fe] border border-[#c3ecf6]">
                v1beta
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleRunRequest()}
              disabled={isRunning || questions.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-sans text-white bg-[#4285f4] hover:bg-[#1a73e8] disabled:opacity-50 border border-[#1a73e8] font-semibold transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{isRunning ? "Evaluating..." : "Run request"}</span>
              <span className="text-[10px] font-mono text-white/85 ml-1">
                Ctrl+↵
              </span>
            </button>
          </div>
        </section>

        {/* Right Pane: Response & Payload Inspector */}
        <section
          className="w-full lg:w-1/2 flex flex-col bg-[#fbfbfc] h-1/2 lg:h-full overflow-y-auto"
          data-purpose="response-inspector-pane"
        >
          <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700 font-sans tracking-wide">
                Response
              </span>
              {response && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                    response.mode === "live"
                      ? "bg-[#e6f4ea] text-[#137333] border-[#ccf6c5]"
                      : "bg-[#fef7e0] text-[#b06000] border-[#ffe7a5]"
                  }`}
                >
                  {response.mode.toUpperCase()}
                </span>
              )}
            </div>
            {response && (
              <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500">
                <span>{response.latencyMs} ms</span>
                <span>in: {response.usage.total_input_tokens} tok</span>
                <span className="text-[#137333] font-semibold">
                  out: {response.usage.total_output_tokens} tok
                </span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3 flex-1">
            {error && (
              <div className="border border-[#ea4335] bg-[#fce8e6] text-[#c5221f] px-3 py-2 text-xs font-mono">
                {error}
              </div>
            )}

            {response?.fallbackReason && (
              <div className="border border-[#fbbc04] bg-[#fef7e0] text-[#b06000] px-3 py-2 text-xs font-sans">
                {response.fallbackReason}
              </div>
            )}

            {!response && !error && (
              <div className="border border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
                <div className="text-xs font-semibold text-[#1e1e1e]">
                  Ready to evaluate with{" "}
                  <span className="font-mono text-[#1967d2]">
                    gemini-decision-1
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Edit any <span className="font-mono">State</span> or{" "}
                  <span className="font-mono">Questions</span> block on the left
                  and press{" "}
                  <span className="font-mono px-1 bg-slate-100 border border-slate-200">
                    Ctrl+↵
                  </span>{" "}
                  to run parallel calibrated decisions with{" "}
                  <span className="font-mono text-[#137333]">
                    0 output tokens
                  </span>
                  .
                </p>
              </div>
            )}

            {response && (
              <div className="bg-[#1e1e1e] text-[#f0f0f0] border border-[#1e1e1e]">
                <div className="px-3 py-1.5 border-b border-[#333333] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#57caff]">
                    ~/gdg-console/decision-response.json
                  </span>
                  <span className="text-[#5cdb6d]">
                    total_output_tokens: {response.usage.total_output_tokens}
                  </span>
                </div>
                <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto code-editor">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
