// ============================================================
// STRATEGY ALIGNMENT - src/components/StrategyAlignment.jsx
// ============================================================
// Shows Vision 2030 strategic goals, their KPIs, linked
// projects, and overall strategic health scoring.
//
// PROPS:
// - projects: visible projects (filtered by role)
// - stratGoals: strategic goal definitions
// - lang: "en" or "ar"
// - translations: current language strings
// ============================================================

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";
const SC = { "On Track": "#2D9B9B", Delayed: "#FFB224", Critical: "#FF4D6A", Completed: "#00B4D8", "On Hold": "#8899AA" };

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

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1a1a]/95 border border-white/10 rounded-lg px-3.5 py-2.5 shadow-xl">
      <p className="text-[13px] font-bold m-0" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
      <p className="text-slate-300 text-xs mt-1 m-0">{payload[0].value}</p>
    </div>
  );
};

export default function StrategyAlignment({ projects, stratGoals, lang, translations: t }) {
  // ----- COMPUTED GOAL DATA -----
  const goalData = stratGoals.map(g => {
    const gProjs = projects.filter(p => p.goalId === g.id);
    const avgComp = gProjs.length ? Math.round(gProjs.reduce((s, p) => s + p.completion, 0) / gProjs.length) : 0;
    const kpiAvgPct = g.targets.length ? Math.round(g.actuals.reduce((s, v, i) => s + Math.min(100, (v / g.targets[i]) * 100), 0) / g.targets.length) : 0;
    const onTrackN = gProjs.filter(p => ["On Track", "Completed"].includes(p.status)).length;
    return { ...g, projects: gProjs, avgComp, kpiAvgPct, achievement: Math.round(avgComp * 0.5 + kpiAvgPct * 0.5), onTrack: onTrackN };
  });
  const overallHealth = goalData.length ? Math.round(goalData.reduce((s, g) => s + g.achievement, 0) / goalData.length) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-white text-xl font-bold mb-1">{t.stratAnalysis}</h2>
          <p className="text-slate-600 text-xs">{lang === "en" ? "Strategic goals, KPIs, and project alignment" : "الأهداف الاستراتيجية والمؤشرات والمشاريع المرتبطة"}</p>
        </div>
        <div className={`${cardClass} px-5 py-3 flex items-center gap-3`}>
          <span className="text-slate-600 text-[11px] font-semibold uppercase">{t.overallStratHealth}</span>
          <span className="text-3xl font-extrabold" style={{ color: overallHealth >= 75 ? "#2D9B9B" : overallHealth >= 50 ? "#FFB224" : "#FF4D6A" }}>{overallHealth}%</span>
        </div>
      </div>

      {/* Goal Cards */}
      {goalData.map(g => (
        <div key={g.id} className={`${cardClass} mb-4`} style={{ borderColor: `${g.color}22` }}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                <span className="text-[11px] font-bold uppercase" style={{ color: g.color }}>{g.id}</span>
              </div>
              <h3 className="text-white text-base font-bold mb-1">{lang === "en" ? g.name : g.nameAr}</h3>
              <div className="flex gap-4 mt-2">
                <span className="text-slate-600 text-[11px]">{g.projects.length} {t.linkedProjects}</span>
                <span className="text-slate-600 text-[11px]">{g.kpis.length} {t.linkedKPIs}</span>
              </div>
            </div>
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-extrabold" style={{ color: g.achievement >= 75 ? g.color : g.achievement >= 50 ? "#FFB224" : "#FF4D6A" }}>{g.achievement}%</div>
              <div className="text-[10px] text-slate-600">{t.goalAchievement}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="h-1.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${g.achievement}%`, background: g.color }} />
          </div>

          {/* KPIs grid */}
          <div className="mb-3.5">
            <div className="text-slate-600 text-[11px] font-semibold uppercase mb-2">{t.linkedKPIs}</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(g.kpis.length, 4)}, 1fr)` }}>
              {g.kpis.map((kpi, i) => {
                const pct = Math.min(100, Math.round((g.actuals[i] / g.targets[i]) * 100));
                const good = pct >= 80;
                return (
                  <div key={i} className="bg-black/20 rounded-lg p-2.5">
                    <div className="text-slate-500 text-[10px] mb-1">{lang === "en" ? kpi : g.kpisAr[i]}</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold" style={{ color: good ? "#2D9B9B" : "#FF4D6A" }}>
                        {g.actuals[i]}{typeof g.targets[i] === "number" && g.targets[i] < 10 ? "/5" : g.targets[i] > 50 ? "%" : ""}
                      </span>
                      <span className="text-[10px] text-slate-700">{t.target}: {g.targets[i]}</span>
                    </div>
                    <div className="h-[3px] bg-white/[0.06] rounded-sm mt-1.5 overflow-hidden">
                      <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: good ? "#2D9B9B" : "#FF4D6A" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Projects */}
          <div>
            <div className="text-slate-600 text-[11px] font-semibold uppercase mb-2">{t.linkedProjects}</div>
            {g.projects.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 px-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                <div className="flex-1">
                  <span className="text-white text-xs font-semibold">{lang === "en" ? p.name : p.nameAr}</span>
                  <span className="text-slate-700 text-[11px] ml-2">{p.id}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold mr-3" style={{ background: `${SC[p.status]}15`, color: SC[p.status] }}>{p.status}</span>
                <div className="flex items-center gap-1 min-w-[80px]">
                  <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.completion}%`, background: p.completion >= 70 ? "#2D9B9B" : p.completion >= 40 ? "#FFB224" : "#FF4D6A" }} />
                  </div>
                  <span className="text-slate-500 text-[10px] min-w-[28px]">{p.completion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-3.5 mt-4">
        {/* Goal Achievement Bar */}
        <div className={cardClass}>
          <h3 className="text-white text-[13px] font-semibold mb-3">{lang === "en" ? "Goal Achievement Comparison" : "مقارنة تحقيق الأهداف"}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={goalData.map(g => ({ name: g.id, achievement: g.achievement, projects: g.avgComp, kpis: g.kpiAvgPct, color: g.color }))} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5a7a8a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Legend verticalAlign="top" height={28} formatter={v => <span className="text-slate-500 text-[11px]">{v}</span>} />
              <Bar dataKey="achievement" name={lang === "en" ? "Overall" : "الإجمالي"} radius={[4, 4, 0, 0]} barSize={16}>
                {goalData.map((g, i) => <Cell key={i} fill={g.color} />)}
              </Bar>
              <Bar dataKey="projects" name={lang === "en" ? "Projects" : "المشاريع"} fill="#00B4D8" radius={[4, 4, 0, 0]} barSize={16} fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className={cardClass}>
          <h3 className="text-white text-[13px] font-semibold mb-2">{lang === "en" ? "Goal Performance Radar" : "رادار أداء الأهداف"}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={goalData.map(g => ({ goal: g.id, achievement: g.achievement, target: 75 }))}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="goal" tick={{ fill: "#8899aa", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#5a7a8a", fontSize: 9 }} />
              <Radar name={t.actual} dataKey="achievement" stroke="#2D9B9B" fill="#2D9B9B" fillOpacity={0.2} strokeWidth={2} />
              <Radar name={t.target} dataKey="target" stroke="#FFB224" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
