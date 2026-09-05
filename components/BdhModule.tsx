"use client";

import {
  Brain,
  Network,
  Sparkles,
  Waves,
  Eye,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const PILLARS: {
  icon: React.ReactNode;
  title: string;
  body: string;
}[] = [
  {
    icon: <Sparkles className="h-5 w-5 text-warn" />,
    title: "Sparse, non-negative activations (~5% active)",
    body: "Each token fires only a small subset of neurons, and activations never go negative — like real spikes. In this demo each token drives 2 of 24 neurons (≈8%), the same regime BDH works in. Sparsity is what keeps Hebbian traces local: only the co-firing neurons' synapses change.",
  },
  {
    icon: <Waves className="h-5 w-5 text-accent" />,
    title: "Hebbian plasticity instead of attention weights",
    body: "BDH replaces attention's KV-cache with synaptic state: 'neurons that fire together, wire together.' When the model hears or reasons about a concept, the synapses between the representing neurons physically strengthen, then decay. Working memory lives in the synapses, not in a saved list of keys and values.",
  },
  {
    icon: <Network className="h-5 w-5 text-fire" />,
    title: "Local graph dynamics, no quadratic attention",
    body: "BDH is a scale-free graph of locally-interacting neuron particles (heavy-tailed degree distribution, high modularity). Each neuron updates from its neighbors only — no global attention over the full context. Information propagates through the graph, and the state never exceeds the graph's synapse count.",
  },
  {
    icon: <Eye className="h-5 w-5 text-ok" />,
    title: "Interpretability by construction",
    body: "Because state is sparse and positive, individual synapses can be inspected: BDH's authors report that specific synapses strengthen whenever the model processes a specific concept, and demonstrate monosemanticity on language tasks. The demo matrix you just played with is exactly the kind of state you can point at.",
  },
];

const MAPPING: { transformer: string; bdh: string }[] = {
  ...[
    {
      transformer: "KV-cache (keys + values, grows per token)",
      bdh: "Synaptic weight state W (fixed size, decayed per step)",
    },
    {
      transformer: "Attention scores = Query·Key (global, dense)",
      bdh: "Local neighbor interactions on a sparse graph",
    },
    {
      transformer: "Dense positive+negative activations",
      bdh: "Sparse, non-negative 'spike' activations (~5%)",
    },
    {
      transformer: "Context = full token history, kept verbatim",
      bdh: "Context = compressed plastic trace, decayed and saturated",
    },
  ],
};

const MAPPING_ROWS = Object.values(MAPPING);

export default function BdhModule() {
  return (
    <section
      id="bdh-module"
      className="rounded-xl border border-edge bg-surface p-6 space-y-6"
      aria-label="BDH integration module"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">
            From Demo to Architecture: Baby Dragon Hatchling (BDH)
          </h2>
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          The matrix you just manipulated is a toy of the exact mechanism Pathway&apos;s{" "}
          <strong className="text-foreground">BDH</strong> architecture uses for working memory
          during inference. Four design pillars connect the demo to the real system
          (Kosowski&nbsp;et&nbsp;al., 2025 — arXiv:2509.26507).
        </p>
      </header>

      {/* Four pillars */}
      <div className="grid gap-4 md:grid-cols-2">
        {PILLARS.map((p) => (
          <article
            key={p.title}
            className="rounded-lg border border-edge bg-surface-2 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              {p.icon}
              <h3 className="text-sm font-semibold">{p.title}</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">{p.body}</p>
          </article>
        ))}
      </div>

      {/* Transformer ↔ BDH mapping table */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-muted uppercase mb-3">
          Transformer ↔ BDH Mapping
        </h3>
        <div className="overflow-x-auto rounded-lg border border-edge">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-2 text-left text-muted">
                <th className="px-4 py-2.5 font-medium">Standard Transformer</th>
                <th className="px-2 py-2.5 w-8" aria-hidden>
                  <ArrowRight className="h-3.5 w-3.5" />
                </th>
                <th className="px-4 py-2.5 font-medium">BDH (synaptic state)</th>
              </tr>
            </thead>
            <tbody>
              {MAPPING_ROWS.map((row, i) => (
                <tr key={i} className="border-t border-edge">
                  <td className="px-4 py-2.5 text-muted">{row.transformer}</td>
                  <td className="px-2 py-2.5" aria-hidden>
                    <ArrowRight className="h-3.5 w-3.5 text-accent" />
                  </td>
                  <td className="px-4 py-2.5">{row.bdh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <a
          href="https://arxiv.org/abs/2509.26507"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-accent-strong hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Paper: The Dragon Hatchling (arXiv:2509.26507)
        </a>
        <a
          href="https://github.com/pathwaycom/bdh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-accent-strong hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Code: github.com/pathwaycom/bdh
        </a>
      </footer>
    </section>
  );
}
