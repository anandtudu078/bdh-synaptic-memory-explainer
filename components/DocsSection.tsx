"use client";

import {
  BookOpen,
  AlertTriangle,
  FileText,
  BookMarked,
  FlaskConical,
  Download,
} from "lucide-react";

const LIMITATIONS = [
  {
    title: "Interference & crosstalk",
    body: "Overlapping representations write to the same synapses. When 'a' and 'the' share a neuron, recall of one corrupts the other. In the demo this shows up as bars lighting up for tokens you never saw. Real BDH mitigates this with extreme sparsity and competitive inhibition between neurons.",
  },
  {
    title: "Catastrophic forgetting",
    body: "A fixed-size state must overwrite something to store something new. With multiplicative decay λ < 1, old traces decay toward zero; with λ = 1 and saturation clamps, the matrix eventually fills and new memories crush old ones. There is no free lunch: 576 synapses cannot verbatim-hold an unbounded stream.",
  },
  {
    title: "Capacity is bounded and content-addressed only",
    body: "Classical results (Hopfield 1982; recent modern Hopfield work 2020–2024) put associative-memory capacity around 0.14·d patterns for naive outer-product rules. The demo state saturates after a handful of overlapping tokens; recall is by similarity, not by exact position or timestamp.",
  },
  {
    title: "Order information is weak",
    body: "Outer-product traces are (mostly) order-agnostic: 'dog bites man' and 'man bites dog' write nearly the same synapses. Transformers get order for free from positional embeddings plus the cache; recurrent plastic states need extra structure to represent sequence order.",
  },
  {
    title: "This demo is a toy of the mechanism, not of BDH itself",
    body: "BDH's actual dynamics include spiking thresholds, per-neuron state, winner-take-all-style normalization, and a trained (not hand-set) weighting of plasticity. We strip all that away so the core Hebbian + decay loop is visible in one glance.",
  },
];

const CITATIONS = [
  {
    year: "2025",
    ref: "Kosowski, A., Uznański, P., Chorowski, J., Stamirowska, Z., & Bartoszkiewicz, M. (2025). The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain. arXiv:2509.26507.",
    url: "https://arxiv.org/abs/2509.26507",
    tag: "PRIMARY",
  },
  {
    year: "2024",
    ref: "Orvieto, A., Smith, S. L., Gu, A., Fernando, A., Gulcehre, C., Paszke, A., ... & De, S. (2024). Resurrecting Recurrent Neural Networks for Long Sequences. ICML 2024.",
    url: "https://arxiv.org/abs/2303.06349",
    tag: "RECURRENCE",
  },
  {
    year: "2023",
    ref: "Gu, A., & Dao, T. (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces. arXiv:2312.00752.",
    url: "https://arxiv.org/abs/2312.00752",
    tag: "SSM",
  },
  {
    year: "2023",
    ref: "Schlag, I., Irie, K., & Schmidhuber, J. (2021). Linear Transformers Are Secretly Fast Weight Programmers. ICML 2021 — foundational for fast-weight / synaptic views of attention.",
    url: "https://arxiv.org/abs/2102.11174",
    tag: "FAST WEIGHTS",
  },
  {
    year: "2020",
    ref: "Ramsauer, H., et al. (2020). Hopfield Networks is All You Need. arXiv:2006.16222 — attention as associative memory retrieval.",
    url: "https://arxiv.org/abs/2006.16222",
    tag: "HOPFIELD",
  },
  {
    year: "1982",
    ref: "Hopfield, J. J. (1982). Neural networks and physical systems with emergent collective computational abilities. PNAS 79(8).",
    url: "https://www.pnas.org/doi/10.1073/pnas.79.8.2554",
    tag: "CLASSIC",
  },
];

export default function DocsSection() {
  return (
    <section id="docs" className="space-y-6" aria-label="Documentation and citations">
      {/* How the model works */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">How the Simulation Works</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 text-xs text-muted leading-relaxed">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">State.</strong> A fixed 24×24 matrix{" "}
              <code className="font-mono text-accent-strong">W</code> of non-negative synapse
              weights — 576 numbers, forever.
            </p>
            <p>
              <strong className="text-foreground">Encoding.</strong> Each token activates a sparse
              pattern <code className="font-mono text-accent-strong">x</code> of 2 neurons
              (mimicking BDH&apos;s ~5% sparsity, non-negative).
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Update (Hebbian + decay).</strong>{" "}
              <code className="font-mono text-accent-strong">
                W ← λ·W + η·(x·xᵀ)
              </code>{" "}
              — decay everything, then strengthen co-firing pairs, clamped to [0,&nbsp;1].
            </p>
            <p>
              <strong className="text-foreground">Recall.</strong>{" "}
              <code className="font-mono text-accent-strong">y = W·cue</code>, normalized. The
              &ldquo;truth&rdquo; panel compares against an oracle with a perfect, unlimited cache.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-warn" />
          <h2 className="text-lg font-semibold">Limitations & Honest Caveats</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {LIMITATIONS.map((l) => (
            <article key={l.title} className="rounded-lg bg-surface-2 p-4">
              <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-fire shrink-0" />
                {l.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">{l.body}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Citations */}
      <div className="rounded-xl border border-edge bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookMarked className="h-5 w-5 text-ok" />
          <h2 className="text-lg font-semibold">Sources (2020–2026)</h2>
        </div>
        <ol className="space-y-3">
          {CITATIONS.map((c) => (
            <li key={c.url} className="flex gap-3 text-xs leading-relaxed">
              <span className="shrink-0 rounded bg-surface-2 border border-edge px-1.5 py-0.5 font-mono text-[10px] text-muted h-fit">
                {c.year}
              </span>
              <span className="text-muted">
                {c.ref}{" "}
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-strong hover:underline"
                >
                  [{c.tag}]
                </a>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* PDF export block — the only section rendered when printing */}
      <div className="print-visible">
        <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 no-print">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-strong" />
              <h2 className="text-lg font-semibold">1-Page PDF Summary</h2>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent/15 border border-accent/40 px-4 py-2 text-sm font-medium text-accent-strong hover:bg-accent/25 transition-colors"
              aria-label="Download the one-page summary as PDF via the print dialog"
            >
              <Download className="h-4 w-4" />
              Download 1-page PDF
            </button>
          </div>
          <p className="text-xs text-muted mb-4 leading-relaxed no-print">
            Opens your browser&apos;s print dialog — choose <strong className="text-foreground">“Save as PDF”</strong>.
            Only this summary is printed: claim, mechanism, trade-off, BDH link, and sources on one A4 page.
          </p>
          <div className="print-summary rounded-lg bg-background border border-edge p-5 font-mono text-[11px] leading-relaxed text-muted space-y-2">
          <p className="text-accent-strong font-semibold">
            SYNAPTIC PLASTICITY AS SHORT-TERM MEMORY — 1-PAGE SUMMARY
          </p>
          <p>
            <span className="text-foreground">CLAIM.</span> Attention can be reformulated as
            synaptic memory: recent token interactions temporarily strengthen local connection
            weights via Hebbian updates, letting a fixed-size recurrent state process sequential
            context without a growing quadratic KV-cache.
          </p>
          <p>
            <span className="text-foreground">MECHANISM.</span> W ← λ·W + η·(x·xᵀ). Sparse
            non-negative token spikes (≈5% of neurons, per BDH) write outer-product traces into a
            fixed synapse matrix; λ decays old traces (short-term memory); recall y = W·cue.
          </p>
          <p>
            <span className="text-foreground">TRADE-OFF.</span> Constant memory O(1) vs cache
            O(T): you gain a bounded, biologically plausible, interpretable state; you pay with
            interference, bounded capacity, weak order information, and catastrophic forgetting.
          </p>
          <p>
            <span className="text-foreground">BDH LINK.</span> Pathway&apos;s Baby Dragon Hatchling
            (arXiv:2509.26507, 2025) operationalizes this at 10M–1B parameters with sparse spiking
            neurons on a scale-free local graph, rivalling GPT-2 at equal parameter count — no
            KV-cache.
          </p>
          <p className="text-muted/70">
            Sources: Kosowski et al. 2025 (primary); Schlag et al. 2021; Gu &amp; Dao 2023;
            Orvieto et al. 2024; Ramsauer et al. 2020; Hopfield 1982.
          </p>
          </div>
        </section>
      </div>
    </section>
  );
}
