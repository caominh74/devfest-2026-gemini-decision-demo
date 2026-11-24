import type {
  DecisionApiQuestion,
  DecisionInputContent,
  QuestionBlock,
  StateBlock,
} from "./types";

export function parseStateValue(
  valueType: "string" | "number" | "boolean" | "json",
  rawValue: string
): unknown {
  if (valueType === "number") {
    const parsed = Number(rawValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (valueType === "boolean") {
    return rawValue.trim().toLowerCase() === "true";
  }
  if (valueType === "json") {
    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  }
  return rawValue;
}

export function buildStateObject(
  stateBlocks: StateBlock[]
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const block of stateBlocks) {
    if (block.kind === "variable") {
      const key = block.key.trim();
      if (!key) continue;
      obj[key] = parseStateValue(block.valueType, block.value);
    }
  }
  return obj;
}

export function serializeStateBlocksToInput(
  stateBlocks: StateBlock[]
): DecisionInputContent[] {
  const input: DecisionInputContent[] = [];
  const stateObj = buildStateObject(stateBlocks);

  if (Object.keys(stateObj).length > 0 || stateBlocks.every((b) => b.kind !== "asset")) {
    input.push({
      type: "text",
      text: JSON.stringify(stateObj) + "\n",
    });
  }

  for (const block of stateBlocks) {
    if (block.kind === "asset" && block.data.trim().length > 0) {
      if (block.mimeType === "application/pdf") {
        input.push({
          type: "document",
          data: block.data,
          mime_type: "application/pdf",
        });
      } else {
        input.push({
          type: "image",
          data: block.data,
          mime_type: block.mimeType || "image/jpeg",
          resolution: block.resolution ?? "low",
        });
      }
    }
  }

  return input;
}

export function serializeQuestionBlocks(
  questionBlocks: QuestionBlock[]
): Record<string, DecisionApiQuestion> {
  const questions: Record<string, DecisionApiQuestion> = {};

  questionBlocks.forEach((block, idx) => {
    const baseKey = block.key.trim() || `${block.type}_${idx + 1}`;
    let finalKey = baseKey;
    let suffix = 2;
    while (finalKey in questions) {
      finalKey = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    if (block.type === "noul") {
      const trueDesc = block.criteria?.true_description?.trim();
      const falseDesc = block.criteria?.false_description?.trim();
      const hasCriteria = Boolean(trueDesc || falseDesc);
      questions[finalKey] = {
        type: "noul",
        instructions: block.instructions.trim() || "Evaluate this statement.",
        ...(hasCriteria
          ? {
              criteria: {
                ...(trueDesc ? { true_description: trueDesc } : {}),
                ...(falseDesc ? { false_description: falseDesc } : {}),
              },
            }
          : {}),
      };
    } else if (block.type === "choice") {
      const criteria: Record<string, string> = {};
      block.options.forEach((opt, optIdx) => {
        const optKey = opt.key.trim() || `option_${optIdx + 1}`;
        criteria[optKey] = opt.description.trim();
      });
      questions[finalKey] = {
        type: "choice",
        instructions: block.instructions.trim() || "Select the best option.",
        criteria,
      };
    } else if (block.type === "score") {
      const levels = block.levels
        .map((lvl) => lvl.trim())
        .filter((lvl) => lvl.length > 0);
      questions[finalKey] = {
        type: "score",
        instructions: block.instructions.trim() || "Score according to rubric.",
        criteria: levels.length >= 2 ? levels : ["Low", "High"],
      };
    }
  });

  return questions;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
