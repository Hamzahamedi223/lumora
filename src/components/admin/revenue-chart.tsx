"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type Point = { day: string; revenue: number; orders: number };

const dayLabel = (d: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

/** Single-series daily revenue bars with a hover tooltip and an accessible table fallback. */
export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 720;
  const H = 220;
  const pad = { l: 64, r: 8, t: 12, b: 24 };
  const max = Math.max(1, ...data.map((d) => d.revenue));
  // Round the axis max up to a "nice" value.
  const mag = 10 ** Math.floor(Math.log10(max));
  const niceMax = Math.ceil(max / mag / 2) * 2 * mag;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = innerW / data.length;
  const barW = Math.max(2, Math.min(22, step - 2));
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const labelEvery = Math.ceil(data.length / 6);
  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button type="button" onClick={() => setTable(!table)} className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">
          {table ? "Voir le graphique" : "Voir le tableau"}
        </button>
      </div>
      {table ? (
        <div className="max-h-64 overflow-y-auto text-sm">
          <table className="w-full">
            <thead className="text-xs text-subtle"><tr><th className="py-1 text-left">Jour</th><th className="text-right">Commandes</th><th className="text-right">Chiffre d&apos;affaires</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.day} className="border-t border-border"><td className="py-1.5">{dayLabel(d.day)}</td><td className="text-right tabular-nums">{d.orders}</td><td className="text-right tabular-nums">{formatPrice(d.revenue)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chiffre d'affaires par jour" onMouseLeave={() => setHover(null)}>
            {[0.5, 1].map((f) => (
              <g key={f}>
                <line x1={pad.l} x2={W - pad.r} y1={y(niceMax * f)} y2={y(niceMax * f)} stroke="var(--color-border)" strokeDasharray="2 4" />
                <text x={pad.l - 8} y={y(niceMax * f) + 3} textAnchor="end" className="fill-subtle text-[10px]">{formatPrice(niceMax * f)}</text>
              </g>
            ))}
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="var(--color-border-strong)" />
            {data.map((d, i) => {
              const x = pad.l + i * step + (step - barW) / 2;
              const top = y(d.revenue);
              const hgt = pad.t + innerH - top;
              const r = Math.min(4, barW / 2, hgt);
              return (
                <g key={d.day}>
                  {d.revenue > 0 ? (
                    <path
                      d={`M${x},${pad.t + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.t + innerH} Z`}
                      fill="var(--color-accent)"
                      opacity={hover == null || hover === i ? 1 : 0.45}
                    />
                  ) : null}
                  {/* Hit target larger than the mark */}
                  <rect x={pad.l + i * step} y={pad.t} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
                  {i % labelEvery === 0 ? <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-subtle text-[10px]">{dayLabel(d.day)}</text> : null}
                </g>
              );
            })}
          </svg>
          {h && hover != null ? (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-xl"
              style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%` }}
            >
              <p className="text-muted">{dayLabel(h.day)}</p>
              <p className="font-semibold tabular-nums">{formatPrice(h.revenue)}</p>
              <p className="text-muted tabular-nums">{h.orders} commande{h.orders > 1 ? "s" : ""}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
