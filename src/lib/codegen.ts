import {
  serializeQuestionBlocks,
  serializeStateBlocksToInput,
} from "./serialize";
import type {
  DecisionInputContent,
  QuestionBlock,
  StateBlock,
} from "./types";

function sanitizeInputForCodegen(
  input: DecisionInputContent[]
): DecisionInputContent[] {
  return input.map((item) => {
    if (item.type === "text") return item;
    return {
      ...item,
      data: "<BASE64_ENCODED_FILE_DATA>",
    };
  });
}

function toPythonLiteral(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  const childPad = " ".repeat(indent + 4);

  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value
      .map((item) => `${childPad}${toPythonLiteral(item, indent + 4)}`)
      .join(",\n");
    return `[\n${items},\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const lines = entries
      .map(
        ([k, v]) =>
          `${childPad}${JSON.stringify(k)}: ${toPythonLiteral(v, indent + 4)}`
      )
      .join(",\n");
    return `{\n${lines},\n${pad}}`;
  }

  return String(value);
}

/**
 * Generates copy-pasteable TypeScript SDK code using `@google/genai` (`v1beta`).
 */
export function generateTypeScriptCode(
  stateBlocks: StateBlock[],
  questions: QuestionBlock[]
): string {
  const input = sanitizeInputForCodegen(
    serializeStateBlocksToInput(stateBlocks)
  );
  const serializedQuestions = serializeQuestionBlocks(questions);

  const inputJson = JSON.stringify(input, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join("\n");

  const questionsJson = JSON.stringify(serializedQuestions, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join("\n");

  return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
});

const result = await ai.decisions.create({
  model: "gemini-decision-1",
  input: ${inputJson},
  questions: ${questionsJson},
});

console.log(result.answers);
console.log("usage:", result.usage); // total_output_tokens === 0`;
}

/**
 * Generates copy-pasteable Python SDK code using `google-genai` (`v1beta`).
 */
export function generatePythonCode(
  stateBlocks: StateBlock[],
  questions: QuestionBlock[]
): string {
  const input = sanitizeInputForCodegen(
    serializeStateBlocksToInput(stateBlocks)
  );
  const serializedQuestions = serializeQuestionBlocks(questions);

  const pyInput = toPythonLiteral(input, 4);
  const pyQuestions = toPythonLiteral(serializedQuestions, 4);

  return `import os
from google import genai

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
    http_options={"api_version": "v1beta"},
)

result = client.decisions.create(
    model="gemini-decision-1",
    input=${pyInput},
    questions=${pyQuestions},
)

print(result.answers)
print("usage:", result.usage)  # total_output_tokens == 0`;
}
