# 🐉 BDH Synaptic Memory Explainer

**Synaptic Plasticity as Short-Term Memory vs. the KV-Cache**

An interactive, single-page educational web app for the **DataForge Pathway track**. You manipulate a living synaptic memory yourself: feed it tokens, watch Hebbian traces form, interfere, and decay — then see exactly how Pathway's **Baby Dragon Hatchling (BDH)** architecture turns this mechanism into a competitive Transformer alternative with **no growing KV-cache**.

---

## 🎯 The One-Sentence Claim

> *"Attention can be reformulated as synaptic memory — where recent token interactions temporarily strengthen local connection weights via Hebbian updates — allowing a fixed-size recurrent state to process sequential context without growing a quadratic Key-Value cache."*

The app is built to let you **test that claim with your own hands**, not just read it.

---

## 👥 Who This Is For

- ML engineers and students who know what attention is but not how plastic recurrent states work
- Hackathon judges evaluating the Pathway/BDH track
- Anyone curious how far brain-inspired architectures deviate from the Transformer playbook

No neuroscience background required.

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

Every step updates in **sub-second** — the whole simulation runs client-side with zero backend.

---

## 🧠 The Model (How the Simulation Works)

A faithful toy of BDH's working-memory mechanism:

1. **State** — a fixed `24 × 24` matrix `W` of non-negative synapse weights (576 numbers, forever).
2. **Encoding** — each token activates a sparse pattern `x` of 2 of 24 neurons (~8%; BDH uses ~5%), mirroring BDH's sparse, non-negative activations.
3. **Update (Hebbian + decay)** — `W ← λ·W + η·(x·xᵀ)`: decay everything, then strengthen co-firing pairs, clamped to `[0, 1]`. *"Neurons that fire together, wire together."*
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

### Deploy to Vercel

One click: [vercel.com/new](https://vercel.com/new) → import the repo → framework auto-detects Next.js → deploy. No environment variables needed.

---

## 🗂 Project Structure

```
bdh-synaptic-memory-explainer/
├── app/
│   ├── layout.tsx        # Root layout, metadata, dark theme
│   ├── page.tsx          # Assembles header → lab → BDH module → docs
│   └── globals.css       # Tailwind 4 theme, sliders, animations
├── components/
│   ├── Header.tsx        # Title, audience, the one-sentence claim
│   ├── SynapticLab.tsx   # ⭐ Interactive matrix, sliders, token stream, recall probe
│   ├── TruthVsEstimate.tsx  # Model memory vs oracle truth + memory budget bars
│   ├── KvGrowthChart.tsx # Pure-SVG chart: fixed state (O(1)) vs KV-cache (O(T))
│   ├── SynapticTerrain3D.tsx # Lazy-loaded 3D synaptic terrain (three.js)
│   ├── BdhModule.tsx     # BDH pillars + Transformer ↔ BDH mapping table
│   └── DocsSection.tsx   # How-it-works, limitations, citations, PDF export block
├── lib/
│   └── engine.ts         # ⭐ Hebbian simulation, presets, scoring, budget math
├── tests/
│   └── engine.test.ts    # Engine smoke tests (npm test)
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
- **Bounded capacity** — ~0.14·d patterns for naive outer-product rules (classical Hopfield result); the demo saturates after a handful of overlapping tokens.
- **Weak order information** — outer-product traces are largely order-agnostic; "dog bites man" ≈ "man bites dog".
- **Not a BDH re-implementation** — BDH adds spiking thresholds, per-neuron state, normalization, and learned plasticity. We strip all that so the core loop is visible in one glance.

Full discussion lives in the app's **Limitations** section.

---

## 🔮 Roadmap

- [x] Slider presets for demo scenarios (goldfish / balanced / elephant)
- [x] Live KV-growth chart (O(T) vs O(1))
- [x] One-click 1-page PDF export
- [x] 3D synaptic terrain view (lazy-loaded three.js)
- [ ] Side-by-side scenario comparison mode
- [ ] Optional: BDH-style spiking threshold dynamics

---

## 📖 Primary Sources

- **Kosowski, A., Uznański, P., Chorowski, J., Stamirowska, Z., & Bartoszkiewicz, M. (2025).** *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.* arXiv:2509.26507 — [arxiv.org/abs/2509.26507](https://arxiv.org/abs/2509.26507) · Code: [github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh)
- Schlag, I., Irie, K., & Schmidhuber, J. (2021). *Linear Transformers Are Secretly Fast Weight Programmers.* ICML.
- Gu, A., & Dao, T. (2023). *Mamba: Linear-Time Sequence Modeling with Selective State Spaces.* arXiv:2312.00752.
- Orvieto, A., et al. (2024). *Resurrecting Recurrent Neural Networks for Long Sequences.* ICML.
- Ramsauer, H., et al. (2020). *Hopfield Networks is All You Need.* arXiv:2006.16222.
- Hopfield, J. J. (1982). *Neural networks and physical systems with emergent collective computational abilities.* PNAS.

---

*Built as an educational explainer — not affiliated with Pathway.*

---

## 📄 License

MIT — see [LICENSE](LICENSE).
