export type StateValueType = "string" | "number" | "boolean" | "json";

export interface VariableStateBlock {
  id: string;
  kind: "variable";
  key: string;
  valueType: StateValueType;
  value: string;
}

export interface AssetStateBlock {
  id: string;
  kind: "asset";
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Base64-encoded file payload (without data URI prefix). */
  data: string;
  resolution?: "low" | "medium" | "high";
}

export type StateBlock = VariableStateBlock | AssetStateBlock;

export interface ChoiceOption {
  id: string;
  key: string;
  description: string;
}

export interface NoulCriteria {
  true_description?: string;
  false_description?: string;
}

export interface NoulQuestionBlock {
  id: string;
  key: string;
  type: "noul";
  instructions: string;
  criteria?: NoulCriteria;
}

export interface ChoiceQuestionBlock {
  id: string;
  key: string;
  type: "choice";
  instructions: string;
  options: ChoiceOption[];
}

export interface ScoreQuestionBlock {
  id: string;
  key: string;
  type: "score";
  instructions: string;
  /** Ordered 0-indexed rubric level descriptions (2 to 255 levels). */
  levels: string[];
}

export type QuestionBlock =
  | NoulQuestionBlock
  | ChoiceQuestionBlock
  | ScoreQuestionBlock;

export type DecisionQuestionType = QuestionBlock["type"];

/** Official Gemini Decisions API input block shapes (`v1beta`). */
export type DecisionInputContent =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      data: string;
      mime_type: string;
      resolution?: "low" | "medium" | "high";
    }
  | {
      type: "document";
      data: string;
      mime_type: string;
    };

/** Official Gemini Decisions API question shapes (`v1beta`). */
export type DecisionApiQuestion =
  | {
      type: "noul";
      instructions: string;
      criteria?: NoulCriteria;
    }
  | {
      type: "choice";
      instructions: string;
      criteria: Record<string, string>;
    }
  | {
      type: "score";
      instructions: string;
      criteria: string[];
    };

export type EvaluationMode = "live" | "mock";

export interface DecisionApiRequest {
  input: DecisionInputContent[];
  questions: Record<string, DecisionApiQuestion>;
  mode?: EvaluationMode;
}

export interface NoulAnswer {
  type: "noul";
  /** Calibrated probability P(true) in [0.01, 0.99]. */
  noul: number;
  /** max(noul, 1 - noul) */
  confidence: number;
}

export interface ChoiceAnswer {
  type: "choice";
  /** Winning option ID with highest probability. */
  choice: string;
  /** Normalized probabilities summing to 1 across option IDs. */
  probabilities: Record<string, number>;
  /** Highest probability in `probabilities`. */
  confidence: number;
}

export interface ScoreAnswer {
  type: "score";
  /** Probability-weighted expected score: sum(k * p_k). */
  score: number;
  /** Normalized probabilities keyed by 0-based level index string ("0", "1", ...). */
  probabilities: Record<string, number>;
  /** Rubric description for each 0-based level index string. */
  legend: Record<string, string>;
  /** Highest probability in `probabilities`. */
  confidence: number;
}

export type DecisionAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface DecisionUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens?: number;
}

export interface DecisionApiResponse {
  answers: Record<string, DecisionAnswer>;
  usage: DecisionUsage;
  latencyMs: number;
  mode: EvaluationMode;
  fallbackReason?: string;
}
