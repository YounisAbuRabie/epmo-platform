// ============================================================
// PROJECT LIST - src/components/ProjectList.jsx
// ============================================================
// Portfolio table with status filters and click-to-expand
// project detail view showing KPIs, budget burn, and timeline.
//
// PROPS:
// - projects: array of visible projects (filtered by role)
// - stratGoals: strategic goal definitions
// - lang: "en" or "ar"
// - translations: current language strings
// ============================================================

import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";
const SC = { "On Track": "#2D9B9B", Delayed: "#FFB224", Critical: "#FF4D6A", Completed: "#00B4D8", "On Hold": "#8899AA" };
const RC = { High: "#FF4D6A", Medium: "#FFB224", Low: "#2D9B9B" };
const PC = { Critical: "#FF4D6A", High: "#FFB224", Medium: "#00B4D8", Low: "#8899AA" };
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

// ----- PROJECT HEALTH SCORE -----
function calcHealth(p) {
  if (!p.kpis) return 50;
  const b = Math.min(100, p.kpis.budgetExec);
  const m = Math.min(100, p.kpis.mileRate);
  const r = Math.min(100, p.kpis.riskMit);
  const s = Math.min(100, p.kpis.satScore * 20);
  const penalty = Math.max(0, Math.min(30, p.kpis.schedVar));
  return Math.round((b * 0.25 + m * 0.25 + r * 0.2 + s * 0.15 + p.completion * 0.15) - penalty * 0.3);
}

// ============================================================
// PROJECT DETAIL VIEW
// ============================================================
function ProjectDetail({ project: p, stratGoals, lang, translations: t, onBack }) {
  const [tab, setTab] = useState("overview");
  const health = calcHealth(p);
  const budgetPct = Math.round(p.spent / p.budget * 100);
  const burnRate = p.completion > 0 ? Math.round(budgetPct / p.completion * 100) : 0;
  const goal = stratGoals.find(g => g.id === p.goalId);

  const kpiItems = p.kpis ? [
    { l: t.budgetExec, v: p.kpis.budgetExec, u: "%", tgt: 85, cat: "Financial", inv: false },
    { l: t.costVar, v: p.kpis.costVar, u: "%", tgt: 5, cat: "Financial", inv: true },
    { l: t.roi, v: p.kpis.roi, u: "%", tgt: 15, cat: "Financial", inv: false },
    { l: t.compRate, v: p.completion, u: "%", tgt: 80, cat: "Delivery", inv: false },
    { l: t.mileRate, v: p.kpis.mileRate, u: "%", tgt: 85, cat: "Delivery", inv: false },
    { l: t.schedVar, v: p.kpis.schedVar, u: "d", tgt: 10, cat: "Delivery", inv: true },
    { l: t.delivRate, v: p.kpis.delivRate, u: "%", tgt: 90, cat: "Delivery", inv: false },
    { l: t.resUtil, v: p.kpis.resUtil, u: "%", tgt: 80, cat: "Operational", inv: false },
    { l: t.riskMit, v: p.kpis.riskMit, u: "%", tgt: 75, cat: "Operational", inv: false },
    { l: t.changeReq, v: p.kpis.changeReq, u: "", tgt: 5, cat: "Operational", inv: true },
    { l: t.satScore, v: p.kpis.satScore, u: "/5", tgt: 4.0, cat: "Stakeholder", inv: false },
    { l: t.escCount, v: p.kpis.escCount, u: "", tgt: 2, cat: "Stakeholder", inv: true },
  ] : [];

  const radarKpis = kpiItems.filter(k => !k.inv).slice(0, 6).map(k => ({
    s: k.l.split(" ").slice(0, 2).join(" "),
    v: k.u === "%" ? k.v : k.v * 20,
    t: k.u === "%" ? k.tgt : k.tgt * 20,
  }));

  const phases = [
    { phase: lang === "en" ? "Initiation" : "البدء", pct: 100, color: "#2D9B9B" },
    { phase: lang === "en" ? "Planning" : "التخطيط", pct: 100, color: "#2D9B9B" },
    { phase: lang === "en" ? "Execution" : "التنفيذ", pct: Math.min(100, Math.max(0, Math.round((p.completion - 20) / 60 * 100))), color: p.completion >= 80 ? "#2D9B9B" : "#00B4D8" },
    { phase: lang === "en" ? "Testing & QA" : "الاختبار", pct: p.completion >= 80 ? Math.round((p.completion - 80) / 15 * 100) : 0, color: p.completion >= 95 ? "#2D9B9B" : p.completion >= 80 ? "#00B4D8" : "#5a7a8a" },
    { phase: lang === "en" ? "Closure" : "الإغلاق", pct: p.completion >= 95 ? Math.round((p.completion - 95) / 5 * 100) : 0, color: p.completion >= 100 ? "#2D9B9B" : p.completion >= 95 ? "#00B4D8" : "#5a7a8a" },
  ];

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 mb-5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-500 text-[13px] hover:bg-teal-500/[0.06] hover:text-teal-400 cursor-pointer transition-all">
        <span className="text-base">←</span>
        {lang === "en" ? "Back to Projects" : "العودة للمشاريع"}
      </button>

      {/* Header Card */}
      <div className={`${cardClass} mb-4`} style={{ borderColor: `${SC[p.status]}33` }}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="text-slate-600 text-xs font-semibold">{p.id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${SC[p.status]}18`, color: SC[p.status] }}>{p.status}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${PC[p.priority]}15`, color: PC[p.priority] }}>{p.priority}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${RC[p.risk]}12`, color: RC[p.risk] }}>{lang === "en" ? "Risk" : "خطر"}: {p.risk}</span>
            </div>
            <h2 className="text-white text-xl font-bold mb-1.5">{lang === "en" ? p.name : p.nameAr}</h2>
            <div className="flex gap-4 flex-wrap text-slate-500 text-xs">
              <span>{lang === "en" ? p.dept : p.deptAr}</span>
              <span>{t.owner}: {p.owner}</span>
              {goal && <span style={{ color: goal.color }}>{goal.id}: {lang === "en" ? goal.name.split("&")[0].trim() : goal.nameAr.split("و")[0].trim()}</span>}
            </div>
          </div>
          <div className="flex gap-5 items-center">
            <div className="text-center">
              <div className="text-3xl font-extrabold" style={{ color: health >= 70 ? "#2D9B9B" : health >= 50 ? "#FFB224" : "#FF4D6A" }}>{health}%</div>
              <div className="text-[10px] text-slate-600">{lang === "en" ? "Health Score" : "مؤشر الصحة"}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold" style={{ color: p.completion >= 70 ? "#2D9B9B" : p.completion >= 40 ? "#FFB224" : "#FF4D6A" }}>{p.completion}%</div>
              <div className="text-[10px] text-slate-600">{t.completion}</div>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full mt-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.completion}%`, background: p.completion >= 70 ? "#2D9B9B" : p.completion >= 40 ? "#FFB224" : "#FF4D6A" }} />
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex gap-1 mb-5 bg-black/20 rounded-xl p-1 w-fit">
        {[
          { id: "overview", l: lang === "en" ? "Overview" : "نظرة عامة" },
          { id: "kpis", l: lang === "en" ? "All KPIs" : "كل المؤشرات" },
          { id: "budget", l: lang === "en" ? "Budget Burn" : "استهلاك الميزانية" },
          { id: "timeline", l: lang === "en" ? "Timeline" : "الجدول الزمني" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${tab === tb.id ? "bg-teal-500/15 text-teal-400" : "text-slate-600 hover:text-slate-400"}`}>
            {tb.l}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3.5">
          {/* Budget summary */}
          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-3.5">{t.budget}</h3>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              {[
                { l: lang === "en" ? "Budget" : "الميزانية", v: `SAR ${(p.budget / 1000).toFixed(0)}K`, c: "#00B4D8" },
                { l: lang === "en" ? "Spent" : "المصروف", v: `SAR ${(p.spent / 1000).toFixed(0)}K`, c: budgetPct > 90 ? "#FF4D6A" : "#FFB224" },
                { l: lang === "en" ? "Remaining" : "المتبقي", v: `SAR ${((p.budget - p.spent) / 1000).toFixed(0)}K`, c: "#2D9B9B" },
              ].map(b => (
                <div key={b.l} className="bg-black/20 rounded-lg p-2.5">
                  <div className="text-slate-600 text-[10px] mb-1">{b.l}</div>
                  <div className="text-lg font-extrabold" style={{ color: b.c }}>{b.v}</div>
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/[0.06] rounded relative overflow-hidden">
              <div className="h-full rounded" style={{ width: `${budgetPct}%`, background: budgetPct > 90 ? "#FF4D6A" : budgetPct > 75 ? "#FFB224" : "#2D9B9B" }} />
              <div className="absolute top-[-2px] w-0.5 h-3 bg-white rounded-full" style={{ left: `${p.completion}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-slate-600 text-[10px]">
              <span>{budgetPct}% {lang === "en" ? "spent" : "مصروف"}</span>
              <span>{lang === "en" ? "Burn rate" : "معدل الاستهلاك"}: {burnRate}%</span>
            </div>
          </div>

          {/* KPI Radar */}
          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-2">{t.kpiRadar}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarKpis}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="s" tick={{ fill: "#8899aa", fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#5a7a8a", fontSize: 9 }} />
                <Radar name={t.actual} dataKey="v" stroke="#2D9B9B" fill="#2D9B9B" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={t.target} dataKey="t" stroke="#FFB224" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 6 KPIs */}
          <div className={`${cardClass} col-span-2`}>
            <h3 className="text-white text-[13px] font-semibold mb-3">{lang === "en" ? "Key Performance Indicators" : "المؤشرات الرئيسية"}</h3>
            <div className="grid grid-cols-6 gap-2">
              {kpiItems.slice(0, 6).map(k => {
                const good = k.inv ? k.v <= k.tgt : k.v >= k.tgt;
                return (
                  <div key={k.l} className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-[9px] font-semibold uppercase mb-1" style={{ color: CC[k.cat] }}>{k.cat}</div>
                    <div className="text-slate-300 text-[11px] mb-1.5">{k.l}</div>
                    <div className="text-lg font-extrabold" style={{ color: good ? "#2D9B9B" : "#FF4D6A" }}>{k.v}{k.u}</div>
                    <div className="text-[10px] text-slate-700">{t.target}: {k.tgt}{k.u}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== ALL KPIs TAB ===== */}
      {tab === "kpis" && (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiItems.map(k => {
            const good = k.inv ? k.v <= k.tgt : k.v >= k.tgt;
            const pct = k.inv ? Math.max(0, Math.min(100, 100 - ((k.v / Math.max(k.tgt, 1)) * 100))) : Math.min(100, (k.v / Math.max(k.tgt, 1)) * 100);
            return (
              <div key={k.l} className={`${cardClass} p-3.5`}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase" style={{ color: CC[k.cat] }}>{k.cat}</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: good ? "#2D9B9B" : "#FF4D6A" }} />
                </div>
                <div className="text-slate-300 text-[13px] font-semibold mb-2">{k.l}</div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[22px] font-extrabold" style={{ color: good ? "#2D9B9B" : "#FF4D6A" }}>{k.v}{k.u}</span>
                  <span className="text-[11px] text-slate-600">{t.target}: {k.tgt}{k.u}</span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: good ? "#2D9B9B" : "#FF4D6A" }} />
                </div>
                <div className="mt-2 text-[10px]" style={{ color: good ? "#3a7a5a" : "#7a3a3a" }}>
                  {good ? (lang === "en" ? "On target" : "على المستهدف") : (lang === "en" ? "Below target" : "أقل من المستهدف")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== BUDGET BURN TAB ===== */}
      {tab === "budget" && (
        <div className="grid grid-cols-2 gap-3.5">
          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-3.5">{lang === "en" ? "Budget Consumption" : "استهلاك الميزانية"}</h3>
            <div className="flex flex-col gap-3">
              {[
                { l: lang === "en" ? "Total Budget" : "الميزانية الكلية", v: p.budget, c: "#00B4D8" },
                { l: lang === "en" ? "Amount Spent" : "المبلغ المصروف", v: p.spent, c: "#FFB224" },
                { l: lang === "en" ? "Remaining" : "المتبقي", v: p.budget - p.spent, c: "#2D9B9B" },
                { l: lang === "en" ? "Cost Variance" : "انحراف التكلفة", v: p.kpis?.costVar || 0, c: (p.kpis?.costVar || 0) > 5 ? "#FF4D6A" : "#2D9B9B", pct: true },
              ].map(item => (
                <div key={item.l} className="flex justify-between items-center px-3.5 py-2.5 bg-black/20 rounded-lg" style={{ borderLeft: `3px solid ${item.c}` }}>
                  <span className="text-slate-500 text-xs">{item.l}</span>
                  <span className="text-base font-bold" style={{ color: item.c }}>{item.pct ? `${item.v}%` : `SAR ${(item.v / 1000).toFixed(0)}K`}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-3.5">{lang === "en" ? "Burn Rate" : "معدل الاستهلاك"}</h3>
            <div className="text-center py-5">
              <div className="text-5xl font-extrabold" style={{ color: burnRate > 120 ? "#FF4D6A" : burnRate > 100 ? "#FFB224" : "#2D9B9B" }}>{burnRate}%</div>
              <div className="text-slate-600 text-xs mt-1">{lang === "en" ? "Budget-to-completion ratio" : "نسبة الميزانية للإنجاز"}</div>
              <div className="mt-4 px-4 py-3 rounded-lg text-xs" style={{
                background: burnRate > 120 ? "rgba(255,77,106,0.1)" : burnRate > 100 ? "rgba(255,178,36,0.1)" : "rgba(0,229,160,0.1)",
                color: burnRate > 120 ? "#FF4D6A" : burnRate > 100 ? "#FFB224" : "#2D9B9B"
              }}>
                {burnRate > 120 ? (lang === "en" ? "Severe overspend — budget will exhaust before completion" : "إفراط شديد في الإنفاق")
                  : burnRate > 100 ? (lang === "en" ? "Slight overspend — monitor closely" : "إنفاق زائد طفيف — يحتاج مراقبة")
                    : (lang === "en" ? "Healthy burn rate — on budget" : "معدل استهلاك صحي — ضمن الميزانية")}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={[{ name: lang === "en" ? "Budget" : "ميزانية", spent: budgetPct, completion: p.completion }]} margin={{ left: 0, right: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="spent" name={lang === "en" ? "Spent %" : "المصروف %"} fill="#FFB224" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="completion" name={lang === "en" ? "Completion %" : "الإنجاز %"} fill="#2D9B9B" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== TIMELINE TAB ===== */}
      {tab === "timeline" && (
        <div className={cardClass}>
          <h3 className="text-white text-[13px] font-semibold mb-3.5">{lang === "en" ? "Project Timeline & Milestones" : "الجدول الزمني والمراحل"}</h3>
          <div className="relative pl-6">
            <div className="absolute left-[10px] top-0 bottom-0 w-0.5 bg-white/[0.08]" />
            {phases.map((m, i) => {
              const status = m.pct >= 100 ? (lang === "en" ? "Completed" : "مكتمل") : m.pct > 0 ? (lang === "en" ? "In Progress" : "قيد التنفيذ") : (lang === "en" ? "Pending" : "معلق");
              return (
                <div key={i} className="flex items-start gap-3.5 mb-5 relative">
                  <div className="absolute left-[-16px] top-0.5 w-3 h-3 rounded-full z-10 border-2"
                    style={{ background: m.pct >= 100 ? m.color : m.pct > 0 ? "#00B4D8" : "rgba(255,255,255,0.1)", borderColor: m.pct >= 100 ? m.color : m.pct > 0 ? "#00B4D8" : "rgba(255,255,255,0.1)" }} />
                  <div className="flex-1 bg-black/20 rounded-lg p-3" style={{ borderLeft: `3px solid ${m.color}` }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white text-[13px] font-semibold">{m.phase}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${m.color}18`, color: m.color }}>{status}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, m.pct)}%`, background: m.color }} />
                    </div>
                    <div className="text-slate-600 text-[10px] mt-1">{Math.max(0, m.pct)}% {lang === "en" ? "complete" : "مكتمل"}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {p.kpis?.schedVar > 0 && (
            <div className="mt-3 px-4 py-3 bg-amber-500/[0.08] border border-amber-500/15 rounded-lg">
              <span className="text-amber-400 text-xs font-semibold">{t.schedVar}: +{p.kpis.schedVar} {lang === "en" ? "days behind schedule" : "يوم تأخير"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PROJECT LIST COMPONENT
// ============================================================
export default function ProjectList({ projects, stratGoals, lang, translations: t }) {
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = filter === "All" ? projects : projects.filter(p => p.status === filter);
  const selectedProject = selectedId ? projects.find(p => p.id === selectedId) : null;

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} stratGoals={stratGoals} lang={lang} translations={t} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h2 className="text-white text-xl font-bold">{t.projectList} ({filtered.length})</h2>
        <div className="flex gap-1 flex-wrap">
          {["All", "On Track", "Delayed", "Critical", "Completed"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all
                ${filter === s
                  ? s === "All" ? "bg-teal-500/15 text-teal-400" : `text-white`
                  : "border border-white/[0.08] text-slate-600 hover:text-slate-400"}`}
              style={filter === s && s !== "All" ? { background: `${SC[s]}18`, color: SC[s] } : {}}>
              {s === "All" ? t.all : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} p-0 overflow-hidden`}>
        <div className="grid gap-2" style={{ gridTemplateColumns: "2fr 1.2fr 0.7fr 0.8fr 0.8fr 0.5fr", padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[t.project, t.department, t.status, t.budget, t.completion, t.risk].map(h => (
            <div key={h} className="text-slate-600 text-[11px] font-bold uppercase">{h}</div>
          ))}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelectedId(p.id)}
              className="grid gap-2 px-4 py-2.5 border-b border-white/[0.03] cursor-pointer hover:bg-teal-500/[0.04] transition-all"
              style={{ gridTemplateColumns: "2fr 1.2fr 0.7fr 0.8fr 0.8fr 0.5fr" }}>
              <div>
                <div className="text-white text-[13px] font-semibold">{lang === "en" ? p.name : p.nameAr}</div>
                <div className="text-slate-700 text-[11px]">{p.id}</div>
              </div>
              <div className="text-slate-500 text-xs flex items-center">{lang === "en" ? p.dept : p.deptAr}</div>
              <div className="flex items-center">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${SC[p.status]}15`, color: SC[p.status] }}>{p.status}</span>
              </div>
              <div className="text-slate-500 text-xs flex items-center">{(p.budget / 1000).toFixed(0)}K</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.completion}%`, background: p.completion >= 70 ? "#2D9B9B" : p.completion >= 40 ? "#FFB224" : "#FF4D6A" }} />
                </div>
                <span className="text-slate-500 text-[11px] font-semibold min-w-[28px]">{p.completion}%</span>
              </div>
              <div className="flex items-center">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold" style={{ background: `${RC[p.risk]}12`, color: RC[p.risk] }}>{p.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
