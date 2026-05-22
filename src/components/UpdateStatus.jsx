// ============================================================
// UPDATE STATUS - src/components/UpdateStatus.jsx
// ============================================================
// Form for project managers to update project status, KPIs,
// and risk assessments. Updates propagate to all other views.
//
// PROPS:
// - projects: visible projects
// - onUpdate: callback(projectId, updates) to update project data
// - lang: "en" or "ar"
// - translations: current language strings
// ============================================================

import { useState } from "react";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";
const SC = { "On Track": "#2D9B9B", Delayed: "#FFB224", Critical: "#FF4D6A", Completed: "#00B4D8", "On Hold": "#8899AA" };
const inputClass = "w-full px-3.5 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-teal-500/30 transition-all";
const labelClass = "block text-slate-500 text-[11px] font-semibold mb-2 uppercase tracking-wide";

export default function UpdateStatus({ projects, onUpdate, lang, translations: t }) {
  const [selProj, setSelProj] = useState("");
  const [form, setForm] = useState({
    status: "On Track", completion: 50, risk: "Low", notes: "",
    kBudgetExec: 85, kMileRate: 85, kResUtil: 80, kSatScore: 4.0,
    kRiskLevel: "Low", kRiskDesc: "",
  });
  const [success, setSuccess] = useState(false);

  const selP = selProj ? projects.find(p => p.id === selProj) : null;

  const handleSelect = (id) => {
    setSelProj(id);
    const p = projects.find(pr => pr.id === id);
    if (p) {
      setForm({
        status: p.status, completion: p.completion, risk: p.risk, notes: "",
        kBudgetExec: p.kpis?.budgetExec || 85, kMileRate: p.kpis?.mileRate || 85,
        kResUtil: p.kpis?.resUtil || 80, kSatScore: p.kpis?.satScore || 4.0,
        kRiskLevel: p.risk, kRiskDesc: "",
      });
    }
  };

  const handleSubmit = () => {
    if (!selProj) return;
    onUpdate(selProj, {
      status: form.status,
      completion: form.completion,
      risk: form.kRiskLevel,
      kpis: {
        budgetExec: form.kBudgetExec,
        mileRate: form.kMileRate,
        resUtil: form.kResUtil,
        satScore: form.kSatScore,
      },
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setSelProj("");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-white text-xl font-bold mb-5">{t.updateStatus}</h2>

      {/* Success message */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400 text-sm font-semibold">
          ✓ {t.updateSuccess}
        </div>
      )}

      {/* Project Selection */}
      <div className={cardClass}>
        <label className={labelClass}>{t.selectProject}</label>
        <select value={selProj} onChange={e => handleSelect(e.target.value)}
          className={inputClass} style={{ boxSizing: "border-box" }}>
          <option value="" style={{ background: "#1a2332" }}>{t.selectProject}...</option>
          {projects.map(p => <option key={p.id} value={p.id} style={{ background: "#1a2332" }}>{lang === "en" ? p.name : p.nameAr}</option>)}
        </select>

        {selP && (
          <div className="flex gap-4 mt-3 px-3.5 py-2.5 bg-teal-500/[0.06] rounded-lg flex-wrap">
            <span className="text-slate-500 text-[11px]">{selP.dept}</span>
            <span className="text-[11px] font-bold" style={{ color: SC[selP.status] }}>{selP.status}</span>
            <span className="text-slate-500 text-[11px]">SAR {(selP.budget / 1000).toFixed(0)}K</span>
            <span className="text-slate-500 text-[11px]">{selP.completion}% {lang === "en" ? "complete" : "مكتمل"}</span>
          </div>
        )}
      </div>

      {selProj && (
        <>
          {/* Project Status */}
          <div className={`${cardClass} mt-3`}>
            <h3 className="text-teal-400 text-[13px] font-bold uppercase mb-3.5">{lang === "en" ? "Project Status" : "حالة المشروع"}</h3>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>{t.newStatus}</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  {["On Track", "Delayed", "Critical", "On Hold", "Completed"].map(s =>
                    <option key={s} value={s} style={{ background: "#1a2332" }}>{s}</option>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.completionPct}: <span className="text-teal-400">{form.completion}%</span></label>
                <input type="range" min={0} max={100} value={form.completion} onChange={e => setForm({ ...form, completion: parseInt(e.target.value) })}
                  className="w-full mt-2" style={{ accentColor: "#2D9B9B" }} />
              </div>
            </div>
          </div>

          {/* KPI Actuals */}
          <div className={`${cardClass} mt-3`}>
            <h3 className="text-cyan-400 text-[13px] font-bold uppercase mb-3.5">{lang === "en" ? "KPI Actuals Update" : "تحديث المؤشرات الفعلية"}</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { l: t.budgetExec, k: "kBudgetExec", max: 100, unit: "%", tgt: 85 },
                { l: t.mileRate, k: "kMileRate", max: 100, unit: "%", tgt: 85 },
                { l: t.resUtil, k: "kResUtil", max: 100, unit: "%", tgt: 80 },
                { l: t.satScore, k: "kSatScore", max: 5, unit: "/5", tgt: 4.0, step: 0.1 },
              ].map(f => (
                <div key={f.k}>
                  <label className={labelClass}>
                    {f.l}: <span style={{ color: (f.unit === "/5" ? form[f.k] >= f.tgt : form[f.k] >= f.tgt) ? "#2D9B9B" : "#FF4D6A" }}>
                      {f.unit === "/5" ? form[f.k].toFixed(1) : form[f.k]}{f.unit}
                    </span>
                    <span className="text-slate-700 text-[10px] ml-1">({t.target}: {f.tgt}{f.unit})</span>
                  </label>
                  <input type="range" min={0} max={f.max} step={f.step || 1} value={form[f.k]}
                    onChange={e => setForm({ ...form, [f.k]: parseFloat(e.target.value) })}
                    className="w-full" style={{ accentColor: form[f.k] >= f.tgt ? "#2D9B9B" : "#FF4D6A" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`${cardClass} mt-3`}>
            <h3 className="text-amber-400 text-[13px] font-bold uppercase mb-3.5">{lang === "en" ? "Risk Assessment" : "تقييم المخاطر"}</h3>
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label className={labelClass}>{lang === "en" ? "Risk Level" : "مستوى المخاطر"}</label>
                <select value={form.kRiskLevel} onChange={e => setForm({ ...form, kRiskLevel: e.target.value })} className={inputClass}>
                  {["Low", "Medium", "High"].map(r => <option key={r} value={r} style={{ background: "#1a2332" }}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                {["Low", "Medium", "High"].map(r => (
                  <div key={r} className="flex-1 h-1.5 rounded-full transition-all" style={{
                    background: form.kRiskLevel === r ? (r === "High" ? "#FF4D6A" : r === "Medium" ? "#FFB224" : "#2D9B9B") : "rgba(255,255,255,0.06)"
                  }} />
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{lang === "en" ? "Risk Description / Mitigation" : "وصف المخاطر / خطة المعالجة"}</label>
              <textarea value={form.kRiskDesc} onChange={e => setForm({ ...form, kRiskDesc: e.target.value })}
                placeholder={lang === "en" ? "Describe key risks and mitigation actions..." : "وصف المخاطر الرئيسية وإجراءات المعالجة..."}
                rows={2} className={`${inputClass} resize-y font-[inherit]`} style={{ boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Notes + Submit */}
          <div className={`${cardClass} mt-3`}>
            <div className="mb-4">
              <label className={labelClass}>{t.notes}</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder={lang === "en" ? "General update notes, blockers, decisions needed..." : "ملاحظات عامة، معوقات، قرارات مطلوبة..."}
                rows={2} className={`${inputClass} resize-y font-[inherit]`} style={{ boxSizing: "border-box" }} />
            </div>
            <button onClick={handleSubmit}
              className="w-full py-3.5 rounded-xl text-[#0a1a1a] text-[15px] font-bold cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)", boxShadow: "0 4px 20px rgba(0,229,160,0.3)" }}>
              {t.submitUpdate}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
