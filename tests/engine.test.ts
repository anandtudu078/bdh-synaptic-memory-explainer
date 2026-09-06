// Smoke tests for the synaptic engine. Run with `npm test`.
// No framework — the engine is pure, so plain assertions keep this dependency-free.

import {
  zeroMatrix, stepMatrix, replayStream, recall, scoreAllTokens, scoreQuality,
  meanUtilization, paramsMatch, SYNAPSE_UNITS, KV_UNITS_PER_TOKEN, kvUnitsAt,
  MATRIX_SIZE, TOKEN_STREAM, PRESETS, DEFAULT_PARAMS, CUE_TOKEN, CUE_SPIKES,
} from "../lib/engine";

let pass = 0, fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

console.log("— Engine smoke tests —");

// 1. Shape
const Z = zeroMatrix();
check("matrix is 24×24", Z.length === 24 && Z[0].length === 24);
check("fresh matrix is all zeros", Z.every(r => r.every(w => w === 0)));

// 2. Hebbian write: η lands exactly on co-firing cells
const P = { plasticityRate: 0.5, decayFactor: 1.0 };
const W1 = stepMatrix(Z, { spikes: [0, 3] }, P);
check("write: W[0][0] = η (0.5)", W1[0][0] === 0.5);
check("write: W[0][3] = η", W1[0][3] === 0.5);
check("write: off-spike cell untouched", W1[5][5] === 0);

// 3. Decay: λ multiplies everything
const W2 = stepMatrix(W1, { spikes: [] }, { plasticityRate: 0.5, decayFactor: 0.5 });
check("decay: 0.5 → 0.25 after one λ=0.5 step", W2[0][0] === 0.25);

// 4. Saturation clamp at 1
const W3 = stepMatrix(Z, { spikes: [1] }, { plasticityRate: 2, decayFactor: 1 });
check("clamp: weight never exceeds 1", W3[1][1] === 1);

// 5. stepMatrix must not mutate its input
const before = Z[0][0];
stepMatrix(Z, { spikes: [0, 1] }, P);
check("purity: stepMatrix leaves the input matrix untouched", Z[0][0] === before);

// 6. Repetition strengthens (Hebbian property)
const Pa = { plasticityRate: 0.4, decayFactor: 0.9 };
let Wr = zeroMatrix();
for (let i = 0; i < 5; i++) Wr = stepMatrix(Wr, { spikes: [2, 9] }, Pa);
check("repetition: 5×'the' trace > single write", Wr[2][9] > Pa.plasticityRate);

// 7. Recall: normalized, max response = 1
const full = replayStream(13, { plasticityRate: 0.45, decayFactor: 0.92 });
const y = recall(full, CUE_SPIKES);
check("recall: strongest response normalizes to 1", Math.abs(Math.max(...y) - 1) < 1e-9);
check("recall: every response is non-negative", y.every(v => v >= 0));

// 8. Interference is real: cue 'the' also activates overlapping 'a'/'it'
const sc = scoreAllTokens(full, CUE_SPIKES, 13);
const the = sc.find(s => s.text === "the")!;
const a = sc.find(s => s.text === "a")!;
check("recall: 'the' scores higher than overlap token 'a'", the.score >= a.score);
check("interference: 'a' (shares neuron) still active > 0", a.score > 0.01);

// 9. Empty memory recalls nothing
const emptyScores = scoreAllTokens(zeroMatrix(), CUE_SPIKES, 0);
check("empty state: all scores are 0", emptyScores.every(s => s.score === 0));
check("empty state: nothing marked as seen", emptyScores.every(s => s.count === 0));

// 10. scoreQuality bounds
const q = scoreQuality(sc);
check("quality: fidelity within [0,1]", q.fidelity >= 0 && q.fidelity <= 1);
check("quality: interference within [0,1]", q.interference >= 0 && q.interference <= 1);
const qEmpty = scoreQuality(emptyScores);
check("quality: fidelity is 0 when nothing was seen", qEmpty.fidelity === 0);

// 11. Utilization grows as tokens are written
const u0 = meanUtilization(zeroMatrix());
const u13 = meanUtilization(full);
check("utilization: 0% on a fresh matrix", u0 === 0);
check("utilization: rises after 13 tokens", u13 > u0);

// 12. Forgetting: elephant retains an OLD single-write trace better than goldfish
//     (compare the 'dragon' cells, written once at step 1, after 12 decay steps)
const goldfish = PRESETS.find(p => p.id === "goldfish")!.params;
const elephant = PRESETS.find(p => p.id === "elephant")!.params;
const gf = replayStream(13, goldfish);
const el = replayStream(13, elephant);
const [dr0, dr1] = TOKEN_STREAM[1].spikes; // 'dragon' → [0, 5]
check(
  `elephant old-trace retention (${el[dr0][dr1].toFixed(3)}) > goldfish (${gf[dr0][dr1].toFixed(3)})`,
  el[dr0][dr1] > gf[dr0][dr1]
);

// 13. Determinism: same params → identical result
check("deterministic: identical replays",
  JSON.stringify(replayStream(13, Pa)) === JSON.stringify(replayStream(13, Pa)));

// 14. replayStream clamps to the stream length
check("replay: count beyond the stream is clamped",
  JSON.stringify(replayStream(999, Pa)) === JSON.stringify(replayStream(TOKEN_STREAM.length, Pa)));

// 15. Budget math: crossover at 144 tokens
check("budget: 576 synapses", SYNAPSE_UNITS === 576);
check("budget: 4 units/token", KV_UNITS_PER_TOKEN === 4);
check("crossover: kvUnitsAt(144) === 576", kvUnitsAt(144) === SYNAPSE_UNITS);
check("budget: kvUnitsAt(0) === 0", kvUnitsAt(0) === 0);

// 16. Stream + preset integrity
check("stream: 13 tokens, all valid spikes", TOKEN_STREAM.length === 13 &&
  TOKEN_STREAM.every(t => t.spikes.every(i => i >= 0 && i < MATRIX_SIZE)));
check("cue: CUE_SPIKES matches the cue token's pattern",
  JSON.stringify(CUE_SPIKES) ===
  JSON.stringify(TOKEN_STREAM.find(t => t.text === CUE_TOKEN)!.spikes));
check("presets: 3 scenarios with unique ids",
  PRESETS.length === 3 && new Set(PRESETS.map(p => p.id)).size === 3);
check("presets: every λ within the slider range [0.8, 0.999]",
  PRESETS.every(p => p.params.decayFactor >= 0.8 && p.params.decayFactor <= 0.999));
check("presets: every η within the slider range [0, 1]",
  PRESETS.every(p => p.params.plasticityRate >= 0 && p.params.plasticityRate <= 1));
check("presets: default params are the 'balanced' preset",
  paramsMatch(DEFAULT_PARAMS, PRESETS.find(p => p.id === "balanced")!.params));
check("paramsMatch: rejects differing params", !paramsMatch(goldfish, elephant));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
