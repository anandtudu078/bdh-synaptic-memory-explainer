// 60-second test: three engine-grounded from-memory checks + a self-checked explain-it-back box. Client-side only.

"use client";

import { useState } from "react";
import {
  Timer,
  CircleCheck,
  CircleX,
  PenLine,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

type Question = {
  prompt: string;
  options: string[];
  correct: number;
  why: string;
};

// Every fact below matches the engine's actual behavior:
//  - λ multiplies every synapse every step (0.85^12 ≈ 0.14 after 12 steps)
//  - "the" = neurons [2,9]; "a" also fires 2; "it" also fires 9 (interference)
//  - oracle truth = 1.0 for every seen token (perfect, unbounded cache)
const QUESTIONS: Question[] = [
  {
    prompt: "Replay the stream with λ lowered to 0.85. What happens to the trace of a token written early?",
    options: [
      "It fades much faster — every step multiplies it by 0.85",
      "It stays the same — decay only affects newly written tokens",
      "It gets stronger — slower decay accumulates more",
    ],
    correct: 0,
    why: "λ multiplies every synapse every step: after 12 steps an old write is scaled by 0.85¹² ≈ 14%. Low λ is working memory; high λ is long retention.",
  },
  {
    prompt: "You cue with \u201cthe\u201d, and \u201ca\u201d and \u201cit\u201d light up too. Why?",
    options: [
      "The model learned that these are all common function words",
      "They share active neurons with \u201cthe\u201d, so their synapses were co-strengthened",
      "A bug — recall should stay sparse to the cue alone",
    ],
    correct: 1,
    why: "\u201cthe\u201d fires neurons [2, 9]; \u201ca\u201d also fires 2 and \u201cit\u201d also fires 9. The Hebbian write strengthens co-firing pairs, so any token sharing a neuron leaks into recall. That crosstalk is the price of a fixed state.",
  },
  {
    prompt: "In Truth-vs-Estimate, what does the green marker on a seen token represent?",
    options: [
      "The model's confidence in its next-word prediction",
      "What a perfect, unbounded KV-cache would recall — truth = 1.0",
      "The weight of the strongest synapse in the matrix",
    ],
    correct: 1,
    why: "Truth beside estimate: the green marker is the oracle (exact cache) result for every seen token. The gap between green and blue is exactly what decay + interference cost you.",
  },
];

const SELF_CHECKS = [
  "Mentioned the fixed-size state",
  "Mentioned the Hebbian write (co-firing → strengthening)",
  "Mentioned the trade-off (decay, interference, or forgetting)",
];

const MODEL_ANSWER =
  "Recent tokens write sparse Hebbian traces into one fixed synapse matrix " +
  "(W ← λ·W + η·x·xᵀ); decay λ fades old traces, so the state acts as short-term memory. " +
  "Because the matrix never grows, memory cost is constant — but overlapping patterns interfere, " +
  "capacity is bounded, and exact recall is lost. BDH builds its working memory on exactly this " +
  "mechanism, replacing the KV-cache.";

export default function SixtySecondTest() {
  const [picked, setPicked] = useState<(number | null)[]>(
    QUESTIONS.map(() => null)
  );
  const [explanation, setExplanation] = useState("");
  const [checks, setChecks] = useState<boolean[]>(
    SELF_CHECKS.map(() => false)
  );
  const [showModel, setShowModel] = useState(false);

  const answeredCount = picked.filter((p) => p !== null).length;
  const correctCount = picked.reduce<number>(
    (acc, p, i) => acc + (p === QUESTIONS[i].correct ? 1 : 0),
    0
  );
  const allAnswered = answeredCount === QUESTIONS.length;

  function pick(qi: number, oi: number) {
    setPicked((prev) => prev.map((p, i) => (i === qi ? (p ?? oi) : p)));
  }

  function reset() {
    setPicked(QUESTIONS.map(() => null));
    setShowModel(false);
  }

  function optionClass(qi: number, oi: number): string {
    const p = picked[qi];
    const base =
      "w-full text-left rounded-lg border px-2.5 py-2 text-xs leading-snug transition-colors";
    if (p === null)
      return `${base} border-edge bg-surface text-muted hover:border-accent/50 hover:text-foreground`;
    if (oi === QUESTIONS[qi].correct)
      return `${base} border-ok/60 bg-ok/10 text-ok`;
    if (oi === p) return `${base} border-bad/60 bg-bad/10 text-bad`;
    return `${base} border-edge text-muted/50`;
  }

  return (
    <section
      id="sixty-second-test"
      className="rounded-xl border border-edge bg-surface p-6 space-y-5"
      aria-label="Sixty-second self-test"
    >
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">The 60-Second Test</h2>
        </div>
        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <span
              className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${
                correctCount === QUESTIONS.length
                  ? "border-ok/50 bg-ok/10 text-ok"
                  : correctCount >= 2
                    ? "border-warn/50 bg-warn/10 text-warn"
                    : "border-bad/50 bg-bad/10 text-bad"
              }`}
              aria-live="polite"
            >
              {correctCount}/{QUESTIONS.length} correct
            </span>
          )}
          {answeredCount > 0 && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1 text-xs text-muted hover:border-accent/50 hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Retake
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed -mt-3">
        Answer from memory — no scrolling back. Then explain the claim in your own
        words. Self-checked and client-side: nothing is uploaded anywhere.
      </p>

      {/* ---------- Quick checks ---------- */}
      <div className="grid gap-4 md:grid-cols-3">
        {QUESTIONS.map((q, qi) => (
          <fieldset
            key={qi}
            className="rounded-lg border border-edge bg-surface-2/50 p-3 space-y-2"
          >
            <legend className="px-1 text-xs font-semibold text-foreground leading-snug">
              {q.prompt}
            </legend>
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => pick(qi, oi)}
                disabled={picked[qi] !== null}
                aria-pressed={picked[qi] === oi}
                className={`${optionClass(qi, oi)} disabled:cursor-default`}
              >
                {picked[qi] !== null && oi === q.correct && (
                  <CircleCheck className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />
                )}
                {picked[qi] !== null && oi === picked[qi] && oi !== q.correct && (
                  <CircleX className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />
                )}
                {opt}
              </button>
            ))}
            {picked[qi] !== null && (
              <p className="text-[11px] text-muted leading-relaxed" aria-live="polite">
                {q.why}
              </p>
            )}
          </fieldset>
        ))}
      </div>

      {allAnswered && (
        <p
          className={`text-sm font-medium ${
            correctCount === QUESTIONS.length
              ? "text-ok"
              : correctCount >= 2
                ? "text-warn"
                : "text-bad"
          }`}
          aria-live="polite"
        >
          {correctCount === QUESTIONS.length
            ? "Flawless — you can defend the claim. Now prove it: say it back in your own words."
            : correctCount >= 2
              ? "Solid — re-read the explanation for the one you missed, then say the claim back in your own words."
              : "Scroll back to the lab, replay with the presets, and retake — the mechanism is one line of math."}
        </p>
      )}

      {/* ---------- Explain it back ---------- */}
      <div className="rounded-lg border border-edge bg-surface-2/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-accent-strong" />
          <h3 className="text-sm font-semibold">Explain it back (in your own words)</h3>
        </div>
        <p className="text-xs text-muted">
          One or two sentences, as if to a colleague. This is the real test —
          judges and colleagues both ask for it.
        </p>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          aria-label="Your explanation of the concept in your own words"
          placeholder="e.g. A fixed grid of synapses remembers by strengthening when neurons co-fire and fading when they don't — the memory never grows, but traces interfere and decay."
          className="w-full rounded-lg border border-edge bg-surface p-3 text-xs text-foreground leading-relaxed placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
        />

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {SELF_CHECKS.map((c, i) => (
            <label
              key={i}
              className="inline-flex items-center gap-2 text-[11px] text-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={(e) =>
                  setChecks((prev) =>
                    prev.map((v, j) => (j === i ? e.target.checked : v))
                  )
                }
                className="accent-[var(--color-accent)] h-3.5 w-3.5"
              />
              {c}
            </label>
          ))}
        </div>

        <div>
          <button
            onClick={() => setShowModel((v) => !v)}
            aria-expanded={showModel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-strong hover:bg-accent/20 transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            {showModel ? "Hide model answer" : "Reveal model answer — compare after writing yours"}
          </button>
          {showModel && (
            <p className="mt-2 rounded-lg border-l-2 border-accent bg-surface p-3 text-xs text-muted leading-relaxed">
              {MODEL_ANSWER}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
