"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Code2,
  Image as ImageIcon,
  Layers,
  Loader2,
  Table2,
  X,
} from "lucide-react";
import { SdkCodePanel } from "./SdkCodePanel";
import { PLAYGROUND_EXAMPLES, type PlaygroundExample } from "@/lib/examples";
import { serializeQuestionBlocks } from "@/lib/serialize";
import type {
  ChoiceAnswer,
  DecisionAnswer,
  DecisionApiQuestion,
  DecisionApiResponse,
  NoulAnswer,
  QuestionBlock,
  ScoreAnswer,
  StateBlock,
} from "@/lib/types";

interface ResponsePanelProps {
  stateBlocks: StateBlock[];
  questions: QuestionBlock[];
  response: DecisionApiResponse | null;
  error: string | null;
  isRunning: boolean;
  lastRunLabel: string | null;
  onLoadExample: (example: PlaygroundExample) => void;
  mobileHidden?: boolean;
}

function pct(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

function MiniDonut({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const size = 18;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}

function DotOnLineGauge({
  position,
  color,
  ticks,
  leftLabel,
  rightLabel,
}: {
  /** Normalized 0..1 position along the line */
  position: number;
  color: string;
  ticks?: number;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const clampedPct = Math.max(0, Math.min(100, position * 100));

  return (
    <div className="w-full space-y-1">
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="w-full h-[2px] bg-slate-200 relative">
          <div
            className="h-full"
            style={{ width: `${clampedPct}%`, backgroundColor: color }}
          />
        </div>

        {/* Optional tick marks */}
        {ticks && ticks >= 2 && (
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
            {Array.from({ length: ticks }).map((_, idx) => (
              <span
                key={idx}
                className="w-[1px] h-2.5 bg-slate-300 inline-block"
              />
            ))}
          </div>
        )}

        {/* Sharp square marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 border border-[#1e1e1e] transition-all"
          style={{ left: `${clampedPct}%`, backgroundColor: color }}
        />
      </div>

      {(leftLabel || rightLabel) && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

function NoulResultCell({ answer }: { answer: NoulAnswer }) {
  const truePct = Math.round(answer.noul * 100);
  const falsePct = Math.round((1 - answer.noul) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm font-mono">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#1967d2]">{truePct}% true</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">{falsePct}% false</span>
        </div>
        <span className="text-xs text-slate-500">
          Confidence: {pct(answer.confidence)}
        </span>
      </div>
      <DotOnLineGauge
        position={answer.noul}
        color="#4285f4"
        ticks={3}
        leftLabel="0.01"
        rightLabel="0.99"
      />
    </div>
  );
}

function ChoiceResultCell({ answer }: { answer: ChoiceAnswer }) {
  const ranked = Object.entries(answer.probabilities).sort(
    ([, a], [, b]) => b - a
  );
  const topVisible = ranked.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {topVisible.map(([optKey, prob], idx) => {
          const isWinner = optKey === answer.choice;
          return (
            <div
              key={optKey}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <MiniDonut
                  value={prob}
                  color={isWinner ? "#fbbc04" : "#94a3b8"}
                />
                <span
                  className={`font-mono truncate ${
                    isWinner
                      ? "font-bold text-[#1e1e1e]"
                      : "text-slate-500 font-normal"
                  }`}
                >
                  {optKey}
                </span>
                {idx === 0 && (
                  <span className="text-[10px] font-mono uppercase px-1.5 bg-[#fef7e0] text-[#b06000] border border-[#ffe7a5] shrink-0">
                    top
                  </span>
                )}
              </div>
              <span
                className={`font-mono text-xs shrink-0 ${
                  isWinner ? "font-bold text-[#b06000]" : "text-slate-400"
                }`}
              >
                {pct(prob)}
              </span>
            </div>
          );
        })}
        {ranked.length > 3 && (
          <div className="text-xs font-mono text-slate-400 pl-6">
            +{ranked.length - 3} more options
          </div>
        )}
      </div>
      <div className="text-xs font-mono text-slate-500 pt-0.5">
        Confidence: {pct(answer.confidence)}
      </div>
    </div>
  );
}

function ScoreResultCell({ answer }: { answer: ScoreAnswer }) {
  const levelIndices = Object.keys(answer.probabilities)
    .map((k) => Number(k))
    .filter((n) => !Number.isNaN(n));
  const maxLevel = levelIndices.length > 0 ? Math.max(...levelIndices) : 1;
  const normalizedPos = maxLevel > 0 ? answer.score / maxLevel : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm font-mono">
        <span className="font-bold text-[#137333]">
          {answer.score.toFixed(2)}{" "}
          <span className="font-normal text-slate-400">/ {maxLevel}</span>
        </span>
        <span className="text-xs text-slate-500">
          Confidence: {pct(answer.confidence)}
        </span>
      </div>
      <DotOnLineGauge
        position={normalizedPos}
        color="#34a853"
        ticks={Math.min(11, maxLevel + 1)}
        leftLabel="0"
        rightLabel={String(maxLevel)}
      />
    </div>
  );
}

function TypeBadge({ type }: { type: DecisionAnswer["type"] }) {
  if (type === "noul") {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-mono bg-[#e8f0fe] text-[#1967d2] border border-[#c3ecf6] font-bold">
        noul
      </span>
    );
  }
  if (type === "choice") {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-mono bg-[#fef7e0] text-[#b06000] border border-[#ffe7a5] font-bold">
        choice
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-mono bg-[#e6f4ea] text-[#137333] border border-[#ccf6c5] font-bold">
      score
    </span>
  );
}

function ExpandedCriteriaDetails({
  question,
  answer,
}: {
  question?: DecisionApiQuestion;
  answer: DecisionAnswer;
}) {
  if (answer.type === "noul") {
    const noulQ = question?.type === "noul" ? question : undefined;
    const trueDesc = noulQ?.criteria?.true_description;
    const falseDesc = noulQ?.criteria?.false_description;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
        <div className="border border-slate-200 bg-white p-2.5">
          <div className="text-xs font-mono font-bold text-[#137333] mb-1">
            true ({pct(answer.noul)})
          </div>
          <div className="text-slate-600 text-xs">
            {trueDesc || "No explicit true criteria provided."}
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-2.5">
          <div className="text-xs font-mono font-bold text-[#c5221f] mb-1">
            false ({pct(1 - answer.noul)})
          </div>
          <div className="text-slate-600 text-xs">
            {falseDesc || "No explicit false criteria provided."}
          </div>
        </div>
      </div>
    );
  }

  if (answer.type === "choice") {
    const choiceQ = question?.type === "choice" ? question : undefined;
    const ranked = Object.entries(answer.probabilities).sort(
      ([, a], [, b]) => b - a
    );

    return (
      <div className="space-y-2">
        {ranked.map(([optKey, prob]) => {
          const isWinner = optKey === answer.choice;
          const desc = choiceQ?.criteria[optKey];
          return (
            <div
              key={optKey}
              className="border border-slate-200 bg-white p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span
                  className={
                    isWinner ? "font-bold text-[#1e1e1e]" : "text-slate-600"
                  }
                >
                  {optKey}
                </span>
                <span className="text-slate-500">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(prob * 100)}%`,
                    backgroundColor: isWinner ? "#fbbc04" : "#94a3b8",
                  }}
                />
              </div>
              {desc && (
                <div className="text-xs text-slate-500 font-sans">{desc}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Score answer: 0-indexed rubric legend + per-level probabilities
  const levels = Object.keys(answer.probabilities).sort(
    (a, b) => Number(a) - Number(b)
  );

  return (
    <div className="space-y-2">
      {levels.map((lvlKey) => {
        const prob = answer.probabilities[lvlKey] ?? 0;
        const legendText = answer.legend[lvlKey] ?? "";
        return (
          <div
            key={lvlKey}
            className="border border-slate-200 bg-white p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-[#e6f4ea] text-[#137333] border border-[#ccf6c5] shrink-0">
                  {lvlKey}
                </span>
                <span className="text-slate-700 truncate">{legendText}</span>
              </div>
              <span className="font-mono text-slate-500 shrink-0">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100">
              <div
                className="h-full bg-[#34a853]"
                style={{ width: `${Math.round(prob * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResponsePanel({
  stateBlocks,
  questions,
  response,
  error,
  isRunning,
  lastRunLabel,
  onLoadExample,
  mobileHidden = false,
}: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "code">(
    "structured"
  );
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const serializedQuestions = useMemo(
    () => serializeQuestionBlocks(questions),
    [questions]
  );

  const toggleRow = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const answerEntries = response ? Object.entries(response.answers) : [];

  return (
    <section
      className={`${
        mobileHidden ? "hidden" : "flex"
      } lg:flex w-full lg:w-1/2 flex-col bg-[#fbfbfc] flex-1 lg:h-full overflow-hidden min-h-0`}
      data-purpose="response-inspector-pane"
    >
      {/* Top Response Header Bar */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between bg-white shrink-0 gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-sm font-semibold text-[#1e1e1e] font-sans tracking-wide">
            Response
          </span>
          <span className="text-slate-300 text-sm">·</span>
          {isRunning ? (
            <span className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#1967d2]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Evaluating...</span>
            </span>
          ) : lastRunLabel ? (
            <span className="text-xs font-mono text-slate-500 truncate">
              {lastRunLabel}
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-400">Ready</span>
          )}

          {response && !isRunning && (
            <span
              className={`text-xs font-mono px-2 py-0.5 border font-semibold shrink-0 ${
                response.mode === "live"
                  ? "bg-[#e6f4ea] text-[#137333] border-[#ccf6c5]"
                  : "bg-[#fef7e0] text-[#b06000] border-[#ffe7a5]"
              }`}
            >
              {response.mode.toUpperCase()}
            </span>
          )}
        </div>

        {/* View Toggle: Structured Response vs </> SDK Code & JSON */}
        <div
          className="inline-flex border border-slate-300 bg-slate-50 text-xs font-mono shrink-0"
          role="tablist"
          aria-label="Response view mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "structured"}
            onClick={() => setActiveTab("structured")}
            className={`touch-target inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 border-r border-slate-300 transition-colors cursor-pointer ${
              activeTab === "structured"
                ? "bg-white text-[#1e1e1e] font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Structured</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "code"}
            onClick={() => setActiveTab("code")}
            className={`touch-target inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 transition-colors cursor-pointer ${
              activeTab === "code"
                ? "bg-[#1e1e1e] text-[#57caff] font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>SDK &amp; JSON</span>
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] space-y-3.5 min-h-0">
        {error && (
          <div className="border border-[#ea4335] bg-[#fce8e6] text-[#c5221f] px-3.5 py-2.5 text-sm font-mono">
            {error}
          </div>
        )}

        {response?.fallbackReason && (
          <div className="border border-[#fbbc04] bg-[#fef7e0] text-[#b06000] px-3.5 py-2.5 text-sm font-sans">
            {response.fallbackReason}
          </div>
        )}

        {activeTab === "code" ? (
          <SdkCodePanel
            stateBlocks={stateBlocks}
            questions={questions}
            response={response}
          />
        ) : (
          <>
            {!response && !isRunning ? (
              !welcomeDismissed ? (
                <div className="bg-white border border-slate-200 p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6">
                  {/* Top Title + Dismiss */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                        ROAD TO DEVFEST 2026 · V1BETA
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1e1e]">
                        Gemini Decision 1
                      </h1>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWelcomeDismissed(true)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Dismiss overview"
                      aria-label="Dismiss overview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stipple Banner Callout */}
                  <div className="stipple-banner border border-[#c3ecf6] p-4 relative overflow-hidden">
                    <div className="sm:max-w-[78%] space-y-1.5 relative z-10">
                      <div className="text-sm font-bold text-[#1e1e1e]">
                        Calibrated probabilities with 0 output tokens
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Send a shared <span className="font-mono">State</span>{" "}
                        prefix once and evaluate up to 1,000 parallel{" "}
                        <span className="font-mono">noul</span>,{" "}
                        <span className="font-mono">choice</span>, and{" "}
                        <span className="font-mono">score</span> questions in a
                        single low-latency call.
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab("code")}
                          className="text-xs text-[#1a73e8] hover:text-[#174ea6] font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect generated SDK code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 opacity-75 pointer-events-none"
                      aria-hidden="true"
                    >
                      <svg
                        fill="none"
                        height="80"
                        viewBox="0 0 110 80"
                        width="110"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="75"
                          cy="40"
                          fill="#c3ecf6"
                          fillOpacity="0.7"
                          r="28"
                        />
                        <circle
                          cx="90"
                          cy="35"
                          fill="#ffd427"
                          fillOpacity="0.6"
                          r="16"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* 2-Column Capabilities Grid */}
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                      DECISION MODEL CAPABILITIES
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-4 bg-white relative space-y-3 hover:border-[#4285f4] transition-colors border-t-2 border-t-[#4285f4]">
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-xs font-sans bg-[#e8f0fe] text-[#1967d2] font-semibold border border-[#c3ecf6]">
                          Multimodal state
                        </div>
                        <div className="h-24 flex items-center justify-center text-[#4285f4]/75">
                          <ImageIcon className="w-12 h-12" strokeWidth={1.4} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-[#1e1e1e]">
                            Shared JSON, images &amp; PDFs
                          </div>
                          <div className="text-xs text-slate-500">
                            Billed once as a shared prefix across every question
                            in the batch
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-4 bg-white relative space-y-3 hover:border-[#34a853] transition-colors border-t-2 border-t-[#34a853]">
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-xs font-sans bg-[#e6f4ea] text-[#137333] font-semibold border border-[#ccf6c5]">
                          3 output types
                        </div>
                        <div className="h-24 flex items-center justify-center text-[#34a853]/75">
                          <Layers className="w-12 h-12" strokeWidth={1.4} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-[#1e1e1e]">
                            noul · choice · score
                          </div>
                          <div className="text-xs text-slate-500">
                            Isolated parallel scoring with calibrated confidence
                            distributions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clickable Examples */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                      MORE EXAMPLES · CLICK TO LOAD
                    </div>
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {PLAYGROUND_EXAMPLES.map((example) => (
                        <button
                          key={example.id}
                          type="button"
                          onClick={() => onLoadExample(example)}
                          className="w-full py-3 flex items-center justify-between gap-3 text-left text-sm hover:bg-[#f8fafd] px-2 cursor-pointer transition-colors group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1 min-w-0">
                            <span className="font-semibold text-[#1e1e1e] group-hover:text-[#1967d2] sm:w-44 sm:shrink-0">
                              {example.title}
                            </span>
                            <span className="text-slate-500 text-xs flex-1">
                              {example.description}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4285f4] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-300 bg-white p-6 space-y-2 text-center">
                  <div className="text-sm font-semibold text-[#1e1e1e]">
                    Ready to evaluate with{" "}
                    <span className="font-mono text-[#1967d2]">
                      gemini-decision-1
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Press{" "}
                    <span className="font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-300">
                      Ctrl+↵
                    </span>{" "}
                    to run your State and Questions blocks, or{" "}
                    <button
                      type="button"
                      onClick={() => setWelcomeDismissed(false)}
                      className="text-[#1a73e8] underline cursor-pointer"
                    >
                      show examples
                    </button>
                    .
                  </p>
                </div>
              )
            ) : (
              <div
                className="@container border border-slate-300 bg-white overflow-hidden"
                role="region"
                aria-label="Decision results"
              >
                {/* Wide Container (>= 560px): 3-Column Table Header */}
                <div className="hidden @[560px]:grid grid-cols-12 border-b border-slate-300 bg-[#f6f3f2] text-xs font-mono uppercase tracking-wider text-slate-600">
                  <div className="col-span-5 px-3.5 py-2.5 border-r border-slate-200">
                    Key &amp; instructions
                  </div>
                  <div className="col-span-5 px-3.5 py-2.5 border-r border-slate-200 flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[#1e1e1e] font-semibold normal-case">
                      gemini-decision-1
                      {response ? ` · ${response.latencyMs}ms` : ""}
                      {response
                        ? ` · ${response.usage.total_output_tokens} out tokens`
                        : ""}
                    </span>
                    {response && (
                      <span className="text-slate-400 normal-case">
                        {response.usage.total_input_tokens} in
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 px-3.5 py-2.5 text-right">Type</div>
                </div>

                {/* Narrow Container (< 560px): Compact Metadata Summary Bar */}
                <div className="@[560px]:hidden px-3 py-2 border-b border-slate-300 bg-[#f6f3f2] flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-mono text-slate-600">
                  <span className="text-[#1e1e1e] font-semibold">
                    gemini-decision-1
                    {response ? ` · ${response.latencyMs}ms` : ""}
                  </span>
                  {response && (
                    <span className="text-slate-500">
                      {response.usage.total_input_tokens} in ·{" "}
                      {response.usage.total_output_tokens} out
                    </span>
                  )}
                </div>

                {/* Loading Skeleton Rows */}
                {isRunning && answerEntries.length === 0 && (
                  <div className="p-6 text-center text-sm font-mono text-slate-400 flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4285f4]" />
                    <span>
                      Evaluating {questions.length} parallel questions...
                    </span>
                  </div>
                )}

                {/* Result Rows */}
                <div className="divide-y divide-slate-200">
                  {answerEntries.map(([key, answer]) => {
                    const isExpanded = Boolean(expandedKeys[key]);
                    const matchedQ = serializedQuestions[key];

                    return (
                      <div key={key} className="bg-white">
                        {/* Desktop / Wide 3-Column Row */}
                        <div className="hidden @[560px]:grid grid-cols-12 items-start hover:bg-[#fafbfc] transition-colors">
                          {/* Col 1: Key & instructions + chevron */}
                          <button
                            type="button"
                            onClick={() => toggleRow(key)}
                            className="col-span-5 px-3.5 py-3.5 border-r border-slate-200 text-left flex items-start space-x-2 cursor-pointer h-full"
                            aria-expanded={isExpanded}
                          >
                            <span className="text-slate-400 mt-0.5 shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </span>
                            <div className="min-w-0 space-y-1">
                              <div className="text-sm font-mono font-bold text-[#1e1e1e] truncate">
                                {key}
                              </div>
                              <div className="text-xs font-sans text-slate-500 line-clamp-2">
                                {matchedQ?.instructions ?? "Evaluated question"}
                              </div>
                            </div>
                          </button>

                          {/* Col 2: Calibrated Result Visualization */}
                          <div className="col-span-5 px-3.5 py-3.5 border-r border-slate-200">
                            {answer.type === "noul" && (
                              <NoulResultCell answer={answer} />
                            )}
                            {answer.type === "choice" && (
                              <ChoiceResultCell answer={answer} />
                            )}
                            {answer.type === "score" && (
                              <ScoreResultCell answer={answer} />
                            )}
                          </div>

                          {/* Col 3: Type Badge */}
                          <div className="col-span-2 px-3.5 py-3.5 flex justify-end">
                            <TypeBadge type={answer.type} />
                          </div>
                        </div>

                        {/* Mobile / Narrow Stacked Card Row */}
                        <div className="@[560px]:hidden">
                          <button
                            type="button"
                            onClick={() => toggleRow(key)}
                            className="w-full px-3 py-3 text-left flex items-start justify-between gap-2 hover:bg-[#fafbfc] transition-colors cursor-pointer"
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-start space-x-2 min-w-0">
                              <span className="text-slate-400 mt-0.5 shrink-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </span>
                              <div className="min-w-0 space-y-0.5">
                                <div className="text-sm font-mono font-bold text-[#1e1e1e] break-all">
                                  {key}
                                </div>
                                <div className="text-xs font-sans text-slate-500">
                                  {matchedQ?.instructions ??
                                    "Evaluated question"}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <TypeBadge type={answer.type} />
                            </div>
                          </button>

                          <div className="px-3 pb-3 pt-1">
                            {answer.type === "noul" && (
                              <NoulResultCell answer={answer} />
                            )}
                            {answer.type === "choice" && (
                              <ChoiceResultCell answer={answer} />
                            )}
                            {answer.type === "score" && (
                              <ScoreResultCell answer={answer} />
                            )}
                          </div>
                        </div>

                        {/* Expandable Criteria Drawer */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-[#fafbfc] px-3 sm:px-4 py-3.5">
                            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                              Criteria &amp; Distribution Breakdown
                            </div>
                            <ExpandedCriteriaDetails
                              question={matchedQ}
                              answer={answer}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
