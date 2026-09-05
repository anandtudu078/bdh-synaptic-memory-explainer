"use client";

import { useMemo } from "react";
import { Scale, HardDrive, Cpu, TrendingDown, Check, X } from "lucide-react";
import {
  MATRIX_SIZE,
  TOKEN_STREAM,
  recall,
  SYNAPSE_UNITS,
  KV_UNITS_PER_TOKEN,
  REAL_KV_BYTES_PER_TOKEN,
  type Matrix,
} from "@/lib/engine";

type Props = {
  matrix: Matrix;
  count: number;
};

type Row = {
  text: string;
  estimate: number;
  truth: number;
  seen: number;
};

export default function TruthVsEstimate({ matrix, count }: Props) {
  // Truth = 1.0 for every seen token (an exact cache never forgets or confuses);
  // estimate = what the fixed-size synaptic state actually recalls right now.
  const rows: Row[] = useMemo(() => {
    const cueSpikes = TOKEN_STREAM.find((t) => t.text === "the")!.spikes;
    const y = recall(matrix, cueSpikes);
    const distinct = new Map<string, number[]>();
    for (const tok of TOKEN_STREAM) {
      if (!distinct.has(tok.text)) distinct.set(tok.text, tok.spikes);
    }
    return [...distinct.entries()].map(([text, spikes]) => {
      const seen = seenCount(count, text);
      const estimate =
        count === 0 ? 0 : spikes.reduce((acc, i) => acc + y[i], 0) / spikes.length;
      const truth = seen > 0 ? 1 : 0;
      return { text, estimate, truth, seen };
    });
  }, [matrix, count]);

  const { fidelity, interference } = useMemo(() => {
    const seen = rows.filter((r) => r.seen > 0);
    const fid =
      seen.length === 0
        ? 0
        : seen.reduce((acc, r) => acc + Math.min(r.estimate, r.truth), 0) / seen.length;
    const unseen = rows.filter((r) => r.seen === 0);
    const int =
      unseen.length === 0
        ? 0
        : unseen.reduce((acc, r) => acc + r.estimate, 0) / unseen.length;
    return { fidelity: fid, interference: int };
  }, [rows]);

  const cacheUnits = count * KV_UNITS_PER_TOKEN;
  const budgetMax = Math.max(SYNAPSE_UNITS, cacheUnits);

  return (
    <section className="grid gap-6 lg:grid-cols-2" aria-label="Truth versus estimate">
      {/* ---------- Fidelity ---------- */}
      <div className="rounded-xl border border-edge bg-surface p-5">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Model Memory vs Ground Truth
          </h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Cue = spike pattern of &ldquo;the&rdquo;. <span className="text-ok">Green marker</span> =
          exact ground truth an oracle KV-cache would produce (perfect, permanent).{" "}
          <span className="text-accent-strong">Blue</span> = what the fixed-size synaptic state
          actually recalls.
        </p>

        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.text}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs w-16 text-right text-muted shrink-0">
                  {r.text}
                </span>
                <div className="flex-1 relative h-5 bg-surface-2 rounded-md overflow-hidden">
                  {r.truth > 0 && (
                    <div
                      className="absolute inset-y-0 right-0 w-1 bg-ok"
                      aria-hidden
                      title="ground truth: 1.0"
                    />
                  )}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-200 ${
                      r.estimate >= 0.99 ? "bg-ok/90" : "bg-accent"
                    }`}
                    style={{ width: `${Math.round(r.estimate * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted w-28 shrink-0 text-right">
                  est {r.estimate.toFixed(2)} / truth {r.truth.toFixed(2)}
                </span>
              </div>
              {r.seen === 0 && r.estimate > 0.05 && (
                <div className="flex items-center gap-1.5 text-[10px] text-warn mt-0.5 ml-[76px]">
                  <TrendingDown className="h-3 w-3" />
                  never seen — this activation is pure interference
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Fidelity</div>
            <div
              className={`font-mono text-xl ${
                fidelity >= 0.8 ? "text-ok" : fidelity >= 0.5 ? "text-warn" : "text-bad"
              }`}
            >
              {(fidelity * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted mt-1">
              mean recall on seen tokens vs truth
            </div>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">Interference</div>
            <div
              className={`font-mono text-xl ${
                interference < 0.05 ? "text-ok" : interference < 0.2 ? "text-warn" : "text-bad"
              }`}
            >
              {(interference * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted mt-1">mean leakage onto unseen tokens</div>
          </div>
        </div>
      </div>

      {/* ---------- Memory budget ---------- */}
      <div className="rounded-xl border border-edge bg-surface p-5">
        <div className="flex items-center gap-2 mb-1">
          <HardDrive className="h-4 w-4 text-fire" />
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            The Price Tag: Memory Budget
          </h3>
        </div>
        <p className="text-xs text-muted mb-4">
          The synaptic matrix is <strong className="text-foreground">constant</strong>. An exact
          KV-cache grows with every token, forever.
        </p>

        <div className="space-y-3">
          <BudgetBar
            icon={<Cpu className="h-3.5 w-3.5 text-accent" />}
            label="Synaptic state (fixed)"
            value={SYNAPSE_UNITS}
            max={budgetMax}
            color="bg-accent"
            note={`${MATRIX_SIZE}² = ${SYNAPSE_UNITS} units — constant`}
          />
          <BudgetBar
            icon={<HardDrive className="h-3.5 w-3.5 text-fire" />}
            label={`KV-cache (grows) @ ${count} tokens`}
            value={cacheUnits}
            max={budgetMax}
            color="bg-fire"
            note={`${KV_UNITS_PER_TOKEN} units/token → ∞`}
          />
        </div>

        <div className="mt-4 rounded-lg bg-surface-2 p-3 text-[11px] text-muted leading-relaxed">
          <p className="mb-1.5">
            <strong className="text-foreground">Real-world scale:</strong> a 7B-class transformer
            with multi-head attention stores ≈{" "}
            <span className="font-mono text-fire">
              {(REAL_KV_BYTES_PER_TOKEN / 1024).toFixed(0)} KB
            </span>{" "}
            of KV-cache per token per sequence. A 32k-token context →{" "}
            <span className="font-mono text-fire">{fmtBytes(REAL_KV_BYTES_PER_TOKEN * 32768)}</span>{" "}
            per sequence. BDH&apos;s synaptic state is the same size whether the context is 100 or
            100,000 tokens.
          </p>
          <p className="flex items-center gap-1.5">
            {count >= TOKEN_STREAM.length ? (
              <>
                <Check className="h-3 w-3 text-ok shrink-0" />
                You processed all {TOKEN_STREAM.length} tokens in a state that never changed size.
              </>
            ) : (
              <>
                <X className="h-3 w-3 text-muted shrink-0" />
                At token {count}: exact cache holds {cacheUnits} units; synaptic state holds{" "}
                {SYNAPSE_UNITS} regardless.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

// helpers

function seenCount(count: number, text: string): number {
  let n = 0;
  for (let t = 0; t < count; t++) if (TOKEN_STREAM[t].text === text) n++;
  return n;
}

function fmtBytes(b: number): string {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function BudgetBar({
  icon,
  label,
  value,
  max,
  color,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  color: string;
  note: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">{icon}{label}</span>
        <span className="font-mono text-[10px] text-muted text-right">{note}</span>
      </div>
      <div className="h-4 bg-surface-2 rounded-md overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${max === 0 ? 0 : Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
