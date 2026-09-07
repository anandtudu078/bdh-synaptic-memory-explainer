// One-click falsification experiment: three checks recomputed live from lib/engine.ts — nothing scripted.

"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Play,
  CircleCheck,
  CircleX,
  RotateCcw,
} from "lucide-react";
import {
  MATRIX_SIZE,
  SYNAPSE_UNITS,
  runClaimExperiment,
  type ClaimExperimentResult,
} from "@/lib/engine";

const STEP_MS = 700;

export default function ClaimExperiment() {
  const [result, setResult] = useState<ClaimExperimentResult | null>(null);
  const [revealed, setRevealed] = useState(0);

  // Derived: the experiment is "running" while checks remain to reveal.
  const total = result?.checks.length ?? 0;
  const running = result !== null && revealed < total;
  const done = result !== null && revealed >= total;

  function run() {
    const r = runClaimExperiment();
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setResult(r);
    setRevealed(reduceMotion ? r.checks.length : 0);
  }

  // Staged reveal: one check per tick; setState only inside the timeout callback.
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [running, revealed]);

  function reset() {
    setResult(null);
    setRevealed(0);
  }

  return (
    <section
      id="falsification-experiment"
      className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 via-surface to-surface p-6 space-y-4"
      aria-label="One-click falsification experiment for the central claim"
    >
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-accent-strong" />
          <h2 className="text-lg font-semibold">The Falsification Experiment</h2>
        </div>
        <div className="flex items-center gap-2">
          {result && !running && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1 text-xs text-muted hover:border-accent/50 hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Rerun
            </button>
          )}
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/40 px-4 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent/25 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <Play className="h-4 w-4" />
            {running ? "Running…" : result ? "Run again" : "Try to break the claim"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed -mt-2">
        One click, ~5 seconds: three checks attack the one-sentence claim using
        the same engine you played with above — a 300-token stream, then a recall
        probe. Results are recomputed live, never precomputed.
      </p>

      {/* ---------- Checks (staggered reveal) ---------- */}
      {result && (
        <ol className="space-y-2.5">
          {result.checks.slice(0, revealed).map((c) => (
            <li
              key={c.id}
              className={`rounded-lg border p-3 ${
                c.pass ? "border-ok/40 bg-ok/5" : "border-bad/50 bg-bad/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {c.pass ? (
                  <CircleCheck className="h-4 w-4 text-ok shrink-0" />
                ) : (
                  <CircleX className="h-4 w-4 text-bad shrink-0" />
                )}
                <span className="text-sm font-medium">{c.label}</span>
                <span
                  className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    c.pass ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"
                  }`}
                >
                  {c.pass ? "PASS" : "FAIL"}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed ml-6">
                <span className="text-foreground">Expect:</span> {c.expected}
                <br />
                <span className="text-foreground">Got:</span> {c.observed}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* ---------- Verdict ---------- */}
      {done && result && (
        <div
          className={`rounded-lg border p-4 text-sm leading-relaxed ${
            result.allPass
              ? "border-ok/50 bg-ok/10 text-ok"
              : "border-bad/50 bg-bad/10 text-bad"
          }`}
          aria-live="polite"
        >
          {result.allPass ? (
            <>
              <strong>Claim survives all three checks.</strong> The state stayed{" "}
              {MATRIX_SIZE}² = {SYNAPSE_UNITS} units across {result.tokensTested}{" "}
              tokens (a cache would hold {result.cacheUnitsAtTest}), the cue is
              still the top recall, and only shared neurons leak. That last check
              is the honest cost — interference is exactly what the claim admits.
            </>
          ) : (
            <>
              <strong>Claim challenged.</strong> Inspect the failing check above —
              that is precisely the kind of observation that would falsify the
              one-sentence claim.
            </>
          )}
        </div>
      )}
    </section>
  );
}
