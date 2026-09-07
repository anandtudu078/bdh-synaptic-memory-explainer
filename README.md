# 🐉 BDH Synaptic Memory Explainer

**Synaptic Plasticity as Short-Term Memory vs. the KV-Cache**

An interactive, single-page educational web app for the **DataForge Pathway track**. You manipulate a living synaptic memory yourself: feed it tokens, watch Hebbian traces form, interfere, and decay — then see exactly how Pathway's **Baby Dragon Hatchling (BDH)** architecture turns this mechanism into a competitive Transformer alternative with **no growing KV-cache**.

> **🔴 Live artifact:** [https://bdh-synaptic-memory-explainer.vercel.app](https://bdh-synaptic-memory-explainer.vercel.app) — opens without sign-in.
> **📄 Blog post (PDF):** [blog/bdh-synaptic-memory-vs-kv-cache.pdf](blog/bdh-synaptic-memory-vs-kv-cache.pdf) (Markdown + HTML source in [`blog/`](blog/)).
> **📝 One-page concept summary (PDF):** [summary/bdh-synaptic-memory-one-page-summary.pdf](summary/bdh-synaptic-memory-one-page-summary.pdf) (print-ready HTML source in [`summary/`](summary/)).

---

## 🎯 The One-Sentence Claim

> *"Attention can be reformulated as synaptic memory — where recent token interactions temporarily strengthen local connection weights via Hebbian updates — allowing a fixed-size recurrent state to process sequential context without a Key-Value cache that grows linearly with context length."*

The app is built to let you **test that claim with your own hands**, not just read it.

This claim is grounded in: **Kosowski et al. (2025)**, who introduce BDH and show that locally plastic, scale-free spiking neuron graphs rival Transformers at 10M–1B parameters without a KV-cache [[arXiv:2509.26507](https://arxiv.org/abs/2509.26507)]; **Schlag, Irie & Schmidhuber (2021)**, who prove that the KV-cache in linear attention *is* a fast-weight program — i.e. attention writes into a rapidly changing weight matrix [[arXiv:2102.11174](https://arxiv.org/abs/2102.11174)]; and the long line of recurrent state-space models summarized by **Gu & Dao (2023)** (Mamba) [[arXiv:2312.00752](https://arxiv.org/abs/2312.00752)] and **Orvieto et al. (2024)** (LRU) [[arXiv:2303.06349](https://arxiv.org/abs/2303.06349)], which process unbounded context with a fixed-size state.

---

## 👥 Who This Is For

- ML engineers and students who know what attention is but not how plastic recurrent states work
- Hackathon judges evaluating the Pathway/BDH track
- Anyone curious how far brain-inspired architectures deviate from the Transformer playbook

**Prerequisites:** comfort with basic matrix notation (`x·xᵀ`, matrix–vector products) and a rough idea of what attention and a KV-cache are (any intro LLM tutorial suffices). No neuroscience background required.

---

## 🧪 What You Can Do (The Demo Script)

| Step | Action | What to Watch |
|------|--------|---------------|
| 1 | Click **"Play stream"** | Green cells flash in the matrix as each token writes `x·xᵀ`; older cells fade as λ decays them |
| 2 | Drag **Decay Factor λ** left (→ 0.8) while playing | Traces fade fast — short-term memory in action |
| 3 | Watch the **Recall Probe** bars | "the" lights up… but so do "a" and "it" — that's **interference** from shared neurons |
| 4 | Check **Truth vs Estimate** | Blue = what the fixed state recalls; green marker = what a perfect oracle cache would give. Fidelity & interference scores update live |
| 5 | Compare **Memory Budget** bars | Synaptic state: constant 576 units. KV-cache: grows forever with every token |
| 6 | Reset and crank **Plasticity Rate η** to 1.0 | Faster writing, but more crosstalk — the core trade-off |
| 7 | Take the **60-Second Test** | 3 from-memory checks with instant feedback, then explain the claim back in your own words and compare with a model answer |
| 8 | Flip **Race mode** | Two (η, λ) memory policies replay the same token stream side by side — watch fidelity and interference diverge |
| 9 | Run the **Falsification Experiment** | One click: three checks try to break the claim on a 300-token stream — verdict computed live, never scripted |

Every step updates in **sub-second** — the whole simulation runs client-side with zero backend.

---

## 🧠 The Model (How the Simulation Works)

A faithful toy of BDH's working-memory mechanism:

1. **State** — a fixed `24 × 24` matrix `W` of non-negative synapse weights (576 numbers, forever). BDH likewise keeps its working memory in a fixed-size synaptic state rather than a growing cache [[arXiv:2509.26507](https://arxiv.org/abs/2509.26507), §2].
2. **Encoding** — each token activates a sparse pattern `x` of 2 of 24 neurons (~8%; BDH uses ~5%), mirroring BDH's sparse, non-negative activations [[arXiv:2509.26507](https://arxiv.org/abs/2509.26507), §2–3].
3. **Update (Hebbian + decay)** — `W ← λ·W + η·(x·xᵀ)`: decay everything, then strengthen co-firing pairs, clamped to `[0, 1]`. *"Neurons that fire together, wire together"* — the classical Hebbian outer-product rule [[Hopfield (1982)](https://www.pnas.org/doi/10.1073/pnas.79.8.2554)], which **Schlag et al. (2021)** show is exactly the state-update performed by linear attention [[arXiv:2102.11174](https://arxiv.org/abs/2102.11174)].
4. **Recall** — `y = W·cue`, normalized. The **Truth vs Estimate** panel compares against an oracle with a perfect, unlimited KV-cache.

### Why This Matters vs. Standard Attention

| | Standard Transformer | Synaptic state (BDH-style) |
|---|---|---|
| Working memory | KV-cache, grows O(T) with context | Fixed-size `W`, O(1) forever |
| Mechanism | Global attention: Q·K over all history | Local Hebbian updates + decay |
| Activations | Dense, signed | Sparse (~5%), non-negative "spikes" |
| Interpretability | Post-hoc | By construction — synapses are the memory |
| Cost | Memory grows unboundedly | Interference, bounded capacity, forgetting |

---

## 📚 Learning Objectives

After using this explainer, you should be able to:

1. **Explain Hebbian plasticity** as a memory-write rule and connect it to the outer-product (correlation) learning rule.
2. **Contrast fixed-size recurrent state** with a growing KV-cache — and articulate the memory-vs-capacity trade-off.
3. **Demonstrate interference** by identifying overlapping token patterns that corrupt each other's recall.
4. **Explain catastrophic forgetting** and why multiplicative decay causes it.
5. **Map the mechanism to BDH**: sparse non-negative activations, local graph dynamics, and synaptic working memory in Pathway's architecture.
6. **Argue both sides**: why O(1) memory is attractive at scale, and why exact caching still wins for verbatim recall.

---

## 🧩 Artifact Status: Live, Precomputed, Synthetic, or Animated

Everything in the artifact falls into exactly one of these categories:

| Component | Status | Notes |
|---|---|---|
| Hebbian simulation (`lib/engine.ts`) | **Live** | Real-time math on every user input; no backend, no model weights |
| Synaptic matrix, recall probe, sliders | **Live** | Rendered from simulation state on every tick |
| Truth-vs-estimate scoring & fidelity/interference metrics | **Live** | Computed per token from the simulation |
| 60-second self-test | **Live** | Graded client-side against the engine's actual behavior; the learner's explanation never leaves the browser |
| Race mode (ScenarioCompare) | **Live** | Two (η, λ) policies replay the identical stream; per-side matrix, fidelity and interference from the same engine |
| Falsification experiment (ClaimExperiment) | **Live** | Three claim checks recomputed from the engine on every run — deterministic, nothing precomputed |
| Memory-budget bars (O(1) vs O(T)) | **Live** | Derived from current stream length |
| KV-growth chart | **Animated SVG** | Chart shape is deterministic given stream length; animation is CSS/keyframe-driven, no chart library |
| 3D synaptic terrain | **Animated, procedural** | three.js mesh generated in code from the live matrix; no external 3D assets; lazy-loaded |
| Token "activations" (which neurons fire) | **Synthetic** | Deterministic pseudo-random sparse patterns seeded per token label; not learned or data-derived |
| Oracle "truth" values | **Synthetic** | Idealized reference computed from a perfect cache in-engine; not a real trained model |
| Copy, docs, citations, blog | **Static** | Authored text; no runtime computation |
| PDF summary & blog PDF | **Precomputed/static** | Generated at authoring time; the in-app 1-page PDF is produced by the browser's print dialog |
| One-page concept summary (`summary/`) | **Static/Precomputed** | Print-ready HTML source + generated PDF; regenerate with headless Chrome (see Reproducing the Results) |

There are **no pretrained weights, no datasets, and no server-side computation** anywhere in the artifact.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ (20+ recommended)
- npm

### Run Locally

```bash
git clone https://github.com/anandtudu078/bdh-synaptic-memory-explainer.git
cd bdh-synaptic-memory-explainer
npm install
npm run dev
```

Open **http://localhost:3000**.

### Production Build

```bash
npm run build
npm start
```

### Tests, Types, Lint

The engine is pure and framework-free, so its tests are plain assertions with no
test-runner dependency:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

### Reproducing the Results

All quantitative behavior in the artifact is reproducible locally:

1. Run the app (above) — the simulation parameters (λ, η, sparsity, matrix size) are visible in `lib/engine.ts` as named constants.
2. `npm test` re-runs the engine smoke tests that verify the Hebbian update, decay, and recall math.
3. To regenerate the blog PDF from source: `blog/bdh-synaptic-memory-vs-kv-cache.html` is print-ready — open it in Chrome and print to PDF (or `chrome --headless --print-to-pdf=blog/bdh-synaptic-memory-vs-kv-cache.pdf blog/bdh-synaptic-memory-vs-kv-cache.html`).
4. To regenerate the one-page concept summary PDF: `summary/bdh-synaptic-memory-one-page-summary.html` is print-ready A4 — `chrome --headless --print-to-pdf=summary/bdh-synaptic-memory-one-page-summary.pdf summary/bdh-synaptic-memory-one-page-summary.html`.

### Deploy to Vercel

One click: [vercel.com/new](https://vercel.com/new) → import the repo → framework auto-detects Next.js → deploy. No environment variables needed.

---

## 🗂 Project Structure

```
bdh-synaptic-memory-explainer/
├── app/
│   ├── layout.tsx        # Root layout, metadata, dark theme, font loading
│   ├── page.tsx          # Assembles header → lab → BDH module → docs
│   └── globals.css       # Tailwind 4 theme, sliders, animations, print stylesheet
├── components/
│   ├── Header.tsx        # Title, audience, the one-sentence claim
│   ├── SynapticLab.tsx   # ⭐ Interactive matrix, sliders, token stream, recall probe
│   ├── ScenarioCompare.tsx  # Race mode: two (η, λ) policies replaying the same stream
│   ├── ClaimExperiment.tsx  # One-click falsification experiment for the claim
│   ├── SixtySecondTest.tsx  # 60-second self-test: from-memory checks + explain-it-back
│   ├── TruthVsEstimate.tsx  # Model memory vs oracle truth + memory budget bars
│   ├── KvGrowthChart.tsx # Pure-SVG chart: fixed state (O(1)) vs KV-cache (O(T))
│   ├── SynapticTerrain3D.tsx # Lazy-loaded 3D synaptic terrain (three.js)
│   ├── BdhModule.tsx     # BDH pillars + Transformer ↔ BDH mapping table
│   └── DocsSection.tsx   # How-it-works, limitations, citations, PDF export block
├── lib/
│   └── engine.ts         # ⭐ Hebbian simulation, presets, scoring, budget math
├── tests/
│   └── engine.test.ts    # Engine smoke tests (npm test)
├── blog/
│   ├── bdh-synaptic-memory-vs-kv-cache.md    # Blog post source (Markdown)
│   ├── bdh-synaptic-memory-vs-kv-cache.html  # Print-ready HTML for PDF export
│   └── bdh-synaptic-memory-vs-kv-cache.pdf   # 📄 The blog as a PDF file
├── summary/
│   ├── bdh-synaptic-memory-one-page-summary.html  # One-page concept summary (print-ready source)
│   └── bdh-synaptic-memory-one-page-summary.pdf   # 📝 The concept summary as a PDF file
└── package.json
```

`lib/engine.ts` is the single source of truth: the simulation, the scenario
presets, the recall cue, and the scoring helpers all live there. Components
render it — they never redefine constants of their own.

---

## ⚠️ Limitations (Honest Caveats)

The simulation is a **toy of the mechanism, not of BDH itself**:

- **Interference** — overlapping representations write to the same synapses; recall of one corrupts the other.
- **Catastrophic forgetting** — a fixed state must overwrite to store; λ < 1 fades old traces, λ = 1 eventually saturates.
- **Bounded capacity** — ~0.14·d patterns for naive outer-product rules [[Hopfield (1982)](https://www.pnas.org/doi/10.1073/pnas.79.8.2554)]; the demo saturates after a handful of overlapping tokens.
- **Weak order information** — outer-product traces are largely order-agnostic; "dog bites man" ≈ "man bites dog".
- **Not a BDH re-implementation** — BDH adds spiking thresholds, per-neuron state, normalization, and learned plasticity [[arXiv:2509.26507](https://arxiv.org/abs/2509.26507)]. We strip all that so the core loop is visible in one glance.

Full discussion lives in the app's **Limitations** section.

---

## 🔮 Roadmap

- [x] Slider presets for demo scenarios (goldfish / balanced / elephant)
- [x] Live KV-growth chart (O(T) vs O(1))
- [x] One-click 1-page PDF export
- [x] 3D synaptic terrain view (lazy-loaded three.js)
- [x] Side-by-side scenario comparison mode (shipped as Race mode)
- [ ] Optional: BDH-style spiking threshold dynamics

---

## 📖 Primary Sources

**Primary papers from 2022–2026** (each uses, extends, tests, or relies on synaptic-memory / fixed-state sequence modeling):

- **Kosowski, A., Uznański, P., Chorowski, J., Stamirowska, Z., & Bartoszkiewicz, M. (2025).** *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.* arXiv:2509.26507 — [arxiv.org/abs/2509.26507](https://arxiv.org/abs/2509.26507) · Code: [github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh) *(primary; introduces the BDH architecture this artifact explains)*
- **Gu, A., & Dao, T. (2023).** *Mamba: Linear-Time Sequence Modeling with Selective State Spaces.* arXiv:2312.00752 — [arxiv.org/abs/2312.00752](https://arxiv.org/abs/2312.00752) *(fixed-size state replaces the KV-cache; tests recurrence against attention)*
- **Orvieto, A., Smith, S. L., Gu, A., Fernando, A., Gulcehre, C., Paszke, A., … De, S. (2024).** *Resurrecting Recurrent Neural Networks for Long Sequences.* ICML 2024 — [arxiv.org/abs/2303.06349](https://arxiv.org/abs/2303.06349) *(shows gated linear recurrences match attention quality with O(1) memory)*

**Foundational and supporting sources:**

- Schlag, I., Irie, K., & Schmidhuber, J. (2021). *Linear Transformers Are Secretly Fast Weight Programmers.* ICML — [arxiv.org/abs/2102.11174](https://arxiv.org/abs/2102.11174)
- Ramsauer, H., et al. (2020). *Hopfield Networks is All You Need.* arXiv:2006.16222.
- Hopfield, J. J. (1982). *Neural networks and physical systems with emergent collective computational abilities.* PNAS 79(8).

---

## 🔍 Source & License Record

Every element of this artifact, its origin, and its license:

| Asset / component | Source | License |
|---|---|---|
| This repository's code | Authored for this project ([github.com/anandtudu078/bdh-synaptic-memory-explainer](https://github.com/anandtudu078/bdh-synaptic-memory-explainer)) | MIT (see [LICENSE](LICENSE)) |
| Blog post & in-app summary text | Authored for this project; ideas attributed via citations | MIT (part of the repo) |
| **Code:** Next.js 16 | [nextjs.org](https://nextjs.org) | MIT |
| **Code:** React 19 / react-dom | [react.dev](https://react.dev) | MIT |
| **Code:** three.js + @react-three/fiber + @react-three/drei | [threejs.org](https://threejs.org), [github.com/pmndrs](https://github.com/pmndrs) | MIT |
| **Code:** lucide-react (all icons in the UI) | [lucide.dev](https://lucide.dev) | ISC |
| **Code:** Tailwind CSS 4 | [tailwindcss.com](https://tailwindcss.com) | MIT |
| **Code:** TypeScript, tsx, ESLint (dev tooling) | [typescriptlang.org](https://www.typescriptlang.org) etc. | Apache-2.0 / MIT |
| **Fonts:** Geist & Geist Mono (via `next/font/google`) | [vercel.com/font](https://vercel.com/font) | SIL Open Font License 1.1 |
| **Graphics:** UI icons | lucide-react (see above) | ISC |
| **Graphics:** charts, matrix heatmap, 3D terrain | Generated procedurally in code (SVG / three.js) — no external images | MIT (part of the repo) |
| **Data** | None — all data shown is **synthetic**, generated at runtime by `lib/engine.ts` | n/a |
| **Model weights** | None — the artifact contains **no pretrained or trained weights** | n/a |

Third-party code is declared in `package.json` and its lockfile with exact versions.

---

## 🤖 AI Assistance & Asset Disclosure

- AI assistance (code): Portions of the code, documentation, and blog post were drafted with the help of an AI coding agent (**Codebuff**), then reviewed, tested, and curated by the author. All technical claims were checked against the cited papers.
- AI assistance (content): The educational narrative was co-drafted with AI and edited by the author; citations and paper claims were verified manually against arXiv sources.
- **Data:** No datasets were used, collected, or modified. All displayed data is **synthetic**, produced by the deterministic simulation in `lib/engine.ts`.
- **Assets:** No third-party images, audio, or video were used. All visuals are procedural (SVG/three.js) or library icons (lucide, ISC). Fonts are Geist/Geist Mono (OFL 1.1) served via `next/font`.
- **Licenses:** This project is MIT-licensed; all incorporated third-party libraries are permissively licensed (MIT/ISC/Apache-2.0) as recorded in the table above.

---

*Built as an educational explainer — not affiliated with Pathway.*

---

## 📄 License

MIT — see [LICENSE](LICENSE).
