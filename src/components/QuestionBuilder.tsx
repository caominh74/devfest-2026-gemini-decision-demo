"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Info,
  X,
} from "lucide-react";
import type {
  ChoiceOption,
  ChoiceQuestionBlock,
  DecisionQuestionType,
  NoulQuestionBlock,
  QuestionBlock,
  ScoreQuestionBlock,
} from "@/lib/types";

interface QuestionBuilderProps {
  questions: QuestionBlock[];
  onChange: (questions: QuestionBlock[]) => void;
  onAddQuestion: (type: DecisionQuestionType) => void;
}

function createOptionId(): string {
  return `opt_${Math.random().toString(36).slice(2, 9)}`;
}

export function QuestionBuilder({
  questions,
  onChange,
  onAddQuestion,
}: QuestionBuilderProps) {
  const [armedDragId, setArmedDragId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  const reorderQuestions = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const fromIdx = questions.findIndex((q) => q.id === sourceId);
    const toIdx = questions.findIndex((q) => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...questions];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  };

  const updateNoul = (
    id: string,
    patch: Partial<Omit<NoulQuestionBlock, "id" | "type">>
  ) => {
    onChange(
      questions.map((q) =>
        q.id === id && q.type === "noul" ? { ...q, ...patch } : q
      )
    );
  };

  const updateChoice = (
    id: string,
    patch: Partial<Omit<ChoiceQuestionBlock, "id" | "type">>
  ) => {
    onChange(
      questions.map((q) =>
        q.id === id && q.type === "choice" ? { ...q, ...patch } : q
      )
    );
  };

  const updateScore = (
    id: string,
    patch: Partial<Omit<ScoreQuestionBlock, "id" | "type">>
  ) => {
    onChange(
      questions.map((q) =>
        q.id === id && q.type === "score" ? { ...q, ...patch } : q
      )
    );
  };

  const blockCountLabel =
    questions.length === 1 ? "1 block" : `${questions.length} blocks`;

  return (
    <section aria-label="Questions builder">
      {/* Sticky Questions Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-800 font-sans tracking-wide">
            Questions
          </span>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
            {blockCountLabel}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Info className="w-3.5 h-3.5" />
            <span>
              {questions.length} {questions.length === 1 ? "rule" : "rules"} ·
              parallel
            </span>
          </span>
        </div>
      </div>

      {/* Modular Scratch-style Question Blocks */}
      <div className="p-3.5 bg-white space-y-3.5">
        {questions.length === 0 && (
          <div className="border border-dashed border-slate-300 bg-[#fafbfc] px-4 py-6 text-center text-sm text-slate-500">
            No output questions yet. Pick{" "}
            <span className="font-mono text-[#1967d2]">+ noul</span>,{" "}
            <span className="font-mono text-[#b06000]">+ choice</span>, or{" "}
            <span className="font-mono text-[#137333]">+ score</span> below to
            evaluate your state in parallel.
          </div>
        )}

        {questions.map((q, index) => {
          const isDragging = draggingId === q.id;
          const isDragOver = dragOverId === q.id && draggingId !== q.id;

          const dragProps = {
            draggable: armedDragId === q.id,
            onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
              setDraggingId(q.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", q.id);
            },
            onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
              if (!draggingId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverId !== q.id) {
                setDragOverId(q.id);
              }
            },
            onDrop: (e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              const sourceId =
                draggingId || e.dataTransfer.getData("text/plain");
              if (sourceId) {
                reorderQuestions(sourceId, q.id);
              }
              setDraggingId(null);
              setDragOverId(null);
              setArmedDragId(null);
            },
            onDragEnd: () => {
              setDraggingId(null);
              setDragOverId(null);
              setArmedDragId(null);
            },
          };

          const gripHandle = (
            <button
              type="button"
              onPointerDown={() => setArmedDragId(q.id)}
              onPointerUp={() => setArmedDragId(null)}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5 -ml-0.5 transition-colors shrink-0"
              title="Drag to reorder"
              aria-label="Drag question block to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          );

          const dragRingClass = isDragOver
            ? "ring-2 ring-[#4285f4] ring-offset-1"
            : "";
          const dragOpacityClass = isDragging ? "opacity-40" : "";

          const reorderControls = (
            <div className="inline-flex items-center space-x-0.5 mr-1">
              <button
                type="button"
                onClick={() => moveQuestion(index, -1)}
                disabled={index === 0}
                className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                title="Move up"
                aria-label="Move question up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(index, 1)}
                disabled={index === questions.length - 1}
                className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                title="Move down"
                aria-label="Move question down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          );

          /* 1. NOUL (Blue #4285f4) */
          if (q.type === "noul") {
            return (
              <div
                key={q.id}
                {...dragProps}
                className={`scratch-block border-l-4 border-l-[#4285f4] border-t border-r border-b border-slate-300 bg-white p-3.5 shadow-sm hover:border-slate-400 transition-all ${dragRingClass} ${dragOpacityClass}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {gripHandle}
                    <div className="inline-block px-2 py-0.5 text-xs font-mono bg-[#e8f0fe] text-[#1967d2] border border-[#c3ecf6] font-bold shrink-0">
                      noul
                    </div>
                    <input
                      type="text"
                      value={q.key}
                      onChange={(e) => updateNoul(q.id, { key: e.target.value })}
                      placeholder="question_key"
                      aria-label="Noul question key"
                      className="text-sm font-mono font-semibold text-[#1e1e1e] bg-transparent border border-transparent hover:border-slate-200 focus:border-[#4285f4] focus:bg-[#f8f9fa] px-1.5 py-0.5 focus:outline-none min-w-0 flex-1"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {reorderControls}
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      bool [0.01..0.99]
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-slate-400 hover:text-[#ea4335] p-0.5 ml-1 transition-colors cursor-pointer"
                      title="Delete block"
                      aria-label="Delete noul question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center text-sm font-sans">
                    <span className="w-20 text-slate-400 text-xs font-mono shrink-0">
                      question
                    </span>
                    <div className="flex-1 flex items-center border border-slate-300 bg-white px-2.5 py-1.5 hover:border-slate-400 focus-within:border-[#4285f4]">
                      <input
                        type="text"
                        value={q.instructions}
                        onChange={(e) =>
                          updateNoul(q.id, { instructions: e.target.value })
                        }
                        placeholder="Ask a yes/no decision question..."
                        className="bg-transparent border-0 p-0 text-sm font-sans text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional criteria: true_description / false_description */}
                  <div className="flex items-start text-sm font-sans">
                    <span className="w-20 text-slate-400 text-xs font-mono shrink-0 pt-1.5">
                      criteria
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center border border-slate-200 bg-white px-2.5 py-1 focus-within:border-[#4285f4]">
                        <span className="text-xs font-mono text-[#137333] mr-1.5 shrink-0">
                          true:
                        </span>
                        <input
                          type="text"
                          value={q.criteria?.true_description ?? ""}
                          onChange={(e) =>
                            updateNoul(q.id, {
                              criteria: {
                                ...q.criteria,
                                true_description: e.target.value,
                              },
                            })
                          }
                          placeholder="Optional true criteria"
                          className="bg-transparent border-0 p-0 text-xs font-sans text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center border border-slate-200 bg-white px-2.5 py-1 focus-within:border-[#4285f4]">
                        <span className="text-xs font-mono text-[#c5221f] mr-1.5 shrink-0">
                          false:
                        </span>
                        <input
                          type="text"
                          value={q.criteria?.false_description ?? ""}
                          onChange={(e) =>
                            updateNoul(q.id, {
                              criteria: {
                                ...q.criteria,
                                false_description: e.target.value,
                              },
                            })
                          }
                          placeholder="Optional false criteria"
                          className="bg-transparent border-0 p-0 text-xs font-sans text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          /* 2. CHOICE (Yellow #fbbc04) */
          if (q.type === "choice") {
            const hasOtherOption = q.options.some(
              (o) => o.key.trim().toLowerCase() === "other"
            );

            const updateOption = (
              optId: string,
              patch: Partial<Omit<ChoiceOption, "id">>
            ) => {
              updateChoice(q.id, {
                options: q.options.map((o) =>
                  o.id === optId ? { ...o, ...patch } : o
                ),
              });
            };

            const addOption = () => {
              const nextNum = q.options.length + 1;
              updateChoice(q.id, {
                options: [
                  ...q.options,
                  {
                    id: createOptionId(),
                    key: `option_${nextNum}`,
                    description: "",
                  },
                ],
              });
            };

            const removeOption = (optId: string) => {
              if (q.options.length <= 2) return;
              updateChoice(q.id, {
                options: q.options.filter((o) => o.id !== optId),
              });
            };

            return (
              <div
                key={q.id}
                {...dragProps}
                className={`scratch-block border-l-4 border-l-[#fbbc04] border-t border-r border-b border-slate-300 bg-white p-3.5 shadow-sm hover:border-slate-400 transition-all ${dragRingClass} ${dragOpacityClass}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {gripHandle}
                    <div className="inline-block px-2 py-0.5 text-xs font-mono bg-[#fef7e0] text-[#b06000] border border-[#ffe7a5] font-bold shrink-0">
                      choice
                    </div>
                    <input
                      type="text"
                      value={q.key}
                      onChange={(e) =>
                        updateChoice(q.id, { key: e.target.value })
                      }
                      placeholder="question_key"
                      aria-label="Choice question key"
                      className="text-sm font-mono font-semibold text-[#1e1e1e] bg-transparent border border-transparent hover:border-slate-200 focus:border-[#fbbc04] focus:bg-[#f8f9fa] px-1.5 py-0.5 focus:outline-none min-w-0 flex-1"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {reorderControls}
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      choice ({q.options.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-slate-400 hover:text-[#ea4335] p-0.5 ml-1 transition-colors cursor-pointer"
                      title="Delete block"
                      aria-label="Delete choice question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center text-sm font-sans">
                    <span className="w-20 text-slate-400 text-xs font-mono shrink-0">
                      question
                    </span>
                    <div className="flex-1 flex items-center border border-slate-300 bg-white px-2.5 py-1.5 hover:border-slate-400 focus-within:border-[#fbbc04]">
                      <input
                        type="text"
                        value={q.instructions}
                        onChange={(e) =>
                          updateChoice(q.id, { instructions: e.target.value })
                        }
                        placeholder="Ask a mutually exclusive single-select question..."
                        className="bg-transparent border-0 p-0 text-sm font-sans text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-start text-sm font-sans">
                    <span className="w-20 text-slate-400 text-xs font-mono shrink-0 pt-1.5">
                      options
                    </span>
                    <div className="flex-1 space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id}
                          className="flex items-center space-x-2"
                        >
                          <span className="text-xs font-mono text-slate-400 w-5 shrink-0">
                            {optIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt.key}
                            onChange={(e) =>
                              updateOption(opt.id, { key: e.target.value })
                            }
                            placeholder="option_id"
                            aria-label={`Option ${optIdx + 1} key`}
                            className="w-36 sm:w-40 border border-slate-200 bg-[#f8f9fa] px-2.5 py-1 text-sm font-mono text-[#1e1e1e] focus:outline-none focus:border-[#fbbc04] focus:bg-white shrink-0"
                          />
                          <input
                            type="text"
                            value={opt.description}
                            onChange={(e) =>
                              updateOption(opt.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Criteria description (optional)"
                            aria-label={`Option ${optIdx + 1} description`}
                            className="flex-1 min-w-0 border border-slate-200 bg-white px-2.5 py-1 text-sm font-sans text-[#1e1e1e] focus:outline-none focus:border-[#fbbc04]"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(opt.id)}
                            disabled={q.options.length <= 2}
                            className="text-slate-400 hover:text-[#ea4335] disabled:opacity-30 px-1 text-base cursor-pointer disabled:cursor-default"
                            title={
                              q.options.length <= 2
                                ? "At least 2 options required"
                                : "Remove option"
                            }
                            aria-label="Remove option"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-xs font-sans text-[#b06000] hover:text-[#ea4335] font-semibold flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>+ Add Option</span>
                        </button>

                        {!hasOtherOption && (
                          <button
                            type="button"
                            onClick={() =>
                              updateChoice(q.id, {
                                options: [
                                  ...q.options,
                                  {
                                    id: createOptionId(),
                                    key: "other",
                                    description:
                                      "None of the listed categories apply.",
                                  },
                                ],
                              })
                            }
                            className="inline-flex items-center space-x-1 text-xs font-mono text-[#b06000] bg-[#fef7e0] border border-[#ffe7a5] px-2 py-0.5 hover:bg-[#ffe7a5]/60 transition-colors cursor-pointer"
                            title="Keys sort alphabetically in UTF-8. Adding 'other' avoids forced misclassification."
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Tip: add &quot;other&quot; fallback</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          /* 3. SCORE (Green #34a853) — 0-indexed rubric levels */
          const updateLevel = (lvlIdx: number, value: string) => {
            const nextLevels = q.levels.map((lvl, i) =>
              i === lvlIdx ? value : lvl
            );
            updateScore(q.id, { levels: nextLevels });
          };

          const addLevel = () => {
            updateScore(q.id, {
              levels: [...q.levels, `Level ${q.levels.length} criteria`],
            });
          };

          const removeLevel = (lvlIdx: number) => {
            if (q.levels.length <= 2) return;
            updateScore(q.id, {
              levels: q.levels.filter((_, i) => i !== lvlIdx),
            });
          };

          return (
            <div
              key={q.id}
              {...dragProps}
              className={`scratch-block border-l-4 border-l-[#34a853] border-t border-r border-b border-slate-300 bg-white p-3.5 shadow-sm hover:border-slate-400 transition-all ${dragRingClass} ${dragOpacityClass}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3 gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {gripHandle}
                  <div className="inline-block px-2 py-0.5 text-xs font-mono bg-[#e6f4ea] text-[#137333] border border-[#ccf6c5] font-bold shrink-0">
                    score
                  </div>
                  <input
                    type="text"
                    value={q.key}
                    onChange={(e) => updateScore(q.id, { key: e.target.value })}
                    placeholder="question_key"
                    aria-label="Score question key"
                    className="text-sm font-mono font-semibold text-[#1e1e1e] bg-transparent border border-transparent hover:border-slate-200 focus:border-[#34a853] focus:bg-[#f8f9fa] px-1.5 py-0.5 focus:outline-none min-w-0 flex-1"
                  />
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  {reorderControls}
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    score [0..{Math.max(1, q.levels.length - 1)}]
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-400 hover:text-[#ea4335] p-0.5 ml-1 transition-colors cursor-pointer"
                    title="Delete block"
                    aria-label="Delete score question"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center text-sm font-sans">
                  <span className="w-20 text-slate-400 text-xs font-mono shrink-0">
                    rubric
                  </span>
                  <div className="flex-1 flex items-center border border-slate-300 bg-white px-2.5 py-1.5 hover:border-slate-400 focus-within:border-[#34a853]">
                    <input
                      type="text"
                      value={q.instructions}
                      onChange={(e) =>
                        updateScore(q.id, { instructions: e.target.value })
                      }
                      placeholder="Describe what to grade on this ordered rubric..."
                      className="bg-transparent border-0 p-0 text-sm font-sans text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ordered 0-indexed rubric level text inputs */}
                <div className="flex items-start text-sm font-sans">
                  <span className="w-20 text-slate-400 text-xs font-mono shrink-0 pt-1.5">
                    levels
                  </span>
                  <div className="flex-1 space-y-2">
                    {q.levels.map((levelText, lvlIdx) => (
                      <div
                        key={lvlIdx}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-xs font-mono font-bold text-[#137333] bg-[#e6f4ea] border border-[#ccf6c5] w-7 text-center py-1 shrink-0">
                          {lvlIdx}
                        </span>
                        <input
                          type="text"
                          value={levelText}
                          onChange={(e) => updateLevel(lvlIdx, e.target.value)}
                          placeholder={`Describe rubric level ${lvlIdx}...`}
                          aria-label={`Rubric level ${lvlIdx}`}
                          className="flex-1 min-w-0 border border-slate-200 bg-white px-2.5 py-1 text-sm font-sans text-[#1e1e1e] focus:outline-none focus:border-[#34a853]"
                        />
                        <button
                          type="button"
                          onClick={() => removeLevel(lvlIdx)}
                          disabled={q.levels.length <= 2}
                          className="text-slate-400 hover:text-[#ea4335] disabled:opacity-30 px-1 text-base cursor-pointer disabled:cursor-default"
                          title={
                            q.levels.length <= 2
                              ? "At least 2 rubric levels required"
                              : "Remove level"
                          }
                          aria-label={`Remove rubric level ${lvlIdx}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addLevel}
                      className="text-xs font-sans text-[#137333] hover:text-[#1e1e1e] font-semibold pt-0.5 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>+ Add Level</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Output Block Palette — Strictly 3 columns (+ noul, + choice, + score) */}
        <div className="pt-2">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            Add Output Block
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onAddQuestion("noul")}
              className="p-2.5 bg-[#f8fafd] border border-[#c3ecf6] hover:border-[#4285f4] hover:bg-[#e8f0fe] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono font-bold text-[#1967d2]">
                + noul
              </div>
              <div className="text-xs text-slate-600 font-sans truncate">
                Boolean condition
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAddQuestion("choice")}
              className="p-2.5 bg-[#fefdf8] border border-[#ffe7a5] hover:border-[#fbbc04] hover:bg-[#fef7e0] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono font-bold text-[#b06000]">
                + choice
              </div>
              <div className="text-xs text-slate-600 font-sans truncate">
                Multiple choice
              </div>
            </button>

            <button
              type="button"
              onClick={() => onAddQuestion("score")}
              className="p-2.5 bg-[#f8fdf9] border border-[#ccf6c5] hover:border-[#34a853] hover:bg-[#e6f4ea] text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono font-bold text-[#137333]">
                + score
              </div>
              <div className="text-xs text-slate-600 font-sans truncate">
                Rubric scoring
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
