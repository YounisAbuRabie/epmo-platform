// ============================================================
// REPORTS PAGE - src/components/Reports.jsx
// ============================================================
// Executive reports with copy-to-clipboard, AI-generated
// analysis via Claude API, and PPT download placeholder.
//
// PROPS:
// - projects: visible projects
// - lang: "en" or "ar"
// - translations: current language strings
// - currentUser: logged-in user
// ============================================================

import { useState } from "react";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";

export default function Reports({ projects, lang, translations: t, currentUser }) {
  const [tab, setTab] = useState("exec");
  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const totB = projects.reduce((s, p) => s + p.budget, 0);
  const totS = projects.reduce((s, p) => s + p.spent, 0);
  const nCrit = projects.filter(p => p.status === "Critical").length;
  const nDel = projects.filter(p => p.status === "Delayed").length;
  const avgC = projects.length ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length) : 0;
  const nOk = projects.filter(p => ["On Track", "Completed"].includes(p.status)).length;
  const hPct = projects.length ? Math.round((nOk / projects.length) * 100) : 0;

  // KPI averages
  const kAgg = projects.reduce((a, p) => {
    if (!p.kpis) return a;
    Object.keys(p.kpis).forEach(k => { if (!a[k]) a[k] = { s: 0, c: 0 }; a[k].s += p.kpis[k]; a[k].c++; });
    return a;
  }, {});
  const kAvg = Object.fromEntries(Object.entries(kAgg).map(([k, v]) => [k, Math.round((v.s / v.c) * 10) / 10]));

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(""), 2000); });
  };

  // ----- EXECUTIVE SUMMARY -----
  const genExecReport = () => {
    const d = new Date().toLocaleDateString(lang === "en" ? "en-US" : "ar-SA", { year: "numeric", month: "long", day: "numeric" });
    const onTrackPct = projects.length ? Math.round(projects.filter(p => p.status === "On Track").length / projects.length * 100) : 0;
    return lang === "en" ?
      `EXECUTIVE PORTFOLIO SUMMARY\n${d} | ${currentUser.name} | ${currentUser.title}\n${"─".repeat(50)}\n\nPORTFOLIO OVERVIEW\n• Total Projects: ${projects.length}\n• Total Budget: SAR ${(totB / 1e6).toFixed(1)}M | Spent: SAR ${(totS / 1e6).toFixed(1)}M (${Math.round(totS / totB * 100)}%)\n• Portfolio Health Score: ${hPct}% (Target: 80%)\n• Average Completion: ${avgC}%\n\nSTATUS BREAKDOWN\n• On Track: ${projects.filter(p => p.status === "On Track").length} (${onTrackPct}%)\n• Delayed: ${nDel} projects\n• Critical: ${nCrit} projects requiring immediate action\n• Completed: ${projects.filter(p => p.status === "Completed").length} projects\n\nCRITICAL PROJECTS\n${projects.filter(p => p.status === "Critical").map(p => `• ${p.name} (${p.dept})\n  Budget: SAR ${(p.budget / 1000).toFixed(0)}K | Spent: ${Math.round(p.spent / p.budget * 100)}% | Completion: ${p.completion}%`).join("\n")}\n\nKEY KPI PERFORMANCE\n• Budget Execution: ${kAvg.budgetExec}% (Target: 85%)\n• Milestone Achievement: ${kAvg.mileRate}% (Target: 85%)\n• Resource Utilization: ${kAvg.resUtil}% (Target: 80%)\n• Satisfaction: ${kAvg.satScore}/5.0 (Target: 4.0)\n\nRECOMMENDATIONS\n1. Immediate intervention for ${nCrit} critical projects\n2. Recovery plans for ${nDel} delayed projects\n3. Budget reallocation review for over-spent projects\n4. Portfolio health at ${hPct}% — ${hPct >= 80 ? "meeting target" : "below 80% target"}`
      :
      `ملخص المحفظة التنفيذي\n${d} | ${currentUser.nameAr} | ${currentUser.titleAr}\n${"─".repeat(50)}\n\nنظرة عامة على المحفظة\n• إجمالي المشاريع: ${projects.length}\n• الميزانية: ${(totB / 1e6).toFixed(1)} مليون ريال | المصروف: ${(totS / 1e6).toFixed(1)} مليون ريال\n• صحة المحفظة: ${hPct}%\n• متوسط الإنجاز: ${avgC}%\n\nالمشاريع الحرجة\n${projects.filter(p => p.status === "Critical").map(p => `• ${p.nameAr} - الإنجاز: ${p.completion}%`).join("\n")}`;
  };

  // ----- STATUS REPORT -----
  const genStatusReport = () => {
    const d = new Date().toLocaleDateString(lang === "en" ? "en-US" : "ar-SA", { year: "numeric", month: "long", day: "numeric" });
    const rows = projects.map(p =>
      `${p.id.padEnd(10)}${p.name.slice(0, 30).padEnd(32)}${p.status.padEnd(12)}${((p.budget / 1000).toFixed(0) + "K").padEnd(10)}${(p.completion + "%").padEnd(8)}${p.risk}`
    ).join("\n");
    return `PROJECT STATUS REPORT\n${d}\n${"─".repeat(90)}\n${"ID".padEnd(10)}${"Project".padEnd(32)}${"Status".padEnd(12)}${"Budget".padEnd(10)}${"Done".padEnd(8)}Risk\n${"─".repeat(90)}\n${rows}\n${"─".repeat(90)}\nTotal: ${projects.length} projects | Budget: SAR ${(totB / 1e6).toFixed(1)}M | Avg Completion: ${avgC}%`;
  };

  // ----- KPI REPORT -----
  const genKPIReport = () => {
    const kTgt = { budgetExec: 85, costVar: 5, roi: 15, compRate: 80, mileRate: 85, schedVar: 10, delivRate: 90, resUtil: 80, riskMit: 75, changeReq: 5, satScore: 4.0, escCount: 2 };
    const kNames = { budgetExec: t.budgetExec, costVar: t.costVar, roi: t.roi, compRate: t.compRate, mileRate: t.mileRate, schedVar: t.schedVar, delivRate: t.delivRate, resUtil: t.resUtil, riskMit: t.riskMit, changeReq: t.changeReq, satScore: t.satScore, escCount: t.escCount };
    const kUnits = { budgetExec: "%", costVar: "%", roi: "%", compRate: "%", mileRate: "%", schedVar: "d", delivRate: "%", resUtil: "%", riskMit: "%", changeReq: "", satScore: "/5", escCount: "" };
    const inv = k => ["costVar", "schedVar", "changeReq", "escCount"].includes(k);
    const lines = Object.entries(kNames).map(([k, nm]) => {
      const v = kAvg[k] || 0; const tg = kTgt[k]; const u = kUnits[k];
      const good = inv(k) ? v <= tg : v >= tg;
      return `${good ? "✓" : "✗"} ${nm}: ${v}${u} (Target: ${tg}${u}) ${good ? "- On Target" : "- BELOW TARGET"}`;
    }).join("\n");
    const onTarget = Object.keys(kNames).filter(k => { const v = kAvg[k] || 0; return inv(k) ? v <= kTgt[k] : v >= kTgt[k]; }).length;
    return `KPI PERFORMANCE REPORT\n${"─".repeat(60)}\nOverall: ${onTarget}/${Object.keys(kNames).length} KPIs on target\n\n${lines}`;
  };

  // ----- AI REPORT -----
  const genAIReport = async () => {
    setAiLoading(true); setAiReport("");
    const ctx = projects.map(p => `${p.id}|${p.name}|${p.dept}|${p.status}|Budget:SAR${p.budget}|Spent:SAR${p.spent}|${p.completion}%|Risk:${p.risk}`).join("\n");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are a senior portfolio analyst for a Saudi government EPMO steering committee. Be specific, data-driven, actionable. Respond in ${lang === "en" ? "English" : "Arabic"}.`,
          messages: [{ role: "user", content: `Write a strategic executive summary:\n\n${ctx}\n\nSummary: ${projects.length} projects, SAR ${(totB / 1e6).toFixed(1)}M budget, ${nCrit} critical, ${nDel} delayed, ${hPct}% health.\n\nInclude: 1) Overall assessment 2) Key risks 3) Top 3 recommendations 4) Projects requiring immediate decision.` }]
        })
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAiReport(data.content?.map(b => b.text || "").join("") || "Failed.");
    } catch { setAiReport(lang === "en" ? "AI generation failed. Try again." : "فشل الإنشاء. حاول مرة أخرى."); }
    finally { setAiLoading(false); }
  };

  const ReportBlock = ({ title, content, id }) => (
    <div className={`${cardClass} mb-3.5`}>
      <div className="flex justify-between items-center mb-3.5">
        <h3 className="text-white text-sm font-bold">{title}</h3>
        <button onClick={() => copyText(content, id)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${copied === id ? "bg-teal-500/20 border-teal-500/30 text-teal-400" : "bg-white/[0.05] border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
          {copied === id ? `✓ ${t.copied}` : t.copyReport}
        </button>
      </div>
      <pre className="bg-black/30 border border-white/[0.06] rounded-xl p-4 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto font-mono">{content}</pre>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
  <h2 className="text-white text-xl font-bold">{t.reports}</h2>
  <a href="/ARRC_EPMO_Portfolio_Report.pptx" download
    className="px-4 py-2 rounded-xl text-sm font-bold text-[#0a1a1a] no-underline"
    style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)" }}>
    ⬇ {lang === "en" ? "Download PPT Report" : "تحميل تقرير PPT"}
  </a>
</div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-5 bg-black/20 rounded-xl p-1 w-fit flex-wrap">
        {[
          { id: "exec", l: t.execSummary },
          { id: "status", l: t.portfolioStatus },
          { id: "kpi", l: t.kpiReport },
          { id: "ai", l: t.generateAI },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${tab === tb.id ? "bg-teal-500/15 text-teal-400" : "text-slate-600 hover:text-slate-400"}`}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab === "exec" && <ReportBlock title={t.execSummary} content={genExecReport()} id="exec" />}
      {tab === "status" && <ReportBlock title={t.portfolioStatus} content={genStatusReport()} id="status" />}
      {tab === "kpi" && <ReportBlock title={t.kpiReport} content={genKPIReport()} id="kpi" />}

      {tab === "ai" && (
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-3.5">
            <h3 className="text-white text-sm font-bold">{lang === "en" ? "AI-Generated Strategic Report" : "تقرير استراتيجي بالذكاء الاصطناعي"}</h3>
            <div className="flex gap-2">
              {aiReport && (
                <button onClick={() => copyText(aiReport, "ai")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${copied === "ai" ? "bg-teal-500/20 border-teal-500/30 text-teal-400" : "bg-white/[0.05] border-white/[0.08] text-slate-500"}`}>
                  {copied === "ai" ? `✓ ${t.copied}` : t.copyReport}
                </button>
              )}
              <button onClick={genAIReport} disabled={aiLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-[#0a1a1a]"
                style={{ background: aiLoading ? "rgba(0,229,160,0.2)" : "linear-gradient(135deg, #2D9B9B, #00B4D8)" }}>
                {aiLoading ? "..." : (aiReport ? (lang === "en" ? "Regenerate" : "إعادة إنشاء") : t.generateAI)}
              </button>
            </div>
          </div>

          {!aiReport && !aiLoading && (
            <div className="text-center py-10">
              <p className="text-slate-600 text-[13px] mb-4">{lang === "en" ? "Generate a strategic executive report using AI analysis of your portfolio data." : "إنشاء تقرير تنفيذي استراتيجي باستخدام تحليل الذكاء الاصطناعي."}</p>
              <button onClick={genAIReport} className="px-7 py-3 rounded-xl text-sm font-bold cursor-pointer text-[#0a1a1a]" style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)", boxShadow: "0 4px 20px rgba(0,229,160,0.3)" }}>
                {t.generateAI}
              </button>
            </div>
          )}

          {aiLoading && (
            <div className="text-center py-10">
              <div className="flex gap-1.5 justify-center mb-3">
                {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
              <p className="text-slate-600 text-[13px]">{lang === "en" ? "Analyzing portfolio data..." : "جاري تحليل البيانات..."}</p>
            </div>
          )}

          {aiReport && !aiLoading && (
            <pre className="bg-black/30 border border-white/[0.06] rounded-xl p-4 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto font-mono">{aiReport}</pre>
          )}
        </div>
      )}
    </div>
  );
}
