// Side-by-side A/B comparison: two (η, λ) configurations replaying the same
// token stream. Shared playback; per-column matrix, recall probe, metrics.

"use client";

import { useMemo, useState } from "react";
import { Play, Pause, RotateCcw, Swords } from "lucide-react";
import {
  TOKEN_STREAM,
  replayStream,
  scoreAllTokens,
  meanUtilization,
  type EngineParams,
  type Matrix,
} from "@/lib/engine";
import { MatrixGrid } from "./SynapticLab";

const CUE_TOKEN = "the";

const SIDE_PRESETS: { label: string; params: EngineParams }[] = [
  { label: "🐟 Goldfish", params: { plasticityRate: 0.9, decayFactor: 0.82 } },
  { label: "⚖️ Balanced", params: { plasticityRate: 0.45, decayFactor: 0.92 } },
  { label: "🐘 Elephant", params: { plasticityRate: 0.3, decayFactor: 0.995 } },
];

function ScoreBars({
  matrix,
  count,
}: {
  matrix: Matrix;
  count: number;
}) {
  const scores = useMemo(() => {
    const cueSpikes = TOKEN_STREAM.find((t) => t.text === CUE_TOKEN)!.spikes;
    return scoreAllTokens(matrix, cueSpikes, count);
  }, [matrix, count]);

  const fidelity = useMemo(() => {
    const seen = scores.filter((s) => s.count > 0);
    if (seen.length === 0) return 0;
    return seen.reduce((acc, s) => acc + Math.min(s.score, 1), 0) / seen.length;
  }, [scores]);

  const interference = useMemo(() => {
    const unseen = scores.filter((s) => s.count === 0);
    if (unseen.length === 0) return 0;
    return unseen.reduce((acc, s) => acc + s.score, 0) / unseen.length;
  }, [scores]);

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className="rounded-lg bg-surface-2 p-2">
        <div className="text-[9px] uppercase tracking-wide text-muted">Fidelity</div>
        <div className="font-mono text-base text-ok">{(fidelity * 100).toFixed(0)}%</div>
      </div>
      <div className="rounded-lg bg-surface-2 p-2">
        <div className="text-[9px] uppercase tracking-wide text-muted">Interference</div>
        <div className="font-mono text-base text-warn">{(interference * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

export default function ScenarioCompare() {
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [aParams, setAParams] = useState<EngineParams>(SIDE_PRESETS[0].params);
  const [bParams, setBParams] = useState<EngineParams>(SIDE_PRESETS[2].params);

  const matrixA = useMemo(() => replayStream(count, aParams), [count, aParams]);
  const matrixB = useMemo(() => replayStream(count, bParams), [count, bParams]);
  const utilA = useMemo(() => meanUtilization(matrixA), [matrixA]);
  const utilB = useMemo(() => meanUtilization(matrixB), [matrixB]);

  function PresetPicker({
    value,
    onChange,
  }: {
    value: EngineParams;
    onChange: (p: EngineParams) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {SIDE_PRESETS.map((p) => {
          const active =
            Math.abs(p.params.plasticityRate - value.plasticityRate) < 1e-9 &&
            Math.abs(p.params.decayFactor - value.decayFactor) < 1e-9;
          return (
            <button
              key={p.label}
              onClick={() => onChange(p.params)}
              aria-pressed={active}
              className={`px-2 py-1 rounded-md text-xs border transition-colors ${
                active
                  ? "border-accent bg-accent/15 text-accent-strong"
                  : "border-edge text-muted hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-edge bg-surface p-5 space-y-4"
      aria-label="Scenario comparison mode"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-fire" />
          <h2 className="text-lg font-semibold">Scenario Race — Same Stream, Two Memories</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">
            {count}/{TOKEN_STREAM.length} tokens
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent/25"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play both"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setCount(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm text-foreground hover:border-accent/50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { tag: "A", matrix: matrixA, params: aParams, set: setAParams, util: utilA },
          { tag: "B", matrix: matrixB, params: bParams, set: setBParams, util: utilB },
        ].map((side) => (
          <div key={side.tag} className="rounded-lg border border-edge bg-surface-2/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-accent-strong">
                Side {side.tag}
              </span>
              <span className="font-mono text-[10px] text-muted">
                util {(side.util * 100).toFixed(1)}%
              </span>
            </div>
            <PresetPicker value={side.params} onChange={side.set} />
            <div className="mt-3 flex justify-center">
              <MatrixGrid matrix={side.matrix} newSpikes={count > 0 ? TOKEN_STREAM[count - 1].spikes : null} compact />
            </div>
            <ScoreBars matrix={side.matrix} count={count} />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Both sides consume the identical token stream. Only η (write strength) and λ (decay) differ.
        Watch fidelity and interference diverge as the same tokens hit two different memory policies.
      </p>
    </section>
  );
}
