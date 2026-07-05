export type ScoringWeights = {
  completeness: number;
  coherence: number;
  lengthAppropriateness: number;
  structuralPatterns: number;
  hallucination: number;
  correctness: number;
  readability: number;
};

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  completeness: 1,
  coherence: 1,
  lengthAppropriateness: 1,
  structuralPatterns: 1,
  hallucination: 1,
  correctness: 1,
  readability: 1,
};
export const GEMINI_MODELS = [
  'gemini-2.0-flash-001',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

/** Rough USD per 1M tokens (input / output) for cost estimates */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.3 },
};

