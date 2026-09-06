// Live memory-budget chart: fixed synaptic state (O(1)) vs growing KV-cache (O(T)).
// Pure SVG — no chart dependency. Crossover at token 576/4 = 144.

"use client";

type Props = {
  tokens: number; // current position in the demo stream (0..13)
};

const W = 600;
const H = 250;
const PAD_L = 48;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 30;

const MAX_TOKENS = 512;
const MAX_UNITS = 1024; // top of y-axis
const SYNAPSE_UNITS = 576;
const KV_PER_TOKEN = 4;

const COLOR_SYNAPTIC = "#38bdf8"; // sky
const COLOR_CACHE = "#fb923c"; // orange
const COLOR_MUTED = "#8b98b3";
const COLOR_GRID = "#1e2a44";

function x(t: number): number {
  return PAD_L + (t / MAX_TOKENS) * (W - PAD_L - PAD_R);
}

function y(u: number): number {
  return H - PAD_B - (u / MAX_UNITS) * (H - PAD_T - PAD_B);
}

export default function KvGrowthChart({ tokens }: Props) {
  const cacheUnits = tokens * KV_PER_TOKEN;
  const crossoverToken = SYNAPSE_UNITS / KV_PER_TOKEN; // 144

  // The cache line reaches MAX_UNITS at 256 tokens, well before MAX_TOKENS.
  // Stop it at the ceiling so it never draws outside the plot area.
  const cacheEndToken = Math.min(MAX_TOKENS, MAX_UNITS / KV_PER_TOKEN);
  const cacheX1 = x(0);
  const cacheY1 = y(0);
  const cacheX2 = x(cacheEndToken);
  const cacheY2 = y(cacheEndToken * KV_PER_TOKEN);

  const synX1 = x(0);
  const synY1 = y(SYNAPSE_UNITS);
  const synX2 = x(MAX_TOKENS);
  const synY2 = y(SYNAPSE_UNITS);

  // "you are here" position on the cache line
  const hereX = x(Math.min(tokens, MAX_TOKENS));
  const hereY = y(cacheUnits);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Memory vs Context Length
        </h4>
        <span className="font-mono text-[10px] text-muted">
          units of state · linear scale
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Line chart: KV-cache grows linearly with tokens and crosses the constant synaptic state at 144 tokens. Synaptic state stays at 576 units forever."
      >
        {/* gridlines */}
        {[0, 256, 512, 768, 1024].map((u) => (
          <g key={u}>
            <line
              x1={PAD_L}
              y1={y(u)}
              x2={W - PAD_R}
              y2={y(u)}
              stroke={COLOR_GRID}
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(u) + 3}
              textAnchor="end"
              fontSize={9}
              fill={COLOR_MUTED}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {u}
            </text>
          </g>
        ))}

        {/* x-axis ticks */}
        {[0, 128, 256, 384, 512].map((t) => (
          <text
            key={t}
            x={x(t)}
            y={H - PAD_B + 14}
            textAnchor="middle"
            fontSize={9}
            fill={COLOR_MUTED}
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {t}
          </text>
        ))}
        <text
          x={(PAD_L + W - PAD_R) / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize={9}
          fill={COLOR_MUTED}
        >
          tokens processed →
        </text>

        {/* cache line (orange) */}
        <line
          x1={cacheX1}
          y1={cacheY1}
          x2={cacheX2}
          y2={cacheY2}
          stroke={COLOR_CACHE}
          strokeWidth={2}
        />
        {/* synaptic line (sky, flat) */}
        <line
          x1={synX1}
          y1={synY1}
          x2={synX2}
          y2={synY2}
          stroke={COLOR_SYNAPTIC}
          strokeWidth={2}
        />

        {/* crossover marker */}
        <g>
          <line
            x1={x(crossoverToken)}
            y1={y(0)}
            x2={x(crossoverToken)}
            y2={y(SYNAPSE_UNITS)}
            stroke={COLOR_MUTED}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.7}
          />
          <text
            x={x(crossoverToken) + 4}
            y={y(SYNAPSE_UNITS) - 6}
            fontSize={9}
            fill={COLOR_MUTED}
          >
            crossover @ 144
          </text>
        </g>

        {/* "you are here" dot on the cache line */}
        {tokens > 0 && (
          <g>
            <circle cx={hereX} cy={hereY} r={4} fill={COLOR_CACHE}>
              <animate attributeName="r" values="4;5.5;4" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text
              x={hereX + (hereX > W - 120 ? -8 : 8)}
              y={hereY - 8}
              textAnchor={hereX > W - 120 ? "end" : "start"}
              fontSize={10}
              fill={COLOR_CACHE}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {tokens} tok · {cacheUnits} u
            </text>
          </g>
        )}

        {/* crossover fill hint: region where cache exceeds fixed state */}
        <rect
          x={x(crossoverToken)}
          y={PAD_T}
          width={Math.max(0, W - PAD_R - x(crossoverToken))}
          height={H - PAD_T - PAD_B}
          fill={COLOR_CACHE}
          opacity={0.05}
        />
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5" style={{ background: COLOR_SYNAPTIC }} />
          Synaptic state — 576 units, forever
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5" style={{ background: COLOR_CACHE }} />
          KV-cache — 4 units/token
        </span>
        <span className="ml-auto font-mono">
          {tokens < crossoverToken
            ? `cache (${cacheUnits}) still below fixed state (${SYNAPSE_UNITS})`
            : `cache (${cacheUnits}) has outgrown the fixed state`}
        </span>
      </div>
    </div>
  );
}
