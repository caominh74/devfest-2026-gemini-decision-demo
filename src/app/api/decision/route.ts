import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { evaluateDecisionMock } from "@/lib/mockEvaluator";
import type {
  DecisionAnswer,
  DecisionApiQuestion,
  DecisionApiRequest,
  DecisionApiResponse,
  DecisionInputContent,
} from "@/lib/types";

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

function validateInput(input: unknown): input is DecisionInputContent[] {
  if (!Array.isArray(input) || input.length === 0) return false;
  return input.every((item) => {
    if (!item || typeof item !== "object") return false;
    const block = item as Record<string, unknown>;
    if (block.type === "text") {
      return typeof block.text === "string";
    }
    if (block.type === "image" || block.type === "document") {
      return isNonEmptyString(block.data) && isNonEmptyString(block.mime_type);
    }
    return false;
  });
}

function validateQuestions(
  questions: unknown
): questions is Record<string, DecisionApiQuestion> {
  if (!questions || typeof questions !== "object" || Array.isArray(questions)) {
    return false;
  }
  const entries = Object.entries(questions as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 1000) return false;

  return entries.every(([key, value]) => {
    if (!isNonEmptyString(key) || !value || typeof value !== "object") {
      return false;
    }
    const q = value as Record<string, unknown>;
    if (!isNonEmptyString(q.instructions)) return false;

    if (q.type === "noul") {
      return true;
    }
    if (q.type === "choice") {
      if (!q.criteria || typeof q.criteria !== "object" || Array.isArray(q.criteria)) {
        return false;
      }
      const optionCount = Object.keys(q.criteria as Record<string, unknown>).length;
      return optionCount >= 2 && optionCount <= 255;
    }
    if (q.type === "score") {
      if (!Array.isArray(q.criteria)) return false;
      return (
        q.criteria.length >= 2 &&
        q.criteria.length <= 255 &&
        q.criteria.every((level) => isNonEmptyString(level))
      );
    }
    return false;
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const payload = body as Partial<DecisionApiRequest>;
  const requestedMode = payload.mode === "mock" ? "mock" : "live";

  if (!validateInput(payload.input)) {
    return NextResponse.json(
      {
        error:
          "Invalid `input`: expected a non-empty array of text, image, or document content blocks.",
      },
      { status: 400 }
    );
  }

  if (!validateQuestions(payload.questions)) {
    return NextResponse.json(
      {
        error:
          "Invalid `questions`: expected 1–1,000 valid `noul`, `choice` (2–255 options), or `score` (2–255 non-empty levels) questions.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (requestedMode === "mock" || !apiKey) {
    const fallbackReason =
      requestedMode === "live" && !apiKey
        ? "GEMINI_API_KEY is not configured on the server; using deterministic Mock Mode."
        : undefined;

    const mockResult = evaluateDecisionMock(
      payload.input,
      payload.questions,
      fallbackReason
    );
    return NextResponse.json<DecisionApiResponse>(mockResult);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1beta",
    });

    const startTime = performance.now();
    const result = await ai.decisions.create({
      model: "gemini-decision-1",
      input: payload.input,
      questions: payload.questions,
    });
    const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

    const answers = (result.answers ?? {}) as Record<string, DecisionAnswer>;
    const totalInputTokens = result.usage?.total_input_tokens ?? 0;
    const totalOutputTokens = result.usage?.total_output_tokens ?? 0;

    const response: DecisionApiResponse = {
      answers,
      usage: {
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        ...(result.usage?.total_tokens !== undefined
          ? { total_tokens: result.usage.total_tokens }
          : {}),
      },
      latencyMs,
      mode: "live",
    };

    return NextResponse.json<DecisionApiResponse>(response);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to evaluate decision with gemini-decision-1.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
