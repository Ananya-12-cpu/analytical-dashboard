// Dependency-free SVG charts (server components).

export const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

export function AreaChart({
  data,
  color = "#6366f1",
  label,
  prefix = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  label: string;
  prefix?: string;
}) {
  const W = 600, H = 240, P = { t: 16, r: 16, b: 28, l: 48 };
  if (data.length === 0) return <p className="py-10 text-center text-sm text-zinc-500">No data in this range</p>;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const x = (i: number) => (data.length === 1 ? (W + P.l - P.r) / 2 : P.l + (i * (W - P.l - P.r)) / (data.length - 1));
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const step = Math.ceil(data.length / 8); // thin x labels
  const dots = data.length <= 45;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-zinc-200 dark:stroke-zinc-800" />
          <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="fill-zinc-500 text-[10px]">
            {prefix}{compact(t)}
          </text>
        </g>
      ))}
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label + i}>
          {(dots || data.length === 1) && <circle cx={x(i)} cy={y(d.value)} r={3} fill={color} />}
          {/* wide invisible hit target for the native tooltip */}
          <rect x={x(i) - 6} y={P.t} width={12} height={H - P.t - P.b} fill="transparent">
            <title>{`${d.label}: ${prefix}${d.value.toLocaleString("en-US")}`}</title>
          </rect>
          {i % step === 0 && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-zinc-500 text-[10px]">
              {d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="space-y-3" aria-label="Revenue by category">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{d.label}</span>
            <span className="font-medium tabular-nums">
              ${d.value.toLocaleString("en-US")}{" "}
              <span className="text-xs font-normal text-zinc-500">{((d.value / total) * 100).toFixed(0)}%</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
