import Header from "@/components/Header";
import SynapticLab from "@/components/SynapticLab";
import BdhModule from "@/components/BdhModule";
import DocsSection from "@/components/DocsSection";

const CLAIM =
  "Attention can be reformulated as synaptic memory—where recent token interactions temporarily strengthen local connection weights via Hebbian updates—allowing a fixed-size recurrent state to process sequential context without growing a quadratic Key-Value cache.";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-10">
        <Header claim={CLAIM} />

        <SynapticLab />

        <BdhModule />

        <DocsSection />

        <footer className="border-t border-edge pt-6 pb-10 text-xs text-muted leading-relaxed">
          <p>
            Built as a DataForge Pathway track explainer. Educational toy model — not affiliated
            with Pathway. Primary source:{" "}
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong hover:underline"
            >
              Kosowski et al., 2025 (arXiv:2509.26507)
            </a>
            . Code for BDH:{" "}
            <a
              href="https://github.com/pathwaycom/bdh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong hover:underline"
            >
              github.com/pathwaycom/bdh
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
