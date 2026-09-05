// Synaptic plasticity engine: W ← λ·W + η·(x·xᵀ), recall y = W·cue.
// Toy of BDH's working memory (Pathway, arXiv:2509.26507): fixed-size
// state, sparse non-negative token spikes, decay = short-term memory.

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
