import type {
  ChoiceAnswer,
  DecisionAnswer,
  DecisionApiQuestion,
  DecisionApiResponse,
  DecisionInputContent,
  NoulAnswer,
  ScoreAnswer,
} from "./types";

/**
 * Deterministic 32-bit FNV-1a hash used to produce repeatable pseudo-calibrated
 * probabilities in Mock Mode from the exact input + question payload.
 */
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic uniform float in [0, 1) derived from a seed string.
 */
function seededUnit(seed: string): number {
  return fnv1aHash(seed) / 0x100000000;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractInputFingerprint(input: DecisionInputContent[]): string {
  return input
    .map((block) => {
      if (block.type === "text") {
        return `text:${block.text}`;
      }
      const preview = block.data.slice(0, 64);
      return `${block.type}:${block.mime_type}:${block.data.length}:${preview}`;
    })
    .join("|");
}

function estimateInputTokens(
  input: DecisionInputContent[],
  questions: Record<string, DecisionApiQuestion>
): number {
  let chars = 0;
  let mediaTokens = 0;

  for (const block of input) {
    if (block.type === "text") {
      chars += block.text.length;
    } else if (block.type === "image") {
      mediaTokens += block.resolution === "low" ? 66 : 258;
    } else if (block.type === "document") {
      mediaTokens += 258;
    }
  }

  for (const [key, q] of Object.entries(questions)) {
    chars += key.length + q.instructions.length;
    if (q.type === "noul" && q.criteria) {
      chars +=
        (q.criteria.true_description?.length ?? 0) +
        (q.criteria.false_description?.length ?? 0);
    } else if (q.type === "choice") {
      for (const [optKey, desc] of Object.entries(q.criteria)) {
        chars += optKey.length + desc.length;
      }
    } else if (q.type === "score") {
      for (const level of q.criteria) {
        chars += level.length;
      }
    }
  }

  const textTokens = Math.max(1, Math.ceil(chars / 4));
  return textTokens + mediaTokens;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3)
  );
}

function overlapScore(inputTokens: Set<string>, candidateText: string): number {
  const candidateTokens = tokenize(candidateText);
  if (candidateTokens.size === 0) return 0;
  let hits = 0;
  for (const token of candidateTokens) {
    if (inputTokens.has(token)) hits += 1;
  }
  return hits / Math.sqrt(candidateTokens.size);
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxLogit));
  const sum = exps.reduce((acc, v) => acc + v, 0);
  if (sum === 0) {
    return logits.map(() => 1 / logits.length);
  }
  return exps.map((v) => v / sum);
}

function normalizeRounded(probs: number[]): number[] {
  const rounded = probs.map((p) => round4(p));
  const sum = rounded.reduce((acc, v) => acc + v, 0);
  const diff = round4(1 - sum);
  if (rounded.length > 0 && diff !== 0) {
    let maxIdx = 0;
    for (let i = 1; i < rounded.length; i++) {
      if (rounded[i] > rounded[maxIdx]) maxIdx = i;
    }
    rounded[maxIdx] = round4(clamp(rounded[maxIdx] + diff, 0, 1));
  }
  return rounded;
}

function evaluateNoul(
  seedPrefix: string,
  inputTokens: Set<string>,
  q: Extract<DecisionApiQuestion, { type: "noul" }>
): NoulAnswer {
  const baseUnit = seededUnit(`${seedPrefix}:noul:${q.instructions}`);
  // Map uniform [0, 1) to a bimodal calibrated-looking logit, nudged by keyword overlap.
  let logit = (baseUnit - 0.5) * 4.2;

  if (q.criteria?.true_description) {
    logit += overlapScore(inputTokens, q.criteria.true_description) * 1.6;
  }
  if (q.criteria?.false_description) {
    logit -= overlapScore(inputTokens, q.criteria.false_description) * 1.6;
  }

  const rawProb = 1 / (1 + Math.exp(-logit));
  const noul = round4(clamp(rawProb, 0.01, 0.99));
  const confidence = round4(Math.max(noul, 1 - noul));

  return {
    type: "noul",
    noul,
    confidence,
  };
}

function evaluateChoice(
  seedPrefix: string,
  inputTokens: Set<string>,
  q: Extract<DecisionApiQuestion, { type: "choice" }>
): ChoiceAnswer {
  // Official Decisions API sorts choice keys alphabetically in UTF-8 order.
  const keys = Object.keys(q.criteria).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );

  const logits = keys.map((optKey) => {
    const desc = q.criteria[optKey] ?? "";
    const hashBias = (seededUnit(`${seedPrefix}:choice:${optKey}:${desc}`) - 0.5) * 2.8;
    const lexicalBias = overlapScore(inputTokens, `${optKey} ${desc}`) * 2.2;
    const otherPenalty = optKey.toLowerCase() === "other" ? -0.6 : 0;
    return hashBias + lexicalBias + otherPenalty;
  });

  const normalized = normalizeRounded(softmax(logits));
  const probabilities: Record<string, number> = {};
  let bestChoice = keys[0] ?? "";
  let bestProb = -1;

  keys.forEach((optKey, idx) => {
    const p = normalized[idx] ?? 0;
    probabilities[optKey] = p;
    if (p > bestProb) {
      bestProb = p;
      bestChoice = optKey;
    }
  });

  return {
    type: "choice",
    choice: bestChoice,
    probabilities,
    confidence: round4(Math.max(0, bestProb)),
  };
}

function evaluateScore(
  seedPrefix: string,
  inputTokens: Set<string>,
  q: Extract<DecisionApiQuestion, { type: "score" }>
): ScoreAnswer {
  const levels = q.criteria;
  const count = levels.length;
  const center = seededUnit(`${seedPrefix}:score:${q.instructions}`) * (count - 1);

  const logits = levels.map((desc, idx) => {
    // Gaussian-like peak around deterministic center so adjacent rubric levels share probability mass.
    const distance = idx - center;
    const bell = -(distance * distance) / Math.max(0.8, count * 0.45);
    const lexicalBias = overlapScore(inputTokens, desc) * 1.4;
    const jitter = (seededUnit(`${seedPrefix}:score:${idx}:${desc}`) - 0.5) * 0.4;
    return bell + lexicalBias + jitter;
  });

  const normalized = normalizeRounded(softmax(logits));
  const probabilities: Record<string, number> = {};
  const legend: Record<string, string> = {};
  let expectedScore = 0;
  let maxProb = 0;

  levels.forEach((desc, idx) => {
    const key = String(idx);
    const p = normalized[idx] ?? 0;
    probabilities[key] = p;
    legend[key] = desc;
    expectedScore += idx * p;
    if (p > maxProb) maxProb = p;
  });

  return {
    type: "score",
    score: round4(expectedScore),
    probabilities,
    legend,
    confidence: round4(maxProb),
  };
}

/**
 * Deterministic offline / stage-fallback evaluator mirroring the official
 * `gemini-decision-1` response contract (`total_output_tokens: 0`).
 */
export function evaluateDecisionMock(
  input: DecisionInputContent[],
  questions: Record<string, DecisionApiQuestion>,
  fallbackReason?: string
): DecisionApiResponse {
  const start = performance.now();
  const inputFingerprint = extractInputFingerprint(input);
  const inputText = input
    .filter((b): b is Extract<DecisionInputContent, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join(" ");
  const inputTokens = tokenize(inputText);

  const answers: Record<string, DecisionAnswer> = {};

  for (const [questionKey, question] of Object.entries(questions)) {
    const seedPrefix = `${inputFingerprint}::${questionKey}`;
    if (question.type === "noul") {
      answers[questionKey] = evaluateNoul(seedPrefix, inputTokens, question);
    } else if (question.type === "choice") {
      answers[questionKey] = evaluateChoice(seedPrefix, inputTokens, question);
    } else if (question.type === "score") {
      answers[questionKey] = evaluateScore(seedPrefix, inputTokens, question);
    }
  }

  const totalInputTokens = estimateInputTokens(input, questions);
  const elapsedMs = Math.max(1, Math.round(performance.now() - start));

  return {
    answers,
    usage: {
      total_input_tokens: totalInputTokens,
      total_output_tokens: 0,
      total_tokens: totalInputTokens,
    },
    latencyMs: elapsedMs,
    mode: "mock",
    ...(fallbackReason ? { fallbackReason } : {}),
  };
}
