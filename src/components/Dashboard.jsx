// ============================================================
// DASHBOARD - src/components/Dashboard.jsx
// ============================================================
// ARRC-branded with teal (#2D9B9B) replacing emerald (#00E5A0)
// ============================================================

import { useState } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

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

// ARRC color maps — teal replaces emerald
const SC = { "On Track": "#2D9B9B", Delayed: "#FFB224", Critical: "#FF4D6A", Completed: "#00B4D8", "On Hold": "#8899AA" };
const RC = { High: "#FF4D6A", Medium: "#FFB224", Low: "#2D9B9B" };
const PC = { Critical: "#FF4D6A", High: "#FFB224", Medium: "#00B4D8", Low: "#8899AA" };

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";

function Donut({ title, data }) {
  return (
    <div className={cardClass}>
      <h3 className="text-white text-[13px] font-semibold mb-1">{title}</h3>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {data.map((s) => (
          <div key={s.name} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
            <span className="text-slate-500 text-[10px]">{s.name}: {s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ projects, stratGoals, lang, translations: t, currentUser }) {
  const [dTab, setDTab] = useState("overview");

  const totB = projects.reduce((s, p) => s + p.budget, 0);
  const totS = projects.reduce((s, p) => s + p.spent, 0);
  const nCrit = projects.filter((p) => p.status === "Critical").length;
  const nDel = projects.filter((p) => p.status === "Delayed").length;
  const avgC = projects.length ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length) : 0;
  const nOk = projects.filter((p) => ["On Track", "Completed"].includes(p.status)).length;
  const hPct = projects.length ? Math.round((nOk / projects.length) * 100) : 0;

  const mkPie = (key, colors) =>
    Object.entries(projects.reduce((a, p) => { a[p[key]] = (a[p[key]] || 0) + 1; return a; }, {}))
      .map(([n, v]) => ({ name: n, value: v, color: colors[n] }));

  const statusD = mkPie("status", SC);
  const riskD = mkPie("risk", RC);
  const prioD = mkPie("priority", PC);

  const deptBud = Object.entries(
    projects.reduce((a, p) => { if (!a[p.dept]) a[p.dept] = { b: 0, s: 0 }; a[p.dept].b += p.budget; a[p.dept].s += p.spent; return a; }, {})
  ).map(([n, v]) => ({
    name: n.length > 16 ? n.slice(0, 14) + ".." : n,
    full: n,
    budget: Math.round(v.b / 1000),
    spent: Math.round(v.s / 1000),
  })).sort((a, b) => b.budget - a.budget);

  const deptComp = Object.entries(
    projects.reduce((a, p) => { if (!a[p.dept]) a[p.dept] = { s: 0, c: 0 }; a[p.dept].s += p.completion; a[p.dept].c++; return a; }, {})
  ).map(([n, v]) => ({
    name: n.length > 16 ? n.slice(0, 14) + ".." : n,
    comp: Math.round(v.s / v.c),
  })).sort((a, b) => b.comp - a.comp);

  const healthD = [{ name: "H", value: hPct, fill: hPct >= 80 ? "#2D9B9B" : hPct >= 60 ? "#FFB224" : "#FF4D6A" }];

  const goalData = stratGoals.map((g) => {
    const gProjs = projects.filter((p) => p.goalId === g.id);
    const avgComp = gProjs.length ? Math.round(gProjs.reduce((s, p) => s + p.completion, 0) / gProjs.length) : 0;
    const kpiAvgPct = g.targets.length ? Math.round(g.actuals.reduce((s, v, i) => s + Math.min(100, (v / g.targets[i]) * 100), 0) / g.targets.length) : 0;
    const onTrackN = gProjs.filter((p) => ["On Track", "Completed"].includes(p.status)).length;
    return { ...g, projects: gProjs, avgComp, kpiAvgPct, achievement: Math.round(avgComp * 0.5 + kpiAvgPct * 0.5), onTrack: onTrackN };
  });

  const kpiCards = [
    { l: t.totalBudget, v: `${(totB / 1e6).toFixed(1)}${t.M}`, s: "SAR", c: "#2D9B9B" },
    { l: t.budgetUtilization, v: `${Math.round((totS / totB) * 100)}%`, s: `SAR ${(totS / 1e6).toFixed(1)}${t.M}`, c: totS / totB > 0.8 ? "#FFB224" : "#00B4D8" },
    { l: t.criticalProjects, v: nCrit, s: lang === "en" ? "Immediate action" : "إجراء فوري", c: "#FF4D6A" },
    { l: t.delayedProjects, v: nDel, s: lang === "en" ? "Recovery needed" : "يحتاج تعافي", c: "#FFB224" },
    { l: t.avgCompletion, v: `${avgC}%`, s: `${projects.length} ${lang === "en" ? "projects" : "مشروع"}`, c: "#00B4D8" },
    { l: t.portfolioHealth, v: `${hPct}%`, s: lang === "en" ? "Target: 80%" : "الهدف: 80%", c: hPct >= 80 ? "#2D9B9B" : hPct >= 60 ? "#FFB224" : "#FF4D6A" },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white text-[22px] font-bold mb-1">
          {t.welcomeBack}, {lang === "en" ? currentUser.name.split(" ")[0] : currentUser.nameAr.split(" ")[0]}
        </h2>
        <p className="text-slate-600 text-[13px]">{t.lastLogin}</p>
      </div>

      <div className="flex gap-1 mb-5 bg-black/20 rounded-xl p-1 w-fit">
        {["overview", "charts", "alerts"].map((tb) => (
          <button key={tb} onClick={() => setDTab(tb)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all
              ${dTab === tb ? "bg-teal-500/15 text-teal-400" : "text-slate-600 hover:text-slate-400"}`}>
            {t[tb]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {kpiCards.map((k, i) => (
          <div key={i} className={`${cardClass} relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: k.c }} />
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1.5 pl-2">{k.l}</div>
            <div className="text-2xl font-extrabold leading-none mb-1 pl-2" style={{ color: k.c }}>{k.v}</div>
            <div className="text-[11px] text-slate-600 pl-2">{k.s}</div>
          </div>
        ))}
      </div>

      {dTab === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3.5">
            <Donut title={t.projectStatus} data={statusD} />
            <Donut title={t.riskDistribution} data={riskD} />
            <Donut title={t.priorityDist} data={prioD} />
          </div>

          <div className={`${cardClass} mb-3.5`}>
            <h3 className="text-white text-[13px] font-semibold mb-2">{t.budgetVsSpent} (SAR {t.K})</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptBud} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#5a7a8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Legend verticalAlign="top" height={28} formatter={(v) => <span className="text-slate-500 text-[11px]">{v}</span>} />
                <Bar dataKey="budget" name={lang === "en" ? "Budget" : "الميزانية"} fill="#00B4D8" radius={[0, 4, 4, 0]} barSize={9} />
                <Bar dataKey="spent" name={lang === "en" ? "Spent" : "المصروف"} fill="#FFB224" radius={[0, 4, 4, 0]} barSize={9} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div className={cardClass}>
              <h3 className="text-white text-[13px] font-semibold mb-2">{t.completionByDept}</h3>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={deptComp} margin={{ left: 5, right: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#8899aa", fontSize: 9 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={45} />
                  <YAxis tick={{ fill: "#5a7a8a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="comp" name={lang === "en" ? "Completion" : "الإنجاز"} radius={[4, 4, 0, 0]} barSize={18}>
                    {deptComp.map((e, i) => <Cell key={i} fill={e.comp >= 70 ? "#2D9B9B" : e.comp >= 40 ? "#FFB224" : "#FF4D6A"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={`${cardClass} flex flex-col items-center justify-center`}>
              <h3 className="text-white text-[13px] font-semibold mb-1.5">{t.portfolioHealth}</h3>
              <ResponsiveContainer width={150} height={90}>
                <RadialBarChart cx="50%" cy="100%" innerRadius={45} outerRadius={72} startAngle={180} endAngle={0} barSize={11} data={healthD}>
                  <RadialBar background={{ fill: "rgba(255,255,255,0.06)" }} clockWise dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-[30px] font-extrabold -mt-2" style={{ color: healthD[0].fill }}>{hPct}%</div>
              <div className="text-[11px] text-slate-600">{lang === "en" ? "Target: 80%" : "الهدف: 80%"}</div>
            </div>
          </div>

          <div className={`${cardClass} mt-3.5`}>
            <h3 className="text-white text-[13px] font-semibold mb-3">
              {lang === "en" ? "Strategic Goal Alignment" : "توافق الأهداف الاستراتيجية"}
            </h3>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${goalData.length}, 1fr)` }}>
              {goalData.map((g) => (
                <div key={g.id} className="bg-black/20 rounded-lg p-2.5" style={{ borderLeft: `3px solid ${g.color}` }}>
                  <div className="text-[10px] font-bold mb-1" style={{ color: g.color }}>{g.id}</div>
                  <div className="text-slate-300 text-[11px] font-semibold mb-1.5 leading-tight">
                    {lang === "en" ? g.name.split("&")[0].trim() : g.nameAr.split("و")[0].trim()}
                  </div>
                  <div className="text-xl font-extrabold" style={{ color: g.achievement >= 75 ? g.color : g.achievement >= 50 ? "#FFB224" : "#FF4D6A" }}>
                    {g.achievement}%
                  </div>
                  <div className="h-[3px] bg-white/[0.06] rounded-sm mt-1 overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${g.achievement}%`, background: g.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {nCrit > 0 && (
            <div className="bg-red-500/[0.06] border border-red-500/15 rounded-xl p-4 mt-3.5">
              <h3 className="text-red-400 text-[13px] font-bold mb-2.5">
                {lang === "en" ? "Critical Projects Requiring Action" : "مشاريع حرجة تتطلب إجراء"}
              </h3>
              {projects.filter((p) => p.status === "Critical").map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b border-red-500/10">
                  <div>
                    <div className="text-white text-[13px] font-semibold">{lang === "en" ? p.name : p.nameAr}</div>
                    <div className="text-slate-600 text-[11px]">{lang === "en" ? p.dept : p.deptAr}</div>
                  </div>
                  <div className="text-red-400 text-sm font-bold">{p.completion}%</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {dTab === "charts" && (
        <div className="grid grid-cols-2 gap-3.5">
          {[{ title: t.projectStatus, d: statusD }, { title: t.riskDistribution, d: riskD }].map((ch, i) => (
            <div key={i} className={cardClass}>
              <h3 className="text-white text-[13px] font-semibold mb-2">{ch.title}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ch.d} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {ch.d.map((e, j) => <Cell key={j} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={30} formatter={(v) => <span className="text-slate-500 text-[11px]">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}

          <div className={`${cardClass} col-span-2`}>
            <h3 className="text-white text-[13px] font-semibold mb-3">
              {lang === "en" ? "Strategic Goal Achievement" : "تحقيق الأهداف الاستراتيجية"}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={goalData.map((g) => ({ name: lang === "en" ? g.name.split("&")[0].trim() : g.nameAr.split("و")[0].trim(), achievement: g.achievement, projects: g.avgComp, kpis: g.kpiAvgPct, color: g.color }))} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a7a8a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Legend verticalAlign="top" height={28} formatter={(v) => <span className="text-slate-500 text-[11px]">{v}</span>} />
                <Bar dataKey="achievement" name={lang === "en" ? "Overall" : "الإجمالي"} radius={[4, 4, 0, 0]} barSize={16}>
                  {goalData.map((g, i) => <Cell key={i} fill={g.color} />)}
                </Bar>
                <Bar dataKey="projects" name={lang === "en" ? "Projects" : "المشاريع"} fill="#00B4D8" radius={[4, 4, 0, 0]} barSize={16} fillOpacity={0.5} />
                <Bar dataKey="kpis" name={lang === "en" ? "KPIs" : "المؤشرات"} fill="#A78BFA" radius={[4, 4, 0, 0]} barSize={16} fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-2">
              {lang === "en" ? "Goal KPI Performance Radar" : "رادار أداء مؤشرات الأهداف"}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={goalData.map((g) => ({ goal: g.id, achievement: g.achievement, target: 75 }))}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="goal" tick={{ fill: "#8899aa", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#5a7a8a", fontSize: 9 }} />
                <Radar name={t.actual} dataKey="achievement" stroke="#2D9B9B" fill="#2D9B9B" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={t.target} dataKey="target" stroke="#FFB224" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className={cardClass}>
            <h3 className="text-white text-[13px] font-semibold mb-2">
              {lang === "en" ? "Projects per Strategic Goal" : "المشاريع لكل هدف استراتيجي"}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={goalData.map((g) => ({ name: g.id, value: g.projects.length, color: g.color }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {goalData.map((g, i) => <Cell key={i} fill={g.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" height={30} formatter={(v) => <span className="text-slate-500 text-[11px]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`${cardClass} col-span-2`}>
            <h3 className="text-white text-[13px] font-semibold mb-2">{t.departmentBudget} (SAR {t.K})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptBud} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#5a7a8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="budget" fill="#00B4D8" radius={[0, 4, 4, 0]} barSize={14}>
                  {deptBud.map((e, i) => <Cell key={i} fill={i === 0 ? "#2D9B9B" : i < 3 ? "#00B4D8" : "#1a3a5a"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {dTab === "alerts" && (
        <div>
          <div className={`${cardClass} mb-3.5`}>
            <h3 className="text-amber-400 text-[13px] font-bold mb-3">
              {lang === "en" ? "Budget Alerts (>80% spent)" : "تنبيهات الميزانية (>80%)"}
            </h3>
            {projects
              .filter((p) => p.spent / p.budget > 0.8 && p.status !== "Completed")
              .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
              .map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <div>
                    <div className="text-white text-[13px] font-semibold">{lang === "en" ? p.name : p.nameAr}</div>
                    <div className="text-slate-600 text-[11px]">{Math.round((p.spent / p.budget) * 100)}% {lang === "en" ? "used" : "مستخدم"}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold">
                    {Math.round((p.spent / p.budget) * 100)}%
                  </span>
                </div>
              ))}
          </div>

          <div className={cardClass}>
            <h3 className="text-red-400 text-[13px] font-bold mb-3">{t.topRisks}</h3>
            {projects
              .filter((p) => p.risk === "High" && p.status !== "Completed")
              .map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <div>
                    <div className="text-white text-[13px] font-semibold">{lang === "en" ? p.name : p.nameAr}</div>
                    <div className="text-slate-600 text-[11px]">{lang === "en" ? p.dept : p.deptAr}</div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-red-500/15 text-red-400 text-[11px] font-semibold">
                    {p.risk}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
