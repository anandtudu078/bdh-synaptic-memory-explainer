"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Zap,
  Thermometer,
  Activity,
  Info,
} from "lucide-react";
import {
  MATRIX_SIZE,
  TOKEN_STREAM,
  replayStream,
  scoreAllTokens,
  meanUtilization,
  type EngineParams,
  type Matrix,
  type TokenScore,
} from "@/lib/engine";
import TruthVsEstimate from "./TruthVsEstimate";

const CUE_TOKEN = "the"; // probe token for the recall panel
const PLAY_MS = 750; // per-token playback interval

export default function SynapticLab() {
  const [params, setParams] = useState<EngineParams>({
    plasticityRate: 0.45,
    decayFactor: 0.92,
  });
  const onParamsChange = setParams;
  const [count, setCount] = useState(0); // tokens processed
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const matrix: Matrix = useMemo(() => replayStream(count, params), [count, params]);
  const cueSpikes = useMemo(
    () => TOKEN_STREAM.find((t) => t.text === CUE_TOKEN)!.spikes,
    []
  );
  const scores: TokenScore[] = useMemo(
    () => scoreAllTokens(matrix, cueSpikes, count),
    [matrix, cueSpikes, count]
  );
  const utilization = useMemo(() => meanUtilization(matrix), [matrix]);

  // playback loop
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c >= TOKEN_STREAM.length) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, PLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [playing]);

  const newSpikes = count > 0 ? TOKEN_STREAM[count - 1].spikes : null;

  return (
    <section className="space-y-6" aria-label="Interactive synaptic memory lab">
      {/* ---------- Sliders ---------- */}
      <div className="grid gap-4 md:grid-cols-2">
        <Slider
          label="Plasticity Rate η"
          icon={<Zap className="h-4 w-4 text-warn" />}
          value={params.plasticityRate}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `η = ${v.toFixed(2)}`}
          onChange={(v) => onParamsChange({ ...params, plasticityRate: v })}
          hint="How strongly co-firing neurons wire together. Higher η writes traces faster — but also writes more interference."
        />
        <Slider
          label="Decay Factor λ"
          icon={<Thermometer className="h-4 w-4 text-fire" />}
          value={params.decayFactor}
          min={0.8}
          max={0.999}
          step={0.001}
          format={(v) => `λ = ${v.toFixed(3)}`}
          onChange={(v) => onParamsChange({ ...params, decayFactor: v })}
          hint="Multiplicative forgetting per step. Low λ = fast fade (working memory). High λ = long-lived traces but slower overwrite."
        />
      </div>

      {/* ---------- Token stream + matrix ---------- */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Token stream card */}
          <div className="rounded-xl border border-edge bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                Input Stream
              </h3>
              <span className="font-mono text-xs text-muted">
                {count}/{TOKEN_STREAM.length} tokens
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4" role="list" aria-label="Token stream">
              {TOKEN_STREAM.map((tok, idx) => (
                <button
                  key={idx}
                  role="listitem"
                  disabled={idx >= count}
                  onClick={() => setCount(idx + 1)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs border transition-colors ${
                    idx < count
                      ? "border-accent/50 bg-accent/10 text-accent-strong"
                      : idx === count
                        ? "border-warn/60 bg-warn/10 text-warn"
                        : "border-edge text-muted/60"
                  } disabled:cursor-not-allowed hover:enabled:border-accent/70`}
                  title={idx === count ? "Click to process up to this token" : undefined}
                >
                  {tok.text}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={count >= TOKEN_STREAM.length}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? "Pause" : "Play stream"}
              </button>
              <button
                onClick={() => setCount((c) => Math.min(c + 1, TOKEN_STREAM.length))}
                disabled={count >= TOKEN_STREAM.length}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <StepForward className="h-4 w-4" /> Step
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setCount(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent/50"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* Recall probe card */}
          <div className="rounded-xl border border-edge bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-ok" />
              <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                Recall Probe
              </h3>
            </div>
            <p className="text-xs text-muted mb-3">
              Cue the matrix with the spike pattern of{" "}
              <code className="text-accent-strong font-mono">{CUE_TOKEN}</code>. Bars show the
              normalized activation y&nbsp;=&nbsp;W·cue on each token&apos;s neurons.
            </p>
            <div className="space-y-1.5">
              {scores.map((s) => (
                <div key={s.text} className="flex items-center gap-2">
                  <span className="font-mono text-xs w-16 text-right text-muted shrink-0">
                    {s.text}
                  </span>
                  <div className="flex-1 h-3 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        s.count === 0
                          ? "bg-muted/30"
                          : s.text === CUE_TOKEN
                            ? "bg-ok"
                            : "bg-accent"
                      }`}
                      style={{ width: `${Math.round(s.score * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted w-8 text-right shrink-0">
                    {s.score.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted leading-relaxed">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <p>
                Interference is visible: &ldquo;a&rdquo; and &ldquo;it&rdquo; share neurons with
                &ldquo;the&rdquo;, so they light up too. That crosstalk is the price of a fixed-size state.
              </p>
            </div>
            <div className="mt-2 text-[11px] text-muted">
              Mean synapse utilization:{" "}
              <span className="font-mono text-accent-strong">
                {(utilization * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Matrix card */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-edge bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                Synaptic Weight Matrix W ({MATRIX_SIZE}×{MATRIX_SIZE})
              </h3>
              <span className="font-mono text-xs text-muted">
                fixed size · {MATRIX_SIZE * MATRIX_SIZE} synapses
              </span>
            </div>
            <MatrixGrid matrix={matrix} newSpikes={newSpikes} />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-surface-2 border border-edge" />
                silent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-accent/50" />
                weak trace
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-fire/80" />
                strong trace
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-ok" />
                just written
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted leading-relaxed">
            Every token writes its outer product x·xᵀ into the same {MATRIX_SIZE * MATRIX_SIZE}
            -synapse matrix while decay λ fades older traces. The matrix{" "}
            <strong className="text-foreground">never grows</strong> — that is the recurrent-state
            idea behind BDH&apos;s working memory.
          </p>
        </div>
      </div>

      {/* Truth-vs-estimate panel */}
      <TruthVsEstimate matrix={matrix} count={count} />
    </section>
  );
}

// subcomponents

function MatrixGrid({ matrix, newSpikes }: { matrix: Matrix; newSpikes: number[] | null }) {
  const flashSet = useMemo(() => {
    const s = new Set<string>();
    if (newSpikes) {
      for (const i of newSpikes) {
        for (const j of newSpikes) s.add(`${i}-${j}`);
      }
    }
    return s;
  }, [newSpikes]);

  return (
    <div
      className="mx-auto grid gap-[2px] select-none"
      style={{
        gridTemplateColumns: `repeat(${MATRIX_SIZE}, minmax(0, 1fr))`,
        maxWidth: 520,
      }}
      role="img"
      aria-label="Heatmap of the synaptic weight matrix. Brighter cells are stronger synapses."
    >
      {matrix.map((row, i) =>
        row.map((w, j) => {
          const isFlash = flashSet.has(`${i}-${j}`);
          return (
            <div
              key={`${i}-${j}`}
              className="syn-cell aspect-square rounded-[2px]"
              style={{ backgroundColor: cellColor(w, isFlash) }}
              title={`w[${i}][${j}] = ${w.toFixed(3)}`}
            />
          );
        })
      )}
    </div>
  );
}

function cellColor(w: number, flash: boolean): string {
  if (flash) return "#34d399"; // just-written: green
  if (w < 0.01) return "#121b30"; // silent
  const t = Math.min(w, 1);
  if (t < 0.5) {
    const k = t / 0.5;
    return `rgba(56, 189, 248, ${0.12 + 0.5 * k})`;
  }
  const k = (t - 0.5) / 0.5;
  return `rgba(251, 146, 60, ${0.35 + 0.65 * k})`;
}

type SliderProps = {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint: string;
};

function Slider({ label, icon, value, min, max, step, format, onChange, hint }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </label>
        <span className="font-mono text-xs text-accent-strong">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        aria-label={label}
        aria-valuetext={format(value)}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
