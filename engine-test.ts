import {
  zeroMatrix, stepMatrix, replayStream, recall, scoreAllTokens,
  meanUtilization, SYNAPSE_UNITS, KV_UNITS_PER_TOKEN, kvUnitsAt,
  MATRIX_SIZE, TOKEN_STREAM,
} from "./lib/engine";

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

// 5. Repetition strengthens (Hebbian property)
const Pa = { plasticityRate: 0.4, decayFactor: 0.9 };
let Wr = zeroMatrix();
for (let i = 0; i < 5; i++) Wr = stepMatrix(Wr, { spikes: [2, 9] }, Pa);
check("repetition: 5×'the' trace > single write", Wr[2][9] > Pa.plasticityRate);

// 6. Recall: normalized, max response = 1
const full = replayStream(13, { plasticityRate: 0.45, decayFactor: 0.92 });
const y = recall(full, [2, 9]);
const maxY = Math.max(...y);
check("recall: strongest response normalizes to 1", Math.abs(maxY - 1) < 1e-9);

// 7. Interference is real: cue 'the' also activates overlapping 'a'/'it'
const sc = scoreAllTokens(full, [2, 9], 13);
const the = sc.find(s => s.text === "the")!;
const a = sc.find(s => s.text === "a")!;
check("recall: 'the' scores higher than overlap token 'a'", the.score >= a.score);
check("interference: 'a' (shares neuron) still active > 0", a.score > 0.01);

// 8. Forgetting: elephant retains an OLD single-write trace better than goldfish
//    (compare the 'dragon' cells, written once at step 1, after 12 decay steps)
const gf = replayStream(13, { plasticityRate: 0.9, decayFactor: 0.82 });
const el = replayStream(13, { plasticityRate: 0.3, decayFactor: 0.995 });
const dragonSpike = TOKEN_STREAM[1].spikes; // [0, 5]
const gfOld = gf[dragonSpike[0]][dragonSpike[1]];
const elOld = el[dragonSpike[0]][dragonSpike[1]];
check(`elephant old-trace retention (${elOld.toFixed(3)}) > goldfish (${gfOld.toFixed(3)})`, elOld > gfOld);

// 9. Determinism: same params → identical result
const d1 = replayStream(13, Pa), d2 = replayStream(13, Pa);
check("deterministic: identical replays", JSON.stringify(d1) === JSON.stringify(d2));

// 10. Budget math: crossover at 144 tokens
check("budget: 576 synapses", SYNAPSE_UNITS === 576);
check("budget: 4 units/token", KV_UNITS_PER_TOKEN === 4);
check("crossover: kvUnitsAt(144) === 576", kvUnitsAt(144) === SYNAPSE_UNITS);

// 11. Stream integrity
check("stream: 13 tokens, all valid spikes", TOKEN_STREAM.length === 13 &&
  TOKEN_STREAM.every(t => t.spikes.every(i => i >= 0 && i < MATRIX_SIZE)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
