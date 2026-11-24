"use client";

import { useState } from "react";
import {
  Code2,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Upload,
  X,
} from "lucide-react";
import { formatBytes, serializeStateBlocksToInput } from "@/lib/serialize";
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

export function StateBuilder({
  blocks,
  onChange,
  onAddVariable,
  onAddAsset,
}: StateBuilderProps) {
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

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

  const rawPreview = (() => {
    const serialized = serializeStateBlocksToInput(blocks).map((item) => {
      if (item.type === "text") return item;
      return {
        ...item,
        data: `<base64: ${item.data.length} chars>`,
      };
    });
    return JSON.stringify(serialized, null, 2);
  })();

  const countLabel =
    blocks.length === 1 ? "1 variable" : `${blocks.length} variables`;

  return (
    <section aria-label="State input builder">
      {/* Sticky State Header */}
      <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700 font-sans tracking-wide">
            State
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
            {countLabel}
          </span>
        </div>
        <div className="inline-flex border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`p-1 border-r border-slate-200 transition-colors cursor-pointer ${
              viewMode === "visual"
                ? "bg-white text-slate-800"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Visual Block Mode"
            aria-label="Visual Block Mode"
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`p-1 transition-colors cursor-pointer ${
              viewMode === "raw"
                ? "bg-white text-slate-800"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Raw Input JSON View"
            aria-label="Raw Input JSON View"
          >
            <Code2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* State Canvas */}
      <div className="p-3 bg-[#fafbfc] border-b border-slate-200 space-y-2.5">
        {viewMode === "raw" ? (
          <div className="bg-[#1e1e1e] text-[#f0f0f0] border border-[#1e1e1e]">
            <div className="px-3 py-1.5 border-b border-[#333333] flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#57caff]">~/gdg-console/input.json</span>
              <span className="text-slate-400">shared prefix · billed once</span>
            </div>
            <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto code-editor">
              {rawPreview}
            </pre>
          </div>
        ) : (
          <>
            {blocks.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">
                No state variables yet. Add a{" "}
                <span className="font-mono text-[#1967d2]">SET state.</span>{" "}
                block or attach an image/PDF asset below.
              </div>
            )}

            {blocks.map((block) => {
              if (block.kind === "variable") {
                const jsonInvalid =
                  block.valueType === "json" && !isValidJson(block.value);

                return (
                  <div
                    key={block.id}
                    className="scratch-block bg-white border-l-4 border-l-[#4285f4] border-t border-r border-b border-slate-300 p-2.5 shadow-sm hover:border-slate-400 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-slate-300 py-0.5"
                          aria-hidden="true"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                        <div className="inline-flex items-center bg-[#e8f0fe] border border-[#c3ecf6] px-2 py-0.5 text-[10px] font-mono font-bold text-[#1967d2]">
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
                          className="text-[10px] font-mono border border-slate-200 bg-white px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-[#4285f4]"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="json">json</option>
                        </select>
                        {jsonInvalid && (
                          <span className="text-[10px] font-mono text-[#c5221f] bg-[#fce8e6] border border-[#f8d8d8] px-1">
                            invalid json
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="text-slate-300 hover:text-[#ea4335] p-0.5 transition-colors cursor-pointer"
                        title="Delete block"
                        aria-label="Delete state block"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 text-xs font-mono">
                      <div className="flex items-center border border-slate-200 bg-[#f8f9fa] px-2 py-1 flex-1 min-w-[130px] focus-within:border-[#4285f4]">
                        <span className="text-[10px] text-slate-500 font-sans mr-1 shrink-0">
                          key:
                        </span>
                        <input
                          type="text"
                          value={block.key}
                          onChange={(e) =>
                            updateVariable(block.id, { key: e.target.value })
                          }
                          placeholder="variable_name"
                          className="bg-transparent border-0 p-0 text-xs font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <div className="hidden sm:flex items-center justify-center text-slate-400 px-0.5 font-sans text-xs">
                        =
                      </div>
                      <div
                        className={`flex items-center border px-2 py-1 flex-[2] focus-within:border-[#4285f4] ${
                          jsonInvalid
                            ? "border-[#ea4335] bg-[#fce8e6]/20"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 font-sans mr-1 shrink-0">
                          value:
                        </span>
                        {block.valueType === "boolean" ? (
                          <select
                            aria-label="Boolean state value"
                            value={
                              block.value === "false" ? "false" : "true"
                            }
                            onChange={(e) =>
                              updateVariable(block.id, {
                                value: e.target.value,
                              })
                            }
                            className="bg-transparent border-0 p-0 text-xs font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input
                            type={block.valueType === "number" ? "number" : "text"}
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
                            className="bg-transparent border-0 p-0 text-xs font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
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
                  className="scratch-block bg-white border-l-4 border-l-[#ea4335] border-t border-r border-b border-slate-300 p-2.5 shadow-sm hover:border-slate-400 transition-colors"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="text-slate-300 py-0.5"
                        aria-hidden="true"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <div className="inline-flex items-center bg-[#fce8e6] border border-[#f8d8d8] px-2 py-0.5 text-[10px] font-mono font-bold text-[#c5221f]">
                        <span className="mr-1 text-[#ea4335]">ATTACH</span>
                        <span>asset_ref</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#c5221f] bg-[#f8d8d8] px-1 border border-[#f8d8d8]">
                        {isPdf ? "PDF Document" : "Image / PDF"}
                      </span>
                      {!isPdf && block.data && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 border border-slate-200">
                          res: {block.resolution ?? "low"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="text-slate-300 hover:text-[#ea4335] p-0.5 transition-colors cursor-pointer"
                      title="Delete block"
                      aria-label="Delete asset block"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 text-xs font-mono">
                    <div className="flex items-center border border-slate-200 bg-[#f8f9fa] px-2 py-1 flex-1 min-w-[130px] focus-within:border-[#ea4335]">
                      <span className="text-[10px] text-slate-500 font-sans mr-1 shrink-0">
                        key:
                      </span>
                      <input
                        type="text"
                        value={block.key}
                        onChange={(e) =>
                          updateAsset(block.id, { key: e.target.value })
                        }
                        placeholder="asset_ref"
                        className="bg-transparent border-0 p-0 text-xs font-mono text-[#1e1e1e] w-full focus:ring-0 focus:outline-none"
                      />
                    </div>
                    <div className="hidden sm:flex items-center justify-center text-slate-400 px-0.5 font-sans text-xs">
                      =
                    </div>
                    <label className="flex items-center justify-between border border-dashed border-[#ea4335] bg-[#fce8e6]/50 px-2 py-1 flex-[2] cursor-pointer hover:bg-[#fce8e6] transition-colors min-w-0">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(block.id, e.target.files?.[0])
                        }
                      />
                      <div className="flex items-center space-x-1.5 truncate">
                        {isPdf ? (
                          <FileText className="w-3.5 h-3.5 text-[#ea4335] shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-[#ea4335] shrink-0" />
                        )}
                        <span className="text-[11px] font-sans text-[#c5221f] truncate font-medium">
                          {block.fileName
                            ? `${block.fileName} (${formatBytes(block.sizeBytes)})`
                            : "Choose image or PDF..."}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-[#ea4335] underline shrink-0 ml-2 font-semibold">
                        {block.fileName ? "Replace" : "Upload"}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Add State Block Buttons */}
            <div className="pt-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={onAddVariable}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-sans font-medium text-[#1967d2] bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-[#c3ecf6] shadow-sm transition-colors cursor-pointer"
              >
                <span className="text-[#4285f4] font-bold">+</span>
                <span>Add State Block</span>
              </button>
              <button
                type="button"
                onClick={onAddAsset}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-sans text-slate-600 bg-white hover:bg-slate-50 border border-dashed border-slate-300 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-slate-400" />
                <span>Attach Asset Block</span>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
