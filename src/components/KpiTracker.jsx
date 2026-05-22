// ============================================================
// KPI TRACKER - src/components/KpiTracker.jsx
// ============================================================
// Shows all 12 project KPIs aggregated across the portfolio,
// with category filters, radar chart, and detail cards.
//
// PROPS:
// - projects: visible projects (filtered by role)
// - lang: "en" or "ar"
// - translations: current language strings
// ============================================================

import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";
const CC = { Financial: "#2D9B9B", Delivery: "#00B4D8", Operational: "#FFB224", Stakeholder: "#A78BFA" };

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1a1a]/95 border border-white/10 rounded-lg px-3.5 py-2.5 shadow-xl">
      {label && <p className="text-slate-500 text-[11px] font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold my-0.5" style={{ color: p.color || "#2D9B9B" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// KPI definitions
const kpiDefs = (t) => ({
  budgetExec: { name: t.budgetExec, tgt: 85, unit: "%", cat: "Financial", inv: false },
  costVar: { name: t.costVar, tgt: 5, unit: "%", cat: "Financial", inv: true },
  roi: { name: t.roi, tgt: 15, unit: "%", cat: "Financial", inv: false },
  compRate: { name: t.compRate, tgt: 80, unit: "%", cat: "Delivery", inv: false },
  mileRate: { name: t.mileRate, tgt: 85, unit: "%", cat: "Delivery", inv: false },
  schedVar: { name: t.schedVar, tgt: 10, unit: "d", cat: "Delivery", inv: true },
  delivRate: { name: t.delivRate, tgt: 90, unit: "%", cat: "Delivery", inv: false },
  resUtil: { name: t.resUtil, tgt: 80, unit: "%", cat: "Operational", inv: false },
  riskMit: { name: t.riskMit, tgt: 75, unit: "%", cat: "Operational", inv: false },
  changeReq: { name: t.changeReq, tgt: 5, unit: "", cat: "Operational", inv: true },
  satScore: { name: t.satScore, tgt: 4.0, unit: "/5", cat: "Stakeholder", inv: false },
  escCount: { name: t.escCount, tgt: 2, unit: "", cat: "Stakeholder", inv: true },
});

export default function KpiTracker({ projects, lang, translations: t }) {
  const [cat, setCat] = useState("All");
  const defs = kpiDefs(t);

  // Aggregate KPI averages across portfolio
  const kAgg = projects.reduce((a, p) => {
    if (!p.kpis) return a;
    Object.keys(p.kpis).forEach(k => { if (!a[k]) a[k] = { s: 0, c: 0 }; a[k].s += p.kpis[k]; a[k].c++; });
    return a;
  }, {});
  const kAvg = Object.fromEntries(Object.entries(kAgg).map(([k, v]) => [k, Math.round((v.s / v.c) * 10) / 10]));

  // Filter by category
  const filtered = Object.entries(defs).filter(([, d]) => cat === "All" || d.cat === cat);

  // Radar data (non-inverted KPIs only)
  const radarD = Object.entries(defs)
    .filter(([, d]) => !d.inv)
    .slice(0, 6)
    .map(([k, d]) => ({
      s: d.name.split(" ").slice(0, 2).join(" "),
      v: d.unit === "/5" ? (kAvg[k] || 0) * 20 : (kAvg[k] || 0),
      t: d.unit === "/5" ? d.tgt * 20 : d.tgt,
    }));

  // Category summary
  const catSummary = Object.entries(CC).map(([catName, col]) => {
    const ks = Object.entries(defs).filter(([, d]) => d.cat === catName);
    const onTarget = ks.filter(([k, d]) => {
      const v = kAvg[k] || 0;
      return d.inv ? v <= d.tgt : v >= d.tgt;
    }).length;
    return { cat: catName, col, total: ks.length, onTarget };
  });

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-5">{t.kpiOverview}</h2>

      {/* Category Filters */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {["All", "Financial", "Delivery", "Operational", "Stakeholder"].map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all
              ${cat === c
                ? c === "All" ? "bg-teal-500/15 text-teal-400" : `text-white`
                : "border border-white/[0.08] text-slate-600 hover:text-slate-400"}`}
            style={cat === c && c !== "All" ? { background: `${CC[c]}22`, color: CC[c] } : {}}>
            {c === "All" ? t.all : (t[c.toLowerCase()] || c)}
          </button>
        ))}
      </div>

      {/* Radar + Category Summary */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <div className={cardClass}>
          <h3 className="text-white text-[13px] font-semibold mb-2">{t.kpiRadar}</h3>
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={radarD}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: "#8899aa", fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#5a7a8a", fontSize: 9 }} />
              <Radar name={t.actual} dataKey="v" stroke="#2D9B9B" fill="#2D9B9B" fillOpacity={0.2} strokeWidth={2} />
              <Radar name={t.target} dataKey="t" stroke="#FFB224" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {catSummary.map(cs => (
            <div key={cs.cat} className={`${cardClass} p-3.5`} style={{ borderColor: `${cs.col}22` }}>
              <div className="text-[11px] text-slate-600 font-semibold uppercase mb-2">{t[cs.cat.toLowerCase()] || cs.cat}</div>
              <div className="text-3xl font-extrabold mb-1" style={{ color: cs.col }}>{cs.onTarget}/{cs.total}</div>
              <div className="text-[11px] text-slate-700">{lang === "en" ? "on target" : "على المستهدف"}</div>
              <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(cs.onTarget / cs.total) * 100}%`, background: cs.col }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Detail Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {filtered.map(([key, def]) => {
          const v = kAvg[key] || 0;
          const good = def.inv ? v <= def.tgt : v >= def.tgt;
          const pct = def.inv
            ? Math.max(0, Math.min(100, 100 - ((v / Math.max(def.tgt, 1)) * 100)))
            : Math.min(100, (v / Math.max(def.tgt, 1)) * 100);
          return (
            <div key={key} className={`${cardClass} p-3.5`}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase" style={{ color: CC[def.cat] }}>{t[def.cat.toLowerCase()] || def.cat}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: good ? "#2D9B9B" : "#FF4D6A" }} />
              </div>
              <div className="text-slate-300 text-[13px] font-semibold mb-2">{def.name}</div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[22px] font-extrabold" style={{ color: good ? "#2D9B9B" : "#FF4D6A" }}>{v}{def.unit}</span>
                <span className="text-[11px] text-slate-600">{t.target}: {def.tgt}{def.unit}</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: good ? "#2D9B9B" : "#FF4D6A" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
