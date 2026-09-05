import { BrainCircuit, Users, Target } from "lucide-react";

export default function Header({ claim }: { claim: string }) {
  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1.5">
          <BrainCircuit className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium tracking-wide text-muted">
            DataForge Pathway Track · Interactive Explainer
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1.5">
          <Users className="h-4 w-4 text-fire" />
          <span className="text-xs font-medium tracking-wide text-muted">
            For readers who know what attention is — no neuroscience PhD required
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          Synaptic Plasticity as Short-Term Memory
          <span className="text-muted"> vs. the KV-Cache</span>
        </h1>
        <p className="text-sm md:text-base text-muted max-w-3xl leading-relaxed">
          An interactive walkthrough: grow a living synaptic memory yourself, watch it remember,
          interfere, and forget — then see exactly how Pathway&apos;s Baby Dragon Hatchling (BDH)
          turns this mechanism into a competitive Transformer alternative.
        </p>
      </div>

      {/* The claim, prominently */}
      <div className="relative rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-surface p-5 md:p-6 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden />
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-accent-strong mt-1 shrink-0" />
          <div>
            <div className="text-[11px] uppercase tracking-widest text-accent-strong font-semibold mb-2">
              The One-Sentence Claim
            </div>
            <p className="text-base md:text-lg font-medium leading-relaxed text-foreground">
              &ldquo;{claim}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
