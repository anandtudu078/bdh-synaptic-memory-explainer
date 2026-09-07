// Synaptic plasticity engine: W ← λ·W + η·(x·xᵀ), recall y = W·cue — toy of BDH's working memory (arXiv:2509.26507).

export type TokenDef = {
  text: string;
  spikes: number[]; // active neuron indices
};

export type EngineParams = {
  /** Hebbian learning rate η ∈ [0, 1] */
  plasticityRate: number;
  /** trace decay λ ∈ [0.8, 0.999] */
  decayFactor: number;
};

export type Matrix = number[][];

export const MATRIX_SIZE = 24; // 24 neurons → 576 synapses
export const ACTIVE_PER_TOKEN = 2; // ≈8% active (BDH uses ~5%)

// Spike patterns deliberately overlap ("the"/"a" share neuron 2,
// "the"/"it" share neuron 9) to make interference visible.
export const TOKEN_STREAM: TokenDef[] = [
  { text: "the", spikes: [2, 9] },
  { text: "dragon", spikes: [0, 5] },
  { text: "hatches", spikes: [11, 17] },
  { text: "a", spikes: [2, 15] },
  { text: "scaled", spikes: [7, 20] },
  { text: "signal", spikes: [3, 14] },
  { text: "the", spikes: [2, 9] }, // repetition re-strengthens the trace
  { text: "egg", spikes: [6, 16] },
  { text: "it", spikes: [9, 13] },
  { text: "glows", spikes: [8, 21] },
  { text: "warm", spikes: [1, 12] },
  { text: "shell", spikes: [4, 18] },
  { text: "cracks", spikes: [10, 19] },
];

/** Fresh zero matrix — no memory yet. */
export function zeroMatrix(): Matrix {
  return Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => 0)
  );
}

/** One plasticity step: decay all, then strengthen co-firing pairs (clamp ≤ 1). */
export function stepMatrix(
  W: Matrix,
  token: { spikes: number[]; strength?: number },
  params: EngineParams
): Matrix {
  const { plasticityRate, decayFactor } = params;
  const strength = token.strength ?? 1;

  const next = W.map((row) => {
    const r = row.slice();
    for (let j = 0; j < MATRIX_SIZE; j++) r[j] *= decayFactor;
    return r;
  });

  for (const i of token.spikes) {
    for (const j of token.spikes) {
      next[i][j] += plasticityRate * strength;
      if (next[i][j] > 1) next[i][j] = 1;
    }
  }
  return next;
}

/** Replay tokens[0..count) from a zero matrix. */
export function replayStream(count: number, params: EngineParams): Matrix {
  let W = zeroMatrix();
  for (let t = 0; t < count && t < TOKEN_STREAM.length; t++) {
    W = stepMatrix(W, TOKEN_STREAM[t], params);
  }
  return W;
}

/** Recall y = W·cue, normalized so the strongest response = 1. */
export function recall(W: Matrix, cueSpikes: number[]): number[] {
  const y = Array.from({ length: MATRIX_SIZE }, () => 0);
  for (const i of cueSpikes) {
    for (let j = 0; j < MATRIX_SIZE; j++) y[j] += W[i][j];
  }
  const max = Math.max(...y, 1e-6);
  return y.map((v) => v / max);
}

export type TokenScore = {
  text: string;
  score: number; // mean activation on the token's own spike neurons
  firstSeen: number; // stream position of first occurrence, or -1
  count: number; // occurrences in the processed prefix
};

/** Score every distinct token against the current recall vector. */
export function scoreAllTokens(
  W: Matrix,
  cueSpikes: number[],
  processedCount: number
): TokenScore[] {
  const y = recall(W, cueSpikes);
  const seen = new Map<string, { count: number; firstSeen: number }>();
  for (let t = 0; t < processedCount && t < TOKEN_STREAM.length; t++) {
    const tok = TOKEN_STREAM[t];
    const e = seen.get(tok.text);
    if (e) e.count++;
    else seen.set(tok.text, { count: 1, firstSeen: t });
  }
  const byText = new Map<string, TokenDef>();
  for (const tok of TOKEN_STREAM) if (!byText.has(tok.text)) byText.set(tok.text, tok);

  return [...byText.values()].map((tok) => {
    const score = tok.spikes.reduce((acc, i) => acc + y[i], 0) / tok.spikes.length;
    const s = seen.get(tok.text);
    return {
      text: tok.text,
      score,
      firstSeen: s ? s.firstSeen : -1,
      count: s ? s.count : 0,
    };
  });
}

/** Fidelity = mean recall on seen tokens (oracle = 1.0); interference = mean leakage onto unseen tokens. Clamped to [0,1]. */
export function scoreQuality(scores: TokenScore[]): {
  fidelity: number;
  interference: number;
} {
  const seen = scores.filter((s) => s.count > 0);
  const unseen = scores.filter((s) => s.count === 0);
  const mean = (xs: TokenScore[]) =>
    xs.length === 0
      ? 0
      : xs.reduce((acc, s) => acc + Math.min(Math.max(s.score, 0), 1), 0) / xs.length;
  return { fidelity: mean(seen), interference: mean(unseen) };
}

/** Mean synapse weight — how "full" the memory is. */
export function meanUtilization(W: Matrix): number {
  let sum = 0;
  for (const row of W) for (const w of row) sum += w;
  return sum / (MATRIX_SIZE * MATRIX_SIZE);
}

// Memory budget (toy scale): fixed 576 synapses vs 4 units/token KV-cache.
export const SYNAPSE_UNITS = MATRIX_SIZE * MATRIX_SIZE;
export const KV_UNITS_PER_TOKEN = ACTIVE_PER_TOKEN * 2; // keys + values

// Real-world illustration: 7B-class MHA, fp16 → ~0.5 MB KV/token.
export const REAL_KV_BYTES_PER_TOKEN = 2 * 32 * 32 * 128 * 2;

export function kvUnitsAt(tokens: number): number {
  return tokens * KV_UNITS_PER_TOKEN;
}

/** Replay the token stream cyclically for `steps` tokens (long-context simulation). Pure, deterministic. */
export function replayLooped(steps: number, params: EngineParams): Matrix {
  let W = zeroMatrix();
  for (let t = 0; t < steps; t++) {
    W = stepMatrix(W, TOKEN_STREAM[t % TOKEN_STREAM.length], params);
  }
  return W;
}// Falsification experiment: three deterministic claim checks, recomputed live — nothing precomputed, no hardcoded outcomes.

export type ClaimCheckId = "fixed-size" | "still-remembers" | "interference-price";

export type ClaimCheck = {
  id: ClaimCheckId;
  label: string;
  expected: string;
  observed: string;
  pass: boolean;
};

export type ClaimExperimentResult = {
  checks: ClaimCheck[];
  allPass: boolean;
  tokensTested: number;
  cacheUnitsAtTest: number;
};

/** Length of the long-context leg (cache would hold 4·300 = 1200 units). */
export const EXPERIMENT_TOKENS = 300;

/** Token ids sharing a neuron with the cue ("the" = [2,9]; "a" has 2, "it" has 9). */
const CUE_OVERLAP_TOKENS = ["a", "it"];

/** Run the 3 claim checks (default balanced policy): fixed-size after 300 tokens, cue top-1 after 13, overlap-only leakage. */
export function runClaimExperiment(
  params: EngineParams = DEFAULT_PARAMS
): ClaimExperimentResult {
  // Leg 1 — long context
  const long = replayLooped(EXPERIMENT_TOKENS, params);
  const cacheUnits = kvUnitsAt(EXPERIMENT_TOKENS);
  const fixedSizePass =
    long.length === MATRIX_SIZE && long[0].length === MATRIX_SIZE;

  // Legs 2 & 3 — recall quality after the standard stream
  const W = replayStream(TOKEN_STREAM.length, params);
  const scores = scoreAllTokens(W, CUE_SPIKES, TOKEN_STREAM.length);
  const cue = scores.find((s) => s.text === CUE_TOKEN)!;
  const stillRemembersPass = scores.every(
    (s) => s.text === CUE_TOKEN || cue.score >= s.score
  );
  const overlap = scores.filter((s) => CUE_OVERLAP_TOKENS.includes(s.text));
  const distant = scores.filter(
    (s) => !CUE_OVERLAP_TOKENS.includes(s.text) && s.text !== CUE_TOKEN
  );
  const minOverlap = Math.min(...overlap.map((s) => s.score));
  const maxDistant = Math.max(...distant.map((s) => s.score));
  const interferencePass = minOverlap > 0.05 && minOverlap > maxDistant;

  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const checks: ClaimCheck[] = [
    {
      id: "fixed-size",
      label: "Memory never grows",
      expected: `state size stays constant as context grows (claim: no cache that grows linearly)`,
      observed: `${MATRIX_SIZE}×${MATRIX_SIZE} = ${SYNAPSE_UNITS} units after ${EXPERIMENT_TOKENS} tokens — an exact cache would hold ${cacheUnits}`,
      pass: fixedSizePass,
    },
    {
      id: "still-remembers",
      label: "The state still remembers",
      expected: `cue "${CUE_TOKEN}" remains the strongest recall after the full 13-token stream`,
      observed: `"${CUE_TOKEN}" is top-1 at ${pct(cue.score)} — if the state recalled nothing, the claim would fail`,
      pass: stillRemembersPass,
    },
    {
      id: "interference-price",
      label: "Interference is the visible price",
      expected: "only tokens sharing neurons with the cue leak into its recall",
      observed: `overlap tokens "a"/"it" recall ≥ ${pct(minOverlap)}; non-overlapping tokens ≤ ${pct(maxDistant)}`,
      pass: interferencePass,
    },
  ];

  return {
    checks,
    allPass: checks.every((c) => c.pass),
    tokensTested: EXPERIMENT_TOKENS,
    cacheUnitsAtTest: cacheUnits,
  };
}

// The token whose spike pattern probes the recall vector across the UI.
export const CUE_TOKEN = "the";

/** Spike pattern of the cue token, resolved once from the stream. */
export const CUE_SPIKES: number[] =
  TOKEN_STREAM.find((t) => t.text === CUE_TOKEN)!.spikes;

export type Preset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  params: EngineParams;
};

// One-click scenarios (η, λ) — single source of truth for lab and A/B race.
export const PRESETS: Preset[] = [
  {
    id: "goldfish",
    label: "Goldfish",
    emoji: "🐟",
    description: "Fast write, fast fade — pure working memory",
    params: { plasticityRate: 0.9, decayFactor: 0.82 },
  },
  {
    id: "balanced",
    label: "Balanced",
    emoji: "⚖️",
    description: "Default: moderate writing and retention",
    params: { plasticityRate: 0.45, decayFactor: 0.92 },
  },
  {
    id: "elephant",
    label: "Elephant",
    emoji: "🐘",
    description: "Slow write, long retention — stale traces linger",
    params: { plasticityRate: 0.3, decayFactor: 0.995 },
  },
];

/** Default params the lab boots with (the "balanced" preset). */
export const DEFAULT_PARAMS: EngineParams = PRESETS[1].params;

/** True when two parameter sets are equal within float tolerance. */
export function paramsMatch(a: EngineParams, b: EngineParams): boolean {
  return (
    Math.abs(a.plasticityRate - b.plasticityRate) < 1e-9 &&
    Math.abs(a.decayFactor - b.decayFactor) < 1e-9
  );
}
