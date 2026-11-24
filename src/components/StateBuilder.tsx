"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Upload,
  X,
} from "lucide-react";
import { buildStateObject, formatBytes } from "@/lib/serialize";
import type {
  AssetStateBlock,
  StateBlock,
  StateValueType,
  VariableStateBlock,
} from "@/lib/types";

interface StateBuilderProps {
  blocks: StateBlock[];
  onChange: (blocks: StateBlock[]) => void;
  onAddVariable: () => void;
  onAddAsset: () => void;
}

function isValidJson(raw: string): boolean {
  if (!raw.trim()) return true;
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

function inferStateBlocksFromObject(
  obj: Record<string, unknown>,
  existingBlocks: StateBlock[]
): StateBlock[] {
  const existingVarsByKey = new Map<string, VariableStateBlock>();
  const assetBlocks: AssetStateBlock[] = [];

  for (const block of existingBlocks) {
    if (block.kind === "variable") {
      existingVarsByKey.set(block.key.trim(), block);
    } else {
      assetBlocks.push(block);
    }
  }

  const nextVars: VariableStateBlock[] = Object.entries(obj).map(
    ([key, val], idx) => {
      const prev = existingVarsByKey.get(key);
      let valueType: StateValueType = "string";
      let value: string;

      if (typeof val === "number") {
        valueType = "number";
        value = String(val);
      } else if (typeof val === "boolean") {
        valueType = "boolean";
        value = val ? "true" : "false";
      } else if (typeof val === "string") {
        valueType = "string";
        value = val;
      } else {
        valueType = "json";
        value = JSON.stringify(val);
      }

      return {
        id: prev?.id ?? `state_raw_${idx}_${key}`,
        kind: "variable",
        key,
        valueType,
        value,
      };
    }
  );

  return [...nextVars, ...assetBlocks];
}

export function StateBuilder({
  blocks,
  onChange,
  onAddVariable,
  onAddAsset,
}: StateBuilderProps) {
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [rawText, setRawText] = useState<string>(() =>
    JSON.stringify(buildStateObject(blocks), null, 2)
  );
  const [rawError, setRawError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const lastEmittedJsonRef = useRef<string | null>(null);
  const [armedDragId, setArmedDragId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sync external block updates (e.g. Clear or Load Example) into the raw JSON editor
  const serializedStateJson = JSON.stringify(buildStateObject(blocks), null, 2);
  useEffect(() => {
    if (lastEmittedJsonRef.current === serializedStateJson) {
      lastEmittedJsonRef.current = null;
      return;
    }
    setRawText(serializedStateJson);
    setRawError(null);
  }, [serializedStateJson]);

  const handleSwitchMode = (nextMode: "visual" | "raw") => {
    if (nextMode === "raw") {
      setRawText(serializedStateJson);
      setRawError(null);
    }
    setViewMode(nextMode);
  };

  const handleRawChange = (nextText: string) => {
    setRawText(nextText);
    const trimmed = nextText.trim();
    if (!trimmed) {
      setRawError("Enter a JSON object (e.g. {}).");
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setRawError("State must be a JSON object (key-value pairs).");
        return;
      }
      setRawError(null);
      const nextBlocks = inferStateBlocksFromObject(
        parsed as Record<string, unknown>,
        blocks
      );
      lastEmittedJsonRef.current = JSON.stringify(
        buildStateObject(nextBlocks),
        null,
        2
      );
      onChange(nextBlocks);
    } catch (err) {
      setRawError(
        err instanceof Error ? err.message : "Invalid JSON syntax."
      );
    }
  };

  const handleFormatRaw = () => {
    try {
      const parsed = JSON.parse(rawText);
      const formatted = JSON.stringify(parsed, null, 2);
      setRawText(formatted);
      setRawError(null);
    } catch {
      // Keep current error message
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 1600);
    } catch {
      setCopiedRaw(false);
    }
  };

  const updateVariable = (
    id: string,
    patch: Partial<Omit<VariableStateBlock, "id" | "kind">>
  ) => {
    onChange(
      blocks.map((block) =>
        block.id === id && block.kind === "variable"
          ? { ...block, ...patch }
          : block
      )
    );
  };

  const updateAsset = (
    id: string,
    patch: Partial<Omit<AssetStateBlock, "id" | "kind">>
  ) => {
    onChange(
      blocks.map((block) =>
        block.id === id && block.kind === "asset"
          ? { ...block, ...patch }
          : block
      )
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const reorderBlocks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const fromIdx = blocks.findIndex((b) => b.id === sourceId);
    const toIdx = blocks.findIndex((b) => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  };

  const handleFileUpload = (id: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIdx = result.indexOf(",");
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      updateAsset(id, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        data: base64,
        resolution: file.type === "application/pdf" ? undefined : "low",
      });
    };
    reader.readAsDataURL(file);
  };

  const assetCount = blocks.filter((b) => b.kind === "asset").length;

  const countLabel =
    blocks.length === 1 ? "1 variable" : `${blocks.length} variables`;

  return (
    <section aria-label="State input builder">
      {/* Sticky State Header */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-800 font-sans tracking-wide">
            State
          </span>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
            {countLabel}
          </span>
        </div>
        <div
          className="inline-flex border border-slate-200 bg-slate-50"
          role="group"
          aria-label="State view mode"
        >
          <button
            type="button"
            onClick={() => handleSwitchMode("visual")}
            aria-pressed={viewMode === "visual"}
            className={`p-1.5 border-r border-slate-200 transition-colors cursor-pointer ${
              viewMode === "visual"
                ? "bg-white text-slate-900 font-semibold"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Visual Block Mode"
            aria-label="Visual Block Mode"
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("raw")}
            aria-pressed={viewMode === "raw"}
            className={`p-1.5 transition-colors cursor-pointer ${
              viewMode === "raw"
                ? "bg-[#1e1e1e] text-[#57caff] font-semibold"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Raw Input JSON View"
            aria-label="Raw Input JSON View"
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* State Canvas */}
      <div className="p-3 sm:p-3.5 bg-[#fafbfc] border-b border-slate-200 space-y-3">
        {viewMode === "raw" ? (
          <div className="bg-[#1e1e1e] text-[#f0f0f0] border border-[#1e1e1e]">
            <div className="px-3 py-2 border-b border-[#333333] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[#57caff]">~/gdg-console/state.json</span>
                <span className="text-slate-400">editable · syncs live</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleFormatRaw}
                  disabled={Boolean(rawError)}
                  className="px-2 py-0.5 border border-[#444444] bg-[#262626] hover:bg-[#333333] disabled:opacity-40 text-slate-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Format
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyRaw()}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 border border-[#444444] bg-[#262626] hover:bg-[#333333] text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="w-3 h-3 text-[#5cdb6d]" aria-hidden="true" />
                      <span className="text-[#5cdb6d]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              aria-label="Raw state JSON editor"
              value={rawText}
              onChange={(e) => handleRawChange(e.target.value)}
              spellCheck={false}
              rows={Math.max(6, Math.min(18, rawText.split("\n").length + 1))}
              className="w-full p-3 sm:p-3.5 text-xs sm:text-[13px] font-mono leading-relaxed bg-[#1e1e1e] text-[#f0f0f0] focus:outline-none resize-y code-editor block"
            />

            {rawError && (
              <div className="px-3 py-2 border-t border-[#ea4335] bg-[#fce8e6]/15 text-[#ff7daf] text-xs font-mono">
                Invalid JSON: {rawError}
              </div>
            )}

            {assetCount > 0 && (
              <div className="px-3 py-1.5 border-t border-[#333333] text-[11px] font-mono text-slate-400">
                + {assetCount} attached {assetCount === 1 ? "asset" : "assets"}{" "}
                preserved (manage attachments in Visual Block Mode)
              </div>
            )}
          </div>
        ) : (
          <>
            {blocks.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                No state variables yet. Add a{" "}
                <span className="font-mono text-[#1967d2]">SET state.</span>{" "}
                block or attach an image/PDF asset below.
              </div>
            )}

            {blocks.map((block) => {
              const isDragging = draggingId === block.id;
              const isDragOver =
                dragOverId === block.id && draggingId !== block.id;

              const dragProps = {
                draggable: armedDragId === block.id,
                onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
                  setDraggingId(block.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", block.id);
                },
                onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
                  if (!draggingId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverId !== block.id) {
                    setDragOverId(block.id);
                  }
                },
                onDrop: (e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const sourceId =
                    draggingId || e.dataTransfer.getData("text/plain");
                  if (sourceId) {
                    reorderBlocks(sourceId, block.id);
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
                  onPointerDown={() => setArmedDragId(block.id)}
                  onPointerUp={() => setArmedDragId(null)}
                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5 -ml-0.5 transition-colors"
                  title="Drag to reorder"
                  aria-label="Drag state block to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              );

              const dragRingClass = isDragOver
                ? "ring-2 ring-[#4285f4] ring-offset-1"
                : "";
              const dragOpacityClass = isDragging ? "opacity-40" : "";

              if (block.kind === "variable") {
                const jsonInvalid =
                  block.valueType === "json" && !isValidJson(block.value);

                return (
                  <div
                    key={block.id}
                    {...dragProps}
                    className={`scratch-block bg-white border-l-4 border-l-[#4285f4] border-t border-r border-b border-slate-300 p-3 shadow-sm hover:border-slate-400 transition-all ${dragRingClass} ${dragOpacityClass}`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        {gripHandle}
                        <div className="inline-flex items-center bg-[#e8f0fe] border border-[#c3ecf6] px-2 py-0.5 text-xs font-mono font-bold text-[#1967d2]">
                          <span className="mr-1 text-[#4285f4]">SET</span>
                          <span className="text-[#1967d2] font-sans">
                            state.
                          </span>
                        </div>
                        <select
                          aria-label="State value type"
                          value={block.valueType}
                          onChange={(e) => {
                            const nextType = e.target.value as StateValueType;
                            let nextValue = block.value;
                            if (
                              nextType === "boolean" &&
                              nextValue !== "true" &&
                              nextValue !== "false"
                            ) {
                              nextValue = "true";
                            }
                            updateVariable(block.id, {
                              valueType: nextType,
                              value: nextValue,
                            });
                          }}
                          className="text-xs font-mono border border-slate-200 bg-white px-2 py-0.5 text-slate-700 focus:outline-none focus:border-[#4285f4]"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="json">json</option>
                        </select>
                        {jsonInvalid && (
                          <span className="text-xs font-mono text-[#c5221f] bg-[#fce8e6] border border-[#f8d8d8] px-1.5">
                            invalid json
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="text-slate-400 hover:text-[#ea4335] p-0.5 transition-colors cursor-pointer"
                        title="Delete block"
                        aria-label="Delete state block"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-sm font-mono">
                      <div className="flex items-center border border-slate-200 bg-[#f8f9fa] px-2.5 py-1.5 flex-1 min-w-0 sm:min-w-[140px] focus-within:border-[#4285f4]">
                        <span className="text-xs text-slate-500 font-sans mr-1.5 shrink-0">
                          key:
                        </span>
                        <input
                          type="text"
                          value={block.key}
                          onChange={(e) =>
                            updateVariable(block.id, { key: e.target.value })
                          }
                          placeholder="variable_name"
                          className="bg-transparent border-0 p-0 text-sm font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <div className="hidden sm:flex items-center justify-center text-slate-400 px-0.5 font-sans text-sm">
                        =
                      </div>
                      <div
                        className={`flex items-center border px-2.5 py-1.5 flex-[2] focus-within:border-[#4285f4] ${
                          jsonInvalid
                            ? "border-[#ea4335] bg-[#fce8e6]/20"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="text-xs text-slate-500 font-sans mr-1.5 shrink-0">
                          value:
                        </span>
                        {block.valueType === "boolean" ? (
                          <select
                            aria-label="Boolean state value"
                            value={block.value === "false" ? "false" : "true"}
                            onChange={(e) =>
                              updateVariable(block.id, {
                                value: e.target.value,
                              })
                            }
                            className="bg-transparent border-0 p-0 text-sm font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input
                            type={
                              block.valueType === "number" ? "number" : "text"
                            }
                            value={block.value}
                            onChange={(e) =>
                              updateVariable(block.id, {
                                value: e.target.value,
                              })
                            }
                            placeholder={
                              block.valueType === "json"
                                ? '{"tier": "pro"}'
                                : block.valueType === "number"
                                  ? "42"
                                  : "Add context for gemini-decision-1..."
                            }
                            className="bg-transparent border-0 p-0 text-sm font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Asset block (Red #ea4335)
              const isPdf = block.mimeType === "application/pdf";
              return (
                <div
                  key={block.id}
                  {...dragProps}
                  className={`scratch-block bg-white border-l-4 border-l-[#ea4335] border-t border-r border-b border-slate-300 p-3 shadow-sm hover:border-slate-400 transition-all ${dragRingClass} ${dragOpacityClass}`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                      {gripHandle}
                      <div className="inline-flex items-center bg-[#fce8e6] border border-[#f8d8d8] px-2 py-0.5 text-xs font-mono font-bold text-[#c5221f]">
                        <span className="mr-1 text-[#ea4335]">ATTACH</span>
                        <span>asset_ref</span>
                      </div>
                      <span className="text-xs font-mono text-[#c5221f] bg-[#f8d8d8] px-1.5 border border-[#f8d8d8]">
                        {isPdf ? "PDF Document" : "Image / PDF"}
                      </span>
                      {!isPdf && block.data && (
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 border border-slate-200">
                          res: {block.resolution ?? "low"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="text-slate-400 hover:text-[#ea4335] p-0.5 transition-colors cursor-pointer"
                      title="Delete block"
                      aria-label="Delete asset block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-sm font-mono">
                    <div className="flex items-center border border-slate-200 bg-[#f8f9fa] px-2.5 py-1.5 flex-1 min-w-0 sm:min-w-[140px] focus-within:border-[#ea4335]">
                      <span className="text-xs text-slate-500 font-sans mr-1.5 shrink-0">
                        key:
                      </span>
                      <input
                        type="text"
                        value={block.key}
                        onChange={(e) =>
                          updateAsset(block.id, { key: e.target.value })
                        }
                        placeholder="asset_ref"
                        className="bg-transparent border-0 p-0 text-sm font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                      />
                    </div>
                    <div className="hidden sm:flex items-center justify-center text-slate-400 px-0.5 font-sans text-sm">
                      =
                    </div>
                    <label className="flex items-center justify-between border border-dashed border-[#ea4335] bg-[#fce8e6]/50 px-2.5 py-1.5 flex-[2] cursor-pointer hover:bg-[#fce8e6] transition-colors min-w-0">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(block.id, e.target.files?.[0])
                        }
                      />
                      <div className="flex items-center space-x-2 truncate">
                        {isPdf ? (
                          <FileText className="w-4 h-4 text-[#ea4335] shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-[#ea4335] shrink-0" />
                        )}
                        <span className="text-xs font-sans text-[#c5221f] truncate font-medium">
                          {block.fileName
                            ? `${block.fileName} (${formatBytes(block.sizeBytes)})`
                            : "Choose image or PDF..."}
                        </span>
                      </div>
                      <span className="text-xs font-sans text-[#ea4335] underline shrink-0 ml-2 font-semibold">
                        {block.fileName ? "Replace" : "Upload"}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Add State Block Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAddVariable}
                className="touch-target inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-sans font-medium text-[#1967d2] bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-[#c3ecf6] shadow-sm transition-colors cursor-pointer"
              >
                <span className="text-[#4285f4] font-bold">+</span>
                <span>Add State Block</span>
              </button>
              <button
                type="button"
                onClick={onAddAsset}
                className="touch-target inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-sans text-slate-600 bg-white hover:bg-slate-50 border border-dashed border-slate-300 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Attach Asset Block</span>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
