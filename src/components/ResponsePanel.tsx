"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Loader2,
  Table2,
} from "lucide-react";
import { SdkCodePanel } from "./SdkCodePanel";
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
}: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "code">(
    "structured"
  );
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

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
      className="w-full lg:w-1/2 flex flex-col bg-[#fbfbfc] h-1/2 lg:h-full overflow-hidden"
      data-purpose="response-inspector-pane"
    >
      {/* Top Response Header Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 gap-2">
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
            className={`inline-flex items-center space-x-1.5 px-3 py-1 border-r border-slate-300 transition-colors cursor-pointer ${
              activeTab === "structured"
                ? "bg-white text-[#1e1e1e] font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Structured</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "code"}
            onClick={() => setActiveTab("code")}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 transition-colors cursor-pointer ${
              activeTab === "code"
                ? "bg-[#1e1e1e] text-[#57caff] font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SDK &amp; JSON</span>
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
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
              <div className="border border-slate-300 bg-white p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    gemini-decision-1 · v1beta
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-[#e6f4ea] text-[#137333] border border-[#ccf6c5]">
                    0 output tokens
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-[#1e1e1e]">
                    Parallel Calibrated Decision Inspector
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Edit any <span className="font-mono">SET state.</span>{" "}
                    variable, attach an image/PDF, and define{" "}
                    <span className="font-mono text-[#1967d2]">noul</span>,{" "}
                    <span className="font-mono text-[#b06000]">choice</span>, or{" "}
                    <span className="font-mono text-[#137333]">score</span>{" "}
                    questions on the left. Press{" "}
                    <span className="font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-300 text-xs">
                      Ctrl+↵
                    </span>{" "}
                    to evaluate all questions in parallel against the shared
                    state prefix.
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-slate-300 bg-white overflow-hidden">
                {/* 3-Column Table Header */}
                <div className="grid grid-cols-12 border-b border-slate-300 bg-[#f6f3f2] text-xs font-mono uppercase tracking-wider text-slate-600">
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
                        <div className="grid grid-cols-12 items-start hover:bg-[#fafbfc] transition-colors">
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

                        {/* Expandable Criteria Drawer */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-[#fafbfc] px-4 py-3.5">
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
